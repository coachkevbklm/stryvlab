import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Image from 'next/image'
import ProgressCharts from '@/components/client/ProgressCharts'

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

  // Fetch 30-day performance data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/client/performance?days=30`, {
    headers: { Cookie: `` }, // SSR fetch — data fetched via service role in API route
    cache: 'no-store',
  })

  // Fallback: fetch directly via service client if API call fails (SSR context)
  const days = 30
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString().split('T')[0]

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
        rpe
      )
    `)
    .eq('client_id', client.id)
    .gte('logged_at', sinceISO)
    .order('logged_at', { ascending: true })

  const logs = sessionLogs ?? []

  // KPIs
  const completedSessions = logs.filter((l) => l.completed_at).length
  const allSets = logs.flatMap((l: any) => l.client_set_logs ?? [])
  const completedSets = allSets.filter((s: any) => s.completed)
  const totalVolume = completedSets.reduce((sum: number, s: any) => {
    return sum + (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
  }, 0)
  const durationsMin = logs
    .filter((l: any) => l.duration_min != null)
    .map((l: any) => l.duration_min as number)
  const avgDuration = durationsMin.length
    ? Math.round(durationsMin.reduce((a: number, b: number) => a + b, 0) / durationsMin.length)
    : 0

  // Volume timeline
  const timelineMap: Record<string, { date: string; volume: number; sessions: number }> = {}
  for (const log of logs) {
    const date = log.logged_at
    if (!timelineMap[date]) timelineMap[date] = { date, volume: 0, sessions: 0 }
    timelineMap[date].sessions += 1
    for (const s of (log as any).client_set_logs ?? []) {
      if (s.completed) {
        timelineMap[date].volume +=
          (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
      }
    }
  }
  const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date))

  // Exercise progression
  const exerciseMap: Record<
    string,
    { name: string; points: { date: string; maxWeight: number }[] }
  > = {}
  for (const log of logs) {
    for (const s of (log as any).client_set_logs ?? []) {
      if (!s.completed || !s.actual_weight_kg) continue
      const name = s.exercise_name
      if (!exerciseMap[name]) exerciseMap[name] = { name, points: [] }
      const weight = parseFloat(String(s.actual_weight_kg))
      const existing = exerciseMap[name].points.find((p: any) => p.date === log.logged_at)
      if (existing) {
        existing.maxWeight = Math.max(existing.maxWeight, weight)
      } else {
        exerciseMap[name].points.push({ date: log.logged_at, maxWeight: weight })
      }
    }
  }
  const exerciseProgression = Object.values(exerciseMap)
    .filter((e) => e.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 4)

  const kpis = {
    totalSessions: logs.length,
    completedSessions,
    totalSets: completedSets.length,
    totalVolume: Math.round(totalVolume),
    avgDuration,
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Image src="/images/logo.png" alt="STRYV" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-sm font-semibold text-primary">Progression</span>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <KpiCard label="Séances" value={kpis.completedSessions} sub={`sur ${kpis.totalSessions} démarrées`} />
          <KpiCard label="Sets complétés" value={kpis.totalSets} sub="30 derniers jours" />
          <KpiCard label="Volume total" value={`${(kpis.totalVolume / 1000).toFixed(1)}t`} sub="kg soulevés" />
          <KpiCard label="Durée moy." value={kpis.avgDuration ? `${kpis.avgDuration}min` : '—'} sub="par séance" />
        </div>

        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <ProgressCharts timeline={timeline} exerciseProgression={exerciseProgression} />
        )}
      </main>
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-surface rounded-card shadow-soft-out p-4">
      <p className="text-xs text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary font-mono">{value}</p>
      <p className="text-[10px] text-secondary mt-0.5">{sub}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-surface rounded-card shadow-soft-out p-8 text-center">
      <p className="text-3xl mb-3">💪</p>
      <p className="font-semibold text-primary text-sm mb-1">Pas encore de données</p>
      <p className="text-xs text-secondary">
        Logue ta première séance pour voir ta progression ici.
      </p>
    </div>
  )
}
