import catalogData from '@/data/exercise-catalog.json'
import type { InjuryRestriction } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogEntry {
  name: string
  slug: string
  movementPattern: string
  isCompound: boolean
  stimulus_coefficient: number
}

const catalog = catalogData as CatalogEntry[]

// ─── Normalisation slugs muscles ─────────────────────────────────────────────
// Le builder stocke les slugs FR (depuis MUSCLE_GROUPS dans ProgramTemplateBuilder).
// Si un ancien exercice ou exercice custom utilise des slugs EN, on les normalise.

const MUSCLE_SLUG_MAP: Record<string, string> = {
  glutes: 'fessiers',
  hamstrings: 'ischio-jambiers',
  back: 'dos',
  back_upper: 'dos',
  back_lower: 'dos',
  shoulders: 'epaules',
  chest: 'pectoraux',
  quads: 'quadriceps',
  calves: 'mollets',
  abs: 'abdos',
  traps: 'dos',
}

export function normalizeMuscleSlug(slug: string): string {
  return MUSCLE_SLUG_MAP[slug] ?? slug
}

// ─── isCompound depuis les muscles primaires ─────────────────────────────────
// Fallback quand le coach n'a pas coché la checkbox.
// Règle : ≥2 groupes musculaires primaires distincts = composé.

export function isCompoundFromMuscles(primaryMuscles: string[]): boolean {
  return primaryMuscles.length >= 2
}

// ─── Stimulus coefficient ─────────────────────────────────────────────────────
// Même logique que scripts/generate-exercise-catalog.ts (source de vérité).
// Utilisée au runtime pour les exercices custom (pas dans le catalogue JSON).

const STRETCH_POSITION_SLUGS = new Set([
  'curl-incline-halteres', 'curl-incline', 'spider-curl', 'curl-concentre', 'drag-curl',
  'extension-triceps-derriere-tete', 'extension-triceps-overhead', 'skull-crusher', 'barre-front',
  'leg-curl-assis', 'leg-curl-assis-machine',
  'souleve-de-terre-roumain', 'souleve-de-terre-roumain-kettlebell',
  'souleve-de-terre-roumain-landmine', 'souleve-de-terre-jambes-tendues',
  'good-morning', 'good-morning-elastique',
  'squat-bulgare-halteres-exercice-musculation', 'fente-avant-barre-femme',
  'fentes-avant-exercice-musculation', 'fentes-avant-kettlebell',
  'pull-over', 'pull-over-barre', 'musculation-pull-over-assis-machine',
])

export function getStimulusCoeff(slug: string, movementPattern: string, isCompound: boolean): number {
  const s = slug.toLowerCase()
  const stretchBonus = STRETCH_POSITION_SLUGS.has(s) ? 0.08 : 0

  let base: number

  switch (movementPattern) {
    case 'squat_pattern': {
      if (isCompound) {
        const isMachine = s.includes('machine') || s.includes('presse-a-cuisse') ||
          s.includes('presse-a-cuisses') || s.includes('presse-cuisse') ||
          s.includes('leg-press') || s.includes('hack-squat-assis') ||
          s.includes('pendulum') || s.includes('belt-squat')
        base = isMachine ? 0.72 : 0.90
      } else {
        base = 0.45
      }
      break
    }
    case 'hip_hinge': {
      if (isCompound) {
        const isHeavy = s.includes('souleve-de-terre') || s.includes('deadlift') ||
          s.includes('rack-pull') || s.includes('reeves-deadlift') ||
          s.includes('zercher-deadlift') || s.includes('good-morning')
        base = isHeavy ? 0.95 : 0.82
      } else {
        base = 0.48
      }
      break
    }
    case 'horizontal_push': {
      if (isCompound) {
        const isMachine = s.includes('machine') || s.includes('smith')
        base = isMachine ? 0.68 : 0.82
      } else {
        base = 0.52
      }
      break
    }
    case 'vertical_push': {
      if (isCompound) {
        const isMachine = s.includes('machine') || s.includes('smith')
        base = isMachine ? 0.65 : 0.80
      } else {
        base = 0.60
      }
      break
    }
    case 'horizontal_pull': {
      if (isCompound) {
        const isHeavy = s.includes('barre') || s.includes('barbell') ||
          s.includes('seal-row') || s.includes('renegade-row')
        base = isHeavy ? 0.88 : 0.75
      } else {
        base = 0.40
      }
      break
    }
    case 'vertical_pull': {
      if (isCompound) {
        const isBodyweight = s.includes('traction') || s.includes('chin-up')
        base = isBodyweight ? 0.92 : 0.74
      } else {
        base = 0.40
      }
      break
    }
    case 'scapular_elevation': base = 0.30; break
    case 'elbow_flexion': base = 0.55; break
    case 'elbow_extension': {
      const isOverhead = s.includes('derriere-tete') || s.includes('overhead') ||
        s.includes('skull-crusher') || s.includes('barre-front')
      base = isOverhead ? 0.52 : 0.42
      break
    }
    case 'lateral_raise': base = 0.35; break
    case 'knee_flexion': base = isCompound ? 0.78 : 0.55; break
    case 'knee_extension': base = 0.45; break
    case 'calf_raise': {
      const isHeavy = s.includes('donkey') || s.includes('debout') || s.includes('standing')
      base = isHeavy ? 0.50 : 0.38
      break
    }
    case 'core_flex': base = 0.32; break
    case 'core_anti_flex': base = 0.30; break
    case 'core_rotation': base = 0.28; break
    case 'carry': base = 0.65; break
    default: base = 0.50
  }

  return Math.min(1.0, Math.round((base + stretchBonus) * 100) / 100)
}

