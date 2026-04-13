'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { deriveMetrics, type BiometricInputs, type DerivedMetrics, type NavySuggestion } from './healthMath'
import { evaluateAll, type NormEvaluation } from './bioNorms'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientProfile {
  date_of_birth?: string | null   // 'YYYY-MM-DD'
  sex?: string | null             // 'male' | 'female' | 'M' | 'F' | 'homme' | 'femme' | autres
}

interface UseBiometricsReturn {
  derived: DerivedMetrics | null
  evaluations: NormEvaluation[]
  criticalAlerts: NormEvaluation[]
  navySuggestion: NavySuggestion | null
  loading: boolean
  error: string | null
  applyNavySuggestion: () => Promise<void>
  refetch: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BIOMETRIC_FIELD_KEYS = [
  'weight_kg', 'height_cm', 'body_fat_pct', 'fat_mass_kg',
  'muscle_mass_kg', 'muscle_mass_pct', 'skeletal_muscle_pct', 'visceral_fat_level',
  'body_water_pct', 'bone_mass_kg', 'waist_cm', 'neck_cm', 'hips_cm',
  'waist_hip_ratio', 'metabolic_age',
] as const

type BiometricFieldKey = typeof BIOMETRIC_FIELD_KEYS[number]

function normalizeSex(sex: string | null | undefined): 'male' | 'female' | undefined {
  if (!sex) return undefined
  const s = sex.toLowerCase()
  if (s === 'male' || s === 'm' || s === 'homme') return 'male'
  if (s === 'female' || s === 'f' || s === 'femme') return 'female'
  return undefined
}

function calculateAge(dateOfBirth: string, referenceDate: string): number {
  const dob = new Date(dateOfBirth)
  const ref = new Date(referenceDate)
  let age = ref.getFullYear() - dob.getFullYear()
  const monthDiff = ref.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBiometrics(
  submissionId: string,
  clientProfile: ClientProfile,
  bilanDate?: string,
): UseBiometricsReturn {
  const [derived, setDerived] = useState<DerivedMetrics | null>(null)
  const [evaluations, setEvaluations] = useState<NormEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAndCompute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: responses, error: fetchError } = await supabase
        .from('assessment_responses')
        .select('block_id, field_key, value_number')
        .eq('submission_id', submissionId)
        .not('value_number', 'is', null)

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      // Build field map
      const fieldMap = new Map<string, number>()
      for (const row of responses ?? []) {
        if (
          typeof row.field_key === 'string' &&
          typeof row.value_number === 'number'
        ) {
          fieldMap.set(row.field_key, row.value_number)
        }
      }

      const weight_kg = fieldMap.get('weight_kg')
      const height_cm = fieldMap.get('height_cm')

      // Without mandatory fields, skip deriveMetrics
      if (weight_kg === undefined || height_cm === undefined) {
        setDerived(null)
        setEvaluations([])
        return
      }

      // Age calculation
      let age_at_measurement: number | undefined
      if (clientProfile.date_of_birth && bilanDate) {
        const computed = calculateAge(clientProfile.date_of_birth, bilanDate)
        age_at_measurement = computed >= 0 ? computed : undefined
      }

      const normalizedSex = normalizeSex(clientProfile.sex)
      const sex: 'male' | 'female' = normalizedSex ?? 'male'

      const inputs: BiometricInputs = {
        weight_kg,
        height_cm,
        sex,
        age_at_measurement,
        body_fat_pct: fieldMap.get('body_fat_pct'),
        fat_mass_kg: fieldMap.get('fat_mass_kg'),
        muscle_mass_kg: fieldMap.get('muscle_mass_kg'),
        muscle_mass_pct: fieldMap.get('muscle_mass_pct'),
        skeletal_muscle_pct: fieldMap.get('skeletal_muscle_pct'),
        visceral_fat_level: fieldMap.get('visceral_fat_level'),
        body_water_pct: fieldMap.get('body_water_pct'),
        bone_mass_kg: fieldMap.get('bone_mass_kg'),
        waist_cm: fieldMap.get('waist_cm'),
        neck_cm: fieldMap.get('neck_cm'),
        hips_cm: fieldMap.get('hips_cm') ?? fieldMap.get('hip_cm'),
        metabolic_age: fieldMap.get('metabolic_age'),
      }

      const derivedResult = deriveMetrics(inputs)
      setDerived(derivedResult)

      // Compute waist_hip_ratio
      // Supporte les deux clés : 'hips_cm' (actuel) et 'hip_cm' (legacy pré-renommage)
      const waist_cm = fieldMap.get('waist_cm')
      const hips_cm = fieldMap.get('hips_cm') ?? fieldMap.get('hip_cm')
      let waist_hip_ratio: number | undefined = fieldMap.get('waist_hip_ratio')
      if (waist_hip_ratio === undefined && waist_cm !== undefined && hips_cm !== undefined && hips_cm > 0) {
        waist_hip_ratio = waist_cm / hips_cm
      }

      // Age for norms — fallback to 30 if unknown
      const normAge = age_at_measurement ?? 30
      const normSex: 'male' | 'female' = normalizedSex ?? 'male'

      const evals = evaluateAll(
        {
          bmi: derivedResult.bmi,
          body_fat_pct: derivedResult.body_fat_pct,
          muscle_mass_pct: derivedResult.muscle_mass_pct,
          lean_mass_kg: derivedResult.lean_mass_kg,
          visceral_fat_level: fieldMap.get('visceral_fat_level') ?? null,
          body_water_pct: fieldMap.get('body_water_pct') ?? null,
          bone_mass_kg: fieldMap.get('bone_mass_kg') ?? null,
          waist_cm: fieldMap.get('waist_cm') ?? null,
          waist_hip_ratio: waist_hip_ratio ?? null,
          waist_height_ratio: derivedResult.waist_height_ratio ?? null,
          metabolic_age_estimated: derivedResult.metabolic_age_estimated ?? null,
        },
        normAge,
        normSex,
      )

      setEvaluations(evals)
    } catch (err) {
      console.error('[useBiometrics] Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [submissionId, clientProfile, bilanDate])

  useEffect(() => {
    void fetchAndCompute()
  }, [fetchAndCompute])

  const applyNavySuggestion = useCallback(async () => {
    if (!derived?.navy_suggestion) return

    setLoading(true)
    setError(null)

    try {
      const patchRes = await fetch(
        `/api/assessments/submissions/${submissionId}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responses: [
              {
                block_id: 'biometrics',
                field_key: 'body_fat_pct',
                value_number: derived.navy_suggestion.estimated_body_fat_pct,
              },
            ],
          }),
        },
      )

      if (!patchRes.ok) {
        const body = await patchRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${patchRes.status}`)
      }

      const recalcRes = await fetch(
        `/api/assessments/submissions/${submissionId}/recalculate`,
        { method: 'POST' },
      )

      if (!recalcRes.ok) {
        const body = await recalcRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${recalcRes.status}`)
      }

      await fetchAndCompute()
    } catch (err) {
      console.error('[useBiometrics] applyNavySuggestion error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [submissionId, derived, fetchAndCompute])

  const criticalAlerts = evaluations.filter((e) => e.is_critical)
  const navySuggestion = derived?.navy_suggestion ?? null

  return {
    derived,
    evaluations,
    criticalAlerts,
    navySuggestion,
    loading,
    error,
    applyNavySuggestion,
    refetch: fetchAndCompute,
  }
}
