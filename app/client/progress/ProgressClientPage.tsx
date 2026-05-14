'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Flame, Clock, Layers, ChevronRight, Trophy, TrendingUp, Zap, MessageSquare } from 'lucide-react'
import type { HeatmapDay, PREntry, SessionSummary, SessionLog } from '@/lib/client/progressTypes'
import ProgressHeatmap from './ProgressHeatmap'
import PRsPodium from './PRsPodium'
import ProgressVolumeChart from './ProgressVolumeChart'
import { useClientT } from '@/components/client/ClientI18nProvider'
import ClientTopBar from '@/components/client/ClientTopBar'

type Period = '7' | '30' | '90' | 'all'

interface CoachNote {
  id: string
  label: string | null
  note: string | null
  created_at: string
}

interface Props {
  firstName: string
  streak: number
  bestStreak: number
  heatmapData: HeatmapDay[]
  allTimePRs: PREntry[]
  sessionList: SessionSummary[]
  rawLogs: SessionLog[]
  coachNote: CoachNote | null
}

// Contextual insight based on period stats
function buildInsight(
  sessions: number,
  period: Period,
  volume: number,
  bestSessionDate: string | null,
  bestSessionVolume: number,
): string | null {
  if (sessions === 0) return null

  const periodLabel = period === 'all' ? 'au total' : `sur ${period} jours`

  if (bestSessionDate && bestSessionVolume > 0) {
    const [, m, d] = bestSessionDate.split('-')
    const vol = bestSessionVolume >= 1000
      ? `${(bestSessionVolume / 1000).toFixed(1)}t`
      : `${bestSessionVolume}kg`
    return `Meilleure séance le ${d}/${m} — ${vol} soulevés`
  }

  if (sessions >= 3 && volume > 0) {
    const avg = Math.round(volume / sessions)
    const avgLabel = avg >= 1000 ? `${(avg / 1000).toFixed(1)}t` : `${avg}kg`
    return `Moyenne de ${avgLabel} par séance ${periodLabel}`
  }

  return null
}

