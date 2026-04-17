import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import ProgressClientPage from './ProgressClientPage'

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

  // Fetch ALL logs (no date filter) — period filtering done client-side
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

  const logs: SessionLog[] = (sessionLogs ?? []) as SessionLog[]

  // ── Streak calculation ──────────────────────────────────────────────
  const sessionDates = Array.from(new Set(logs.map(l => l.logged_at.split('T')[0]))).sort()
  const { streak, bestStreak } = calculateStreaks(sessionDates)

  // ── Heatmap data (last 84 days = 12 weeks) ──────────────────────────
  const heatmapData = buildHeatmap(logs)

  // ── PR tracking (all-time max weight per exercise) ──────────────────
  const allTimePRs = buildPRs(logs)

  // ── Session list with PR flag ────────────────────────────────────────
  const sessionList = buildSessionList(logs, allTimePRs)

  // ── Dernière annotation coach ────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────

export interface SetLog {
  exercise_name: string
  set_number: number
  actual_reps: number | null
  actual_weight_kg: number | string | null
  completed: boolean
  rpe: number | null
  rir_actual: number | null
}

export interface SessionLog {
  id: string
  session_name: string
  logged_at: string
  completed_at: string | null
  duration_min: number | null
  client_set_logs: SetLog[]
}

export interface HeatmapDay {
  date: string        // YYYY-MM-DD
  volume: number
  sessions: number
  level: 0 | 1 | 2 | 3 | 4   // 0=none, 4=max
}

export interface PREntry {
  exercise: string
  maxWeight: number
  prevMaxWeight: number   // second-best, for delta
  achievedDate: string
  sessionCount: number    // how many sessions with this exercise
}

export interface SessionSummary {
  id: string
  name: string
  date: string            // YYYY-MM-DD
  volume: number
  setsCompleted: number
  durationMin: number | null
  hasPR: boolean
  prExercises: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────

function calculateStreaks(sortedDates: string[]): { streak: number; bestStreak: number } {
  if (!sortedDates.length) return { streak: 0, bestStreak: 0 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let current = 0
  let best = 0
  let tempStreak = 1

  // Best streak (scan full history)
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1])
    const curr = new Date(sortedDates[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      tempStreak++
    } else {
      best = Math.max(best, tempStreak)
      tempStreak = 1
    }
  }
  best = Math.max(best, tempStreak)

  // Current streak (from today or yesterday backward)
  const lastDate = sortedDates[sortedDates.length - 1]
  if (lastDate !== todayStr && lastDate !== yesterdayStr) {
    return { streak: 0, bestStreak: best }
  }

  current = 1
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const next = new Date(sortedDates[i + 1])
    const curr = new Date(sortedDates[i])
    const diff = (next.getTime() - curr.getTime()) / 86400000
    if (diff === 1) current++
    else break
  }

  return { streak: current, bestStreak: best }
}

function buildHeatmap(logs: SessionLog[]): HeatmapDay[] {
  // Build a map of date → volume
  const volumeMap: Record<string, number> = {}
  const sessionMap: Record<string, number> = {}

  for (const log of logs) {
    const date = log.logged_at.split('T')[0]
    if (!volumeMap[date]) { volumeMap[date] = 0; sessionMap[date] = 0 }
    sessionMap[date]++
    for (const s of log.client_set_logs) {
      if (s.completed) {
        volumeMap[date] += (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
      }
    }
  }

  // Build 84-day window
  const days: HeatmapDay[] = []
  const volumes = Object.values(volumeMap).filter(v => v > 0)
  const maxVol = volumes.length ? Math.max(...volumes) : 1

  for (let i = 83; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    const volume = volumeMap[date] ?? 0
    const sessions = sessionMap[date] ?? 0

    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (volume > 0) {
      const ratio = volume / maxVol
      if (ratio < 0.25) level = 1
      else if (ratio < 0.5) level = 2
      else if (ratio < 0.75) level = 3
      else level = 4
    }

    days.push({ date, volume, sessions, level })
  }

  return days
}

function buildPRs(logs: SessionLog[]): PREntry[] {
  // Track max weight history per exercise
  const exerciseHistory: Record<string, { weights: number[]; dates: string[]; count: number }> = {}

  for (const log of logs) {
    const date = log.logged_at.split('T')[0]
    const seen = new Set<string>()
    for (const s of log.client_set_logs) {
      if (!s.completed || !s.actual_weight_kg) continue
      const name = s.exercise_name
      const weight = parseFloat(String(s.actual_weight_kg))
      if (!weight) continue
      if (!exerciseHistory[name]) exerciseHistory[name] = { weights: [], dates: [], count: 0 }
      if (!seen.has(name)) { exerciseHistory[name].count++; seen.add(name) }
      exerciseHistory[name].weights.push(weight)
      exerciseHistory[name].dates.push(date)
    }
  }

  const prs: PREntry[] = []
  for (const [exercise, data] of Object.entries(exerciseHistory)) {
    if (data.weights.length < 1) continue
    const sorted = [...data.weights].sort((a, b) => b - a)
    const maxWeight = sorted[0]
    const prevMaxWeight = sorted[1] ?? maxWeight
    // Find date of max weight
    const maxIdx = data.weights.indexOf(maxWeight)
    const achievedDate = data.dates[maxIdx] ?? ''
    prs.push({ exercise, maxWeight, prevMaxWeight, achievedDate, sessionCount: data.count })
  }

  // Sort by absolute max weight desc
  return prs.sort((a, b) => b.maxWeight - a.maxWeight)
}

function buildSessionList(logs: SessionLog[], prs: PREntry[]): SessionSummary[] {
  // Build per-session all-time PRs at the time of that session
  // For simplicity: flag a session if it contains a set that matches the all-time PR weight for that exercise
  const prMap: Record<string, number> = {}
  for (const pr of prs) prMap[pr.exercise] = pr.maxWeight

  return [...logs]
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
    .map(log => {
      const sets = log.client_set_logs
      const completed = sets.filter(s => s.completed)
      const volume = completed.reduce((sum, s) =>
        sum + (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0), 0)

      const prExercises: string[] = []
      for (const s of completed) {
        if (!s.actual_weight_kg) continue
        const w = parseFloat(String(s.actual_weight_kg))
        if (prMap[s.exercise_name] && w >= prMap[s.exercise_name]) {
          if (!prExercises.includes(s.exercise_name)) prExercises.push(s.exercise_name)
        }
      }

      return {
        id: log.id,
        name: log.session_name,
        date: log.logged_at.split('T')[0],
        volume: Math.round(volume),
        setsCompleted: completed.length,
        durationMin: log.duration_min,
        hasPR: prExercises.length > 0,
        prExercises,
      }
    })
}
