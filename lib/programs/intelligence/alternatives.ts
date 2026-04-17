import catalogData from '@/data/exercise-catalog.json'
import { normalizeMuscleSlug, getStimulusCoeff } from './catalog-utils'
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
  const originalMuscles = new Set(original.primary_muscles.map(normalizeMuscleSlug))
  const originalCoeff = getStimulusCoeff(
    original.name.toLowerCase().replace(/\s+/g, '-'),
    originalPattern,
    (original.is_compound ?? originalMuscles.size >= 2),
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

    // Muscles primaires communs (+30)
    const candidateMuscles = new Set(candidate.muscles.map(normalizeMuscleSlug))
    const overlap = Array.from(originalMuscles).filter(m => candidateMuscles.has(m))
    if (overlap.length > 0) score += Math.min(30, overlap.length * 15)

    // Équipement compatible (+20) — déjà filtré au-dessus, bonus pour équipement similaire
    const sameEquip = original.equipment_required.some(eq => candidate.equipment.includes(eq))
    if (sameEquip) score += 20

    // Non redondant avec les autres exercices de la session (+10)
    const isRedundant = sessionPatterns.includes(candidate.movementPattern)
    if (!isRedundant) score += 10

    // Pénalité si stimulus_coefficient inférieur à l'original (−15)
    if (candidate.stimulus_coefficient < originalCoeff - 0.15) score -= 15

    if (score <= 0) continue

    // Label qualitatif
    let label = 'Alternative'
    if (candidate.movementPattern === originalPattern && overlap.length >= 1) label = 'Remplace mécaniquement'
    else if (candidate.movementPattern !== originalPattern && overlap.length >= 1) label = 'Angle complémentaire'
    else if (!sameEquip && hasEquipment) label = 'Alternative équipement'

    scored.push({ entry: candidate, score, label })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // max 8 alternatives retournées au drawer
}
