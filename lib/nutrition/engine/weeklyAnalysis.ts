import type { WeeklyCheckinSummary, WeeklyAnalysisResult } from './types'
import { runGuardrails } from './guardrails'

export function analyzeWeek(summary: WeeklyCheckinSummary): WeeklyAnalysisResult {
  if (summary.weightSamples < 3) {
    return {
      diagnosis: 'insufficient_data',
      action: 'no_change',
      carbAdjustmentPct: null,
      guardrailTriggered: null,
      reasoning: 'Fewer than 3 weight samples — insufficient data for reliable analysis.',
    }
  }

  const guardrails = runGuardrails({
    adherencePct: summary.adherencePct,
    avgSleepH: summary.avgSleepH,
    avgEnergyLevel: summary.avgEnergyLevel,
    avgStressLevel: summary.avgStressLevel,
    consecutiveFatigueDays: summary.consecutiveFatigueDays,
  })

  if (guardrails.triggered === 'adherence_block') {
    return {
      diagnosis: 'behavioral',
      action: 'focus_adherence',
      carbAdjustmentPct: null,
      guardrailTriggered: 'adherence_block',
      reasoning: 'Adherence below 85% — focus on consistency before adjusting calories.',
    }
  }

  if (guardrails.triggered === 'fatigue_block') {
    return {
      diagnosis: 'insufficient_data',
      action: 'recovery',
      carbAdjustmentPct: null,
      guardrailTriggered: 'fatigue_block',
      reasoning: 'Systemic fatigue detected — prioritize recovery over caloric adjustment.',
    }
  }

  const weightDelta =
    summary.avgWeightKg !== null && summary.prevWeekAvgWeightKg !== null
      ? summary.avgWeightKg - summary.prevWeekAvgWeightKg
      : null

  // Case 1: optimal recomposition — waist down, weight stable
  if (
    summary.waistTrend === 'down' &&
    weightDelta !== null &&
    Math.abs(weightDelta) <= 0.3
  ) {
    return {
      diagnosis: 'optimal_recomp',
      action: 'no_change',
      carbAdjustmentPct: null,
      guardrailTriggered: null,
      reasoning: 'Waist trending down with stable weight — optimal recomposition in progress.',
    }
  }

  // Case 3: deficit too aggressive — rapid loss + symptoms
  const lowEnergy =
    summary.avgEnergyLevel !== null && summary.avgEnergyLevel <= 2
  const perfDeclining = summary.performanceTrend === 'declining'

  if (weightDelta !== null && weightDelta < -0.8 && (lowEnergy || perfDeclining)) {
    const carbAdjustmentPct = lowEnergy && perfDeclining ? 10 : 5
    return {
      diagnosis: 'deficit_aggressive',
      action: 'adjust_carbs_up',
      carbAdjustmentPct,
      guardrailTriggered: null,
      reasoning:
        'Rapid weight loss with low energy or declining performance — increase carbs to reduce deficit.',
    }
  }

  // Case 4: real surplus — waist up + weight gain
  if (
    summary.waistTrend === 'up' &&
    weightDelta !== null &&
    weightDelta > 0.3
  ) {
    return {
      diagnosis: 'surplus_real',
      action: 'adjust_carbs_down',
      carbAdjustmentPct: -5,
      guardrailTriggered: null,
      reasoning: 'Waist trending up with weight gain — reduce carbs to control surplus.',
    }
  }

  return {
    diagnosis: 'optimal_recomp',
    action: 'no_change',
    carbAdjustmentPct: null,
    guardrailTriggered: null,
    reasoning: 'Signals within normal range — maintain current protocol.',
  }
}
