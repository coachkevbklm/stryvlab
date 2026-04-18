export type Severity = 'critical' | 'warning' | 'info'
export type MovementPattern = string

export interface IntelligenceAlert {
  severity: Severity
  code: string
  title: string
  explanation: string
  suggestion: string
  sessionIndex?: number
  exerciseIndex?: number
}

export interface SRAPoint {
  muscleGroup: string
  sessionIndex: number
  hoursFromPrevious: number | null
  windowRequired: number
  violation: boolean
}

export interface RedundantPair {
  sessionIndex: number
  exerciseIndexA: number
  exerciseIndexB: number
  reason: string
}

export interface MuscleDistribution {
  [muscleGroup: string]: number // volume pondéré (sets × stimCoeff)
}

export interface PatternDistribution {
  push: number
  pull: number
  legs: number
  core: number
}

export interface SessionStats {
  name: string
  exerciseCount: number
  totalSets: number
  estimatedReps: number
  patterns: string[]          // slugs uniques présents dans la séance
  topMuscles: string[]        // 3 groupes musculaires les plus sollicités (slugs FR)
  muscleVolumes: Record<string, number>  // slug FR → weighted volume in THIS session
}

export interface ProgramStats {
  totalSets: number           // total séries sur toute la semaine
  totalEstimatedReps: number  // total reps estimées (sets × repsLow)
  totalExercises: number      // exercices uniques (par nom)
  avgExercisesPerSession: number
  sessionsStats: SessionStats[]
}

export interface IntelligenceResult {
  globalScore: number
  globalNarrative: string
  subscores: {
    balance: number
    recovery: number
    specificity: number
    progression: number
    completeness: number
    redundancy: number
  }
  alerts: IntelligenceAlert[]
  distribution: MuscleDistribution
  patternDistribution: PatternDistribution
  missingPatterns: MovementPattern[]
  redundantPairs: RedundantPair[]
  sraMap: SRAPoint[]
  programStats: ProgramStats
}

// Exercice tel que stocké dans le builder (coach_program_template_exercises)
export interface BuilderExercise {
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string
  movement_pattern: string | null
  equipment_required: string[]
  primary_muscles: string[]   // slugs FR : 'fessiers', 'quadriceps', etc.
  secondary_muscles: string[]
  is_compound?: boolean       // checkbox coach — undefined = auto-dérivé
  group_id?: string           // superset group identifier
}

export interface BuilderSession {
  name: string
  day_of_week: number | null
  exercises: BuilderExercise[]
}

export interface TemplateMeta {
  goal: string      // 'hypertrophy' | 'strength' | 'fat_loss' | 'recomp' | 'maintenance' | 'athletic' | 'endurance'
  level: string     // 'beginner' | 'intermediate' | 'advanced' | 'elite'
  weeks: number
  frequency: number
  equipment_archetype: string
}

export interface InjuryRestriction {
  bodyPart: string
  severity: 'avoid' | 'limit' | 'monitor'
}

export interface IntelligenceProfile {
  injuries: InjuryRestriction[]
  equipment: string[]
  fitnessLevel?: string
  goal?: string
}
