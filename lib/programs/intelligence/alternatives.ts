import catalogData from '@/data/exercise-catalog.json'
import { normalizeMuscleSlug, getStimulusCoeff, expandMusclesForScoring } from './catalog-utils'
import type { BuilderExercise } from './types'

interface CatalogEntry {
  id: string
  name: string
  slug: string
  gifUrl: string
  muscleGroup: string
  exerciseType: string
  pattern: string[]
  movementPattern: string
  equipment: string[]
  isCompound: boolean
  muscles: string[]
  stimulus_coefficient: number
}

const catalog = (catalogData as CatalogEntry[]).filter(e => e.exerciseType === 'exercise')

export interface AlternativeScore {
  entry: CatalogEntry
  score: number
  label: string // 'Remplace mécaniquement' | 'Angle complémentaire' | 'Alternative équipement'
}

interface AlternativesContext {
  equipmentArchetype: string
  goal: string
  level: string
  sessionExercises: BuilderExercise[]
}

// Équipements disponibles par archétype
const ARCHETYPE_EQUIPMENT: Record<string, string[]> = {
  bodyweight:      ['bodyweight', 'band'],
  home_dumbbells:  ['bodyweight', 'dumbbell', 'band', 'kettlebell'],
  home_full:       ['bodyweight', 'dumbbell', 'barbell', 'band', 'kettlebell', 'ez_bar'],
  home_rack:       ['bodyweight', 'dumbbell', 'barbell', 'band', 'kettlebell', 'ez_bar', 'smith'],
  functional_box:  ['bodyweight', 'dumbbell', 'kettlebell', 'band', 'cable', 'trx', 'medicine_ball', 'sled'],
  commercial_gym:  ['bodyweight', 'dumbbell', 'barbell', 'kettlebell', 'band', 'cable', 'machine', 'smith', 'ez_bar', 'trap_bar', 'landmine', 'trx', 'rings', 'sled'],
}

export function scoreAlternatives(
  original: BuilderExercise,
  context: AlternativesContext,
): AlternativeScore[] {
  const availableEquipment = ARCHETYPE_EQUIPMENT[context.equipmentArchetype] ?? ARCHETYPE_EQUIPMENT.commercial_gym
  const originalPattern = original.movement_pattern ?? ''

  // Expand original muscles for better discrimination (especially back sub-groups)
  const originalMusclesExpanded = new Set(
    expandMusclesForScoring(original.primary_muscles, originalPattern)
  )

  const originalCoeff = getStimulusCoeff(
    original.name.toLowerCase().replace(/\s+/g, '-'),
    originalPattern,
    (original.is_compound ?? original.primary_muscles.length >= 2),
  )

  // Patterns déjà présents dans la session (pour détecter la redondance)
  const sessionPatterns = context.sessionExercises
    .filter(e => e !== original)
    .map(e => e.movement_pattern)

  const scored: AlternativeScore[] = []

  for (const candidate of catalog) {
    // Exclure l'exercice original lui-même
    if (candidate.name.toLowerCase() === original.name.toLowerCase()) continue

    // Compatibilité équipement
    const hasEquipment = candidate.equipment.some(eq => availableEquipment.includes(eq))
    if (!hasEquipment) continue

    let score = 0

    // Même pattern primaire (+40)
    if (candidate.movementPattern === originalPattern) score += 40

    // Muscles primaires communs — via sub-groups pour 'dos' (+30 max)
    const candidateMusclesExpanded = new Set(
      expandMusclesForScoring(candidate.muscles, candidate.movementPattern)
    )
    const overlap = Array.from(originalMusclesExpanded).filter(m => candidateMusclesExpanded.has(m))
    // dos_large-only overlap (different back sub-groups) = partial credit only
    const hasOnlyDosLarge = overlap.length > 0 && overlap.every(m => m === 'dos_large')
    if (overlap.length > 0) {
      score += hasOnlyDosLarge ? 8 : Math.min(30, overlap.length * 15)
    }

    // Équipement compatible (+20) — déjà filtré au-dessus, bonus pour équipement similaire
    const sameEquip = original.equipment_required.some(eq => candidate.equipment.includes(eq))
    if (sameEquip) score += 20

    // Non redondant avec les autres exercices de la session (+10)
    const isRedundant = sessionPatterns.includes(candidate.movementPattern)
    if (!isRedundant) score += 10

    // Pénalité si stimulus_coefficient inférieur à l'original (−15)
    if (candidate.stimulus_coefficient < originalCoeff - 0.15) score -= 15

    // Constraint profile match (+15)
    const origConstraint = original.constraintProfile as string | null | undefined
    const candConstraint = (candidate as unknown as { constraintProfile?: string | null }).constraintProfile
    if (origConstraint && candConstraint && origConstraint === candConstraint) {
      score += 15
    }

    // Unilateral match (+10)
    const origUnilateral = original.unilateral ?? false
    const candUnilateral = (candidate as unknown as { unilateral?: boolean }).unilateral ?? false
    if (origUnilateral === candUnilateral) {
      score += 10
    }

    // Primary activation delta penalty (0 to −15)
    const origActivation = original.primaryActivation as number | null | undefined
    const candActivation = (candidate as unknown as { primaryActivation?: number | null }).primaryActivation
    if (origActivation != null && candActivation != null) {
      const delta = Math.abs(origActivation - candActivation)
      if (delta > 0.25) score -= Math.round(delta * 60)
    }

    if (score <= 0) continue

    // Label qualitatif — requires real overlap, not just dos_large
    let label = 'Alternative'
    const hasRealOverlap = overlap.length > 0 && !hasOnlyDosLarge
    if (candidate.movementPattern === originalPattern && hasRealOverlap) label = 'Remplace mécaniquement'
    else if (candidate.movementPattern !== originalPattern && hasRealOverlap) label = 'Angle complémentaire'
    else if (!sameEquip && hasEquipment) label = 'Alternative équipement'

    scored.push({ entry: candidate, score, label })
  }

  // Deduplicate by name prefix (first 3 words) — keeps highest scoring variant
  const sorted = scored.sort((a, b) => b.score - a.score)
  const seenPrefixes = new Set<string>()
  const deduped: AlternativeScore[] = []
  for (const alt of sorted) {
    const prefix = alt.entry.name.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
    if (!seenPrefixes.has(prefix)) {
      seenPrefixes.add(prefix)
      deduped.push(alt)
    }
    if (deduped.length >= 6) break
  }
  return deduped
}
