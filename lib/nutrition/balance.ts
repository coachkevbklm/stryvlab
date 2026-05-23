export interface NutritionBalanceMacros {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  water_ml: number
}

export interface NutritionBalanceResult {
  remaining: NutritionBalanceMacros
  overflow: NutritionBalanceMacros
  remainingCaloriesNet: number
  remainingCaloriesFromMacros: number
  statusByMacro: {
    kcal: 'under' | 'met' | 'over'
    protein_g: 'under' | 'met' | 'over'
    carbs_g: 'under' | 'met' | 'over'
    fat_g: 'under' | 'met' | 'over'
    water_ml: 'under' | 'met' | 'over'
  }
}

function diff(target: number, consumed: number) {
  const delta = target - consumed
  return {
    remaining: Math.max(0, delta),
    overflow: Math.max(0, -delta),
    status: delta > 0 ? 'under' : delta < 0 ? 'over' : 'met',
  } as const
}

export function computeNutritionBalance(
  consumed: NutritionBalanceMacros,
  target: NutritionBalanceMacros,
): NutritionBalanceResult {
  const kcal = diff(target.kcal, consumed.kcal)
  const protein = diff(target.protein_g, consumed.protein_g)
  const carbs = diff(target.carbs_g, consumed.carbs_g)
  const fat = diff(target.fat_g, consumed.fat_g)
  const water = diff(target.water_ml, consumed.water_ml)

  const remainingCaloriesFromMacros =
    protein.remaining * 4 + carbs.remaining * 4 + fat.remaining * 9

  return {
    remaining: {
      kcal: kcal.remaining,
      protein_g: protein.remaining,
      carbs_g: carbs.remaining,
      fat_g: fat.remaining,
      water_ml: water.remaining,
    },
    overflow: {
      kcal: kcal.overflow,
      protein_g: protein.overflow,
      carbs_g: carbs.overflow,
      fat_g: fat.overflow,
      water_ml: water.overflow,
    },
    remainingCaloriesNet: kcal.remaining,
    remainingCaloriesFromMacros,
    statusByMacro: {
      kcal: kcal.status,
      protein_g: protein.status,
      carbs_g: carbs.status,
      fat_g: fat.status,
      water_ml: water.status,
    },
  }
}
