import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, Layers, BarChart2, ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import BodyMap from '@/components/client/BodyMap'
import { detectMuscleGroups } from '@/lib/client/muscleDetection'

export default async function SessionRecapPage({ params }: { params: { sessionLogId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/client/login')

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id')
  if (!client) notFound()

  // Fetch le session log avec ses sets
  const { data: sessionLog } = await service
    .from('client_session_logs')
    .select(`
      id, session_name, logged_at, duration_min, exercise_notes,
      client_set_logs (
        id, exercise_name, exercise_id, set_number, side,
        planned_reps, actual_reps, actual_weight_kg, completed,
        rir_actual, rest_sec_actual, notes
      )
    `)
    .eq('id', params.sessionLogId)
    .eq('client_id', client.id)
    .single()

  if (!sessionLog) notFound()

  const allSets = (sessionLog.client_set_logs ?? []) as any[]
  const completedSets = allSets.filter((s: any) => s.completed)

  // ── KPIs ──
  const totalVolume = completedSets.reduce((sum: number, s: any) => {
    return sum + (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
  }, 0)

  const totalReps = completedSets.reduce((sum: number, s: any) => sum + (s.actual_reps ?? 0), 0)

  const restTimes = completedSets
    .filter((s: any) => s.rest_sec_actual != null)
    .map((s: any) => s.rest_sec_actual as number)
  const avgRestSec = restTimes.length
    ? Math.round(restTimes.reduce((a: number, b: number) => a + b, 0) / restTimes.length)
    : null

  // ── Exercices groupés ──
  const exerciseMap: Record<string, { name: string; sets: any[] }> = {}
  for (const s of completedSets) {
    if (!exerciseMap[s.exercise_name]) exerciseMap[s.exercise_name] = { name: s.exercise_name, sets: [] }
    exerciseMap[s.exercise_name].sets.push(s)
  }
  const exercises = Object.values(exerciseMap)

  // ── Schéma corporel ──
  const { primary: primaryGroups, secondary: secondaryGroups } = detectMuscleGroups(
    exercises.map(e => ({ name: e.name }))
  )

  // ── Comparaison dernière séance du même nom ──
  const { data: prevLogs } = await service
    .from('client_session_logs')
    .select(`
      id, logged_at,
      client_set_logs (
        exercise_name, actual_reps, actual_weight_kg, completed
      )
    `)
    .eq('client_id', client.id)
    .eq('session_name', sessionLog.session_name)
    .neq('id', params.sessionLogId)
    .order('logged_at', { ascending: false })
    .limit(1)

  const prevLog = prevLogs?.[0] ?? null
  const prevSets = prevLog ? ((prevLog as any).client_set_logs ?? []).filter((s: any) => s.completed) : []

  // Volume précédent
  const prevVolume = prevSets.reduce((sum: number, s: any) => {
    return sum + (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
  }, 0)

  // Charge max par exercice — comparaison
  const maxWeightNow: Record<string, number> = {}
  const maxWeightPrev: Record<string, number> = {}
  for (const s of completedSets) {
    const w = parseFloat(String(s.actual_weight_kg)) || 0
    if (!maxWeightNow[s.exercise_name] || w > maxWeightNow[s.exercise_name]) maxWeightNow[s.exercise_name] = w
  }
  for (const s of prevSets) {
    const w = parseFloat(String(s.actual_weight_kg)) || 0
    if (!maxWeightPrev[s.exercise_name] || w > maxWeightPrev[s.exercise_name]) maxWeightPrev[s.exercise_name] = w
  }

  const volumeDelta = prevVolume > 0 ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100) : null

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-10">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/client/programme"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Séance terminée</p>
            <p className="text-[13px] font-bold text-white">{sessionLog.session_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-5 flex flex-col gap-4">

        {/* ── Bannière succès ── */}
        <div className="flex items-center gap-3 bg-[#1f8a65]/[0.08] border border-[#1f8a65]/20 rounded-2xl px-5 py-4">
          <CheckCircle2 size={20} className="text-[#1f8a65] shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-white">Séance enregistrée !</p>
            <p className="text-[11px] text-white/40 mt-0.5">
              {completedSets.length} série{completedSets.length > 1 ? 's' : ''} complétée{completedSets.length > 1 ? 's' : ''}
              {sessionLog.duration_min ? ` · ${sessionLog.duration_min}min` : ''}
            </p>
          </div>
        </div>

        {/* ── Stats globales ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            label="Volume total"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg`}
            delta={volumeDelta}
            icon={<BarChart2 size={11} />}
          />
          <StatCard
            label="Reps totales"
            value={String(totalReps)}
            icon={<Layers size={11} />}
          />
          <StatCard
            label="Sets complétés"
            value={String(completedSets.length)}
            sub={`sur ${allSets.length}`}
            icon={<CheckCircle2 size={11} />}
          />
          {avgRestSec !== null && (
            <StatCard
              label="Repos moyen"
              value={avgRestSec >= 60 ? `${Math.floor(avgRestSec / 60)}m${avgRestSec % 60 > 0 ? `${avgRestSec % 60}s` : ''}` : `${avgRestSec}s`}
              icon={<Clock size={11} />}
            />
          )}
        </div>

        {/* ── Schéma corporel ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-4">Muscles sollicités</p>
          <BodyMap primaryGroups={primaryGroups} secondaryGroups={secondaryGroups} />
        </div>

        {/* ── Analyse par exercice ── */}
        {exercises.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Performance par exercice</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {exercises.map(({ name, sets }) => {
                const maxW = maxWeightNow[name] ?? 0
                const prevMaxW = maxWeightPrev[name] ?? 0
                const delta = prevMaxW > 0 && maxW > 0 ? maxW - prevMaxW : null
                const totalRepsEx = sets.reduce((sum: number, s: any) => sum + (s.actual_reps ?? 0), 0)

                return (
                  <div key={name} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white/80 truncate">{name}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {sets.length} série{sets.length > 1 ? 's' : ''} · {totalRepsEx} reps
                        {maxW > 0 ? ` · ${maxW}kg max` : ''}
                      </p>
                    </div>
                    {delta !== null && (
                      <div className={`flex items-center gap-1 text-[11px] font-bold shrink-0 ${
                        delta > 0 ? 'text-[#1f8a65]' : delta < 0 ? 'text-red-400' : 'text-white/30'
                      }`}>
                        {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                        {delta > 0 ? '+' : ''}{delta}kg
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Notes libres ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-3">Notes de séance</p>
          {Object.keys(sessionLog.exercise_notes ?? {}).length > 0 ? (
            <div className="flex flex-col gap-2">
              {Object.entries(sessionLog.exercise_notes as Record<string, string>).map(([exId, note]) => {
                const exName = allSets.find((s: any) => s.exercise_id === exId)?.exercise_name ?? exId
                return (
                  <div key={exId} className="bg-white/[0.02] rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">{exName}</p>
                    <p className="text-[12px] text-white/60 leading-relaxed">{note}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[12px] text-white/25 italic">Aucune note pour cette séance.</p>
          )}
        </div>

        {/* ── CTA ── */}
        <Link
          href="/client/progress"
          className="flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] text-white/60 font-semibold py-3.5 rounded-xl hover:bg-white/[0.06] hover:text-white/80 transition-colors text-[12px]"
        >
          <BarChart2 size={13} />
          Voir ma progression
        </Link>
      </main>
    </div>
  )
}

function StatCard({
  label, value, sub, delta, icon
}: {
  label: string
  value: string
  sub?: string
  delta?: number | null
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
      <div className="flex items-center gap-1 text-white/30 mb-1.5">
        {icon}
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-[1.4rem] font-black text-white font-mono leading-none">{value}</p>
        {delta !== null && delta !== undefined && (
          <span className={`text-[10px] font-bold mb-0.5 ${delta > 0 ? 'text-[#1f8a65]' : delta < 0 ? 'text-red-400' : 'text-white/30'}`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      {sub && <p className="text-[9px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  )
}
