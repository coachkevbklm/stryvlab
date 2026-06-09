import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { insertClientNotification } from '@/lib/notifications/insert-client-notification'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function toDayKey(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null
}

function chunk<T>(items: T[], size: number) {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size))
  }
  return output
}

// GET /api/programs?client_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const { data, error } = await service()
    .from('programs')
    .select(`
      id, name, description, goal, level, frequency, weeks, muscle_tags,
      equipment_archetype, session_mode, status, is_client_visible, created_at,
      program_sessions (
        id, name, day_of_week, days_of_week, position, notes,
        program_exercises (
          id, name, sets, reps, rest_sec, rir, notes, position, image_url,
          movement_pattern, equipment_required, primary_muscles, secondary_muscles,
          group_id, is_compound, target_rir, weight_increment_kg,
          plane, mechanic, unilateral, primary_muscle, primary_activation,
          secondary_muscles_detail, secondary_activations, stabilizers,
          joint_stress_spine, joint_stress_knee, joint_stress_shoulder,
          global_instability, coordination_demand, constraint_profile
        )
      )
    `)
    .eq('client_id', clientId)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const programs = data ?? []
  const sessionToProgram = new Map<string, string>()

  for (const program of programs) {
    for (const session of ((program as any).program_sessions ?? [])) {
      if (session?.id) {
        sessionToProgram.set(session.id, (program as any).id)
      }
    }
  }

  const sessionIds = Array.from(sessionToProgram.keys())
  const logRows: any[] = []

  for (const ids of chunk(sessionIds, 200)) {
    const { data: logs, error: logsError } = await service()
      .from('client_session_logs')
      .select(`
        id, completed_at, duration_min, program_session_id,
        client_set_logs (
          actual_reps, actual_weight_kg, completed
        )
      `)
      .eq('client_id', clientId)
      .in('program_session_id', ids)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })
    logRows.push(...(logs ?? []))
  }

  const statsByProgram = new Map<string, {
    completedSessions: number
    durationSamples: number[]
    totalVolumeKg: number
    totalReps: number
    latestCompletedAt: string | null
    dayVolume: Map<string, number>
    recentSessionDates: string[]
  }>()

  for (const program of programs) {
    statsByProgram.set((program as any).id, {
      completedSessions: 0,
      durationSamples: [],
      totalVolumeKg: 0,
      totalReps: 0,
      latestCompletedAt: null,
      dayVolume: new Map<string, number>(),
      recentSessionDates: [],
    })
  }

  for (const log of logRows) {
    const programId = sessionToProgram.get(log.program_session_id)
    if (!programId) continue

    const stats = statsByProgram.get(programId)
    if (!stats) continue

    stats.completedSessions += 1
    if (typeof log.duration_min === 'number' && Number.isFinite(log.duration_min)) {
      stats.durationSamples.push(log.duration_min)
    }
    if (!stats.latestCompletedAt || log.completed_at > stats.latestCompletedAt) {
      stats.latestCompletedAt = log.completed_at
    }
    if (typeof log.completed_at === 'string') {
      stats.recentSessionDates.push(log.completed_at)
    }

    let sessionVolume = 0
    let sessionReps = 0
    for (const set of (log.client_set_logs ?? [])) {
      if (!set?.completed && set?.actual_reps == null) continue
      const reps = Number(set.actual_reps) || 0
      const weight = Number(set.actual_weight_kg) || 0
      sessionReps += reps
      sessionVolume += reps * weight
    }

    stats.totalReps += sessionReps
    stats.totalVolumeKg += sessionVolume

    const dayKey = toDayKey(log.completed_at)
    if (dayKey) {
      stats.dayVolume.set(dayKey, (stats.dayVolume.get(dayKey) ?? 0) + sessionVolume)
    }
  }

  const enrichedPrograms = programs.map((program: any) => {
    const sessions = (program.program_sessions ?? []) as any[]
    const exercises = sessions.flatMap((session) => session.program_exercises ?? [])
    const plannedSets = exercises.reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0)
    const stats = statsByProgram.get(program.id)
    const avgDuration = stats && stats.durationSamples.length > 0
      ? Math.round(stats.durationSamples.reduce((sum, value) => sum + value, 0) / stats.durationSamples.length)
      : null

    const volumeSeries = Array.from(stats?.dayVolume.entries() ?? [])
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([date, volume]) => ({ date, value: Math.round(volume) }))

    const recentSessionDates = (stats?.recentSessionDates ?? [])
      .slice()
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 12)

    return {
      ...program,
      program_stats: {
        session_count: sessions.length,
        exercise_count: exercises.length,
        planned_set_count: plannedSets,
        completed_session_count: stats?.completedSessions ?? 0,
        avg_duration_min: avgDuration,
        total_volume_kg: Math.round(stats?.totalVolumeKg ?? 0),
        total_reps: stats?.totalReps ?? 0,
        latest_completed_at: stats?.latestCompletedAt ?? null,
        volume_series: volumeSeries,
        recent_session_dates: recentSessionDates,
      },
    }
  })

  return NextResponse.json({ programs: enrichedPrograms })
}

// POST /api/programs — créer un programme
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { client_id, name, description, weeks } = body

  if (!client_id || !name) return NextResponse.json({ error: 'client_id et name requis' }, { status: 400 })

  const { data, error } = await service()
    .from('programs')
    .insert({ coach_id: user.id, client_id, name, description, weeks: weeks ?? 4 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notif client — programme assigné
  await insertClientNotification(service(), {
    coachId:  user.id,
    clientId: client_id,
    type:     'program_assigned',
    message:  `Ton coach t'a assigné un nouveau programme : "${name}".`,
  })

  return NextResponse.json({ program: data }, { status: 201 })
}
