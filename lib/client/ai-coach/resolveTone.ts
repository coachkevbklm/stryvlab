export type Tone = 'strict' | 'bienveillant' | 'motivant' | 'neutre'

const VALID: Tone[] = ['strict', 'bienveillant', 'motivant', 'neutre']

export function resolveTone(perClient: string | null, global: string | null): Tone {
  if (perClient && VALID.includes(perClient as Tone)) return perClient as Tone
  if (global && VALID.includes(global as Tone)) return global as Tone
  return 'bienveillant'
}

export type ToneStyle = {
  opener: (name: string) => string
  closerMorning: string
  closerEvening: string
  /** firmness multiplier for trend escalation wording */
  firmness: 'soft' | 'plain' | 'firm'
}

const n = (name: string) => (name?.trim() ? `${name.trim()}, ` : '')

export const TONE_MATRIX: Record<Tone, ToneStyle> = {
  strict: {
    opener: (name) => `${name ? name.trim() + '.' : 'Bien.'} On fait le point.`,
    closerMorning: 'On exécute, sans négocier.',
    closerEvening: 'Repos correct ce soir, demain on tient la ligne.',
    firmness: 'firm',
  },
  bienveillant: {
    opener: (name) => `Salut ${n(name)}on regarde ta journée ensemble.`,
    closerMorning: 'On avance tranquillement, étape par étape.',
    closerEvening: 'Récupère bien ce soir, tu as fait ta part.',
    firmness: 'plain',
  },
  motivant: {
    opener: (name) => `Allez ${n(name)}on fait le bilan !`,
    closerMorning: 'On garde le cap, à fond mais propre.',
    closerEvening: 'Bonne récup, demain on repart fort.',
    firmness: 'plain',
  },
  neutre: {
    opener: (name) => `${name ? name.trim() + ' — ' : ''}point du jour.`,
    closerMorning: 'On lance la journée.',
    closerEvening: 'Priorité récupération ce soir.',
    firmness: 'soft',
  },
}
