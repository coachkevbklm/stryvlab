import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Link from 'next/link'
import { Dumbbell, Clock, Layers, Coffee, Timer, Target } from 'lucide-react'
import BodyMap from '@/components/client/BodyMap'
import { detectMuscleGroups } from '@/lib/client/muscleDetection'
import ExerciseListDisclosure from '@/components/client/ExerciseListDisclosure'
import { ct, cta, type ClientLang } from '@/lib/i18n/clientTranslations'

function getTodayDow() {
  const jsDay = new Date().getDay() // 0=Sun
  return jsDay === 0 ? 7 : jsDay
}

function getTodayLabel(daysFull: string[]) {
  const todayDow = getTodayDow()
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return { dayName: daysFull[todayDow - 1], date: `${day}/${month}` }
}

function estimateDuration(exercises: any[]): number {
  // Estimation : 45s par set + temps de repos
  let totalSec = 0
  for (const ex of exercises) {
    const sets = ex.sets ?? 3
    const restSec = ex.rest_sec ?? 90
    totalSec += sets * 45 + (sets - 1) * restSec
  }
  return Math.round(totalSec / 60)
}

function estimateVolume(exercises: any[]): { sets: number; totalSets: number } {
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 0), 0)
  return { sets: totalSets, totalSets }
}

function avgRest(exercises: any[]): number | null {
  const rests = exercises.filter(ex => ex.rest_sec != null).map(ex => ex.rest_sec as number)
  if (rests.length === 0) return null
  return Math.round(rests.reduce((a, b) => a + b, 0) / rests.length)
}

function avgRir(exercises: any[]): number | null {
  const rirs = exercises.filter(ex => ex.rir != null).map(ex => ex.rir as number)
  if (rirs.length === 0) return null
  return Math.round(rirs.reduce((a, b) => a + b, 0) / rirs.length)
}

