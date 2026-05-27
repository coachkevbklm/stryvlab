import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  computeTransformationScore,
  type TrainingGoal,
  type DimensionWeights,
  type CheckinSummaryInput,
  type PerformanceSummaryInput,
  type BodyDataInput,
} from '@/lib/coach/transformationScore'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const querySchema = z.object({
  window: z.coerce.number().refine((v): v is 7 | 30 => v === 7 || v === 30, 'must be 7 or 30').default(7),
})

type Params = { params: { clientId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = service()

  const { data: clientData } = await db
    .from('coach_clients')
    .select('id, training_goal, weekly_frequency, score_weights_config')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!clientData) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const parsed = querySchema.safeParse({ window: url.searchParams.get('window') ?? 7 })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  const win = parsed.data.window

  const trainingGoal = (clientData.training_goal ?? 'recomp') as TrainingGoal
  const weeklyFrequency = Number(clientData.weekly_frequency ?? 3)
  const weightsOverride = (clientData.score_weights_config ?? null) as DimensionWeights | null

  const periodStart = new Date(Date.now() - win * 86400000).toISOString()
  const periodStartDate = periodStart.slice(0, 10)

  const [checkinRes, sessionRes, progressionRes, metricsRes, configRes] = await Promise.all([
    db.from('client_daily_checkins')
      .select('date, flow_type, sleep_hours, sleep_quality, energy_level, stress_level, muscle_soreness, hunger_level')
      .eq('client_id', params.clientId)
      .gte('date', periodStartDate)
      .order('date', { ascending: true }),

    db.from('client_session_logs')
      .select('id, completed_at, client_set_logs(exercise_id, set_number, actual_reps, completed, rir_actual)')
      .eq('client_id', params.clientId)
      .not('completed_at', 'is', null)
      .gte('completed_at', periodStart),

    db.from('progression_events')
      .select('exercise_id, created_at, trigger_type')
      .eq('client_id', params.clientId)
      .gte('created_at', periodStart),

    db.from('assessment_submissions')
      .select('submitted_at, bilan_date, assessment_responses(field_key, value_number)')
      .eq('client_id', params.clientId)
      .eq('coach_id', user.id)
      .eq('status', 'completed')
      .gte('submitted_at', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('submitted_at', { ascending: true }),

    db.from('daily_checkin_configs')
      .select('days_of_week')
      .eq('client_id', params.clientId)
      .eq('coach_id', user.id)
      .maybeSingle(),
  ])

  // ── Build checkin input ──────────────────────────────────────────────────────
  const checkinRows = (checkinRes.data ?? []) as any[]
  const fieldSums: Record<string, { sum: number; count: number }> = {}
  const uniqueDays = new Set<string>()

  for (const r of checkinRows) {
    uniqueDays.add(r.date as string)
    const isMorning = r.flow_type === 'morning'
    const fields: Record<string, number | null> = {
      energy: r.energy_level,
      ...(isMorning
        ? { sleep_duration: r.sleep_hours, sleep_quality: r.sleep_quality }
        : { stress: r.stress_level, muscle_soreness: r.muscle_soreness }),
    }
    for (const [k, v] of Object.entries(fields)) {
      if (v == null) continue
      if (!fieldSums[k]) fieldSums[k] = { sum: 0, count: 0 }
      fieldSums[k].sum += Number(v)
      fieldSums[k].count += 1
    }
  }

  const fieldAverages: Record<string, number> = {}
  for (const [k, { sum, count }] of Object.entries(fieldSums)) {
    fieldAverages[k] = Math.round((sum / count) * 10) / 10
  }

  let configuredDays = 0
  const daysOfWeek: number[] = configRes.data?.days_of_week ?? []
  if (daysOfWeek.length > 0) {
    for (let i = 0; i < win; i++) {
      const d = new Date(Date.now() - i * 86400000)
      const jsDay = d.getDay()
      const day = jsDay === 0 ? 6 : jsDay - 1
      if (daysOfWeek.includes(day)) configuredDays++
    }
  }

  const responseRate = configuredDays > 0
    ? Math.round((uniqueDays.size / configuredDays) * 100)
    : null

  const checkin: CheckinSummaryInput = {
    field_averages: {
      energy: fieldAverages.energy,
      sleep_duration: fieldAverages.sleep_duration,
      sleep_quality: fieldAverages.sleep_quality,
      stress: fieldAverages.stress,
      muscle_soreness: fieldAverages.muscle_soreness,
    },
    response_rate: responseRate,
    configured_days_count: configuredDays,
  }

  // ── Build performance input ──────────────────────────────────────────────────
  const sessionLogs = (sessionRes.data ?? []) as any[]
  const sessionsCount = sessionLogs.length
  const progressionEvents = (progressionRes.data ?? []) as any[]

  const exerciseMap = new Map<string, { completionRates: number[]; rirValues: number[] }>()

  for (const session of sessionLogs) {
    const sets = (session.client_set_logs ?? []) as any[]
    const exIds = Array.from(new Set<string>(sets.map((s: any) => s.exercise_id as string)))
    for (const exId of exIds) {
      const exSets = sets.filter((s: any) => s.exercise_id === exId)
      const completedCount = exSets.filter((s: any) => s.completed).length
      const rirValues = exSets
        .map((s: any) => s.rir_actual)
        .filter((v: any): v is number => typeof v === 'number')
      if (!exerciseMap.has(exId)) exerciseMap.set(exId, { completionRates: [], rirValues: [] })
      const entry = exerciseMap.get(exId)!
      entry.completionRates.push(exSets.length > 0 ? completedCount / exSets.length : 0)
      entry.rirValues.push(...rirValues)
    }
  }

  const exercises = Array.from(exerciseMap.entries()).map(([exId, data]) => {
    const avgCompletion = data.completionRates.reduce((s, v) => s + v, 0) / data.completionRates.length
    const avgRir = data.rirValues.length > 0
      ? data.rirValues.reduce((s, v) => s + v, 0) / data.rirValues.length
      : null
    const overloads = progressionEvents.filter(
      (ev: any) => ev.exercise_id === exId && ev.trigger_type === 'overload'
    ).length
    return {
      completion_rate: avgCompletion,
      avg_rir: avgRir,
      overloads_last_4_weeks: overloads,
      stagnation: overloads === 0 && data.completionRates.length >= 3,
      overreaching: data.completionRates.filter(r => r < 0.8).length >= 2,
    }
  })

  const performance: PerformanceSummaryInput = {
    analysis: {
      exercises,
      global_overreaching: exercises.filter(e => e.overreaching).length >= 2,
    },
    sessionsCount,
    weeklyFrequency,
  }

  // ── Build body data input ────────────────────────────────────────────────────
  const submissions = (metricsRes.data ?? []) as any[]
  const weightSeries: { date: string; value: number }[] = []
  const bodyFatSeries: { date: string; value: number }[] = []
  const leanMassSeries: { date: string; value: number }[] = []

  for (const sub of submissions) {
    const rawDate: string = sub.bilan_date ?? sub.submitted_at ?? ''
    const date = rawDate.split('T')[0]
    if (!date) continue
    const responses = (sub.assessment_responses ?? []) as { field_key: string; value_number: number | null }[]
    for (const r of responses) {
      if (r.value_number == null) continue
      if (r.field_key === 'weight')       weightSeries.push({ date, value: r.value_number })
      if (r.field_key === 'body_fat_pct') bodyFatSeries.push({ date, value: r.value_number })
      if (r.field_key === 'lean_mass_kg') leanMassSeries.push({ date, value: r.value_number })
    }
  }

  const bodyData: BodyDataInput = {
    weightSeries,
    bodyFatSeries,
    leanMassSeries,
    trainingGoal,
  }

  const result = computeTransformationScore({ trainingGoal, window: win, checkin, performance, bodyData, weightsOverride })
  return NextResponse.json(result)
}
