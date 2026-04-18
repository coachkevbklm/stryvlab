import { resolveExerciseCoeff, normalizeMuscleSlug, muscleConflictsWithRestriction } from './catalog-utils'
import type {
  BuilderSession, BuilderExercise, TemplateMeta,
  IntelligenceAlert, IntelligenceResult, MuscleDistribution,
  PatternDistribution, SRAPoint, RedundantPair, IntelligenceProfile,
  ProgramStats, SessionStats,
} from './types'

// ─── Constantes ───────────────────────────────────────────────────────────────

// Fenêtres SRA en heures par groupe musculaire (niveau intermédiaire)
// Sources : Schoenfeld 2010, Colquhoun 2018 (fréquence optimale)
const SRA_WINDOWS: Record<string, number> = {
  quadriceps: 48, fessiers: 48, 'ischio-jambiers': 48,
  dos: 48, pectoraux: 48,
  epaules: 36, biceps: 36, triceps: 36,
  mollets: 24, abdos: 24,
}
const SRA_WINDOW_DEFAULT = 48

// Modulation de la fenêtre SRA par niveau
const SRA_LEVEL_MULTIPLIER: Record<string, number> = {
  beginner: 1.25, intermediate: 1.0, advanced: 0.9, elite: 0.85,
}

// Groupes "push" et "pull" pour le calcul de balance
const PUSH_PATTERNS = new Set(['horizontal_push', 'vertical_push', 'elbow_extension'])
const PULL_PATTERNS = new Set(['horizontal_pull', 'vertical_pull', 'elbow_flexion', 'scapular_elevation'])
const LEGS_PATTERNS = new Set(['squat_pattern', 'hip_hinge', 'knee_flexion', 'knee_extension', 'calf_raise'])
const CORE_PATTERNS = new Set(['core_flex', 'core_anti_flex', 'core_rotation'])

// Seuils ratio push/pull par goal
const BALANCE_THRESHOLDS: Record<string, { warn: [number, number], critical: [number, number] }> = {
  athletic:     { warn: [0.8, 1.2], critical: [0.5, 2.0] },
  strength:     { warn: [0.6, 1.6], critical: [0.4, 2.5] },
  default:      { warn: [0.7, 1.4], critical: [0.5, 2.0] },
}

