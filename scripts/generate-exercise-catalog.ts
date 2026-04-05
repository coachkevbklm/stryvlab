/**
 * Script de génération du catalogue d'exercices depuis les GIFs
 * Run: npx ts-node --project tsconfig.json scripts/generate-exercise-catalog.ts
 */

import fs from 'fs'
import path from 'path'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExerciseEntry {
  id: string
  name: string
  slug: string
  gifUrl: string
  muscleGroup: string
  exerciseType: 'exercise' | 'pedagogique'
  pattern: string[]        // macro-pattern : push | pull | legs | hinge | carry | core
  movementPattern: string  // sous-pattern biomécanique pour la substitution (Phase 3 matching)
  equipment: string[]
  isCompound: boolean
  muscles: string[]
}

// ─── Name formatting ─────────────────────────────────────────────────────────

// GIFs pédagogiques (démonstrations de position, vues anatomiques)
// Inclus dans le catalogue avec exerciseType='pedagogique' pour qu'un coach puisse les utiliser
const PEDAGOGIQUE_SLUGS = new Set([
  'bonne-mauvaise-position-bassin-squat',
  'bonne-mauvaise-position-genoux-squat',
  'deadlift-vue-avant',
  'deadlift-vue-de-dos',
  'exercice-squat-vue-profil',
  'fente-avant-barre-vue-profil-homme',
  'position-bassin-souleve-de-terre',
])

function slugToName(slug: string): string {
  const base = slug.replace(/\.gif$/, '')
  let name = base.replace(/-/g, ' ')

  // Remove trailing noise suffixes (order matters — longest first)
  name = name.replace(/\s+exercice musculation$/i, '')
  name = name.replace(/\s+exercice musculation\s+\w+$/i, '')
  name = name.replace(/\s+exercice$/i, '')
  name = name.replace(/\s+musculation$/i, '')

  // Remove mid-string noise keywords
  name = name.replace(/\bexercice\s+/gi, '')
  name = name.replace(/\s+musculation\b/gi, '')

  // Specific known redundancies in filenames
  name = name.replace(/\s+shoulder press$/i, '')   // "à la machine shoulder press" → "à la machine"
  name = name.replace(/\s+abdos$/i, '')            // "Chinese plank planche chinoise abdos" → strip trailing "abdos"
  name = name.replace(/\s+abdominaux$/i, '')       // "Ab coaster abdominaux" → keep as is actually useful
  name = name.replace(/\s+exercice musculation\s+/gi, ' ')
  name = name.replace(/\s+dips assistes$/i, '')   // leg extension unilateral machine dips assistes → cleanup

  // Remove parenthetical duplicates like "(1)"
  name = name.replace(/\s*\(\s*1\s*\)\s*/g, ' ')

  // Restore accents lost in slug encoding
  const accents: [RegExp, string][] = [
    // "developpe" → "Développé" (must run before other replacements)
    [/\bDeveloppe\b/g, 'Développé'],
    [/\bdeveloppe\b/g, 'développé'],
    [/\bSouleve\b/g, 'Soulevé'],
    [/\bsouleve\b/g, 'soulevé'],
    [/\ba\b/g, 'à'],               // "a la barre" → "à la barre"
    [/\belastique\b/gi, 'élastique'],
    [/\blaterale\b/gi, 'latérale'],
    [/\blaterales\b/gi, 'latérales'],
    [/\blateral\b/gi, 'latéral'],
    [/\belastiques\b/gi, 'élastiques'],
    [/\bhaltere\b/gi, 'haltère'],
    [/\bhalteres\b/gi, 'haltères'],
    [/\bderriere\b/gi, 'derrière'],
    [/\becarte\b/gi, 'écarté'],
    [/\becartes\b/gi, 'écartés'],
    [/\bepaule\b/gi, 'épaule'],
    [/\bepaules\b/gi, 'épaules'],
    [/\bepaule\b/gi, 'épaule'],
    [/\bepaules\b/gi, 'épaules'],
    [/\bele[vé]ation\b/gi, 'élévation'],
    [/\belevation\b/gi, 'Élévation'],
    [/\televations\b/gi, 'élévations'],
    [/\belevations\b/gi, 'Élévations'],
    [/\btete\b/gi, 'tête'],
    [/\bunilateral\b/gi, 'unilatéral'],
    [/\bunilaterale\b/gi, 'unilatérale'],
    [/\bplie\b/gi, 'plié'],
    [/\bpliee\b/gi, 'pliée'],
    [/\bgenere\b/gi, 'généré'],
    [/\ballonge\b/gi, 'allongé'],
    [/\ballongee\b/gi, 'allongée'],
    [/\bdebout\b/gi, 'debout'],
    [/\bassis\b/gi, 'assis'],
    [/\bincline\b/gi, 'incliné'],
    [/\binclinee\b/gi, 'inclinée'],
    [/\bdecline\b/gi, 'décliné'],
    [/\bdeclinee\b/gi, 'déclinée'],
    [/\bpoulie\b/gi, 'poulie'],
    [/\bpenche\b/gi, 'penché'],
    [/\bfermier\b/gi, 'fermier'],
    [/\bsuspendu\b/gi, 'suspendu'],
    [/\bserree\b/gi, 'serrée'],
    [/\bserre\b/gi, 'serré'],
    [/\binverse\b/gi, 'inversé'],
    [/\binversee\b/gi, 'inversée'],
    [/\bconcre\b/gi, 'concentré'],
    [/\bderriere\b/gi, 'derrière'],
    [/\bchaise\b/gi, 'chaise'],
    [/\blordose\b/gi, 'lordose'],
    [/\bprise\b/gi, 'prise'],
  ]

  for (const [pattern, replacement] of accents) {
    name = name.replace(pattern, replacement)
  }

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, ' ').trim()

  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1)

  return name
}

