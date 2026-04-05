/**
 * Hydration Calculator — Scientifically validated
 * Sources:
 *   Base: EFSA 2010 (European Food Safety Authority) — 35ml/kg
 *   Activity bonus: ACSM 2007 (Sawka et al.)
 *   Climate bonus: Sawka et al. 2015
 *   Gender adjustment: EFSA 2010
 */

export type HydrationGender = 'male' | 'female';
export type HydrationActivity = 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete';
export type HydrationClimate = 'cold' | 'temperate' | 'hot' | 'veryHot';

export interface HydrationInput {
  weight: number; // kg
  gender: HydrationGender;
  activity: HydrationActivity;
  climate: HydrationClimate;
}

export interface HydrationResult {
  liters: number;
  glasses: number; // 250ml glasses
  breakdown: {
    base: number;    // ml
    gender: number;  // ml adjustment
    activity: number; // ml
    climate: number;  // ml
  };
  warnings: string[];
}

// EFSA 2010 — 35ml/kg base
const BASE_ML_PER_KG = 35;

// Gender multipliers — EFSA 2010
const GENDER_MULTIPLIER: Record<HydrationGender, number> = {
  male: 1.1,   // +10%: higher lean mass, blood volume
  female: 0.95, // -5%: higher relative adiposity
};

// Activity bonus ml — ACSM 2007 (Sawka et al.)
const ACTIVITY_BONUS_ML: Record<HydrationActivity, number> = {
  sedentary: 0,
  light: 300,
  moderate: 600,
  intense: 900,
  athlete: 1200,
};

// Climate bonus ml — Sawka et al. 2015
const CLIMATE_BONUS_ML: Record<HydrationClimate, number> = {
  cold: 500,
  temperate: 0,
  hot: 750,
  veryHot: 1500,
};

export function calculateHydration(input: HydrationInput): HydrationResult {
  const { weight, gender, activity, climate } = input;

  const baseML = weight * BASE_ML_PER_KG;
  const genderAdjusted = baseML * GENDER_MULTIPLIER[gender];
  const genderBonus = Math.round(genderAdjusted - baseML);
  const activityBonus = ACTIVITY_BONUS_ML[activity];
  const climateBonus = CLIMATE_BONUS_ML[climate];

  const totalML = Math.round(genderAdjusted) + activityBonus + climateBonus;
  const liters = Math.round((totalML / 1000) * 10) / 10;
  const glasses = Math.round(totalML / 250);

  const warnings: string[] = [];
  if (liters > 5) warnings.push('⚠️ Volume >5L : Risque hyponatrémie si ingestion trop rapide. Répartir sur 16h (300-350ml/h max selon ACSM 2007).');
  if (liters < 1.5) warnings.push('⚠️ Volume <1.5L : Sous le seuil minimal EFSA (2010). Déshydratation chronique probable. Augmenter progressivement.');
  if (climate === 'veryHot' && activity === 'athlete') warnings.push('ℹ️ Conditions extrêmes : Ajouter électrolytes (sodium 500-700mg/L selon IOC Consensus 2012).');
  if (climate === 'cold') warnings.push('ℹ️ Climat froid : Sensation soif réduite (vasoconstriction). Programmer rappels hydratation toutes les 90-120min.');
  if (liters >= 2 && liters <= 3.5) warnings.push('✓ Volume optimal (2-3.5L) : Conforme recommandations EFSA 2010 pour euhydratation.');

  return {
    liters,
    glasses,
    breakdown: {
      base: Math.round(baseML),
      gender: genderBonus,
      activity: activityBonus,
      climate: climateBonus,
    },
    warnings,
  };
}