// Patterns attendus par goal (pour scoreCompleteness)
const REQUIRED_PATTERNS: Record<string, string[]> = {
  hypertrophy: ['horizontal_push', 'horizontal_pull', 'vertical_pull', 'squat_pattern', 'hip_hinge', 'elbow_flexion', 'elbow_extension', 'lateral_raise'],
  strength:    ['horizontal_push', 'vertical_push', 'squat_pattern', 'hip_hinge', 'horizontal_pull'],
  fat_loss:    ['squat_pattern', 'hip_hinge', 'horizontal_push', 'horizontal_pull', 'carry'],
  athletic:    ['horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'squat_pattern', 'hip_hinge', 'carry'],
  recomp:      ['squat_pattern', 'hip_hinge', 'horizontal_push', 'horizontal_pull'],
  endurance:   ['squat_pattern', 'hip_hinge', 'horizontal_pull', 'carry'],
  maintenance: ['horizontal_push', 'horizontal_pull', 'squat_pattern', 'hip_hinge'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoeff(ex: BuilderExercise): number {
  return resolveExerciseCoeff({
    name: ex.name,
    movement_pattern: ex.movement_pattern,
    primary_muscles: ex.primary_muscles,
    is_compound: ex.is_compound,
  })
}

function getPattern(ex: BuilderExercise): string {
  return ex.movement_pattern ?? 'unknown'
}

// Calcule le volume pondéré d'un exercice : sets × stimCoeff
function weightedVolume(ex: BuilderExercise): number {
  return ex.sets * getCoeff(ex)
}

// Norme un score 0–100 depuis un ratio
function clampScore(v: number): number {
  return Math.round(Math.max(0, Math.min(100, v)))
}

// Heures entre deux jours de semaine (1=Lundi…7=Dimanche), cycliques
function hoursBetween(dayA: number | null, dayB: number | null): number | null {
  if (dayA === null || dayB === null) return null
  const diff = ((dayB - dayA + 7) % 7) || 7
  return diff * 24
}

// ─── 1. Balance push / pull / legs / core ────────────────────────────────────

export function scoreBalance(
  sessions: BuilderSession[],
  meta: TemplateMeta,
): { score: number; alerts: IntelligenceAlert[] } {
  const alerts: IntelligenceAlert[] = []

  let pushVol = 0, pullVol = 0
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const p = getPattern(ex)
      const vol = weightedVolume(ex)
      if (PUSH_PATTERNS.has(p)) pushVol += vol
      if (PULL_PATTERNS.has(p)) pullVol += vol
    }
  }

  // Aucun push ni pull → pas de déséquilibre mesurable
  if (pushVol === 0 && pullVol === 0) return { score: 100, alerts }

  // Évite division par zéro si un côté est absent
  const ratio = pullVol === 0 ? 999 : pushVol === 0 ? 0.001 : pushVol / pullVol
  const thresholds = BALANCE_THRESHOLDS[meta.goal] ?? BALANCE_THRESHOLDS.default

  const deviation = Math.abs(ratio - 1.0)
  let score = clampScore(100 - deviation * 60)

  if (ratio < thresholds.critical[0] || ratio > thresholds.critical[1]) {
    score = Math.min(score, 30)
    alerts.push({
      severity: 'critical',
      code: 'PUSH_PULL_IMBALANCE',
      title: 'Déséquilibre push/pull sévère',
      explanation: `Le ratio push/pull est de ${ratio.toFixed(2)} (idéal : ~1.0). Un déséquilibre important augmente le risque de dysfonction gléno-humérale et d'inhibition réciproque.`,
      suggestion: ratio > 1 ? 'Ajoutez des exercices de tirage (rowing, tractions) pour rééquilibrer.' : 'Ajoutez des exercices de poussée (développé, OHP) pour rééquilibrer.',
    })
  } else if (ratio < thresholds.warn[0] || ratio > thresholds.warn[1]) {
    score = Math.min(score, 65)
    alerts.push({
      severity: 'warning',
      code: 'PUSH_PULL_IMBALANCE',
      title: 'Déséquilibre push/pull',
      explanation: `Ratio push/pull : ${ratio.toFixed(2)}. Optimal pour "${meta.goal}" : ${thresholds.warn[0]}–${thresholds.warn[1]}.`,
      suggestion: ratio > 1 ? "Envisagez d'ajouter 1–2 exercices de tirage." : "Envisagez d'ajouter 1–2 exercices de poussée.",
    })
  }

  return { score, alerts }
}

// ─── 2. Modèle SRA (Stimulus → Récupération → Adaptation) ────────────────────

export function scoreSRA(
  sessions: BuilderSession[],
  meta: TemplateMeta,
  profile?: IntelligenceProfile,
): { score: number; alerts: IntelligenceAlert[]; sraMap: SRAPoint[] } {
  const alerts: IntelligenceAlert[] = []
  const sraMap: SRAPoint[] = []
  const effectiveLevel = profile?.fitnessLevel ?? meta.level
  const levelMult = SRA_LEVEL_MULTIPLIER[effectiveLevel] ?? 1.0

  // Construit une map muscle → [{sessionIndex, dayOfWeek}]
  const muscleSessionMap: Record<string, { sessionIndex: number; day: number | null }[]> = {}

  sessions.forEach((session, si) => {
    const muscles = new Set<string>()
    for (const ex of session.exercises) {
      ex.primary_muscles.map(normalizeMuscleSlug).forEach(m => muscles.add(m))
    }
    muscles.forEach(muscle => {
      if (!muscleSessionMap[muscle]) muscleSessionMap[muscle] = []
      muscleSessionMap[muscle].push({ sessionIndex: si, day: session.day_of_week })
    })
  })

  let violations = 0
  let totalChecks = 0

  for (const [muscle, occurrences] of Object.entries(muscleSessionMap)) {
    const window = (SRA_WINDOWS[muscle] ?? SRA_WINDOW_DEFAULT) * levelMult

    for (let i = 1; i < occurrences.length; i++) {
      const prev = occurrences[i - 1]
      const curr = occurrences[i]
      const hours = hoursBetween(prev.day, curr.day)
      totalChecks++

      const point: SRAPoint = {
        muscleGroup: muscle,
        sessionIndex: curr.sessionIndex,
        hoursFromPrevious: hours,
        windowRequired: Math.round(window),
        violation: false,
      }

      if (hours !== null) {
        if (hours <= window * 0.5) {
          point.violation = true
          violations++
          alerts.push({
            severity: 'critical',
            code: 'SRA_VIOLATION',
            title: `Récupération insuffisante — ${muscle}`,
            explanation: `${muscle} sollicité ${hours}h après la séance précédente. Fenêtre minimum : ${Math.round(window)}h (niveau ${meta.level}).`,
            suggestion: `Espacez les séances sollicitant ${muscle} d'au moins ${Math.round(window - hours)}h supplémentaires.`,
            sessionIndex: curr.sessionIndex,
          })
        } else if (hours <= window * 0.8) {
          violations += 0.5
          alerts.push({
            severity: 'warning',
            code: 'SRA_VIOLATION',
            title: `Récupération courte — ${muscle}`,
            explanation: `${muscle} sollicité ${hours}h après la séance précédente. Idéal : ${Math.round(window)}h.`,
            suggestion: `Envisagez d'espacer davantage ou de réduire l'intensité de l'une des séances.`,
            sessionIndex: curr.sessionIndex,
          })
        }
      }

      sraMap.push(point)
    }
  }

  const score = totalChecks === 0
    ? 100
    : clampScore(100 - (violations / totalChecks) * 100)

  return { score, alerts, sraMap }
}

// ─── 3. Redondance mécanique ──────────────────────────────────────────────────

export function scoreRedundancy(
  sessions: BuilderSession[],
): { score: number; alerts: IntelligenceAlert[]; redundantPairs: RedundantPair[] } {
  const alerts: IntelligenceAlert[] = []
  const redundantPairs: RedundantPair[] = []

  sessions.forEach((session, si) => {
    const exs = session.exercises
    for (let a = 0; a < exs.length; a++) {
      for (let b = a + 1; b < exs.length; b++) {
        const exA = exs[a], exB = exs[b]
        const pA = getPattern(exA), pB = getPattern(exB)

        // Patterns identiques
        if (pA !== pB || pA === 'unknown') continue

        // Les deux composés (composé + isolation = complémentaire, pas redondant)
        const isCompA = resolveExerciseCoeff({ name: exA.name, movement_pattern: pA, primary_muscles: exA.primary_muscles, is_compound: exA.is_compound }) > 0.65
        const isCompB = resolveExerciseCoeff({ name: exB.name, movement_pattern: pB, primary_muscles: exB.primary_muscles, is_compound: exB.is_compound }) > 0.65
        if (!isCompA || !isCompB) continue

        // Muscle primaire commun
        const musA = new Set(exA.primary_muscles.map(normalizeMuscleSlug))
        const musB = new Set(exB.primary_muscles.map(normalizeMuscleSlug))
        const overlap = Array.from(musA).filter(m => musB.has(m))
        if (overlap.length === 0) continue

        // Coefficients proches (même registre d'intensité)
        const coeffA = getCoeff(exA), coeffB = getCoeff(exB)
        if (Math.abs(coeffA - coeffB) >= 0.20) continue

        redundantPairs.push({ sessionIndex: si, exerciseIndexA: a, exerciseIndexB: b, reason: `Même pattern (${pA}), muscles communs : ${overlap.join(', ')}` })
        alerts.push({
          severity: 'warning',
          code: 'REDUNDANT_EXERCISES',
          title: `Redondance mécanique : ${exA.name} + ${exB.name}`,
          explanation: `Ces deux exercices ciblent les mêmes muscles (${overlap.join(', ')}) avec le même pattern (${pA}) et une intensité similaire. Le gain marginal du second est faible.`,
          suggestion: "Remplacez l'un par un exercice sous un angle différent ou avec un pattern complémentaire.",
          sessionIndex: si,
          exerciseIndex: b,
        })
      }
    }
  })

  const totalExercises = sessions.reduce((acc, s) => acc + s.exercises.length, 0)
  const score = totalExercises === 0
    ? 100
    : clampScore(100 - (redundantPairs.length / totalExercises) * 80)

  return { score, alerts, redundantPairs }
}

// ─── 4. Progression RIR / intensité ──────────────────────────────────────────

export function scoreProgression(
  sessions: BuilderSession[],
  meta: TemplateMeta,
): { score: number; alerts: IntelligenceAlert[] } {
  const alerts: IntelligenceAlert[] = []

  // Si durée ≤ 1 semaine : pas de progression évaluable
  if (meta.weeks <= 1) return { score: 100, alerts }

  const allExercises = sessions.flatMap(s => s.exercises)

  // Alerte critique si RIR = 0 dès semaine 1 (aucune marge de progression)
  const rirZeroW1 = allExercises.filter(ex => ex.rir === 0)
  if (rirZeroW1.length > 0) {
    alerts.push({
      severity: 'critical',
      code: 'RIR_TOO_LOW_WEEK1',
      title: 'RIR 0 en semaine 1 — aucune marge de progression',
      explanation: `${rirZeroW1.length} exercice(s) démarrent avec RIR = 0. La progression linéaire (−0.5 RIR/semaine) est impossible sans recommencer à charge réduite.`,
      suggestion: `Démarrez à RIR 3–4 pour un programme de ${meta.weeks} semaines et descendez progressivement.`,
    })
    return { score: 20, alerts }
  }

  // Alerte info si RIR trop élevé pour le nombre de semaines (sous-utilisation)
  const avgRir = allExercises.reduce((acc, ex) => acc + (ex.rir ?? 2), 0) / (allExercises.length || 1)
  const recommendedStartRir = Math.min(4, Math.ceil(meta.weeks * 0.5))
  if (avgRir > recommendedStartRir + 1) {
    alerts.push({
      severity: 'info',
      code: 'RIR_TOO_HIGH',
      title: 'Intensité initiale faible',
      explanation: `RIR moyen de ${avgRir.toFixed(1)} pour un programme de ${meta.weeks} semaines. La fenêtre de progression est sous-utilisée.`,
      suggestion: `Pour ${meta.weeks} semaines, un RIR initial de ${recommendedStartRir}–${recommendedStartRir + 1} est optimal.`,
    })
  }

  const score = alerts.some(a => a.severity === 'critical') ? 20 :
                alerts.some(a => a.severity === 'warning') ? 60 : 90

  return { score, alerts }
}

// ─── 5. Spécificité goal ──────────────────────────────────────────────────────

// Score de spécificité 0–1 par exercice selon le goal
function exerciseSpecificityScore(ex: BuilderExercise, goal: string): number {
  const pattern = getPattern(ex)
  const repsStr = ex.reps ?? ''
  const repsLow = parseInt(repsStr.split('-')[0] ?? '0') || 0
  const rir = ex.rir ?? 2
  const restSec = ex.rest_sec ?? 90
  const coeff = getCoeff(ex)

  switch (goal) {
    case 'hypertrophy': {
      let s = 0.5
      if (repsLow >= 6 && repsLow <= 15) s += 0.2
      if (rir >= 1 && rir <= 3) s += 0.15
      if (restSec <= 180) s += 0.15
      if (coeff < 0.45) s -= 0.15 // isolation pure pénalisée légèrement
      return Math.min(1, Math.max(0, s))
    }
    case 'strength': {
      let s = 0.5
      if (repsLow >= 1 && repsLow <= 6) s += 0.25
      if (rir <= 2) s += 0.15
      if (['squat_pattern', 'hip_hinge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull'].includes(pattern)) s += 0.1
      if (coeff > 0.80) s += 0.1
      if (rir > 2) s -= 0.2 // confort excessif pénalisé
      return Math.min(1, Math.max(0, s))
    }
    case 'fat_loss': {
      let s = 0.5
      if (restSec <= 60) s += 0.2
      if (ex.sets >= 3) s += 0.1
      if (['squat_pattern', 'hip_hinge', 'carry'].includes(pattern)) s += 0.2
      if (restSec > 120) s -= 0.2
      return Math.min(1, Math.max(0, s))
    }
    case 'endurance': {
      let s = 0.5
      if (repsLow >= 15) s += 0.25
      if (restSec <= 45) s += 0.15
      if (coeff > 0.80) s -= 0.1
      return Math.min(1, Math.max(0, s))
    }
    default:
      return 0.65 // score neutre pour recomp / maintenance / athletic
  }
}

export function scoreSpecificity(
  sessions: BuilderSession[],
  meta: TemplateMeta,
  profile?: IntelligenceProfile,
): { score: number; alerts: IntelligenceAlert[] } {
  const alerts: IntelligenceAlert[] = []
  const allExercises = sessions.flatMap(s => s.exercises)

  if (allExercises.length === 0) return { score: 100, alerts }

  // Injury conflict alerts (per exercise)
  if (profile && profile.injuries.length > 0) {
    const SEVERITY_ORDER: Record<string, number> = { avoid: 3, limit: 2, monitor: 1 }
    allExercises.forEach((ex) => {
      const si = sessions.findIndex(s => s.exercises.includes(ex))
      const ei = sessions[si]?.exercises.indexOf(ex) ?? -1
      const allMuscles = [...ex.primary_muscles, ...ex.secondary_muscles]

      let worstConflict: { conflicts: true; severity: 'avoid' | 'limit' | 'monitor' } | null = null
      for (const muscle of allMuscles) {
        const conflict = muscleConflictsWithRestriction(muscle, profile.injuries)
        if (conflict) {
          if (!worstConflict || SEVERITY_ORDER[conflict.severity] > SEVERITY_ORDER[worstConflict.severity]) {
            worstConflict = conflict
          }
        }
      }

      if (worstConflict) {
        const severityLabel = worstConflict.severity === 'avoid' ? 'évitée' : worstConflict.severity === 'limit' ? 'limitée' : 'surveillée'
        alerts.push({
          severity: worstConflict.severity === 'avoid' ? 'critical' : worstConflict.severity === 'limit' ? 'warning' : 'info',
          code: 'INJURY_CONFLICT',
          title: `Conflit blessure — ${ex.name}`,
          explanation: `Cet exercice sollicite une zone ${severityLabel} selon le profil client.`,
          suggestion: 'Voir les alternatives pour éviter cette zone musculaire.',
          sessionIndex: si >= 0 ? si : undefined,
          exerciseIndex: ei >= 0 ? ei : undefined,
        })
      }
    })
  }

  // Moyenne pondérée par stimCoeff
  let totalWeight = 0, weightedSum = 0
  allExercises.forEach((ex) => {
    const coeff = getCoeff(ex)
    const specificity = exerciseSpecificityScore(ex, meta.goal)
    weightedSum += specificity * coeff
    totalWeight += coeff

    if (specificity < 0.5) {
      const si = sessions.findIndex(s => s.exercises.includes(ex))
      alerts.push({
        severity: 'warning',
        code: 'GOAL_MISMATCH',
        title: `${ex.name} — peu adapté à l'objectif "${meta.goal}"`,
        explanation: `Cet exercice (${ex.movement_pattern ?? 'pattern inconnu'}, RIR ${ex.rir}, ${ex.reps} reps) est peu aligné avec l'objectif "${meta.goal}".`,
        suggestion: 'Ajustez les paramètres (reps, RIR, repos) ou remplacez par un exercice plus spécifique.',
        sessionIndex: si,
        exerciseIndex: sessions[si]?.exercises.indexOf(ex),
      })
    }
  })

  const avgSpecificity = totalWeight === 0 ? 0.65 : weightedSum / totalWeight
  const avoidConflicts = alerts.filter(a => a.code === 'INJURY_CONFLICT' && a.severity === 'critical').length
  const limitConflicts = alerts.filter(a => a.code === 'INJURY_CONFLICT' && a.severity === 'warning').length
  const injuryPenalty = Math.min(40, avoidConflicts * 30 + limitConflicts * 15)
  return { score: clampScore(avgSpecificity * 100 - injuryPenalty), alerts }
}

// ─── 6. Patterns manquants ────────────────────────────────────────────────────

// Equipment slugs that support each movement pattern (for equipment-aware completeness)
const PATTERN_EQUIPMENT_REQUIREMENTS: Record<string, string[]> = {
  horizontal_push:  ['barre', 'halteres', 'machine', 'cables', 'smith'],
  vertical_push:    ['barre', 'halteres', 'machine', 'smith'],
  horizontal_pull:  ['barre', 'halteres', 'machine', 'cables', 'trx'],
  vertical_pull:    ['barre', 'halteres', 'machine', 'cables', 'trx', 'poulie'],
  squat_pattern:    ['barre', 'halteres', 'machine', 'smith', 'kettlebell'],
  hip_hinge:        ['barre', 'halteres', 'machine', 'kettlebell'],
  elbow_flexion:    ['barre', 'halteres', 'machine', 'cables', 'elastiques'],
  elbow_extension:  ['barre', 'halteres', 'machine', 'cables', 'elastiques'],
  lateral_raise:    ['halteres', 'machine', 'cables'],
  carry:            ['halteres', 'kettlebell', 'barre'],
  knee_flexion:     ['machine', 'cables'],
  calf_raise:       ['machine', 'barre', 'halteres'],
}

export function scoreCompleteness(
  sessions: BuilderSession[],
  meta: TemplateMeta,
  profile?: IntelligenceProfile,
): { score: number; alerts: IntelligenceAlert[]; missingPatterns: string[] } {
  const alerts: IntelligenceAlert[] = []
  const required = REQUIRED_PATTERNS[meta.goal] ?? REQUIRED_PATTERNS.maintenance
  const presentPatterns = new Set(
    sessions.flatMap(s => s.exercises.map(ex => ex.movement_pattern).filter(Boolean))
  )

  // Filter out patterns that can't be done with available equipment
  const effectiveRequired = profile && profile.equipment.length > 0
    ? required.filter(pattern => {
        const needed = PATTERN_EQUIPMENT_REQUIREMENTS[pattern]
        if (!needed) return true
        return needed.some(eq => profile.equipment.includes(eq))
      })
    : required

  const missing = effectiveRequired.filter(p => !presentPatterns.has(p))

  // Equipment mismatch alerts: exercises in program that need unavailable equipment
  if (profile && profile.equipment.length > 0) {
    sessions.forEach((session, si) => {
      session.exercises.forEach((ex, ei) => {
        if (ex.equipment_required.length === 0) return
        const hasEquipment = ex.equipment_required.some(eq => profile.equipment.includes(eq))
        if (!hasEquipment) {
          alerts.push({
            severity: 'warning',
            code: 'EQUIPMENT_MISMATCH',
            title: `Équipement manquant — ${ex.name}`,
            explanation: `Cet exercice nécessite : ${ex.equipment_required.join(', ')}. Équipement disponible : ${profile.equipment.join(', ')}.`,
            suggestion: "Voir les alternatives compatibles avec l'équipement disponible.",
            sessionIndex: si,
            exerciseIndex: ei,
          })
        }
      })
    })
  }

  // Exemple d'exercice suggéré par pattern manquant
  const PATTERN_EXAMPLES: Record<string, string> = {
    horizontal_push: 'Développé couché',
    vertical_push: 'Développé militaire',
    horizontal_pull: 'Rowing barre',
    vertical_pull: 'Tractions',
    squat_pattern: 'Squat barre',
    hip_hinge: 'Soulevé de terre',
    elbow_flexion: 'Curl haltères',
    elbow_extension: 'Extension triceps overhead',
    lateral_raise: 'Élévation latérale',
    carry: 'Marche du fermier',
    knee_flexion: 'Leg curl',
    calf_raise: 'Extension mollets',
  }

  missing.forEach(pattern => {
    alerts.push({
      severity: 'warning',
      code: 'MISSING_PATTERN',
      title: `Pattern manquant : ${pattern.replace(/_/g, ' ')}`,
      explanation: `L'objectif "${meta.goal}" recommande d'inclure des exercices de type ${pattern.replace(/_/g, ' ')}.`,
      suggestion: `Exemple : ${PATTERN_EXAMPLES[pattern] ?? 'exercice de ce pattern'}.`,
    })
  })

  const score = effectiveRequired.length === 0
    ? 100
    : clampScore(((effectiveRequired.length - missing.length) / effectiveRequired.length) * 100)

  return { score, alerts, missingPatterns: missing }
}

// ─── Agrégation finale ────────────────────────────────────────────────────────

// Poids des subscores dans le globalScore
const SUBSCORE_WEIGHTS = {
  balance: 0.25,
  recovery: 0.25,
  specificity: 0.15,
  progression: 0.15,
  completeness: 0.10,
  redundancy: 0.10,
}

function buildNarrative(subscores: IntelligenceResult['subscores'], alerts: IntelligenceAlert[]): string {
  const criticals = alerts.filter(a => a.severity === 'critical')
  if (criticals.length > 0) {
    return `Point critique : ${criticals[0].title.toLowerCase()}.`
  }

  const sorted = Object.entries(subscores).sort(([, a], [, b]) => b - a)
  const [bestKey, bestVal] = sorted[0]
  const [worstKey, worstVal] = sorted[sorted.length - 1]

  const labels: Record<string, string> = {
    balance: 'équilibre push/pull',
    recovery: 'récupération inter-séances',
    specificity: "cohérence avec l'objectif",
    progression: "progression d'intensité",
    completeness: 'couverture des patterns',
    redundancy: 'diversité des exercices',
  }

  if (worstVal < 60) {
    return `Point fort : ${labels[bestKey]} (${bestVal}/100). À améliorer : ${labels[worstKey]} (${worstVal}/100).`
  }
  return `Programme équilibré. Meilleur score : ${labels[bestKey]} (${bestVal}/100).`
}

export function buildIntelligenceResult(
  sessions: BuilderSession[],
  meta: TemplateMeta,
  profile?: IntelligenceProfile,
): IntelligenceResult {
  // Filtrer les exercices sans nom — les placeholders vides ne doivent pas influencer le scoring
  const filteredSessions = sessions.map(s => ({
    ...s,
    exercises: s.exercises.filter(e => e.name.trim() !== ''),
  }))

  const emptyProgramStats: ProgramStats = {
    totalSets: 0,
    totalEstimatedReps: 0,
    totalExercises: 0,
    avgExercisesPerSession: 0,
    sessionsStats: [],
  }

  const hasExercises = filteredSessions.some(s => s.exercises.length > 0)
  if (!hasExercises) {
    return {
      globalScore: 0,
      globalNarrative: "Ajoutez des exercices pour voir l'analyse.",
      subscores: { balance: 0, recovery: 0, specificity: 0, progression: 0, completeness: 0, redundancy: 0 },
      alerts: [],
      distribution: {},
      patternDistribution: { push: 0, pull: 0, legs: 0, core: 0 },
      missingPatterns: [],
      redundantPairs: [],
      sraMap: [],
      programStats: emptyProgramStats,
    }
  }

  const balanceResult = scoreBalance(filteredSessions, meta)
  const sraResult = scoreSRA(filteredSessions, meta, profile)
  const redundancyResult = scoreRedundancy(filteredSessions)
  const progressionResult = scoreProgression(filteredSessions, meta)
  const specificityResult = scoreSpecificity(filteredSessions, meta, profile)
  const completenessResult = scoreCompleteness(filteredSessions, meta, profile)

  const subscores = {
    balance: balanceResult.score,
    recovery: sraResult.score,
    specificity: specificityResult.score,
    progression: progressionResult.score,
    completeness: completenessResult.score,
    redundancy: redundancyResult.score,
  }

  const globalScore = clampScore(
    Object.entries(subscores).reduce((acc, [key, val]) => {
      return acc + val * SUBSCORE_WEIGHTS[key as keyof typeof SUBSCORE_WEIGHTS]
    }, 0)
  )

  const allAlerts = [
    ...balanceResult.alerts,
    ...sraResult.alerts,
    ...redundancyResult.alerts,
    ...progressionResult.alerts,
    ...specificityResult.alerts,
    ...completenessResult.alerts,
  ].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })

  // Distribution musculaire (volume pondéré par groupe)
  const distribution: MuscleDistribution = {}
  for (const session of filteredSessions) {
    for (const ex of session.exercises) {
      const vol = weightedVolume(ex)
      ex.primary_muscles.forEach(m => {
        const norm = normalizeMuscleSlug(m)
        distribution[norm] = (distribution[norm] ?? 0) + vol
      })
    }
  }

  // Distribution patterns (volume brut)
  const patternDistribution: PatternDistribution = { push: 0, pull: 0, legs: 0, core: 0 }
  for (const session of filteredSessions) {
    for (const ex of session.exercises) {
      const p = getPattern(ex)
      const vol = ex.sets
      if (PUSH_PATTERNS.has(p)) patternDistribution.push += vol
      else if (PULL_PATTERNS.has(p)) patternDistribution.pull += vol
      else if (LEGS_PATTERNS.has(p)) patternDistribution.legs += vol
      else if (CORE_PATTERNS.has(p)) patternDistribution.core += vol
    }
  }

  // ─── Stats programme ──────────────────────────────────────────────────────────
  function parseRepsLow(reps: string): number {
    return parseInt(reps.split('-')[0] ?? '0') || 0
  }

  const sessionsStats: SessionStats[] = filteredSessions.map(session => {
    const exs = session.exercises
    const totalSets = exs.reduce((acc, e) => acc + e.sets, 0)
    const estimatedReps = exs.reduce((acc, e) => acc + e.sets * parseRepsLow(e.reps), 0)
    const patterns = Array.from(new Set(exs.map(e => e.movement_pattern).filter((p): p is string => !!p)))

    const muscleVolumes: Record<string, number> = {}
    for (const ex of exs) {
      const vol = weightedVolume(ex)
      ex.primary_muscles.forEach(m => {
        const norm = normalizeMuscleSlug(m)
        muscleVolumes[norm] = (muscleVolumes[norm] ?? 0) + vol
      })
    }

    const topMuscles = Object.entries(muscleVolumes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([m]) => m)

    return {
      name: session.name,
      exerciseCount: exs.length,
      totalSets,
      estimatedReps,
      patterns,
      topMuscles,
      muscleVolumes,
    }
  })

  const totalSets = sessionsStats.reduce((acc, s) => acc + s.totalSets, 0)
  const totalEstimatedReps = sessionsStats.reduce((acc, s) => acc + s.estimatedReps, 0)
  const totalExercises = new Set(filteredSessions.flatMap(s => s.exercises.map(e => e.name))).size
  const avgExercisesPerSession = filteredSessions.length > 0
    ? Math.round(filteredSessions.reduce((acc, s) => acc + s.exercises.length, 0) / filteredSessions.length)
    : 0

  const programStats: ProgramStats = {
    totalSets,
    totalEstimatedReps,
    totalExercises,
    avgExercisesPerSession,
    sessionsStats,
  }

  return {
    globalScore,
    globalNarrative: buildNarrative(subscores, allAlerts),
    subscores,
    alerts: allAlerts,
    distribution,
    patternDistribution,
    missingPatterns: completenessResult.missingPatterns,
    redundantPairs: redundancyResult.redundantPairs,
    sraMap: sraResult.sraMap,
    programStats,
  }
}
