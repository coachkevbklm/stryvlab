import { calculateOneRM } from '@/lib/formulas/oneRM'
import { getTrainingZone } from './trainingZones'

// Future hook for Approach C (ML regression) — unused in Phase 1
export interface HistoricalSession {
  date: string
  sets: Array<{ set_number: number; weight_kg: number; reps: number; rir_actual: number }>
}

export interface SetRecommendationInput {
  actual_weight_kg: number
  actual_reps: number
  rir_actual: number
  goal: string
  level: string
  planned_reps: number
  set_number: number
  lastWeek?: {
    weight_kg: number
    reps: number
    rir_actual: number
  }
  // Intentionally unused Phase 1 — branch added in Approach C
  historicalSessions?: HistoricalSession[]
}

export interface SetRecommendation {
  weight_kg: number
  reps: number
  confidence: 'high' | 'low'
  delta_vs_last: number | null
}

function roundToQuarter(value: number): number {
  return Math.round(value * 4) / 4
}

function estimateOneRM(weight_kg: number, reps: number, rir_actual: number): number {
  const repsToFailure = reps + rir_actual
  const clampedRTF = Math.max(1, repsToFailure)
  const result = calculateOneRM({ weight: weight_kg, reps: clampedRTF }, 'average')
  return result.oneRM
}

export function recommendNextSet(input: SetRecommendationInput): SetRecommendation | null {
  const { actual_weight_kg, actual_reps, rir_actual, goal, planned_reps, lastWeek } = input

  if (actual_weight_kg <= 0 || actual_reps <= 0) return null
  if (actual_reps + rir_actual < 1) return null

  const zone = getTrainingZone(goal)

  const liveOneRM = estimateOneRM(actual_weight_kg, actual_reps, rir_actual)

  let blendedOneRM: number
  if (lastWeek && lastWeek.weight_kg > 0 && lastWeek.reps > 0) {
    const historyOneRM = estimateOneRM(lastWeek.weight_kg, lastWeek.reps, lastWeek.rir_actual)
    blendedOneRM = historyOneRM * 0.7 + liveOneRM * 0.3
  } else {
    blendedOneRM = liveOneRM
  }

  const rawWeight = blendedOneRM * zone.targetPct
  const targetWeight = roundToQuarter(rawWeight)

  const targetReps = planned_reps > 0
    ? planned_reps
    : Math.round((zone.repRangeMin + zone.repRangeMax) / 2)

  const confidence: 'high' | 'low' = actual_reps > 10 ? 'low' : 'high'

  const delta_vs_last = lastWeek && lastWeek.weight_kg > 0
    ? roundToQuarter(targetWeight - lastWeek.weight_kg)
    : null

  return {
    weight_kg: targetWeight,
    reps: targetReps,
    confidence,
    delta_vs_last,
  }
}