export default function ProgressClientPage({
  firstName,
  streak,
  bestStreak,
  heatmapData,
  allTimePRs,
  sessionList,
  rawLogs,
  coachNote,
}: Props) {
  const { t, ta } = useClientT()

  const PERIODS: { label: string; value: Period }[] = [
    { label: t('progress.period.7'), value: '7' },
    { label: t('progress.period.30'), value: '30' },
    { label: t('progress.period.90'), value: '90' },
    { label: t('progress.period.all'), value: 'all' },
  ]

  const [period, setPeriod] = useState<Period>('30')

  const filteredLogs = useMemo(() => {
    if (period === 'all') return rawLogs
    const days = parseInt(period)
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    return rawLogs.filter(l => l.logged_at.split('T')[0] >= sinceStr)
  }, [rawLogs, period])

  const filteredSessions = useMemo(() => {
    if (period === 'all') return sessionList
    const days = parseInt(period)
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    return sessionList.filter(s => s.date >= sinceStr)
  }, [sessionList, period])

  const kpis = useMemo(() => {
    const totalVolume = filteredSessions.reduce((sum, s) => sum + s.volume, 0)
    const totalSets = filteredSessions.reduce((sum, s) => sum + s.setsCompleted, 0)
    const durations = filteredSessions.filter(s => s.durationMin != null).map(s => s.durationMin!)
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    // Best session by volume
    const best = filteredSessions.reduce<SessionSummary | null>(
      (acc, s) => (!acc || s.volume > acc.volume) ? s : acc,
      null
    )

    return { sessions: filteredSessions.length, volume: totalVolume, sets: totalSets, avgDuration, best }
  }, [filteredSessions])

  const insight = useMemo(() =>
    buildInsight(kpis.sessions, period, kpis.volume, kpis.best?.date ?? null, kpis.best?.volume ?? 0),
    [kpis, period]
  )

  const timeline = useMemo(() => {
    const map: Record<string, { date: string; volume: number }> = {}
    for (const log of filteredLogs) {
      const date = log.logged_at.split('T')[0]
      if (!map[date]) map[date] = { date, volume: 0 }
      for (const s of log.client_set_logs) {
        if (s.completed) {
          map[date].volume += (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
        }
      }
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredLogs])

  const periodPRs = useMemo(() => {
    if (period === 'all') return allTimePRs
    const exerciseMap: Record<string, { max: number; prev: number; date: string; count: number }> = {}
    for (const log of filteredLogs) {
      const date = log.logged_at.split('T')[0]
      const seen = new Set<string>()
      for (const s of log.client_set_logs) {
        if (!s.completed || !s.actual_weight_kg) continue
        const w = parseFloat(String(s.actual_weight_kg))
        if (!w) continue
        const name = s.exercise_name
        if (!exerciseMap[name]) exerciseMap[name] = { max: 0, prev: 0, date, count: 0 }
        if (!seen.has(name)) { exerciseMap[name].count++; seen.add(name) }
        if (w > exerciseMap[name].max) {
          exerciseMap[name].prev = exerciseMap[name].max
          exerciseMap[name].max = w
          exerciseMap[name].date = date
        } else if (w > exerciseMap[name].prev) {
          exerciseMap[name].prev = w
        }
      }
    }
    return Object.entries(exerciseMap)
      .map(([exercise, d]) => ({
        exercise,
        maxWeight: d.max,
        prevMaxWeight: d.prev || d.max,
        achievedDate: d.date,
        sessionCount: d.count,
      }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
  }, [filteredLogs, period, allTimePRs])

  const isStreakActive = streak > 0
  const isOnFire = streak >= 7
  const isRecord = streak > 0 && streak >= bestStreak && bestStreak > 1

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <ClientTopBar
        section="Progression"
        title={firstName || 'Mes stats'}
        right={
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={[
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-150',
                  period === p.value
                    ? 'bg-[#1f8a65] text-white'
                    : 'text-white/40 hover:text-white/70',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-5 pt-[88px] pb-5 flex flex-col gap-5">

        {/* ── Section 1: Streak Hero ── */}
        {isStreakActive ? (
          // ACTIVE STREAK — visual impact
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: isOnFire
                ? 'linear-gradient(135deg, rgba(31,138,101,0.18) 0%, rgba(31,138,101,0.06) 100%)'
                : 'rgba(255,255,255,0.02)',
              border: isOnFire
                ? '0.3px solid rgba(31,138,101,0.35)'
                : '0.3px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Glow spot on fire */}
            {isOnFire && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 50% at 15% 50%, rgba(31,138,101,0.20) 0%, transparent 70%)',
                }}
              />
            )}

            <div className="relative flex items-center px-5 py-5">
              {/* Big number */}
              <div className="flex-1">
                <div className="flex items-end gap-2 mb-1">
                  <span
                    className="font-black font-mono leading-none"
                    style={{
                      fontSize: streak >= 10 ? '3.5rem' : '4rem',
                      color: isOnFire ? '#1f8a65' : 'white',
                      lineHeight: 1,
                    }}
                  >
                    {streak}
                  </span>
                  <span className="text-[1.1rem] font-semibold text-white/40 mb-2">j</span>
                  {isOnFire && (
                    <Flame size={22} className="text-[#1f8a65] mb-1.5 ml-1" />
                  )}
                </div>
                <p className="text-[11px] text-white/50">
                  {isRecord && bestStreak > 1
                    ? '🏆 Nouveau record !'
                    : isOnFire
                    ? 'Feu vert — continue comme ça'
                    : 'Jours consécutifs'}
                </p>
              </div>

              {/* Right: record */}
              <div className="text-right shrink-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-1">Record</p>
                <p className="text-[1.4rem] font-black text-white/35 font-mono leading-none">
                  {bestStreak}<span className="text-[0.8rem] font-medium ml-0.5">j</span>
                </p>
                {streak > 0 && bestStreak > 0 && (
                  <div
                    className="mt-2 h-1 rounded-full overflow-hidden"
                    style={{ width: 56, background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((streak / Math.max(bestStreak, 1)) * 100, 100)}%`,
                        background: '#1f8a65',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // NO STREAK — compact quiet pill
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
            <Zap size={14} className="text-white/20 shrink-0" />
            <p className="text-[12px] text-white/35">
              {bestStreak > 0
                ? `Record : ${bestStreak}j — fais une séance pour relancer`
                : 'Fais une séance aujourd\'hui pour lancer ton streak'}
            </p>
          </div>
        )}

        {/* ── Section 2: Heatmap ── */}
        {/* ── Card Coach ── */}
        {coachNote && (
          <div className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className="text-[#1f8a65]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1f8a65]/80">
                Message de ton coach
              </p>
            </div>
            {coachNote.label && (
              <p className="text-[13px] font-semibold text-white mb-1">{coachNote.label}</p>
            )}
            {coachNote.note && (
              <p className="text-[12px] text-white/55 leading-relaxed">{coachNote.note}</p>
            )}
            <p className="text-[10px] text-white/20 mt-2">
              {new Date(coachNote.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
            Activité — 12 semaines
          </p>
          <ProgressHeatmap data={heatmapData} />
        </div>

        {/* ── Section 3: KPIs + insight — only if data exists ── */}
        {kpis.sessions > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
              Résumé de la période
            </p>
            <div className="grid grid-cols-2 gap-2">
              <KpiCard
                label={t('progress.kpi.sessions')}
                value={kpis.sessions}
                sub={period === 'all' ? 'au total' : `sur ${period} jours`}
                accent={kpis.sessions >= 12}
              />
              <KpiCard
                label={t('progress.kpi.sets')}
                value={kpis.sets}
                sub={`${t('progress.history.setsLabel')} complétés`}
                accent={false}
              />
              <KpiCard
                label={t('progress.kpi.volume')}
                value={kpis.volume >= 1000
                  ? `${(kpis.volume / 1000).toFixed(1)}t`
                  : `${kpis.volume}kg`}
                sub="kg soulevés"
                accent={false}
              />
              <KpiCard
                label={t('progress.kpi.avgDuration')}
                value={kpis.avgDuration ? `${kpis.avgDuration}min` : '—'}
                sub="par séance"
                accent={false}
              />
            </div>

            {/* Micro-insight */}
            {insight && (
              <div className="mt-2 flex items-center gap-2.5 bg-[#1f8a65]/[0.07] border border-[#1f8a65]/[0.15] rounded-xl px-4 py-3">
                <TrendingUp size={13} className="text-[#1f8a65] shrink-0" />
                <p className="text-[11px] text-white/60">{insight}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Section 4: PRs Podium ── */}
        {periodPRs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
              {t('progress.prs.title')}
            </p>
            <PRsPodium prs={periodPRs} />
          </div>
        )}

        {/* ── Section 5: Volume Chart ── */}
        {timeline.length >= 2 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
              Volume par séance
            </p>
            <ProgressVolumeChart timeline={timeline} />
          </div>
        )}

        {/* ── Section 6: Historique ── */}
        {filteredSessions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
              {t('progress.history.title')}
            </p>
            <div className="flex flex-col gap-2">
              {filteredSessions.map(session => {
                const [, m, d] = session.date.split('-')
                const dateLabel = `${d}/${m}`
                return (
                  <Link
                    key={session.id}
                    href={`/client/programme/recap/${session.id}`}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.04] active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center w-9 shrink-0">
                        <p className="text-[12px] font-black text-white/50 font-mono">{dateLabel}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-semibold text-white/80 truncate">{session.name}</p>
                          {session.hasPR && (
                            <span className="shrink-0 flex items-center gap-1 bg-[#1f8a65]/15 text-[#1f8a65] text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md">
                              <Trophy size={8} />PR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] text-white/30">
                            <Layers size={9} />{session.setsCompleted} {t('progress.history.setsLabel')}
                          </span>
                          {session.durationMin && (
                            <span className="flex items-center gap-1 text-[10px] text-white/30">
                              <Clock size={9} />{session.durationMin}min
                            </span>
                          )}
                          {session.volume > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/30">
                              <TrendingUp size={9} />
                              {session.volume >= 1000
                                ? `${(session.volume / 1000).toFixed(1)}t`
                                : `${session.volume}kg`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 shrink-0 ml-2" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {filteredSessions.length === 0 && (
          <p className="text-center text-[12px] text-white/20 py-6">
            {period === 'all'
              ? 'Logue ta première séance pour voir ta progression ici.'
              : t('progress.history.noSessions')}
          </p>
        )}

      </main>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub: string
  accent: boolean
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1.5">{label}</p>
      <p className={[
        'text-[1.5rem] font-black leading-none font-mono',
        accent ? 'text-[#1f8a65]' : 'text-white',
      ].join(' ')}>
        {value}
      </p>
      <p className="text-[10px] text-white/25 mt-1.5">{sub}</p>
    </div>
  )
}