// ─── Equipment inference ──────────────────────────────────────────────────────

function inferEquipment(slug: string): string[] {
  const s = slug.toLowerCase()
  const equip: string[] = []

  // ── Weighted implements ──

  if (s.includes('haltere') || s.includes('halteres') || s.includes('dumbbell') || s.includes('dumbell')) {
    equip.push('dumbbell')
  }

  // Barbell: explicit "barre" OR well-known barbell exercises where "barre" is absent
  const isBarbell =
    (s.includes('barre') && !s.includes('barre-front')) ||
    s.includes('barbell') ||
    // Compound exercises typically done with a barbell when no other equipment is named
    s.includes('zercher') ||
    s.includes('pin-squat') ||
    s.includes('safety-bar-squat') ||
    s.includes('overhead-shrug') ||
    s.includes('reeves-deadlift') ||
    s.includes('renegade-row')  // usually dumbbells but also barbell — dumbbell added separately
  if (isBarbell) equip.push('barbell')

  if (s.includes('smith') || s.includes('smith-machine')) {
    if (!equip.includes('smith')) equip.push('smith')
  }

  if (
    s.includes('machine') ||
    s.includes('hammer') ||
    s.includes('technogym') ||
    s.includes('iso-lateral') ||
    s.includes('prechargee') ||
    s.includes('convergente') ||
    s.includes('ab-coaster') ||
    s.includes('leg-press') ||
    s.includes('presse-a-cuisse') ||
    s.includes('presse-a-cuisses') ||
    s.includes('presse-cuisse') ||
    s.includes('hack-squat-assis') ||
    s.includes('pendulum-squat') ||
    s.includes('belt-squat') ||
    s.includes('sissy-squat-machine') ||
    s.includes('extension-hanche-machine') ||
    s.includes('extension-de-jambe') ||
    s.includes('leg-extension') ||
    s.includes('leg-curl') ||
    s.includes('hip-thrust-a-la-machine') ||
    s.includes('hip-thrust-machine') ||
    s.includes('extension-lombaire-a-la-machine') ||
    s.includes('shrug-machine')
  ) {
    equip.push('machine')
  }

  if (s.includes('poulie') || s.includes('cable') || s.includes('vis-a-vis')) {
    equip.push('cable')
  }

  if (s.includes('kettlebell') || s.includes('kettlebells')) {
    if (!equip.includes('kettlebell')) equip.push('kettlebell')
  }

  // Windmill is typically done with a kettlebell (or dumbbell)
  if (s.includes('windmill') && !equip.includes('kettlebell')) {
    equip.push('kettlebell')
    equip.push('dumbbell')
  }

  if (s.includes('elastique') || s.includes('bande-elastique')) equip.push('band')

  if (s.includes('sangle') || s.includes('trx') || s.includes('suspension')) equip.push('trx')

  if (s.includes('landmine')) equip.push('landmine')

  if (s.includes('medecine') || s.includes('medicine')) equip.push('medicine_ball')

  if (s.includes('sandbag')) equip.push('sandbag')

  if (s.includes('anneaux')) equip.push('rings')

  if (s.includes('ballon') || s.includes('swiss-ball')) equip.push('swiss_ball')

  if (s.includes('sled') || s.includes('traineau')) equip.push('sled')

  if (s.includes('trap-bar')) equip.push('trap_bar')

  if (s.includes('ez') || s.includes('barre-ez')) equip.push('ez_bar')

  if (s.includes('barre-front')) equip.push('barbell') // JM Press

  // Dumbbell for renegade row (requires dumbbells specifically)
  if (s.includes('renegade-row') && !equip.includes('dumbbell')) equip.push('dumbbell')

  // Suitcase deadlift = dumbbell or kettlebell
  if (s.includes('valise') && !equip.includes('dumbbell')) {
    equip.push('dumbbell')
    equip.push('kettlebell')
  }

  // Jefferson squat = barbell (straddled)
  if (s.includes('jefferson-squat') && !equip.includes('barbell')) equip.push('barbell')

  // Pec deck butterfly = machine
  if (s.includes('pec-deck') && !equip.includes('machine')) equip.push('machine')

  // Bodyweight: explicit bodyweight-only movements
  const isClearBodyweight =
    s.includes('pompe') ||
    s.includes('dips-entre') ||
    s.includes('dips-sur') ||
    s.includes('dips-aux-anneaux') ||
    s.includes('planche') ||
    s.includes('gainage') ||
    s.includes('hollow') ||
    s.includes('dead-bug') ||
    s.includes('mountain-climber') ||
    s.includes('dragon-flag') ||
    s.includes('bird-dog') ||
    s.includes('superman') ||
    s.includes('fire-hydratant') ||
    s.includes('donkey-kick') ||
    s.includes('ciseaux') ||
    s.includes('cocon') ||
    s.includes('air-squat') ||
    s.includes('squat-pistol') ||
    s.includes('pistol-squat-assiste') ||
    s.includes('box-pistol-squat') ||
    s.includes('handstand') ||
    s.includes('pike-push') ||
    s.includes('nordic') ||
    s.includes('glute-ham') ||
    s.includes('sit-up-avec-medecine') ||
    s.includes('bear-plank') ||
    s.includes('crunch-au-sol') ||
    s.includes('crunch-avec-jambes') ||
    s.includes('cercles-jambes') ||
    s.includes('v-ups') ||
    s.includes('jackknife') ||
    s.includes('touche-talon') ||
    s.includes('chinese-plank') ||
    s.includes('hyperextension-inversee-ballon') ||
    s.includes('releve-de-genoux-suspendu') ||
    s.includes('releve-de-jambes-suspendu') ||
    s.includes('releve-jambes-chaise-romaine') ||
    s.includes('sits-up-chaise-romaine') ||
    s.includes('abdominaux-a-la-barre') ||  // bar hang
    s.includes('rotations-abdos-obliques-suspendu') ||
    s.includes('traction-') ||  // pull-up family
    s.includes('chin-up') ||
    s.includes('marche-avec-elastique')

  if (isClearBodyweight && !equip.includes('bodyweight')) {
    equip.push('bodyweight')
  }

  // If still nothing, it's bodyweight
  if (equip.length === 0) equip.push('bodyweight')

  return [...new Set(equip)]
}

