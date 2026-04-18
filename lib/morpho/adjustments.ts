// lib/morpho/adjustments.ts

export interface MorphoForAdjustment {
  asymmetries?: {
    arm_diff_cm?: number;
    leg_diff_cm?: number;
    shoulder_imbalance_cm?: number;
    hip_imbalance_cm?: number;
  };
  dimensions?: {
    arm_cm_l?: number;
    arm_cm_r?: number;
    leg_cm_l?: number;
    leg_cm_r?: number;
  };
  body_fat_pct?: number;
}

export interface CoachClientMeta {
  height_cm?: number;
}

export const MOVEMENT_PATTERNS = [
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'squat',
  'hinge',
  'carry',
  'core_anti_flex',
  'unilateral_push',
  'unilateral_pull',
] as const;

export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

/**
 * Calculates stimulus adjustment coefficients based on morphological asymmetries.
 * Returns adjustment multipliers (0.8-1.2 range) for each movement pattern.
 *
 * Rules:
 * - Arm asymmetry >2cm: boost unilateral patterns (1.15)
 * - Shoulder imbalance >2cm: reduce horizontal push (0.90), boost horizontal pull (1.10)
 * - Long arms (>0.40 ratio): boost vertical pull (1.12), horizontal pull (1.05)
 * - Short arms (<0.36 ratio): boost horizontal push (1.10), vertical push (1.08)
 *
 * @param morpho Morphological data with asymmetries and dimensions
 * @param clientMeta Client metadata (height for limb ratio calculations)
 * @returns Record mapping each movement pattern to an adjustment coefficient (0.8-1.2)
 */
export function calculateStimulusAdjustments(
  morpho: MorphoForAdjustment,
  clientMeta: CoachClientMeta
): Record<string, number> {
  const adjustments: Record<string, number> = {};

  // Initialize all patterns at 1.0 (no adjustment)
  for (const pattern of MOVEMENT_PATTERNS) {
    adjustments[pattern] = 1.0;
  }

  // Rule 1: Arm asymmetry >2cm → unilateral patterns more valuable
  const armDiff = morpho.asymmetries?.arm_diff_cm ?? 0;
  if (armDiff > 2) {
    adjustments['unilateral_push'] = 1.15;
    adjustments['unilateral_pull'] = 1.15;
  }

  // Rule 2: Shoulder imbalance >2cm → horizontal patterns adjusted
  const shoulderImbalance = morpho.asymmetries?.shoulder_imbalance_cm ?? 0;
  if (shoulderImbalance > 2) {
    adjustments['horizontal_push'] = 0.9;
    adjustments['horizontal_pull'] = 1.1;
  }

  // Rule 3: Long limbs (arm_ratio >0.40) → pull patterns more effective
  const armLength = Math.max(
    morpho.dimensions?.arm_cm_l ?? 0,
    morpho.dimensions?.arm_cm_r ?? 0
  );
  if (armLength > 0 && clientMeta.height_cm && clientMeta.height_cm > 0) {
    const armRatio = armLength / clientMeta.height_cm;
    if (armRatio > 0.4) {
      // Long arms relative to height
      adjustments['vertical_pull'] = Math.max(adjustments['vertical_pull'], 1.12);
      adjustments['horizontal_pull'] = Math.max(adjustments['horizontal_pull'], 1.05);
    }
  }

  // Rule 4: Short limbs (arm_ratio <0.36) → push patterns more effective
  if (armLength > 0 && clientMeta.height_cm && clientMeta.height_cm > 0) {
    const armRatio = armLength / clientMeta.height_cm;
    if (armRatio < 0.36) {
      // Short arms relative to height
      adjustments['horizontal_push'] = Math.max(adjustments['horizontal_push'], 1.1);
      adjustments['vertical_push'] = Math.max(adjustments['vertical_push'], 1.08);
    }
  }

  // Clamp all adjustments to reasonable range [0.8, 1.2]
  for (const pattern of MOVEMENT_PATTERNS) {
    adjustments[pattern] = Math.max(0.8, Math.min(1.2, adjustments[pattern]));
  }

  return adjustments;
}

/**
 * Applies stimulus adjustments to a base stimulus coefficient.
 * Used during programme scoring to modulate exercise value based on morphology.
 *
 * @param baseCoeff Base stimulus coefficient (typically 0.5-1.0)
 * @param adjustmentCoeff Adjustment coefficient from calculateStimulusAdjustments (0.8-1.2)
 * @returns Adjusted coefficient, clamped to [0.4, 1.2]
 */
export function applyMorphoAdjustment(baseCoeff: number, adjustmentCoeff: number): number {
  const adjusted = baseCoeff * adjustmentCoeff;
  return Math.max(0.4, Math.min(1.2, adjusted));
}
