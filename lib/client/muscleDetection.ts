// Logique pure — pas de 'use client', utilisable dans les Server Components

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'back_upper'
  | 'back_lower'
  | 'traps'

export interface MuscleActivation {
  primary: Set<MuscleGroup>
  secondary: Set<MuscleGroup>
}

// Fallback regex sur le nom — utilisé uniquement si primary_muscles est vide
const MUSCLE_KEYWORDS: Record<MuscleGroup, RegExp> = {
  chest:      /pectoral|pec deck|développé couché|développé incliné|développé haltères|dips pecto|écarté|chest/i,
  shoulders:  /militaire|épaule|élévation|shoulder|delt|développé nuque|oiseau|reverse fly/i,
  biceps:     /curl|bicep|marteau|hammer/i,
  triceps:    /tricep|extension (aux |à la |poulie)|dips/i,
  abs:        /crunch|planche|dead bug|abdomi|core|lombaire/i,
  quads:      /squat|leg press|leg extension|presse à cuisses|hack squat/i,
  hamstrings: /leg curl|ischio|soulevé de terre|roumain|jambes tendues/i,
  glutes:     /hip thrust|fessier|glute|soulevé roumain/i,
  calves:     /mollet|calf|calf raise/i,
  back_upper: /tirage|rowing|traction|pulldown|dos|trapèze supérieur|poulie haute/i,
  back_lower: /extension lombaire|hyperextension|soulevé de terre/i,
  traps:      /trapèze|shrug/i,
}

// Exercice avec métadonnées DB (optionnelles)
export interface ExerciseInput {
  name: string
  primary_muscles?: string[]
  secondary_muscles?: string[]
}

/**
 * Détecte les groupes musculaires actifs depuis une liste d'exercices.
 * Priorité : colonnes DB (primary_muscles / secondary_muscles) → fallback regex sur le nom.
 * Un muscle ne peut pas être à la fois primaire ET secondaire : primaire gagne.
 */
export function detectMuscleGroups(exercises: ExerciseInput[]): MuscleActivation {
  const primary = new Set<MuscleGroup>()
  const secondary = new Set<MuscleGroup>()

  for (const ex of exercises) {
    const hasPrimary = ex.primary_muscles && ex.primary_muscles.length > 0
    const hasSecondary = ex.secondary_muscles && ex.secondary_muscles.length > 0

    if (hasPrimary || hasSecondary) {
      // Source DB — fiable
      for (const m of (ex.primary_muscles ?? [])) {
        if (isValidMuscleGroup(m)) primary.add(m as MuscleGroup)
      }
      for (const m of (ex.secondary_muscles ?? [])) {
        if (isValidMuscleGroup(m) && !primary.has(m as MuscleGroup)) {
          secondary.add(m as MuscleGroup)
        }
      }
    } else {
      // Fallback regex — tous mis en primaire (comportement legacy)
      for (const [group, regex] of Object.entries(MUSCLE_KEYWORDS) as [MuscleGroup, RegExp][]) {
        if (regex.test(ex.name)) primary.add(group)
      }
    }
  }

  // Garantie : si un muscle est primaire dans un exercice et secondaire dans un autre,
  // il reste primaire
  primary.forEach(m => secondary.delete(m))

  return { primary, secondary }
}

const VALID_MUSCLE_GROUPS = new Set<string>([
  'chest','shoulders','biceps','triceps','abs',
  'quads','hamstrings','glutes','calves','back_upper','back_lower','traps'
])

function isValidMuscleGroup(m: string): boolean {
  return VALID_MUSCLE_GROUPS.has(m)
}