export default async function ClientProgrammePage({ searchParams }: { searchParams?: { dow?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service, 'id, first_name')
  if (!client) return <NoProgramPage lang="fr" />

  const todayIso = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [programsResult, prefsLangResult, completedTodayResult] = await Promise.all([
    service.from('programs')
      .select(`
        id, name, description, weeks, status, created_at,
        program_sessions (
          id, name, day_of_week, position, notes,
          program_exercises (
            id, name, sets, reps, rest_sec, rir, notes, position, primary_muscles, secondary_muscles
          )
        )
      `)
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1),
    service.from('client_preferences')
      .select('language')
      .eq('client_id', client.id)
      .maybeSingle(),
    service.from('client_session_logs')
      .select('program_session_id, session_name')
      .eq('client_id', client.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', `${todayIso}T00:00:00`)
      .lte('completed_at', `${todayIso}T23:59:59`),
  ])
  const programs = programsResult?.data
  // Set of session IDs already completed today (by ID or name as fallback)
  const completedRows = (completedTodayResult?.data ?? []) as any[]
  const completedTodayIds = new Set<string>(completedRows.map((r: any) => r.program_session_id).filter(Boolean))
  const completedTodayNames = new Set<string>(completedRows.map((r: any) => r.session_name).filter(Boolean))

  const rawLang = (prefsLangResult as any)?.data?.language
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? rawLang as ClientLang : 'fr'
  const daysShort = cta(lang, 'programme.days.short')
  const daysFull  = cta(lang, 'programme.days.full')
  const dateLocale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB'

  const program = programs?.[0]
  if (!program) return <NoProgramPage lang={lang} />

  const sessions = ((program.program_sessions ?? []) as any[])
    .sort((a, b) => a.position - b.position)

  const todayDow = getTodayDow()
  const { dayName, date } = getTodayLabel(daysFull)

  // Jour sélectionné : query param ?dow=N ou aujourd'hui par défaut
  const selectedDow = searchParams?.dow ? parseInt(searchParams.dow, 10) : todayDow
  const isViewingToday = selectedDow === todayDow

  // Session affichée (peut être un autre jour que aujourd'hui si navigation calendrier)
  const todaySession = sessions.find((s: any) => s.day_of_week === selectedDow) ?? null
  const todayExercises = todaySession
    ? ((todaySession.program_exercises ?? []) as any[]).sort((a: any, b: any) => a.position - b.position)
    : []

  // Label du jour sélectionné
  const selectedDayName = daysFull[selectedDow - 1] ?? dayName
  const selectedDate = isViewingToday ? date : ''

  // Données pour la carte
  const durationMin = todaySession ? estimateDuration(todayExercises) : null
  const { totalSets } = todaySession ? estimateVolume(todayExercises) : { totalSets: 0 }
  const restAvg = todaySession ? avgRest(todayExercises) : null
  const rirAvg = todaySession ? avgRir(todayExercises) : null
  const { primary: primaryGroups, secondary: secondaryGroups } = detectMuscleGroups(
    todayExercises.map((e: any) => ({
      name: e.name,
      primary_muscles:   e.primary_muscles   ?? [],
      secondary_muscles: e.secondary_muscles ?? [],
    }))
  )

  void dateLocale // used for potential future date formatting

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-10">

      {/* ── Header ── */}
      <header className="fixed top-4 left-4 right-4 z-40 h-14 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl bg-white/[0.04]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
        <div className="relative z-10 max-w-lg mx-auto flex items-center justify-between h-full px-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">{ct(lang, 'programme.section')}</p>
            <p className="text-[13px] font-bold text-white">{program.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase tracking-[0.12em]">{program.weeks}sem · {sessions.length} séances</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-[88px] pb-5 flex flex-col gap-4">

        {/* ── Sélecteur de jour — cliquable pour prévisualiser ── */}
        <div className="flex gap-1">
          {daysShort.map((d, i) => {
            const dow = i + 1
            const hasSession = sessions.some((s: any) => s.day_of_week === dow)
            const isToday = dow === todayDow
            const isSelected = dow === selectedDow
            const pill = (
              <span>{d}</span>
            )
            const dot = hasSession && (
              <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : isToday ? 'bg-[#1f8a65]' : 'bg-[#1f8a65]/50'}`} />
            )
            const cls = `flex-1 flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-colors ${
              isSelected
                ? 'bg-[#1f8a65] text-white'
                : isToday
                ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                : hasSession
                ? 'bg-white/[0.04] text-white/50 hover:bg-white/[0.07] cursor-pointer'
                : 'text-white/20'
            }`
            if (!hasSession && !isToday) {
              return <div key={d} className={cls}>{pill}{dot}</div>
            }
            return (
              <Link key={d} href={`/client/programme${dow === todayDow ? '' : `?dow=${dow}`}`} className={cls}>
                {pill}{dot}
              </Link>
            )
          })}
        </div>

        {todaySession ? (
          <>
            {/* ── Carte de séance ── */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">

              {/* Header carte */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-1">
                  {selectedDayName}{selectedDate ? ` · ${selectedDate}` : ''}{!isViewingToday ? ' · Aperçu' : ''}
                </p>
                <h2 className="text-[20px] font-bold text-white leading-tight">{todaySession.name}</h2>
                <p className="text-[12px] text-white/35 mt-0.5">
                  {todayExercises.length} {ct(lang, 'programme.session.exercises')}{todayExercises.length > 1 && lang === 'fr' ? 's' : ''}
                </p>
              </div>

              {/* BodyMap centré */}
              <div className="px-5 py-4 flex justify-center border-t border-b border-white/[0.04]">
                <BodyMap primaryGroups={primaryGroups} secondaryGroups={secondaryGroups} />
              </div>

              {/* Stats pills */}
              <div className="px-5 py-4 flex gap-2 flex-wrap">
                {durationMin !== null && (
                  <StatPill icon={<Clock size={10} />} label={`~${durationMin} min`} />
                )}
                <StatPill icon={<Layers size={10} />} label={`${totalSets} ${ct(lang, 'programme.session.sets')}`} />
                <StatPill icon={<Dumbbell size={10} />} label={`${todayExercises.length} ${ct(lang, 'programme.session.exercises')}`} />
                {restAvg !== null && (
                  <StatPill icon={<Timer size={10} />} label={`${restAvg}s ${ct(lang, 'programme.session.rest')}`} />
                )}
                {rirAvg !== null && (
                  <StatPill icon={<Target size={10} />} label={`${ct(lang, 'programme.session.rir')} ${rirAvg}`} />
                )}
              </div>

              {/* Liste exercices — disclosure collapsée par défaut */}
              <ExerciseListDisclosure exercises={todayExercises.map((ex: any) => ({ id: ex.id, name: ex.name, sets: ex.sets, reps: ex.reps }))} />

              {/* CTA */}
              <div className="px-5 pb-5 pt-3">
                {(completedTodayIds.has(todaySession.id) || completedTodayNames.has(todaySession.name)) ? (
                  <div className="flex items-center justify-between w-full bg-[#1f8a65]/10 border border-[#1f8a65]/20 pl-5 pr-1.5 py-1.5 rounded-xl">
                    <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#1f8a65]">
                      Séance réalisée ✓
                    </span>
                    <Link
                      href={`/client/programme/session/${todaySession.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[10px] font-bold"
                    >
                      Refaire
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/client/programme/session/${todaySession.id}`}
                    className="flex items-center justify-between w-full bg-[#1f8a65] pl-5 pr-1.5 py-1.5 rounded-xl hover:bg-[#217356] active:scale-[0.99] transition-all"
                  >
                    <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                      {ct(lang, 'programme.session.start')}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.15]">
                      <Dumbbell size={15} className="text-white" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* ── Autres séances de la semaine ── */}
            {sessions.filter((s: any) => s.day_of_week !== selectedDow).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                  {ct(lang, 'programme.week.label')}
                </p>
                <div className="flex flex-col gap-2">
                  {sessions
                    .filter((s: any) => s.day_of_week !== selectedDow)
                    .map((session: any) => {
                      const exs = ((session.program_exercises ?? []) as any[])
                        .sort((a: any, b: any) => a.position - b.position)
                      const isSessionToday = session.day_of_week === todayDow
                      return (
                        <Link
                          key={session.id}
                          href={`/client/programme?dow=${session.day_of_week}`}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center w-8">
                              <span className={`text-[9px] font-bold uppercase ${isSessionToday ? 'text-[#1f8a65]' : 'text-white/30'}`}>
                                {daysShort[(session.day_of_week ?? 1) - 1]}
                              </span>
                              {isSessionToday && <span className="w-1 h-1 rounded-full bg-[#1f8a65] mt-0.5" />}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-white/80">{session.name}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">{exs.length} {ct(lang, 'programme.session.exercises')} · {exs.reduce((s: number, e: any) => s + (e.sets ?? 0), 0)} {ct(lang, 'programme.session.sets')}</p>
                            </div>
                          </div>
                          <Dumbbell size={13} className="text-white/20 shrink-0" />
                        </Link>
                      )
                    })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Jour de repos ── */
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-10 text-center">
            <Coffee size={28} className="text-white/20 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-white/50">{ct(lang, 'programme.rest.today')}</p>
            <p className="text-[11px] text-white/25 mt-1">{ct(lang, 'programme.noProgram.desc')}</p>

            {/* Prochaine séance */}
            {(() => {
              const next = sessions.find((s: any) => {
                const d = s.day_of_week ?? 0
                return d > todayDow
              }) ?? sessions[0]
              if (!next) return null
              return (
                <p className="text-[10px] text-white/25 mt-4">
                  Prochaine séance · <span className="text-white/40">{daysFull[(next.day_of_week ?? 1) - 1]} — {next.name}</span>
                </p>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  )
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-3 py-1.5">
      <span className="text-white/35">{icon}</span>
      <span className="text-[11px] font-medium text-white/55">{label}</span>
    </div>
  )
}

function NoProgramPage({ lang }: { lang: ClientLang }) {
  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <header className="fixed top-4 left-4 right-4 z-40 h-14 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl bg-white/[0.04]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
        <div className="relative z-10 max-w-lg mx-auto h-full px-4 flex items-center">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">{ct(lang, 'programme.section')}</p>
            <p className="text-[13px] font-bold text-white">{ct(lang, 'programme.noProgram')}</p>
          </div>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-5 pt-[88px] py-16 text-center">
        <Dumbbell size={36} className="text-white/10 mx-auto mb-4" />
        <p className="text-[13px] text-white/40">{ct(lang, 'programme.noProgram.desc')}</p>
      </div>
    </div>
  )
}
