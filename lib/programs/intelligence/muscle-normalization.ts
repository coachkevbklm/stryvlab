// Single source of truth for all muscle slugs
// Format: FR anatomical names (lowercase_underscore)
// This is the ONLY place where slug definitions live

export const CANONICAL_MUSCLES = {
  // Poitrine
  grand_pectoral: true,
  grand_pectoral_superieur: true,
  grand_pectoral_inferieur: true,
  petit_pectoral: true,

  // Dos
  grand_dorsal: true,
  trapeze_superieur: true,
  trapeze_moyen: true,
  trapeze_inferieur: true,
  rhomboides: true,
  lombaires: true,
  erecteurs_spinaux: true,

  // Épaules
  deltoide_anterieur: true,
  deltoide_lateral: true,
  deltoide_posterieur: true,

  // Bras
  biceps: true,
  biceps_brachial: true,
  brachial: true,
  triceps: true,
  triceps_lateral: true,
  triceps_medial: true,
  triceps_long: true,

  // Avant-bras
  flechisseurs_avant_bras: true,
  extenseurs_avant_bras: true,

  // Jambes
  quadriceps: true,
  rectus_femoris: true,
  vaste_lateral: true,
  vaste_medial: true,
  vaste_intermediaire: true,

  ischio_jambiers: true,
  biceps_femoral: true,
  semi_tendineux: true,
  semi_membraneux: true,

  grand_fessier: true,
  moyen_fessier: true,
  petit_fessier: true,

  adducteurs: true,
  abducteurs: true,

  mollet: true,
  solea: true,
  gastrocnemien: true,
  tibial_anterieur: true,

  // Core
  abdos: true,
  obliques_externes: true,
  obliques_internes: true,
  transverse_abdominal: true,

  // Legacy/catch-all (maps to specific muscles)
  dos_large: true, // Internal use only for grouping
} as const

export type CanonicalMuscle = keyof typeof CANONICAL_MUSCLES

// Map old slugs → canonical (backward compat for import/legacy data)
export const LEGACY_TO_CANONICAL: Record<string, CanonicalMuscle> = {
  // English → FR
  chest: 'grand_pectoral',
  pectoraux: 'grand_pectoral',
  pectoraux_haut: 'grand_pectoral_superieur',
  pectoraux_bas: 'grand_pectoral_inferieur',

  back: 'grand_dorsal',
  dos: 'grand_dorsal',
  lats: 'grand_dorsal',

  shoulders: 'deltoide_anterieur',
  epaules_ant: 'deltoide_anterieur',
  epaules_lat: 'deltoide_lateral',
  epaules_post: 'deltoide_posterieur',

  biceps_brachii: 'biceps',
  triceps_longhead: 'triceps_long',

  quads: 'quadriceps',
  hamstrings: 'ischio_jambiers',
  glutes: 'grand_fessier',
  glutes_med: 'moyen_fessier',

  calves: 'mollet',
  abs: 'abdos',
  core: 'abdos',

  // Déjà canonique (identity map)
  grand_dorsal: 'grand_dorsal',
  trapeze_superieur: 'trapeze_superieur',
  trapeze_moyen: 'trapeze_moyen',
  trapeze_inferieur: 'trapeze_inferieur',
  rhomboides: 'rhomboides',
  lombaires: 'lombaires',
  erecteurs_spinaux: 'erecteurs_spinaux',
  deltoide_anterieur: 'deltoide_anterieur',
  deltoide_lateral: 'deltoide_lateral',
  deltoide_posterieur: 'deltoide_posterieur',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'quadriceps',
  grand_fessier: 'grand_fessier',
  moyen_fessier: 'moyen_fessier',
  petit_fessier: 'petit_fessier',
  mollet: 'mollet',
  abdos: 'abdos',
  dos_large: 'dos_large',
}

/**
 * Normalize any muscle slug to canonical form.
 * Throws if slug is unrecognized.
 */
export function normalizeMuscleSlug(slug: string): CanonicalMuscle {
  const clean = slug.toLowerCase().trim().replace(/\s+/g, '_')

  // Already canonical?
  if (CANONICAL_MUSCLES[clean as CanonicalMuscle]) {
    return clean as CanonicalMuscle
  }

  // Legacy mapping?
  const canonical = LEGACY_TO_CANONICAL[clean]
  if (canonical) {
    return canonical
  }

  throw new Error(
    `Unknown muscle slug: "${slug}". ` +
    `Valid slugs: ${Object.keys(CANONICAL_MUSCLES).join(', ')}`
  )
}

/**
 * Validate array of muscle slugs. Normalizes + dedupes.
 * Throws if any slug is invalid.
 */
export function validateMuscleArray(slugs: unknown[]): CanonicalMuscle[] {
  if (!Array.isArray(slugs)) {
    throw new Error('Muscles must be an array')
  }

  const normalized = slugs.map(s => {
    if (typeof s !== 'string') {
      throw new Error(`Muscle slug must be string, got ${typeof s}`)
    }
    return normalizeMuscleSlug(s)
  })

  // Dedupe while preserving order
  return [...new Set(normalized)]
}
