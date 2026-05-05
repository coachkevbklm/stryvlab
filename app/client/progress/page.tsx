import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import ProgressClientPage from './ProgressClientPage'
import {
  calculateStreaks,
  buildHeatmap,
  buildPRs,
  buildSessionList,
} from '@/lib/client/progressTypes'

// Re-export types for components that still import from here
export type {
  SetLog,
  SessionLog,
  HeatmapDay,
  PREntry,
  SessionSummary,
} from '@/lib/client/progressTypes'

export const metadata = { title: 'Progression' }

export default async function ClientProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/client/login')

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id, first_name')
  if (!client) redirect('/client')

  const { data: sessionLogs } = await service
    .from('client_session_logs')
    .select(`
      id,
      session_name,
      logged_at,
      completed_at,
      duration_min,
      client_set_logs (
        exercise_name,
        set_number,
        actual_reps,
        actual_weight_kg,
        completed,
        rpe,
        rir_actual
      )
    `)
    .eq('client_id', client.id)
    .order('logged_at', { ascending: true })

  const logs = (sessionLogs ?? []) as any[]

  const sessionDates = Array.from(new Set(logs.map((l: any) => l.logged_at.split('T')[0]))).sort() as string[]
  const { streak, bestStreak } = calculateStreaks(sessionDates)
  const heatmapData = buildHeatmap(logs)
  const allTimePRs = buildPRs(logs)
  const sessionList = buildSessionList(logs, allTimePRs)

  const { data: coachNote } = await service
    .from('metric_annotations')
    .select('id, label, note, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <ProgressClientPage
      firstName={(client as any).first_name ?? ''}
      streak={streak}
      bestStreak={bestStreak}
      heatmapData={heatmapData}
      allTimePRs={allTimePRs}
      sessionList={sessionList}
      rawLogs={logs}
      coachNote={coachNote ?? null}
    />
  )
}
