import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { detectMuscleGroups } from '@/lib/client/muscleDetection'
import NotificationsBar, { type Notification } from '@/components/client/smart/NotificationsBar'
import SmartNutritionWidget, { type NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import SmartWorkoutWidget, { type SmartWorkoutWidgetProps } from '@/components/client/smart/SmartWorkoutWidget'
import SmartAgendaTimeline from '@/components/client/smart/SmartAgendaTimeline'
import type { TimelineEntry } from '@/lib/client/smart/timelineBuilder'
import type { MuscleGroup } from '@/lib/client/muscleDetection'

function getTodayDow() {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

function estimateDuration(exercises: any[]): number {
  let totalSec = 0
  for (const ex of exercises) {
    const sets = ex.sets ?? 3
    const restSec = ex.rest_sec ?? 90
    totalSec += sets * 45 + (sets - 1) * restSec
  }
  return Math.round(totalSec / 60)
}

export default async function ClientHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id, coach_id')
  if (!client) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] p-4 pt-6 pb-24 max-w-[480px] mx-auto">
        <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-6 text-center">
          <p className="text-[14px] text-white">Aucun profil client trouvé.</p>
        </div>
      </main>
    )
  }

  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const origin = `${proto}://${host}`
  const cookie = h.get('cookie') ?? ''

  const todayDow = getTodayDow()

  const [notifResult, nutriResult, timelineResult, programResult] = await Promise.allSettled([
    fetch(`${origin}/api/client/notifications?unread=true`, { headers: { cookie }, cache: 'no-store' }),
    fetch(`${origin}/api/client/nutrition/today`, { headers: { cookie }, cache: 'no-store' }),
    fetch(`${origin}/api/client/timeline/today`, { headers: { cookie }, cache: 'no-store' }),
    service
      .from('coach_clients')
      .select(`
        id,
        programs (
          id, name,
          program_sessions (
            id, name, day_of_week,
            program_exercises (
              id, name, sets, rest_sec,
              primary_muscles, secondary_muscles, movement_pattern, is_compound
            )
          )
        )
      `)
      .eq('id', client.id)
      .maybeSingle(),
  ])

  const notifications: Notification[] =
    notifResult.status === 'fulfilled' && notifResult.value.ok
      ? (await notifResult.value.json()).notifications ?? []
      : []

  const nutri =
    nutriResult.status === 'fulfilled' && nutriResult.value.ok
      ? await nutriResult.value.json()
      : null

  const consumed: NutritionMacros = nutri?.consumed ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 }
  const target: NutritionMacros = nutri?.target ?? { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 2500 }

  const timelineEntries: TimelineEntry[] =
    timelineResult.status === 'fulfilled' && timelineResult.value.ok
      ? (await timelineResult.value.json()).entries ?? []
      : []

  const programData = programResult.status === 'fulfilled' ? programResult.value.data : null
  const programs = (programData as any)?.programs ?? []
  const todaysSession = programs[0]?.program_sessions?.find((s: any) => s.day_of_week === todayDow)

  let workoutProps: SmartWorkoutWidgetProps

  if (!programs[0]) {
    workoutProps = { state: 'no_program' }
  } else if (!todaysSession) {
    workoutProps = { state: 'rest' }
  } else {
    const exercises = todaysSession.program_exercises ?? []
    const muscles = detectMuscleGroups(
      exercises.map((e: any) => ({
        id: e.id,
        name: e.name,
        primary_muscles: e.primary_muscles ?? [],
        secondary_muscles: e.secondary_muscles ?? [],
        movement_pattern: e.movement_pattern ?? null,
        is_compound: e.is_compound ?? null,
      }))
    )
    const pills: string[] = Array.from(muscles.primary)
      .slice(0, 3)
      .map(m => m.charAt(0).toUpperCase() + m.slice(1))

    workoutProps = {
      state: 'scheduled',
      session: {
        id: todaysSession.id,
        sessionLogHref: `/client/programme/session/${todaysSession.id}`,
        name: todaysSession.name ?? 'Séance',
        exerciseCount: exercises.length,
        estimatedMinutes: estimateDuration(exercises),
        primaryMuscles: Array.from(muscles.primary) as MuscleGroup[],
        secondaryMuscles: Array.from(muscles.secondary) as MuscleGroup[],
        musclePills: pills,
      },
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] p-4 pt-3 pb-24 max-w-[480px] mx-auto space-y-3">
      <NotificationsBar initial={notifications} />
      <SmartNutritionWidget consumed={consumed} target={target} />
      <SmartWorkoutWidget {...workoutProps} />
      <SmartAgendaTimeline entries={timelineEntries} />
    </main>
  )
}
