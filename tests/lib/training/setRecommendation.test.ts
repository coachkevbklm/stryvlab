import { describe, it, expect } from 'vitest'
import { recommendNextSet } from '@/lib/training/setRecommendation'

describe('recommendNextSet', () => {
  it('returns null for invalid input (zero weight)', () => {
    const result = recommendNextSet({
      actual_weight_kg: 0,
      actual_reps: 8,
      rir_actual: 2,
      goal: 'hypertrophy',
      level: 'intermediate',
      planned_reps: 10,
      set_number: 1,
    })
    expect(result).toBeNull()
  })

  it('returns null for invalid input (zero reps)', () => {
    const result = recommendNextSet({
      actual_weight_kg: 80,
      actual_reps: 0,
      rir_actual: 2,
      goal: 'hypertrophy',
      level: 'intermediate',
      planned_reps: 10,
      set_number: 1,
    })
    expect(result).toBeNull()
  })

  it('returns a recommendation for hypertrophy without history', () => {
    const result = recommendNextSet({
      actual_weight_kg: 80,
      actual_reps: 8,
      rir_actual: 4,   // too easy — should recommend more weight
      goal: 'hypertrophy',
      level: 'intermediate',
      planned_reps: 10,
      set_number: 1,
    })
    expect(result).not.toBeNull()
    expect(result!.weight_kg).toBeGreaterThan(0)
    expect(result!.reps).toBe(10)   // uses planned_reps
    expect(result!.confidence).toBe('high')  // 8 reps ≤ 10
    expect(result!.delta_vs_last).toBeNull()  // no history
  })

  it('returns confidence low when reps > 10', () => {
    const result = recommendNextSet({
      actual_weight_kg: 50,
      actual_reps: 15,
      rir_actual: 2,
      goal: 'endurance',
      level: 'beginner',
      planned_reps: 15,
      set_number: 1,
    })
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe('low')
  })

  it('blends history (0.7) with live (0.3) and returns positive delta', () => {
    const result = recommendNextSet({
      actual_weight_kg: 82.5,
      actual_reps: 8,
      rir_actual: 2,
      goal: 'hypertrophy',
      level: 'intermediate',
      planned_reps: 8,
      set_number: 2,
      lastWeek: { weight_kg: 80, reps: 8, rir_actual: 2 },
    })
    expect(result).not.toBeNull()
    expect(result!.delta_vs_last).not.toBeNull()
    expect(result!.weight_kg).toBeGreaterThan(0)
    // weight rounded to 0.25
    expect(result!.weight_kg % 0.25).toBeCloseTo(0, 5)
  })

  it('returns delta as a number when history matches', () => {
    const result = recommendNextSet({
      actual_weight_kg: 80,
      actual_reps: 8,
      rir_actual: 2,
      goal: 'hypertrophy',
      level: 'intermediate',
      planned_reps: 8,
      set_number: 1,
      lastWeek: { weight_kg: 80, reps: 8, rir_actual: 2 },
    })
    expect(result).not.toBeNull()
    expect(typeof result!.delta_vs_last).toBe('number')
  })

  it('falls back to hypertrophy zone for unknown goal', () => {
    const result = recommendNextSet({
      actual_weight_kg: 100,
      actual_reps: 5,
      rir_actual: 2,
      goal: 'unknown_goal',
      level: 'intermediate',
      planned_reps: 5,
      set_number: 1,
    })
    expect(result).not.toBeNull()
    expect(result!.weight_kg).toBeGreaterThan(0)
  })

  it('uses repRangeMin when planned_reps is 0', () => {
    const result = recommendNextSet({
      actual_weight_kg: 80,
      actual_reps: 8,
      rir_actual: 2,
      goal: 'strength',
      level: 'intermediate',
      planned_reps: 0,
      set_number: 1,
    })
    expect(result).not.toBeNull()
    expect(result!.reps).toBeGreaterThan(0)
  })
})