// ─── Pattern inference ────────────────────────────────────────────────────────

function inferPattern(slug: string, muscleGroup: string): string[] {
  const s = slug.toLowerCase()
  const patterns: string[] = []

  // ── PUSH ──
  if (
    s.includes('developpe') ||
    // "press" but not "leg press / presse à cuisses"
    (s.includes('press') && !s.includes('presse-a-cuisse') && !s.includes('presse-a-cuisses') && !s.includes('presse-cuisse') && !s.includes('leg-press')) ||
    s.includes('dips') ||
    s.includes('pompe') || s.includes('elevation-frontale') || s.includes('elevations-frontales') ||
    s.includes('pike-push') || s.includes('handstand-push') ||
    s.includes('extension-triceps') || s.includes('extensions-des-triceps') ||
    s.includes('extensions-triceps') || s.includes('extensions-concentres') ||
    s.includes('kickback') || s.includes('extension-horizontale-poulie') ||
    s.includes('barre-front') || s.includes('tate-press') || s.includes('hex-press')
  ) patterns.push('push')

  // Thruster = push + legs
  if (s.includes('thruster')) {
    patterns.push('push')
    patterns.push('legs')
  }

  // Overhead squat = push (overhead stability) + legs
  if (s.includes('overhead-squat')) {
    patterns.push('push')
    patterns.push('legs')
  }

  // ── PULL ──
  if (
    s.includes('traction') || s.includes('rowing') || s.includes('tirage') ||
    s.includes('curl') ||
    s.includes('chin-up') || s.includes('pull-over') || s.includes('pullover') ||
    s.includes('face-pull') || s.includes('oiseau') || s.includes('sled-pull') ||
    s.includes('tirage-menton') ||
    s.includes('elevation-laterale') || s.includes('elevations-laterales') ||
    s.includes('elevation-en-y') || s.includes('ecarte-arriere') ||
    s.includes('pec-deck-inverse') || s.includes('rotation-externe') ||
    s.includes('passage-depaule')
  ) patterns.push('pull')

  // Shrug is pull (upper trap isolation)
  if (s.includes('shrug')) patterns.push('pull')

  // ── HINGE ──
  if (
    s.includes('souleve-de-terre') || s.includes('deadlift') || s.includes('good-morning') ||
    s.includes('hip-thrust') || s.includes('kettlebell-swing') ||
    s.includes('zercher-deadlift') || s.includes('reeves-deadlift') ||
    s.includes('rack-pull') || s.includes('pull-through') ||
    s.includes('reverse-hyperextension') || s.includes('hyperextension') ||
    s.includes('glute-ham') || s.includes('extension-lombaire') ||
    s.includes('extension-hanche') || s.includes('nordic') ||
    s.includes('back-extension') || s.includes('superman')
  ) patterns.push('hinge')

  // ── LEGS (squat / lunge family) ──
  if (
    s.includes('squat') || s.includes('fente') ||
    s.includes('presse-a-cuisse') || s.includes('presse-a-cuisses') || s.includes('presse-cuisse') ||
    s.includes('leg-press') || s.includes('hack-squat') ||
    s.includes('split-squat') || s.includes('montees-sur-banc') || s.includes('pistol') ||
    s.includes('sissy') || s.includes('belt-squat') || s.includes('pendulum') ||
    s.includes('safety-bar') || s.includes('jefferson-squat') || s.includes('zercher-squat') ||
    s.includes('air-squat') || s.includes('cossack') || s.includes('curtsy-lunge') ||
    s.includes('leg-extension') || s.includes('leg-curl') ||
    s.includes('extension-mollets') || s.includes('extensions-mollets') || s.includes('extensions-des-mollets') ||
    s.includes('box-pistol') ||
    // Lateral band walk = hip abduction, lower body
    s.includes('marche-avec-elastique')
  ) patterns.push('legs')

  // ── CARRY ──
  if (
    s.includes('marche-du-fermier') || s.includes('zercher-carry') ||
    s.includes('sled-push') || s.includes('sled-pull') || s.includes('fentes-marchees')
  ) patterns.push('carry')

  // ── CORE ──
  if (
    muscleGroup === 'abdos' ||
    s.includes('planche') || s.includes('gainage') || s.includes('crunch') ||
    s.includes('rotation-buste') || s.includes('rotation-abdos') || s.includes('rotations-russes') ||
    s.includes('sit-up') || s.includes('releve-de') || s.includes('dragon-flag') ||
    s.includes('dead-bug') || s.includes('hollow') || s.includes('mountain-climber') ||
    s.includes('bird-dog') || s.includes('roulette') ||
    s.includes('windmill') || s.includes('ab-coaster') || s.includes('abdominaux') ||
    s.includes('obliques') || s.includes('jackknife') || s.includes('ciseaux') ||
    s.includes('cocon') || s.includes('v-ups') || s.includes('touche-talon') || s.includes('bear-plank') ||
    s.includes('cercles-jambes') || s.includes('russian-twist') || s.includes('chinese-plank') ||
    s.includes('pallof') || s.includes('zercher-carry') || s.includes('rotations-abdos-obliques')
  ) patterns.push('core')

  // Fallback
  if (patterns.length === 0) {
    patterns.push(muscleGroup === 'abdos' ? 'core' : 'pull')
  }

  return [...new Set(patterns)]
}

