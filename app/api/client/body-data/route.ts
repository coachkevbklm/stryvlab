import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface BilanMeasures {
  bilanIndex: number
  date: string
  waist_cm:  number | null
  hips_cm:   number | null
  arm_cm:    number | null
  chest_cm:  number | null
}

export interface BodyDataResponse {
  weightSeries:    { date: string; value: number; bilanIndex: number }[]
  bodyFatSeries:   { date: string; value: number; bilanIndex: number }[]
  leanMassSeries:  { date: string; value: number; bilanIndex: number }[]
  composition:     { body_fat_pct: number | null; lean_mass_kg: number | null; muscle_mass_kg: number | null }
  measures:        { waist_cm: number | null; hips_cm: number | null; arm_cm: number | null; chest_cm: number | null }
  latestWeight:    number | null
  measuresByBilan: BilanMeasures[]
  annotations:     { date: string; label: string }[]
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = svc()
  const client = await resolveClientFromUser(user.id, user.email, service, 'id')
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const clientId = (client as any).id as string

  const [submissionsRes, annotationsRes] = await Promise.all([
    service
      .from('assessment_submissions')
      .select('id, bilan_date, submitted_at, assessment_responses(field_key, value_number)')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('bilan_date', { ascending: true })
      .limit(20),
    service
      .from('metric_annotations')
      .select('annotation_date, label')
      .eq('client_id', clientId)
      .not('label', 'is', null)
      .neq('event_type', 'injury')
      .order('annotation_date', { ascending: true }),
  ])

  const empty: BodyDataResponse = {
    weightSeries: [], bodyFatSeries: [], leanMassSeries: [],
    composition: { body_fat_pct: null, lean_mass_kg: null, muscle_mass_kg: null },
    measures: { waist_cm: null, hips_cm: null, arm_cm: null, chest_cm: null },
    latestWeight: null, measuresByBilan: [], annotations: [],
  }

  const submissions = submissionsRes.data
  if (!submissions || submissions.length === 0) {
    return NextResponse.json(empty)
  }

  const weightSeries:   { date: string; value: number; bilanIndex: number }[] = []
  const bodyFatSeries:  { date: string; value: number; bilanIndex: number }[] = []
  const leanMassSeries: { date: string; value: number; bilanIndex: number }[] = []
  const measuresByBilan: BilanMeasures[] = []
  const latestValues: Record<string, number> = {}

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i] as any
    const bilanIndex = i + 1
    const date = sub.bilan_date ?? sub.submitted_at?.split('T')[0] ?? ''
    const responses = sub.assessment_responses as { field_key: string; value_number: number | null }[]
    if (!responses) continue

    const bilanValues: Record<string, number> = {}
    for (const r of responses) {
      if (r.value_number == null) continue
      bilanValues[r.field_key] = r.value_number
      latestValues[r.field_key] = r.value_number
    }

    if (bilanValues['weight_kg'] != null)
      weightSeries.push({ date, value: bilanValues['weight_kg'], bilanIndex })
    if (bilanValues['body_fat_pct'] != null)
      bodyFatSeries.push({ date, value: bilanValues['body_fat_pct'], bilanIndex })
    if (bilanValues['lean_mass_kg'] != null)
      leanMassSeries.push({ date, value: bilanValues['lean_mass_kg'], bilanIndex })

    measuresByBilan.push({
      bilanIndex,
      date,
      waist_cm: bilanValues['waist_cm'] ?? null,
      hips_cm:  bilanValues['hips_cm']  ?? null,
      arm_cm:   bilanValues['arm_cm']   ?? null,
      chest_cm: bilanValues['chest_cm'] ?? null,
    })
  }

  const annotations = (annotationsRes.data ?? []).map((a: any) => ({
    date: a.annotation_date,
    label: a.label,
  }))

  return NextResponse.json({
    weightSeries,
    bodyFatSeries,
    leanMassSeries,
    composition: {
      body_fat_pct:   latestValues['body_fat_pct']   ?? null,
      lean_mass_kg:   latestValues['lean_mass_kg']   ?? null,
      muscle_mass_kg: latestValues['muscle_mass_kg'] ?? null,
    },
    measures: {
      waist_cm: latestValues['waist_cm'] ?? null,
      hips_cm:  latestValues['hips_cm']  ?? null,
      arm_cm:   latestValues['arm_cm']   ?? null,
      chest_cm: latestValues['chest_cm'] ?? null,
    },
    latestWeight: weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null,
    measuresByBilan,
    annotations,
  } satisfies BodyDataResponse)
}