// ─── Resolve coeff pour un exercice du builder ────────────────────────────────
// Ordre de priorité :
// 1. Correspondance exacte par nom dans le catalogue JSON (exercice standard)
// 2. is_compound explicite du coach → getStimulusCoeff(slug_normalisé, pattern, is_compound)
// 3. is_compound déduit depuis primary_muscles.length ≥ 2

interface ExerciseInput {
  name: string
  movement_pattern: string | null
  primary_muscles: string[]
  is_compound: boolean | undefined
}

export function resolveExerciseCoeff(exercise: ExerciseInput): number {
  const pattern = exercise.movement_pattern ?? 'unknown'

  // 1. Recherche dans le catalogue par nom normalisé
  const nameNorm = exercise.name.toLowerCase().trim()
  const catalogEntry = catalog.find(e => e.name.toLowerCase().trim() === nameNorm)
  if (catalogEntry) return catalogEntry.stimulus_coefficient

  // 2. is_compound explicite du coach
  const slug = nameNorm.replace(/\s+/g, '-')
  const isComp = exercise.is_compound !== undefined
    ? exercise.is_compound
    : isCompoundFromMuscles(exercise.primary_muscles)

  return getStimulusCoeff(slug, pattern, isComp)
}

// ─── Back muscle sub-groups by movement pattern ────────────────────────────────
// The catalog stores 'dos' monolithically. At scoring time, expandMusclesForScoring
// maps 'dos' to richer sub-groups based on movementPattern to improve alternative
// discrimination (e.g. traction vs row vs shrug vs hip-hinge all use 'dos' in catalog).
const DOS_SUBGROUPS_BY_PATTERN: Record<string, string[]> = {
  vertical_pull:      ['grand_dorsal', 'dos_large'],
  horizontal_pull:    ['trapeze_moyen', 'rhomboides', 'dos_large'],
  scapular_elevation: ['trapeze_superieur', 'dos_large'],
  hip_hinge:          ['lombaires', 'erecteurs_spinaux', 'dos_large'],
  core_anti_flex:     ['lombaires', 'erecteurs_spinaux', 'dos_large'],
  carry:              ['trapeze_superieur', 'dos_large'],
}

/**
 * Expands muscle slugs for scoring purposes.
 * When 'dos' is present, replaces it with functional sub-groups derived from movementPattern.
 * Other muscles are kept as-is (after normalization).
 */
export function expandMusclesForScoring(muscles: string[], movementPattern: string | null): string[] {
  const result: string[] = []
  for (const m of muscles) {
    const norm = normalizeMuscleSlug(m)
    if (norm === 'dos') {
      const subgroups = DOS_SUBGROUPS_BY_PATTERN[movementPattern ?? ''] ?? ['dos_large']
      result.push(...subgroups)
    } else {
      result.push(norm)
    }
  }
  return result
}

// Maps FR muscle slugs to body_part vocabulary used in restrictions
export const MUSCLE_TO_BODY_PART: Record<string, string[]> = {
  'deltoide_anterieur':  ['shoulder_right', 'shoulder_left'],
  'deltoide_lateral':    ['shoulder_right', 'shoulder_left'],
  'deltoide_posterieur': ['shoulder_right', 'shoulder_left'],
  'coiffe_rotateurs':    ['shoulder_right', 'shoulder_left'],
  'epaules':             ['shoulder_right', 'shoulder_left'],
  'biceps':              ['elbow_right', 'elbow_left'],
  'triceps':             ['elbow_right', 'elbow_left'],
  'avant_bras':          ['elbow_right', 'elbow_left', 'wrist_right', 'wrist_left'],
  'quadriceps':          ['knee_right', 'knee_left'],
  'ischio-jambiers':     ['knee_right', 'knee_left', 'hip_right', 'hip_left'],
  'fessiers':            ['hip_right', 'hip_left'],
  'lombaires':           ['lower_back'],
  'erecteurs_spinaux':   ['lower_back', 'upper_back'],
  'dos':                 ['upper_back', 'lower_back'],
  'trapeze':             ['upper_back', 'neck'],
  'rhomboides':          ['upper_back'],
  'grand_dorsal':        ['upper_back'],
  'pectoraux':           [],
  'abdos':               [],
  'mollets':             ['ankle_right', 'ankle_left'],
}

const SEVERITY_ORDER: Record<string, number> = { avoid: 3, limit: 2, monitor: 1 }

export function muscleConflictsWithRestriction(
  muscleSlug: string,
  restrictions: InjuryRestriction[],
): { conflicts: true; severity: 'avoid' | 'limit' | 'monitor' } | null {
  if (restrictions.length === 0) return null

  const bodyParts = MUSCLE_TO_BODY_PART[normalizeMuscleSlug(muscleSlug)] ?? []
  if (bodyParts.length === 0) return null

  let highestSeverity: 'avoid' | 'limit' | 'monitor' | null = null

  for (const restriction of restrictions) {
    if (bodyParts.includes(restriction.bodyPart)) {
      if (
        highestSeverity === null ||
        SEVERITY_ORDER[restriction.severity] > SEVERITY_ORDER[highestSeverity]
      ) {
        highestSeverity = restriction.severity
      }
    }
  }

  return highestSeverity ? { conflicts: true, severity: highestSeverity } : null
}