// ─── isCompound inference ─────────────────────────────────────────────────────

function inferIsCompound(slug: string): boolean {
  const s = slug.toLowerCase()

  // ── Explicitly compound — checked FIRST, cannot be overridden ──
  // Multi-joint exercises that might match isolation keywords below
  if (s.includes('nordic') || s.includes('glute-ham')) return true

  // ── Always isolation ──
  if (
    // Curl family (except chin-up / traction supination which work lats too)
    (s.includes('curl') && !s.includes('chin-up') && !s.includes('traction-supination')) ||
    // Lateral / front raises
    s.includes('elevation-laterale') || s.includes('elevations-laterales') ||
    s.includes('elevation-frontale') || s.includes('elevations-frontales') ||
    // Flies / écartés
    s.includes('ecarte') || s.includes('ecartes') ||
    // Leg isolation
    s.includes('leg-extension') || s.includes('leg-curl') ||
    // Triceps isolation
    s.includes('extension-triceps') || s.includes('extensions-des-triceps') ||
    s.includes('extensions-concentres') || s.includes('kickback') ||
    s.includes('extension-horizontale-poulie') ||
    // Calf raise
    s.includes('extension-mollets') || s.includes('extensions-mollets') || s.includes('extensions-des-mollets') ||
    // Pec deck / flies
    s.includes('pec-deck') || s.includes('fly') ||
    // Rotator cuff
    s.includes('rotation-externe') || s.includes('rotation-interne') ||
    // Shrug (trap isolation)
    s.includes('shrug') ||
    // Core / abs
    s.includes('crunch') || s.includes('planche') || s.includes('gainage') ||
    s.includes('sit-up') || s.includes('releve-de') || s.includes('dragon-flag') ||
    s.includes('hollow') || s.includes('dead-bug') || s.includes('mountain-climber') ||
    s.includes('bird-dog') || s.includes('roulette') || s.includes('ciseaux') ||
    s.includes('cocon') || s.includes('v-ups') || s.includes('touche-talon') ||
    s.includes('cercles-jambes') || s.includes('russian-twist') || s.includes('abdominaux') ||
    s.includes('ab-coaster') || s.includes('donkey-kick') || s.includes('fire-hydratant') ||
    s.includes('bear-plank') || s.includes('jackknife') || s.includes('chinese-plank') ||
    s.includes('superman') || s.includes('pallof') || s.includes('windmill') ||
    s.includes('rotations-abdos-obliques') || s.includes('rotations-russes') ||
    s.includes('rotation-buste') || s.includes('rotation-abdos') ||
    // Shoulder / rear delt isolation
    s.includes('face-pull') || s.includes('tate-press') ||
    (s.includes('oiseau') && !s.includes('oiseau-inverse')) ||
    // Hip isolation
    s.includes('hip-thrust') || s.includes('extension-hanche') ||
    // Hamstring isolation
    s.includes('pull-through') ||
    // Back extension / hyperextension
    s.includes('extension-lombaire') || s.includes('reverse-hyperextension') ||
    s.includes('hyperextension') ||
    // Biceps variants (isolation)
    s.includes('drag-curl') || s.includes('spider-curl') || s.includes('waiter-curl') ||
    s.includes('curl-concentre') ||
    // JM press (triceps isolation)
    s.includes('barre-front') ||
    // Sissy squat = knee isolation
    s.includes('sissy-squat') ||
    // Croix de fer = shoulder isolation
    s.includes('croix-de-fer') ||
    // Pec deck reverse = rear delt isolation
    s.includes('pec-deck-inverse')
  ) return false

  return true
}

