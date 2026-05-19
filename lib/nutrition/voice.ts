import type { MealType } from './food-items'

export type VoiceConfidence = 'high' | 'medium' | 'low'

export interface VoiceItem {
  name: string
  quantity_g: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  confidence: VoiceConfidence
  food_item_id?: string
  is_new: boolean
}

export interface VoiceParseResult {
  items: VoiceItem[]
  meal_type: MealType
  raw_transcript: string
  clean_transcript: string
}

// ── Filler word maps ─────────────────────────────────────────────────────────
const FILLERS: Record<string, RegExp> = {
  // Use (?:^|\s) / (?=\s|$) for accented words that break \b word boundaries
  fr: /(?:^|\s)(?:euh|donc|voil[aà]|en fait|genre|alors|bon|ben)(?=\s|$)/gi,
  en: /\b(um|uh|so|like|well|you know)\b/gi,
  es: /(?:^|\s)(?:eh|bueno|pues|o sea)(?=\s|$)/gi,
}

// ── Written numbers → digits (French) ───────────────────────────────────────
const FR_NUMBERS: Array<[RegExp, string]> = [
  [/\bmille\b/gi, '1000'],
  [/\bcinq cents\b/gi, '500'],
  [/\bquatre cents\b/gi, '400'],
  [/\btrois cents\b/gi, '300'],
  [/\bdeux cents\b/gi, '200'],
  [/\bcent cinquante\b/gi, '150'],
  [/\bcent\b/gi, '100'],
  [/\bquatre-vingt-dix\b/gi, '90'],
  [/\bquatre-vingts?\b/gi, '80'],
  [/\bsoixante-dix\b/gi, '70'],
  [/\bsoixante\b/gi, '60'],
  [/\bciquante\b/gi, '50'],
  [/\bquarante\b/gi, '40'],
  [/\btrente\b/gi, '30'],
  [/\bvingt\b/gi, '20'],
  [/\bdix\b/gi, '10'],
  [/\bneuf\b/gi, '9'],
  [/\bhuit\b/gi, '8'],
  [/\bsept\b/gi, '7'],
  [/\bsix\b/gi, '6'],
  [/\bcinq\b/gi, '5'],
  [/\bquatre\b/gi, '4'],
  [/\btrois\b/gi, '3'],
  [/\bdeux\b/gi, '2'],
  [/\bun\b/gi, '1'],
  [/\bune demi\b/gi, '0.5'],
  [/\bun quart\b/gi, '0.25'],
]

// ── Unit normalizations ──────────────────────────────────────────────────────
const UNITS: Array<[RegExp, string]> = [
  [/\bkilogrammes?\b/gi, 'kg'],
  [/\bgrammes?\b/gi, 'g'],
  [/\bmillilitres?\b/gi, 'ml'],
  [/\bcentilitres?\b/gi, 'cl'],
  [/\blitres?\b/gi, 'L'],
]

export function cleanTranscript(raw: string, lang: string): string {
  let text = raw.toLowerCase()

  const fillerRe = FILLERS[lang] ?? FILLERS['fr']
  text = text.replace(fillerRe, '')

  if (lang === 'fr') {
    for (const [re, digit] of FR_NUMBERS) {
      text = text.replace(re, digit)
    }
  }

  for (const [re, abbr] of UNITS) {
    text = text.replace(re, abbr)
  }

  return text.replace(/\s+/g, ' ').trim()
}
