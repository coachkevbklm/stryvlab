// Logique pure — pas de 'use client', utilisable dans les Server Components
// Catalogue importé pour fallback lookup par nom d'exercice
import catalogJson from '@/data/exercise-catalog.json'

interface CatalogEntry { name: string; muscles?: string[]; primaryMuscle?: string; secondaryMuscles?: string[] }
const catalog = catalogJson as CatalogEntry[]

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
const catalogBySlug = new Map<string, CatalogEntry>(catalog.map(e => [toSlug(e.name), e]))

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

// Mapping depuis les slugs du catalogue (muscles[] = FR court, primaryMuscle/secondaryMuscles = EN anatomique)
// vers les MuscleGroup du BodyMap.
const CATALOG_SLUG_MAP: Record<string, MuscleGroup> = {
  // Slugs FR courts (champ muscles[])
  'dos':               'back_upper',
  'pectoraux':         'chest',
  'epaules':           'shoulders',
  'biceps':            'biceps',
  'triceps':           'triceps',
  'abdos':             'abs',
  'quadriceps':        'quads',         // FR court
  'ischio-jambiers':   'hamstrings',
  'fessiers':          'glutes',
  'mollets':           'calves',
  // Slugs EN anatomiques (champ primaryMuscle / secondaryMuscles[])
  'lats':                    'back_upper',
  'upper_back':              'back_upper',
  'rhomboids':               'back_upper',
  'teres_major':             'back_upper',
  'teres_minor':             'back_upper',
  'infraspinatus':           'back_upper',
  'spine_erectors':          'back_lower',
  'erector_spinae':          'back_lower',
  'lower_back':              'back_lower',
  'pectoralis_major':        'chest',
  'pectoralis_major_upper':  'chest',
  'pectoralis_major_lower':  'chest',
  'pec_minor':               'chest',
  'anterior_deltoid':        'shoulders',
  'medial_deltoid':          'shoulders',
  'posterior_deltoid':       'shoulders',
  'deltoid':                 'shoulders',
  'rotator_cuff':            'shoulders',
  'subscapularis':           'shoulders',
  'biceps_brachii':          'biceps',
  'brachialis':              'biceps',
  'brachioradialis':         'biceps',
  'triceps_brachii':         'triceps',
  'rectus_abdominis':        'abs',
  'obliques':                'abs',
  'transverse_abdominis':    'abs',
  'lower_abs':               'abs',
  'core':                    'abs',
  'core_global':             'abs',
  'rectus_femoris':          'quads',
  'vastus_lateralis':        'quads',
  'vastus_medialis':         'quads',
  'hamstrings':              'hamstrings',
  'biceps_femoris':          'hamstrings',
  'semimembranosus':         'hamstrings',
  'semitendinosus':          'hamstrings',
  'gluteus_maximus':         'glutes',
  'gluteus_medius':          'glutes',
  'glutes':                  'glutes',
  'gastrocnemius':           'calves',
  'soleus':                  'calves',
  'traps':                   'traps',
  'upper_traps':             'traps',
  'middle_traps':            'traps',
  'trapezius':               'traps',
  'levator_scapulae':        'traps',
  // Épaules — variantes supplémentaires catalogue
  'rear_delts':              'shoulders',
  'deltoids':                'shoulders',
  'shoulders':               'shoulders',
  'supraspinatus':           'shoulders',
  'external_rotators':       'shoulders',
  // Pectoraux — variantes
  'pec_major':               'chest',
  'upper_chest':             'chest',
  // Dos — variantes
  'scapula':                 'back_upper',
  'quadratus_lumborum':      'back_lower',
  // Jambes — variantes
  'quads':                   'quads',
  'adductors':               'quads',
  'hip_flexors':             'quads',
  'calves':                  'calves',
  // Abs — variantes
  'anconeus':                'triceps',
}

// Fallback regex sur le nom — utilisé uniquement si primary_muscles est vide ET le slug ne mappe pas
const MUSCLE_KEYWORDS: Record<MuscleGroup, RegExp> = {
  chest:      /pectoral|pec deck|développé couché|développé incliné|développé haltères|dips pecto|écarté|chest|fly|flye/i,
  shoulders:  /militaire|épaule|élévation|shoulder|delt|développé nuque|oiseau|reverse fly|face pull/i,
  biceps:     /curl|bicep|marteau|hammer/i,
  triceps:    /tricep|extension (aux |à la |poulie haute|câble)|skull|close.grip/i,
  abs:        /crunch|planche|dead bug|abdomi|core|lombaire|relevé de jambes|dragon flag/i,
  quads:      /squat|leg press|leg extension|presse à cuisses|hack squat|fente|split squat/i,
  hamstrings: /leg curl|ischio|soulevé de terre|roumain|jambes tendues/i,
  glutes:     /hip thrust|fessier|glute|soulevé roumain|kickback/i,
  calves:     /mollet|calf|calf raise/i,
  back_upper: /tirage|rowing|traction|pulldown|dos|poulie haute|seated row|chest supported/i,
  back_lower: /extension lombaire|hyperextension|soulevé de terre/i,
  traps:      /trapèze|shrug|haussement/i,
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
/** Traduit un slug catalogue (FR court ou EN anatomique) vers un MuscleGroup BodyMap. */
function resolveSlug(slug: string): MuscleGroup | null {
  const direct = CATALOG_SLUG_MAP[slug]
  if (direct) return direct
  // Tentative case-insensitive
  const lower = slug.toLowerCase()
  return CATALOG_SLUG_MAP[lower] ?? null
}

export function detectMuscleGroups(exercises: ExerciseInput[]): MuscleActivation {
  const primary = new Set<MuscleGroup>()
  const secondary = new Set<MuscleGroup>()

  for (const ex of exercises) {
    const hasPrimary = ex.primary_muscles && ex.primary_muscles.length > 0
    const hasSecondary = ex.secondary_muscles && ex.secondary_muscles.length > 0

    if (hasPrimary || hasSecondary) {
      // Source DB — résoudre via mapping catalogue puis fallback isValidMuscleGroup
      for (const m of (ex.primary_muscles ?? [])) {
        const group = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
        if (group) primary.add(group)
      }
      for (const m of (ex.secondary_muscles ?? [])) {
        const group = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
        if (group && !primary.has(group)) secondary.add(group)
      }

      // Si aucun slug n'a résolu, tomber en fallback regex sur le nom
      if (primary.size === 0 && secondary.size === 0) {
        for (const [group, regex] of Object.entries(MUSCLE_KEYWORDS) as [MuscleGroup, RegExp][]) {
          if (regex.test(ex.name)) primary.add(group)
        }
      }
    } else {
      // Pas de données DB — chercher dans le catalogue par nom, puis fallback regex
      const slug = toSlug(ex.name)
      const entry = catalogBySlug.get(slug) ?? catalog.find(e => toSlug(e.name) === slug)
      if (entry) {
        const pm = entry.primaryMuscle ? resolveSlug(entry.primaryMuscle) : null
        if (pm) primary.add(pm)
        for (const m of (entry.muscles ?? [])) {
          const g = resolveSlug(m)
          if (g && g !== pm) secondary.add(g)
        }
        for (const m of (entry.secondaryMuscles ?? [])) {
          const g = resolveSlug(m)
          if (g && !primary.has(g)) secondary.add(g)
        }
      } else {
        // Fallback ultime — regex sur le nom
        for (const [group, regex] of Object.entries(MUSCLE_KEYWORDS) as [MuscleGroup, RegExp][]) {
          if (regex.test(ex.name)) primary.add(group)
        }
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