// ─── Muscles inference ────────────────────────────────────────────────────────

function inferMuscles(slug: string, muscleGroup: string): string[] {
  const muscles: string[] = [muscleGroup]
  const s = slug.toLowerCase()

  if (muscleGroup === 'pectoraux') {
    if (s.includes('developpe') || s.includes('dips')) muscles.push('triceps', 'epaules')
  }
  if (muscleGroup === 'dos') {
    muscles.push('biceps')
    if (s.includes('souleve-de-terre') || s.includes('deadlift')) muscles.push('fessiers', 'ischio-jambiers', 'quadriceps')
    if (s.includes('rowing')) muscles.push('epaules')
  }
  if (muscleGroup === 'epaules') {
    if (s.includes('developpe') || s.includes('thruster')) muscles.push('triceps')
    if (s.includes('tirage-menton')) muscles.push('biceps', 'dos')
    if (s.includes('thruster')) muscles.push('quadriceps', 'fessiers')
  }
  if (muscleGroup === 'biceps') {
    if (s.includes('chin-up') || s.includes('traction-supination')) muscles.push('dos')
  }
  if (muscleGroup === 'triceps') {
    if (s.includes('developpe') || s.includes('dips')) muscles.push('pectoraux', 'epaules')
  }
  if (muscleGroup === 'fessiers') {
    if (s.includes('squat') || s.includes('fente') || s.includes('thruster')) muscles.push('quadriceps', 'ischio-jambiers')
    if (s.includes('souleve-de-terre') || s.includes('hip-thrust')) muscles.push('ischio-jambiers')
  }
  if (muscleGroup === 'quadriceps') {
    if (s.includes('squat') || s.includes('fente') || s.includes('thruster')) muscles.push('fessiers', 'ischio-jambiers')
    if (s.includes('presse') || s.includes('leg-press')) muscles.push('fessiers')
    if (s.includes('souleve-de-terre')) muscles.push('fessiers', 'ischio-jambiers', 'dos')
  }
  if (muscleGroup === 'ischio-jambiers') {
    if (s.includes('souleve-de-terre') || s.includes('deadlift')) muscles.push('fessiers', 'dos', 'quadriceps')
    if (s.includes('nordic') || s.includes('glute-ham')) muscles.push('fessiers', 'mollets')
  }

  return [...new Set(muscles)]
}

