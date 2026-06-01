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
    // D6: CTA emphasizes the FIRST waking action (BPM), not the full list
    expect(message.content).toContain('fréquence cardiaque')
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

  it('reminder emphasizes the first waking action (D6: BPM before getting up)', () => {
    const reminder = buildMorningPreparationReminder(['sleep_hours', 'weight_kg', 'rhr_morning'])

    expect(reminder).toContain('demain matin')
    // First waking action = BPM; mentioned with the "before getting up" hint
    expect(reminder).toContain('fréquence cardiaque')
    expect(reminder).toMatch(/sortir du lit/)
  })
})
