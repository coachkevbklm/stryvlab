import { calculateOneRM } from '@/lib/formulas/oneRM'

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
  rep_min?: number
  rep_max?: number
  target_rir?: number
  weight_increment_kg?: number
  lastWeek?: {
    weight_kg: number
    reps: number
    rir_actual: number
  }
  // Weight used in the previous set this session — recommendation never goes below this
  prev_set_weight_kg?: number
  historicalSessions?: HistoricalSession[]
}

export interface SetRecommendation {
  weight_kg: number
  reps: number
  confidence: 'high' | 'low'
  delta_vs_last: number | null
  phase: 'double_progression_reps' | 'double_progression_overload' | 'intra_session' | 'prescription'
}

// Arrondi au palier configuré — parseFloat/toFixed élimine le floating point IEEE 754
function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0) return Math.round(value * 2) / 2
  return parseFloat((Math.round(value / increment) * increment).toFixed(10))
}

function estimateOneRM(weight_kg: number, reps: number, rir_actual: number): number {
  const repsToFailure = reps + rir_actual
  const clampedRTF = Math.max(1, Math.min(repsToFailure, 15)) // cap à 15 — précision ±15% au-delà
  const result = calculateOneRM({ weight: weight_kg, reps: clampedRTF }, 'average')
  return result.oneRM
}

export function recommendNextSet(input: SetRecommendationInput): SetRecommendation | null {
  const {
    actual_weight_kg, actual_reps, rir_actual,
    goal,
    planned_reps,
    rep_min, rep_max, target_rir,
    weight_increment_kg = 2.5,
    lastWeek, prev_set_weight_kg,
  } = input

  if (actual_weight_kg <= 0 || actual_reps <= 0) return null

  const increment = weight_increment_kg > 0 ? weight_increment_kg : 2.5
  const effectiveTargetRir = target_rir ?? 2
  const effectiveRepMin = rep_min ?? 6
  const effectiveRepMax = rep_max ?? 12

  // ── Path A : double progression (historique S-1 disponible + plage reps configurée) ──
  // Utilise S-1 comme référence — pas le set courant
  if (lastWeek && lastWeek.weight_kg > 0 && lastWeek.reps > 0) {
    const lastAtOrAboveRepMax = lastWeek.reps >= effectiveRepMax
    const lastRirCompliant = lastWeek.rir_actual <= effectiveTargetRir + 1

    // Phase overload : S-1 avait atteint rep_max avec bon effort → augmenter la charge
    if (lastAtOrAboveRepMax && lastRirCompliant) {
      let targetWeight = roundToIncrement(lastWeek.weight_kg + increment, increment)
      // Ne jamais descendre sous le set précédent de cette session
      if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
        targetWeight = Math.max(targetWeight, prev_set_weight_kg)
      }
      const delta = roundToIncrement(targetWeight - lastWeek.weight_kg, increment)
      return {
        weight_kg: targetWeight,
        reps: effectiveRepMin,
        confidence: 'high',
        delta_vs_last: delta,
        phase: 'double_progression_overload',
      }
    }

    // Phase reps ↑ : garder la charge de S-1, viser +1 rep vers rep_max
    let targetWeight = roundToIncrement(lastWeek.weight_kg, increment)
    if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
      targetWeight = Math.max(targetWeight, prev_set_weight_kg)
    }
    const targetReps = Math.min(lastWeek.reps + 1, effectiveRepMax)
    const delta = roundToIncrement(targetWeight - lastWeek.weight_kg, increment)
    return {
      weight_kg: targetWeight,
      reps: targetReps,
      confidence: 'high',
      delta_vs_last: delta !== 0 ? delta : null,
      phase: 'double_progression_reps',
    }
  }

  // ── Path B : intra-séance (pas d'historique S-1) ──
  // Logique basée sur la performance du set courant + prescription coach
  //
  // Règles :
  //   Si client est dans la zone (rep_min ≤ reps ≤ rep_max) avec bon RIR → maintenir charge
  //   Si client dépasse rep_max → progresser (charge actuelle + incrément)
  //   Si client est sous rep_min → reculer légèrement (charge actuelle - incrément)
  //   Si RIR < target → le client est proche de l'échec → maintenir ou descendre
  //   Si RIR > target + 2 → trop facile → monter la charge

  const inZone = actual_reps >= effectiveRepMin && actual_reps <= effectiveRepMax
  const aboveZone = actual_reps > effectiveRepMax
  const belowZone = actual_reps < effectiveRepMin

  const rirTooLow = rir_actual < effectiveTargetRir - 1   // trop difficile
  const rirTooHigh = rir_actual > effectiveTargetRir + 2  // trop facile

  let targetWeight: number
  let targetReps: number
  let confidence: 'high' | 'low' = 'high'

  if (aboveZone) {
    // Charge trop légère → augmenter
    targetWeight = roundToIncrement(actual_weight_kg + increment, increment)
    targetReps = effectiveRepMin
  } else if (belowZone && rirTooLow) {
    // Sous le min ET proche de l'échec → descendre
    targetWeight = roundToIncrement(actual_weight_kg - increment, increment)
    targetReps = effectiveRepMin
  } else if (belowZone && !rirTooLow) {
    // Sous le min MAIS effort OK → charge trop lourde techniquement, pas à l'effort
    // Maintenir la charge, viser la prescription du coach
    targetWeight = roundToIncrement(actual_weight_kg, increment)
    targetReps = planned_reps > 0 ? planned_reps : effectiveRepMin
    confidence = 'low'
  } else if (inZone && rirTooHigh) {
    // Dans la zone mais trop facile → monter
    targetWeight = roundToIncrement(actual_weight_kg + increment, increment)
    targetReps = effectiveRepMin
  } else if (inZone && rirTooLow) {
    // Dans la zone mais proche de l'échec → maintenir
    targetWeight = roundToIncrement(actual_weight_kg, increment)
    targetReps = Math.min(actual_reps, effectiveRepMax)
  } else {
    // Cas standard — dans la zone, bon effort → +1 rep
    targetWeight = roundToIncrement(actual_weight_kg, increment)
    targetReps = Math.min(actual_reps + 1, effectiveRepMax)
    confidence = 'low'
  }

  // Ne jamais descendre sous le set précédent de cette session
  if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
    targetWeight = Math.max(targetWeight, prev_set_weight_kg)
  }
  // Ne jamais proposer 0kg ou charge négative
  targetWeight = Math.max(targetWeight, increment)

  return {
    weight_kg: targetWeight,
    reps: targetReps,
    confidence,
    delta_vs_last: null,
    phase: 'intra_session',
  }
}