// ─── Movement pattern (sous-pattern biomécanique) ────────────────────────────
// Granularité Phase 3 : permet de trouver un substitut exact si équipement manquant

function inferMovementPattern(slug: string, muscleGroup: string): string {
  const s = slug.toLowerCase()

  // ── CORE ──
  if (s.includes('crunch') || s.includes('sit-up') || s.includes('releve-de') ||
      s.includes('releve-jambes') || s.includes('abdominaux-a-la-barre') ||
      s.includes('dragon-flag') || s.includes('v-ups') || s.includes('jackknife') ||
      s.includes('ciseaux') || s.includes('cocon') || s.includes('cercles-jambes') ||
      s.includes('ab-coaster') || s.includes('rotations-abdos-obliques'))
    return 'core_flex'

  if (s.includes('rotation-buste') || s.includes('rotations-russes') ||
      s.includes('russian-twist') || s.includes('pallof') || s.includes('windmill') ||
      s.includes('touche-talon'))
    return 'core_rotation'

  if (s.includes('planche') || s.includes('gainage') || s.includes('hollow') ||
      s.includes('dead-bug') || s.includes('mountain-climber') || s.includes('bear-plank') ||
      s.includes('chinese-plank') || s.includes('bird-dog') || s.includes('superman') ||
      s.includes('hyperextension-inversee') || s.includes('zercher-carry'))
    return 'core_anti_flex'

  // ── CALF ──
  if (s.includes('extension-mollets') || s.includes('extensions-mollets') ||
      s.includes('extensions-des-mollets'))
    return 'calf_raise'

  // ── CARRY ──
  if (s.includes('marche-du-fermier') || s.includes('sled-push') ||
      s.includes('sled-pull') || s.includes('fentes-marchees'))
    return 'carry'

  // ── KNEE EXTENSION (isolation quad) ──
  // Exclusions : slugs combo qui contiennent "leg-extension" mais sont autre chose
  if (
    (s.includes('leg-extension') &&
      !s.includes('machine-dips-assistes') &&
      !s.includes('hip-thrust-machine-leg-extension')) ||
    s.includes('sissy-squat')
  ) return 'knee_extension'

  // ── KNEE FLEXION (isolation ischios) ──
  if (s.includes('leg-curl') || s.includes('nordic') || s.includes('glute-ham'))
    return 'knee_flexion'

  // ── HIP HINGE ──
  if (s.includes('souleve-de-terre') || s.includes('deadlift') ||
      s.includes('good-morning') || s.includes('hip-thrust') ||
      s.includes('kettlebell-swing') || s.includes('pull-through') ||
      s.includes('rack-pull') || s.includes('reeves-deadlift') ||
      s.includes('extension-lombaire') || s.includes('extension-hanche') ||
      s.includes('hyperextension') || s.includes('reverse-hyperextension') ||
      s.includes('superman'))
    return 'hip_hinge'

  // ── SQUAT / LUNGE ──
  if (s.includes('squat') || s.includes('fente') || s.includes('split-squat') ||
      s.includes('presse-a-cuisse') || s.includes('presse-a-cuisses') ||
      s.includes('presse-cuisse') || s.includes('leg-press') ||
      s.includes('hack-squat') || s.includes('montees-sur-banc') ||
      s.includes('pistol') || s.includes('belt-squat') ||
      s.includes('pendulum') || s.includes('safety-bar') ||
      s.includes('jefferson-squat') || s.includes('cossack') ||
      s.includes('curtsy-lunge') || s.includes('box-pistol'))
    return 'squat_pattern'

  // ── VERTICAL PULL ──
  if (s.includes('traction') || s.includes('chin-up') ||
      s.includes('tirage-vertical') || s.includes('tirage-avant') ||
      s.includes('tirage-incline-poulie-haute') || s.includes('pull-over') ||
      s.includes('pullover'))
    return 'vertical_pull'

  // ── HORIZONTAL PULL ──
  if (s.includes('rowing') || s.includes('tirage-horizontal') ||
      s.includes('seal-row') || s.includes('renegade-row') ||
      s.includes('tirage-menton') || s.includes('face-pull') ||
      s.includes('oiseau') || s.includes('ecarte-arriere') ||
      s.includes('pec-deck-inverse') || s.includes('elevation-laterale') ||
      s.includes('elevations-laterales') || s.includes('elevation-en-y') ||
      s.includes('rotation-externe') || s.includes('passage-depaule') ||
      s.includes('shrug'))
    return 'horizontal_pull'

  // ── ELBOW FLEXION (curl) ──
  if (s.includes('curl') && !s.includes('chin-up') && !s.includes('traction-supination'))
    return 'elbow_flexion'

  // ── LATERAL RAISE (delt isolation) ──
  if (s.includes('elevation-frontale') || s.includes('elevations-frontales') ||
      s.includes('croix-de-fer'))
    return 'lateral_raise'

  // ── ELBOW EXTENSION (triceps) ──
  if (s.includes('extension-triceps') || s.includes('extensions-des-triceps') ||
      s.includes('extensions-triceps') || s.includes('extensions-concentres') ||
      s.includes('kickback') || s.includes('extension-horizontale-poulie') ||
      s.includes('barre-front') || s.includes('tate-press'))
    return 'elbow_extension'

  // ── VERTICAL PUSH ──
  if ((s.includes('developpe') && (s.includes('epaule') || s.includes('militaire') ||
      s.includes('arnold') || s.includes('nuque') || s.includes('landmine') ||
      s.includes('kettlebell') || s.includes('overhead') || s.includes('z-press'))) ||
      s.includes('developpe-militaire') || s.includes('handstand-push') ||
      s.includes('pike-push') || s.includes('thruster'))
    return 'vertical_push'

  // ── HORIZONTAL PUSH (défaut pour tout développé pec / dips / pompe) ──
  if (s.includes('developpe') || s.includes('dips') || s.includes('pompe') ||
      s.includes('ecarte-couche') || s.includes('ecartes-') ||
      s.includes('ecarte-a-la-poulie') || s.includes('ecarte-poulie') ||
      s.includes('ecartes-poulie') || s.includes('pec-deck-butterfly') ||
      s.includes('hyght') || s.includes('hex-press') ||
      (s.includes('press') && muscleGroup === 'pectoraux'))
    return 'horizontal_push'

  // Fallback par muscleGroup
  const fallbacks: Record<string, string> = {
    pectoraux: 'horizontal_push',
    dos: 'horizontal_pull',
    epaules: 'vertical_push',
    biceps: 'elbow_flexion',
    triceps: 'elbow_extension',
    quadriceps: 'squat_pattern',
    fessiers: 'hip_hinge',
    'ischio-jambiers': 'knee_flexion',
    mollets: 'calf_raise',
    abdos: 'core_anti_flex',
  }
  return fallbacks[muscleGroup] ?? 'core_anti_flex'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const BASE_DIR = path.join(process.cwd(), 'public', 'bibliotheque_exercices')
const OUTPUT = path.join(process.cwd(), 'data', 'exercise-catalog.json')

const catalog: ExerciseEntry[] = []
const seen = new Set<string>()

const dirs = fs.readdirSync(BASE_DIR).filter(d => {
  return fs.statSync(path.join(BASE_DIR, d)).isDirectory()
})

for (const dir of dirs) {
  const dirPath = path.join(BASE_DIR, dir)
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.gif'))

  for (const file of files) {
    const slug = file.replace(/\.gif$/, '')
    const isPedagogique = PEDAGOGIQUE_SLUGS.has(slug)

    const id = `${dir}__${slug}`
    const uniqueId = seen.has(id) ? `${id}__2` : id
    seen.add(id)

    const gifUrl = `/bibliotheque_exercices/${dir}/${file}`
    const name = slugToName(file)
    const equipment = inferEquipment(slug)
    const pattern = inferPattern(slug, dir)
    const movementPattern = inferMovementPattern(slug, dir)
    const isCompound = inferIsCompound(slug)
    const muscles = inferMuscles(slug, dir)

    catalog.push({
      id: uniqueId,
      name,
      slug,
      gifUrl,
      muscleGroup: dir,
      exerciseType: isPedagogique ? 'pedagogique' : 'exercise',
      pattern,
      movementPattern,
      equipment,
      isCompound,
      muscles,
    })
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2))
console.log(`✅ Catalogue généré: ${catalog.length} exercices → ${OUTPUT}`)
