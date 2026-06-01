import { describe, expect, it } from 'vitest'

import { buildMorningPreparationReminder, buildRoutineMessage } from '@/lib/client/ai-coach/routineMessages'

describe('buildRoutineMessage', () => {
  it('builds an interactive morning routine when a check-in is configured', () => {
    const message = buildRoutineMessage({
      flowType: 'morning',
      firstName: 'Sam',
      tone: 'bienveillant',
      hasTrainingToday: true,
      trainingName: 'Push A',
      checkin: {
        enabled: true,
        fields: ['sleep_hours', 'rhr_morning', 'sleep_quality'],
      },
    })

    expect(message.content).toContain('Sam')
    expect(message.content).toContain('Push A')
    expect(message.content).toContain('check-in du matin')
    // D6 waking order: BPM before sleep quality
    expect(message.content.indexOf('fréquence cardiaque')).toBeLessThan(message.content.indexOf('qualité de sommeil'))
    expect(message.metadata?.key).toBe('checkin_ready')
    expect(message.metadata?.flow_type).toBe('morning')
  })

  it('builds a standalone evening routine when no check-in should be prompted', () => {
    const message = buildRoutineMessage({
      flowType: 'evening',
      firstName: 'Lina',
      tone: 'motivant',
      checkin: { enabled: false },
    })

    expect(message.content).toContain('Lina')
    expect(message.content).toContain('Petit rappel pour demain matin')
    expect(message.content).not.toMatch(/prêt pour ton check-in/i)
    expect(message.metadata).toBeNull()
  })

  it('builds the morning preparation reminder in waking-priority order (D6)', () => {
    const reminder = buildMorningPreparationReminder(['sleep_hours', 'weight_kg', 'rhr_morning'])

    expect(reminder).toContain('demain matin')
    // BPM first, then sleep duration, weight last
    expect(reminder.indexOf('fréquence cardiaque')).toBeLessThan(reminder.indexOf('durée de sommeil'))
    expect(reminder.indexOf('durée de sommeil')).toBeLessThan(reminder.indexOf('poids'))
  })
})
