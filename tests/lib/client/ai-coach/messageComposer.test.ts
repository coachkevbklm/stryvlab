import { describe, it, expect } from 'vitest'
import {
  composeClosingMessage,
  composeMorningGreeting,
  composeEveningReminder,
} from '@/lib/client/ai-coach/messageComposer'
import type { DailyFacts } from '@/lib/client/ai-coach/dailyFacts'

const facts: DailyFacts = {
  dayKind: 'cancelled',
  session: { planned: 'Push A', status: 'cancelled' },
  nutrition: { kcalLogged: 2300, kcalTarget: 2000, deltaKcal: 300, pctKcal: 115, proteinLogged: 150, proteinTarget: 150, proteinShort: false, status: 'over' },
  hydration: { ml: 1500, targetMl: 2500, pct: 60 },
  steps: 9000,
  checkin: {},
}

describe('composeClosingMessage', () => {
  it('names the cancelled session honestly (no false praise)', () => {
    const msg = composeClosingMessage({ facts, tips: [], tone: 'neutre', flow: 'evening' })
    expect(msg).toMatch(/non faite|annulée/i)
    expect(msg).not.toMatch(/bien avancé|bravo|félicitations/i)
  })
  it('states calorie overshoot with the delta', () => {
    const msg = composeClosingMessage({ facts, tips: [], tone: 'neutre', flow: 'evening' })
    expect(msg).toMatch(/\+300/)
  })
  it('appends tips when provided', () => {
    const msg = composeClosingMessage({ facts, tips: ['Bois par gorgées.'], tone: 'neutre', flow: 'evening' })
    expect(msg).toMatch(/Bois par gorgées\./)
  })
  it('uses the tone opener', () => {
    const msg = composeClosingMessage({ facts, tips: [], tone: 'motivant', flow: 'evening' })
    expect(msg.length).toBeGreaterThan(0)
  })
})

describe('composeMorningGreeting', () => {
  it('starts the check-in CTA with the highest-priority enabled action (BPM first)', () => {
    const msg = composeMorningGreeting({ name: 'Kev', tone: 'bienveillant', enabledFields: ['energy_level', 'rhr_morning', 'sleep_hours'], hasTrainingToday: true, trainingName: 'Push A' })
    const idxBpm = msg.indexOf('fréquence cardiaque')
    const idxEnergy = msg.indexOf('énergie')
    expect(idxBpm).toBeGreaterThan(-1)
    expect(idxBpm).toBeLessThan(idxEnergy === -1 ? Infinity : idxEnergy)
  })
})

describe('composeEveningReminder', () => {
  it('primes tomorrow starting with the first waking action enabled', () => {
    const msg = composeEveningReminder({ tone: 'neutre', enabledMorningFields: ['energy_level', 'rhr_morning'] })
    expect(msg).toMatch(/fréquence cardiaque/i)
    const idxBpm = msg.indexOf('fréquence cardiaque')
    const idxEnergy = msg.indexOf('énergie')
    expect(idxBpm).toBeLessThan(idxEnergy === -1 ? Infinity : idxEnergy)
  })
  it('falls back gracefully with no fields', () => {
    expect(composeEveningReminder({ tone: 'neutre', enabledMorningFields: [] }).length).toBeGreaterThan(0)
  })
})
