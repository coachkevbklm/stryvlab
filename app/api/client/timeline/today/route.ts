import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { buildTimeline, type TimelineSource } from '@/lib/client/smart/timelineBuilder'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function mealTypeLabel(t: string): string {
  switch (t) {
    case 'breakfast': return 'Petit-déjeuner'
    case 'lunch': return 'Déjeuner'
    case 'dinner': return 'Dîner'
    case 'snack': return 'Collation'
    default: return 'Repas'
  }
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cc } = await svc().from('coach_clients').select('id').eq('user_id', user.id).single()
  if (!cc) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const dateParam = url.searchParams.get('date')
  const date = dateParam ?? computePhysiologicalDate(new Date())
  const dayStart = `${date}T00:00:00Z`
  const dayEnd = `${date}T23:59:59Z`

  const [mealsResult, waterResult, sessionResult, activitiesResult] = await Promise.allSettled([
    svc()
      .from('nutrition_meals')
      .select('id, meal_type, title, logged_at, calories, protein_g, carbs_g, fat_g')
      .eq('client_id', cc.id)
      .eq('physiological_date', date)
      .neq('meal_type', 'drinks')
      .order('logged_at', { ascending: true }),
    svc()
      .from('client_water_logs')
      .select('logged_at, amount_ml')
      .eq('client_id', cc.id)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),
    svc()
      .from('client_session_logs')
      .select('id, completed_at, program_session_id')
      .eq('client_id', cc.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    svc()
      .from('client_activity_logs')
      .select('id, started_at, activity_type, custom_label, duration_min, intensity')
      .eq('client_id', cc.id)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd),
  ])

  const meals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const water = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []
  const sessionRow = sessionResult.status === 'fulfilled' ? sessionResult.value.data : null
  const activities = activitiesResult.status === 'fulfilled' ? (activitiesResult.value.data ?? []) : []

  let session: TimelineSource['session'] = null
  if (sessionRow) {
    // Get exercise count
    const { count } = await svc()
      .from('client_set_logs')
      .select('exercise_name', { count: 'exact', head: true })
      .eq('session_log_id', sessionRow.id)

    session = {
      id: sessionRow.id,
      completed_at: sessionRow.completed_at as string,
      title: 'Séance',
      duration_min: 0,
      exercises_count: count ?? 0,
    }
  }

  const src: TimelineSource = {
    meals: meals.map(m => ({
      id: m.id,
      logged_at: m.logged_at,
      title: m.title ?? mealTypeLabel(m.meal_type),
      meal_type: m.meal_type as any,
      kcal: Number(m.calories ?? 0),
      protein_g: Number(m.protein_g ?? 0),
      carbs_g: Number(m.carbs_g ?? 0),
      fat_g: Number(m.fat_g ?? 0),
    })),
    waterLogs: water.map(w => ({ logged_at: w.logged_at, amount_ml: Number(w.amount_ml ?? 0) })),
    session,
    activities: activities.map(a => ({
      id: a.id,
      started_at: a.started_at,
      activity_type: a.activity_type as any,
      custom_label: a.custom_label,
      duration_min: a.duration_min,
      intensity: a.intensity,
    })),
    checkins: [],
  }

  const entries = buildTimeline(src)
  return NextResponse.json({ date, entries })
}
