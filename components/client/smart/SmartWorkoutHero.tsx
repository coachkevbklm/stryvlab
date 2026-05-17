'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

type Props = {
  date: string
  state: 'scheduled' | 'completed' | 'rest'
  sessionName?: string
  sessionLogHref?: string
  recapHref?: string
  exerciseCount?: number
  estimatedMinutes?: number
  performanceSummary?: string
}

function shiftDate(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function fmt(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(iso + 'T00:00:00'))
}

export default function SmartWorkoutHero(p: Props) {
  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-4">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/client/programme?date=${shiftDate(p.date, -1)}`} className="flex items-center gap-1 text-white/60 text-[11px]">
          <ChevronLeft size={14} /> {fmt(shiftDate(p.date, -1))}
        </Link>
        <span className="text-[18px] font-black tracking-[-0.02em] text-white">{fmt(p.date)}</span>
        <Link href={`/client/programme?date=${shiftDate(p.date, 1)}`} className="flex items-center gap-1 text-white/60 text-[11px]">
          {fmt(shiftDate(p.date, 1))} <ChevronRight size={14} />
        </Link>
      </div>

      {p.state === 'scheduled' && p.sessionName && (
        <>
          <div className="text-[20px] font-black tracking-[-0.02em] text-white">{p.sessionName}</div>
          <div className="text-[11px] text-white/50 mt-1">{p.exerciseCount} exercices · ~{p.estimatedMinutes} min</div>
          {p.sessionLogHref && (
            <Link
              href={p.sessionLogHref}
              className="mt-3 flex w-full items-center justify-center h-11 rounded-xl bg-[#ffe01e] text-[#0d0d0d] text-[11px] font-black uppercase tracking-[0.1em]"
            >
              Démarrer →
            </Link>
          )}
        </>
      )}

      {p.state === 'completed' && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-white font-semibold">Séance terminée</div>
            <div className="text-[10px] text-white/40">{p.performanceSummary}</div>
          </div>
          {p.recapHref && <Link href={p.recapHref} className="text-[11px] text-[#ffe01e]">Voir →</Link>}
        </div>
      )}

      {p.state === 'rest' && (
        <p className="text-[12px] text-white/55">Jour de repos.</p>
      )}
    </div>
  )
}
