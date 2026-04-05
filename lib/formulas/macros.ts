/**
 * Macro Calculator — Forensic Metabolic Analysis
 * Methodology: Katch-McArdle BMR + NEAT/EAT/TEF + BF% Stratification + Boer LBM
 * Migrated from utils/macroCalculator.js to TypeScript strict
 */

export type MacroGoal = 'deficit' | 'maintenance' | 'surplus';
export type MacroGender = 'male' | 'female';

export interface MacroInput {
  weight: number;        // kg, 40-250
  height: number;        // cm, 140-220
  age: number;           // years, 15-85
  gender: MacroGender;
  goal: MacroGoal;
  bodyFat?: number;      // % optional — Boer formula used if absent
  steps?: number;        // daily steps for NEAT
  workouts?: number;     // weekly workouts for EAT
}

export interface MacroResult {
  calories: number;
  tdee: number;
  leanMass: number;
  estimatedBF: number;
  macros: { p: number; f: number; c: number };
  ratios: { p: number; f: number; c: number };
  percents: { p: number; f: number; c: number };
  breakdown: { bmr: number; neat: number; eat: number; tef: number };
  adjustment: number;
  warnings: string[];
}

export interface MacroValidationError {
  field: string;
  message: string;
}

export function validateMacroInputs(input: Partial<MacroInput>): MacroValidationError[] {
  const errors: MacroValidationError[] = [];
  if (!input.weight || input.weight < 40 || input.weight > 250) errors.push({ field: 'weight', message: 'Poids hors limites (40-250kg)' });
  if (!input.height || input.height < 140 || input.height > 220) errors.push({ field: 'height', message: 'Taille hors limites (140-220cm)' });
  if (!input.age || input.age < 15 || input.age > 85) errors.push({ field: 'age', message: 'Âge hors limites (15-85 ans)' });
  return errors;
}

/** Boer Formula for LBM estimation when BF% is unknown */
function boerLBM(weight: number, height: number, gender: MacroGender): number {
  const lbm = gender === 'male'
    ? 0.407 * weight + 0.267 * height - 19.2
    : 0.252 * weight + 0.473 * height - 48.3;
  return Math.max(weight * 0.5, Math.min(weight, lbm));
}

/** Katch-McArdle BMR with age-based decrement (>30 years) */
function katchMcArdleBMR(leanMass: number, age: number): number {
  let bmr = 370 + 21.6 * leanMass;
  if (age > 30) {
    const ageDecrement = Math.floor((age - 30) / 10) * 0.02;
    bmr = bmr * (1 - ageDecrement);
  }
  return bmr;
}

const TRAINING_LOAD: Record<number, number> = {
  0: 0, 1: 200, 2: 250, 3: 325, 4: 400, 5: 475, 6: 550, 7: 625,
};

export function calculateMacros(input: MacroInput): MacroResult {
  const { weight, height, age, gender, goal } = input;
  const steps = input.steps ?? 0;
  const weeklyWorkouts = input.workouts ?? 0;

  // Phase 1: LBM
  let estimatedBF: number;
  let leanMass: number;
  if (input.bodyFat && input.bodyFat > 0) {
    estimatedBF = input.bodyFat;
    leanMass = weight * (1 - estimatedBF / 100);
  } else {
    leanMass = boerLBM(weight, height, gender);
    estimatedBF = ((weight - leanMass) / weight) * 100;
  }

  // Phase 2: BMR (Katch-McArdle)
  const bmr = katchMcArdleBMR(leanMass, age);

  // Phase 3: TDEE forensic (NEAT + EAT + TEF)
  const neat = steps * 0.04;
  const eatPerDay = TRAINING_LOAD[Math.min(Math.floor(weeklyWorkouts), 7)] ?? 325;
  const tef = bmr * 0.1;
  const tdee = Math.round(bmr + neat + eatPerDay + tef);

  // Phase 4: Target calories
  let surplusOrDeficit = 0;
  if (goal === 'deficit') {
    let deficitFactor =
      estimatedBF > 25 ? 0.25 :
      estimatedBF > 20 ? 0.20 :
      estimatedBF > 15 ? 0.15 : 0.12;
    if (weeklyWorkouts >= 5) deficitFactor = Math.max(0.12, deficitFactor - 0.03);
    surplusOrDeficit = -Math.round(tdee * deficitFactor);
  } else if (goal === 'surplus') {
    surplusOrDeficit =
      estimatedBF < 12 ? 220 :
      estimatedBF < 15 ? 180 :
      estimatedBF < 18 ? 150 : 100;
  }
  const targetCalories = tdee + surplusOrDeficit;

  // Phase 5: Macros
  const proteinMultiplier =
    goal === 'deficit'     ? (estimatedBF > 20 ? 2.5 : 2.8) :
    goal === 'surplus'     ? 2.2 : 2.0;
  const protein = Math.round(leanMass * proteinMultiplier);

  const minFatsMultiplier = gender === 'female' ? 0.9 : 0.7;
  const minFats = weight * minFatsMultiplier;
  const fatsPercent = goal === 'surplus' ? 0.22 : 0.25;
  const fats = Math.round(Math.max(minFats, (targetCalories * fatsPercent) / 9));

  const carbs = Math.max(0, Math.round((targetCalories - protein * 4 - fats * 9) / 4));

  // Phase 6: Warnings
  const warnings: string[] = [];
  if (protein < leanMass * 1.8) warnings.push('⚠️ Protéines sous 1.8g/kg LBM: risque de catabolisme.');
  if (fats < weight * (gender === 'female' ? 0.6 : 0.5)) warnings.push('⚠️ Lipides critiques: risque de dérèglement hormonal.');
  if (weeklyWorkouts >= 4 && carbs < weight * 2) warnings.push('⚠️ Glucides bas: performance et récupération compromises.');
  const maxBFForSurplus = gender === 'male' ? 18 : 28;
  if (goal === 'surplus' && estimatedBF > maxBFForSurplus) warnings.push('⚠️ BF% élevé: un léger cut est conseillé avant un surplus.');

  return {
    calories: targetCalories,
    tdee,
    leanMass: Math.round(leanMass * 10) / 10,
    estimatedBF: Math.round(estimatedBF * 10) / 10,
    macros: { p: protein, f: fats, c: carbs },
    ratios: {
      p: Math.round((protein / leanMass) * 10) / 10,
      f: Math.round((fats / weight) * 10) / 10,
      c: Math.round((carbs / weight) * 10) / 10,
    },
    percents: {
      p: Math.round((protein * 4 / targetCalories) * 100),
      f: Math.round((fats * 9 / targetCalories) * 100),
      c: Math.round((carbs * 4 / targetCalories) * 100),
    },
    breakdown: {
      bmr: Math.round(bmr),
      neat: Math.round(neat),
      eat: Math.round(eatPerDay),
      tef: Math.round(tef),
    },
    adjustment: surplusOrDeficit,
    warnings,
  };
}
