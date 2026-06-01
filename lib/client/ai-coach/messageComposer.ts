import type { DailyFacts } from '@/lib/client/ai-coach/dailyFacts'
import { TONE_MATRIX, type Tone } from '@/lib/client/ai-coach/resolveTone'
import { orderedByWaking, getFieldsForFlow } from '@/lib/client/checkin/fieldRegistry'

function sessionFact(f: DailyFacts): string | null {
  const name = f.session.planned ?? 'ta séance'
  switch (f.session.status) {
    case 'completed': return `Séance ${name} bouclée.`
    case 'cancelled':
    case 'skipped': return `Séance ${name} non faite aujourd’hui.`
    case 'rest': return `Jour de repos.`
    case 'none': return `Séance ${name} prévue, pas encore faite.`
    default: return null
  }
}

function nutritionFact(f: DailyFacts): string | null {
  const nu = f.nutrition
  if (nu.status === 'over') return `Calories au-dessus de la cible (+${nu.deltaKcal}).`
  if (nu.status === 'under') return `Calories sous la cible (${nu.deltaKcal}).`
  if (nu.proteinShort) return `Protéines courtes (${nu.proteinLogged}/${nu.proteinTarget}g).`
  return `Nutrition dans la cible (${nu.pctKcal}%).`
}

function secondaryFact(f: DailyFacts): string | null {
  if (f.hydration.pct < 60) return `Hydratation à ${f.hydration.pct}%.`
  if (f.steps != null && f.steps > 0) return `${f.steps} pas.`
  return null
}

export type ClosingInput = {
  facts: DailyFacts
  tips: string[]
  tone: Tone
  flow: 'morning' | 'evening'
}

export function composeClosingMessage(input: ClosingInput): string {
  const style = TONE_MATRIX[input.tone]
  const facts = [sessionFact(input.facts), nutritionFact(input.facts), secondaryFact(input.facts)].filter(Boolean) as string[]
  const numbered = facts.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const actions = input.tips.length > 0 ? '\n\n' + input.tips.join('\n') : ''
  const closer = input.flow === 'evening' ? style.closerEvening : style.closerMorning
  return `${style.opener('')}\n${numbered}${actions}\n\n${closer}`.trim()
}

export type MorningGreetingInput = {
  name: string
  tone: Tone
  enabledFields: string[]
  hasTrainingToday: boolean
  trainingName: string | null
}

export function composeMorningGreeting(input: MorningGreetingInput): string {
  const style = TONE_MATRIX[input.tone]
  const ordered = orderedByWaking(input.enabledFields)
  const firstActions = ordered.map((f) => f.label)
  const ctaList = firstActions.length > 0
    ? `Si tu le fais maintenant, commence par ${firstActions.join(', ')}.`
    : ''
  const context = input.hasTrainingToday
    ? `Aujourd’hui : ${input.trainingName ?? 'séance prévue'}.`
    : 'Pas de séance prévue aujourd’hui.'
  return [
    style.opener(input.name),
    context,
    'Prêt pour ton check-in du matin ?',
    ctaList,
    style.closerMorning,
  ].filter(Boolean).join('\n')
}

export type EveningReminderInput = { tone: Tone; enabledMorningFields: string[] }

export function composeEveningReminder(input: EveningReminderInput): string {
  const ordered = orderedByWaking(input.enabledMorningFields)
  const first = ordered[0]?.label ?? 'les mesures que ton coach suit'
  const rest = ordered.slice(1).map((f) => f.label)
  const tail = rest.length > 0 ? `, puis ${rest.join(', ')}` : ''
  return `Petit rappel pour demain matin : au réveil, commence par ${first}${tail}, avant même de sortir du lit pour les mesures qui le demandent.`
}

export { orderedByWaking, getFieldsForFlow }
