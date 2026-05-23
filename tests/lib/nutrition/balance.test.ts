import { describe, expect, it } from 'vitest'
import { computeNutritionBalance } from '@/lib/nutrition/balance'

describe('computeNutritionBalance', () => {
  it('returns remaining values when under target', () => {
    const result = computeNutritionBalance(
      { kcal: 1800, protein_g: 100, carbs_g: 150, fat_g: 50, water_ml: 1000 },
      { kcal: 2200, protein_g: 140, carbs_g: 220, fat_g: 70, water_ml: 2500 },
    )

    expect(result.remaining.protein_g).toBe(40)
    expect(result.remaining.carbs_g).toBe(70)
    expect(result.remaining.fat_g).toBe(20)
    expect(result.overflow.protein_g).toBe(0)
    expect(result.remainingCaloriesNet).toBe(400)
    expect(result.remainingCaloriesFromMacros).toBe(620)
  })

  it('tracks overflow separately when a macro is exceeded', () => {
    const result = computeNutritionBalance(
      { kcal: 2300, protein_g: 150, carbs_g: 80, fat_g: 60, water_ml: 2600 },
      { kcal: 2200, protein_g: 120, carbs_g: 140, fat_g: 65, water_ml: 2500 },
    )

    expect(result.remaining.protein_g).toBe(0)
    expect(result.overflow.protein_g).toBe(30)
    expect(result.remaining.carbs_g).toBe(60)
    expect(result.remaining.fat_g).toBe(5)
    expect(result.remainingCaloriesNet).toBe(0)
    expect(result.statusByMacro.protein_g).toBe('over')
  })
})
