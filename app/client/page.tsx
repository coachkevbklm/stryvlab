import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Link from 'next/link'
import Image from 'next/image'
import { Dumbbell, ChevronRight, ClipboardList, MessageSquare, Clock, Layers, CalendarDays, Sparkles, CheckCircle2 } from 'lucide-react'
import ContextualGreeting from '@/components/client/ContextualGreeting'
import ClientTopBar from '@/components/client/ClientTopBar'
import { ct, cta, type ClientLang } from '@/lib/i18n/clientTranslations'

function getTodayDow() {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

function getWeekBounds() {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun
  const dow = jsDay === 0 ? 7 : jsDay
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
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

function NoProgramPage({ lang }: { lang: ClientLang }) {
  return (
    <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-[#1f8a65]/10 flex items-center justify-center">
        <Sparkles size={20} className="text-[#1f8a65]" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white">{ct(lang, 'home.noProgram.title')}</p>
        <p className="text-[12px] text-white/40 mt-1 leading-relaxed">
          {ct(lang, 'home.noProgram.desc')}
        </p>
      </div>
    </div>
  )
}

export default async function ClientHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(
    user!.id,
    user!.email,
    service,
    'id, first_name, last_name, coach_id'
  )

  if (!client) return (
    <div className="min-h-screen bg-[#121212] font-sans flex items-center justify-center p-4">
      <NoProgramPage lang="fr" />
    </div>
  )

  const clientId = client?.id ?? null
  const firstName = client?.first_name ?? user?.email?.split('@')[0] ?? 'toi'

  const todayDow = getTodayDow()
  const { monday, sunday } = getWeekBounds()

  // ── Parallel fetches ──
  // Bornes "aujourd'hui" pour vérifier si la séance du jour est déjà complétée
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const coachId: string | null = (client as any)?.coach_id ?? null

  const [
    programResult,
    pendingResult,
    logsThisWeekResult,
    coachNoteResult,
    prefsLangResult,
    todayLogsResult,
    coachProfileResult,
    checkinConfigResult,
    todayCheckinsResult,
    streakResult,
    pointsHistoryResult,
  ] = await Promise.all([
    // Programme actif + sessions
    clientId
      ? service
          .from('programs')
          .select(`
            id, name,
            program_sessions (
              id, name, day_of_week, days_of_week, position,
              program_exercises ( id, sets, rest_sec )
            )
          `)
          .eq('client_id', clientId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null }),

    // Bilans en attente — fetch token pour lien direct vers formulaire
    clientId
      ? service
          .from('assessment_submissions')
          .select('id, token, token_expires_at')
          .eq('client_id', clientId)
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),

    // Séances faites cette semaine
    clientId
      ? service
          .from('client_session_logs')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .gte('started_at', monday.toISOString())
          .lte('started_at', sunday.toISOString())
      : Promise.resolve({ count: 0 }),

    // Dernière annotation coach
    clientId
      ? service
          .from('metric_annotations')
          .select('id, label, note, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Préférence langue
    clientId
      ? service
          .from('client_preferences')
          .select('language')
          .eq('client_id', clientId)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    // Séances complétées aujourd'hui — pour savoir si la séance du jour est déjà faite
    clientId
      ? service
          .from('client_session_logs')
          .select('id, session_name, completed_at')
          .eq('client_id', clientId)
          .not('completed_at', 'is', null)
          .gte('completed_at', todayStart.toISOString())
          .lte('completed_at', todayEnd.toISOString())
      : Promise.resolve({ data: [] }),

    // Profil coach — pour afficher nom + logo dans la TopBar
    coachId
      ? service
          .from('coach_profiles')
          .select('full_name, brand_name, logo_url')
          .eq('coach_id', coachId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? service
          .from('daily_checkin_configs')
          .select('id, is_active, days_of_week, moments')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? service
          .from('daily_checkin_responses')
          .select('moment, responded_at')
          .eq('client_id', clientId)
          .gte('responded_at', todayStart.toISOString())
          .lte('responded_at', todayEnd.toISOString())
      : Promise.resolve({ data: [] }),
    clientId
      ? service
          .from('client_streaks')
          .select('current_streak, longest_streak, level, total_points')
          .eq('client_id', clientId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? service
          .from('client_points')
          .select('action_type, points, earned_at')
          .eq('client_id', clientId)
          .order('earned_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const coachProfile = (coachProfileResult as any)?.data ?? null
  const coachDisplayName: string = coachProfile?.brand_name ?? coachProfile?.full_name ?? ''
  const coachLogoUrl: string | null = coachProfile?.logo_url ?? null
  const coachInitials = coachDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')

  const rawLang = (prefsLangResult as any)?.data?.language
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? rawLang as ClientLang : 'fr'
  const daysFull = cta(lang, 'programme.days.full')
  const dateLocale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB'

  const program = (programResult as any)?.data?.[0] ?? null
  const sessions = program
    ? ((program.program_sessions ?? []) as any[]).sort((a: any, b: any) => a.position - b.position)
    : []

  const pendingSubmissions: { id: string; token: string; token_expires_at: string }[] = (pendingResult as any)?.data ?? []
  // Filtrer les tokens expirés côté client aussi
  const validPending = pendingSubmissions.filter(s =>
    !s.token_expires_at || new Date(s.token_expires_at) > new Date()
  )
  const pendingCount = validPending.length
  // Lien direct vers le formulaire bilan (pas la vue lecture)
  const firstPendingToken = validPending[0]?.token ?? null
  const doneThisWeek = (logsThisWeekResult as any)?.count ?? 0
  const coachNote = (coachNoteResult as any)?.data ?? null
  const todayCompletedLogs: any[] = (todayLogsResult as any)?.data ?? []
  const checkinConfig: any = (checkinConfigResult as any)?.data ?? null
  const todayCheckins: any[] = (todayCheckinsResult as any)?.data ?? []
  const streak = (streakResult as any)?.data ?? { current_streak: 0, longest_streak: 0, level: 'bronze', total_points: 0 }
  const pointsHistory: any[] = (pointsHistoryResult as any)?.data ?? []

  const jsDay = new Date().getDay()
  const todayCheckinDay = jsDay === 0 ? 6 : jsDay - 1
  const isCheckinConfiguredToday =
    !!checkinConfig?.is_active &&
    (checkinConfig?.days_of_week ?? []).includes(todayCheckinDay)

  const todayMoments: string[] = ((checkinConfig?.moments ?? []) as any[]).map((m: any) => m.moment)
  const respondedMoments = new Set(todayCheckins.map((r: any) => r.moment))
  const pendingMoment = todayMoments.find((m) => !respondedMoments.has(m)) ?? null

  // Séance du jour — masquée si déjà complétée aujourd'hui (session du même nom)
  const rawTodaySession = sessions.find((s: any) =>
    (s.days_of_week?.length ? s.days_of_week : [s.day_of_week]).includes(todayDow)
  ) ?? null
  const todaySessionAlreadyDone = rawTodaySession
    ? todayCompletedLogs.some((log: any) => log.session_name === rawTodaySession.name)
    : false
  const todaySession = todaySessionAlreadyDone ? null : rawTodaySession
  const todayExercises = todaySession
    ? ((todaySession.program_exercises ?? []) as any[])
    : []
  const durationMin = todaySession ? estimateDuration(todayExercises) : null
  const totalSets = todayExercises.reduce((sum: number, ex: any) => sum + (ex.sets ?? 0), 0)

  // Prochaine séance si pas aujourd'hui
  const nextSession = !todaySession
    ? sessions
        .filter((s: any) => (s.days_of_week?.length ? Math.min(...s.days_of_week) : s.day_of_week ?? 0) > todayDow)
        .sort((a: any, b: any) => (a.days_of_week?.[0] ?? a.day_of_week ?? 0) - (b.days_of_week?.[0] ?? b.day_of_week ?? 0))[0] ??
      sessions.sort((a: any, b: any) => (a.days_of_week?.[0] ?? a.day_of_week ?? 0) - (b.days_of_week?.[0] ?? b.day_of_week ?? 0))[0] ??
      null
    : null

  // Séances prévues cette semaine
  const plannedThisWeek = sessions.length

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <ClientTopBar
        left={
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="STRYVR" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-unbounded text-[13px] font-bold text-white tracking-wide">STRYVR</span>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/client/agenda"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition-colors active:scale-[0.97]"
            >
              <CalendarDays size={14} />
              <span className="text-[11px] font-semibold">Agenda</span>
            </Link>
            {coachDisplayName && (
              <div className="flex items-center gap-2">
                {coachLogoUrl ? (
                  <Image
                    src={coachLogoUrl}
                    alt={coachDisplayName}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover border-[0.3px] border-white/[0.12]"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1f8a65] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white leading-none">{coachInitials || '?'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-5 flex flex-col gap-4">

        {/* ── Salutation ── */}
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-1">
            {ct(lang, 'home.section')}
          </p>
          <ContextualGreeting firstName={firstName} hasSessionToday={!!todaySession} />
        </div>

        {/* ── Progression gamification ── */}
        <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-3">
            Ma progression
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MiniStat label="Points" value={streak.total_points ?? 0} />
            <MiniStat label="Série" value={streak.current_streak ?? 0} />
            <MiniStat label="Record" value={streak.longest_streak ?? 0} />
          </div>
          <div className="bg-white/[0.03] rounded-xl px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/35 mb-0.5">Niveau</p>
            <p className="text-[12px] font-semibold text-white capitalize">
              {streak.level === 'bronze' ? '🥉 Bronze'
                : streak.level === 'silver' ? '🥈 Argent'
                : streak.level === 'gold' ? '🥇 Or'
                : streak.level === 'platinum' ? '💎 Platine'
                : streak.level === 'diamond' ? '💎 Diamant'
                : `🥉 ${streak.level ?? 'Bronze'}`}
            </p>
          </div>
        </div>

        {/* ── Widget check-in ── */}
        {isCheckinConfiguredToday && pendingMoment && (
          <Link
            href={`/client/checkin/${pendingMoment}`}
            className="bg-white/[0.02] rounded-xl border-[0.3px] border-[#1f8a65]/25 p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1f8a65]/90">
                Check-in
              </p>
              <p className="text-[13px] font-semibold text-white mt-1">
                {pendingMoment === 'morning' ? 'Check-in du matin — à compléter' : 'Check-in du soir — à compléter'}
              </p>
            </div>
            <ChevronRight size={16} className="text-[#1f8a65]" />
          </Link>
        )}

        {/* ── État vide : pas de programme ── */}
        {!program && <NoProgramPage lang={lang} />}

        {/* ── Hero : Séance du jour ── */}
        {todaySession ? (
          <div className="relative rounded-2xl overflow-hidden border border-[#1f8a65]/25 shadow-[0_0_32px_rgba(31,138,101,0.12)]">
            {/* Fond accent subtil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f8a65]/10 via-[#1f8a65]/05 to-transparent" />
            <div className="absolute inset-0 bg-white/[0.015]" />

            {/* Header card */}
            <div className="relative z-10 px-5 pt-5 pb-4 border-b border-[#1f8a65]/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1f8a65] mb-1">
                    {ct(lang, 'home.session.label')}
                  </p>
                  <p className="text-[20px] font-bold text-white leading-tight">
                    {todaySession.name}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#1f8a65]/20 border border-[#1f8a65]/30 flex items-center justify-center shrink-0">
                  <Dumbbell size={20} className="text-[#1f8a65]" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 flex divide-x divide-[#1f8a65]/10">
              {durationMin && (
                <div className="flex-1 flex flex-col items-center py-4 gap-1">
                  <Clock size={13} className="text-[#1f8a65]/60" />
                  <p className="text-[15px] font-bold text-white">{durationMin}<span className="text-[10px] font-medium text-white/40">min</span></p>
                  <p className="text-[9px] text-white/30 uppercase tracking-wide">{ct(lang, 'home.session.duration')}</p>
                </div>
              )}
              <div className="flex-1 flex flex-col items-center py-4 gap-1">
                <Layers size={13} className="text-[#1f8a65]/60" />
                <p className="text-[15px] font-bold text-white">{totalSets}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-wide">{ct(lang, 'home.session.sets')}</p>
              </div>
              <div className="flex-1 flex flex-col items-center py-4 gap-1">
                <Dumbbell size={13} className="text-[#1f8a65]/60" />
                <p className="text-[15px] font-bold text-white">{todayExercises.length}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-wide">{ct(lang, 'home.session.exercises')}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="relative z-10 px-5 pb-5">
              <Link
                href={`/client/programme/session/${todaySession.id}`}
                className="flex h-12 items-center justify-between rounded-xl bg-[#1f8a65] pl-5 pr-2 transition-all hover:bg-[#217356] active:scale-[0.99] shadow-[0_4px_16px_rgba(31,138,101,0.35)]"
              >
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                  {ct(lang, 'home.session.start')}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.15]">
                  <ChevronRight size={16} className="text-white" />
                </div>
              </Link>
            </div>
          </div>
        ) : todaySessionAlreadyDone && rawTodaySession ? (
          /* Séance du jour déjà complétée */
          <div className="relative rounded-2xl overflow-hidden border border-[#1f8a65]/20">
            <div className="absolute inset-0 bg-[#1f8a65]/[0.05]" />
            <div className="relative z-10 px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1f8a65]/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-[#1f8a65]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white">Séance réalisée ✓</p>
                <p className="text-[11px] text-white/40 mt-0.5">{rawTodaySession.name}</p>
              </div>
              <Link
                href={`/client/programme/session/${rawTodaySession.id}`}
                className="shrink-0 text-[10px] font-bold text-[#1f8a65] bg-[#1f8a65]/10 px-3 py-1.5 rounded-lg hover:bg-[#1f8a65]/20 transition-colors"
              >
                Refaire
              </Link>
            </div>
          </div>
        ) : (
          /* Pas de séance aujourd'hui */
          <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-white/30" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/50">{ct(lang, 'home.rest.noSession')}</p>
              {nextSession ? (
                <p className="text-[11px] text-white/30 mt-0.5">
                  {ct(lang, 'home.rest.next')}{' '}
                  <span className="text-white/60 font-medium">
                    {daysFull[((nextSession.days_of_week?.[0] ?? nextSession.day_of_week) ?? 1) - 1]} — {nextSession.name}
                  </span>
                </p>
              ) : program ? (
                <p className="text-[11px] text-white/30 mt-0.5">{ct(lang, 'home.rest.seeProgram')}</p>
              ) : (
                <p className="text-[11px] text-white/30 mt-0.5">{ct(lang, 'home.rest.noActive')}</p>
              )}
            </div>
            {program && (
              <Link href="/client/programme" className="shrink-0 text-white/20 hover:text-white/50 transition-colors">
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        )}

        {/* ── Stats hebdo ── */}
        {plannedThisWeek > 0 && (
          <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] font-medium text-white/40">Séances cette semaine</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: plannedThisWeek }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < doneThisWeek ? 'bg-[#1f8a65]' : 'bg-white/[0.10]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[13px] font-bold text-white ml-1">
                {doneThisWeek}
                <span className="text-white/30 font-medium text-[11px]">/{plannedThisWeek}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Message du coach ── */}
        {coachNote && (
          <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className="text-[#1f8a65]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1f8a65]/80">
                {ct(lang, 'home.coachMsg.label')}
              </p>
            </div>
            {coachNote.label && (
              <p className="text-[13px] font-semibold text-white mb-1">{coachNote.label}</p>
            )}
            {coachNote.note && (
              <p className="text-[12px] text-white/55 leading-relaxed">{coachNote.note}</p>
            )}
            <p className="text-[10px] text-white/20 mt-2">
              {new Date(coachNote.created_at).toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        )}

        {/* ── Bilans en attente ── */}
        {pendingCount > 0 && (
          <Link
            href={firstPendingToken ? `/bilan/${firstPendingToken}` : '/client/bilans'}
            className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white">
                {pendingCount === 1
                  ? ct(lang, 'home.bilans.one')
                  : ct(lang, 'home.bilans.many', { n: pendingCount })}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">{ct(lang, 'home.bilans.cta')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
              <ChevronRight size={15} className="text-white/20" />
            </div>
          </Link>
        )}

      </main>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/[0.03] rounded-xl px-2 py-2 text-center">
      <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="text-[13px] font-bold text-white mt-0.5">{value}</p>
    </div>
  )
}
