'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AgendaEventCard, { type AgendaEvent } from './AgendaEventCard'
import { Skeleton } from '@/components/ui/skeleton'

function dateIso(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatDayHeader(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function MacroProgressBar({
  label, consumed, target, color,
}: {
  label: string; consumed: number; target: number; color: string
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-4">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/50 w-16 text-right">
        {Math.round(consumed)}/{Math.round(target)}g
      </span>
    </div>
  )
}

type Progress = {
  consumed: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
  target: { calories: number; protein_g: number; carbs_g: number; fat_g: number } | null
  hasProtocol: boolean
}

export default function AgendaDayView({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate)
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress | null>(null)

  const loadDay = useCallback(async (d: string) => {
    setLoading(true)
    const [evRes, prRes] = await Promise.all([
      fetch(`/api/client/agenda?date=${d}`),
      fetch('/api/client/nutrition/today-progress'),
    ])
    const evData = await evRes.json()
    const prData = await prRes.json()
    setEvents(evData.data ?? [])
    setProgress(prData)
    setLoading(false)
  }, [])

  useEffect(() => { loadDay(date) }, [date, loadDay])

  // Poll pending meals every 3s
  useEffect(() => {
    const hasPending = events.some(e => e.event_type === 'meal' && e.ai_status === 'pending')
    if (!hasPending) return
    const timer = setTimeout(() => loadDay(date), 3000)
    return () => clearTimeout(timer)
  }, [events, date, loadDay])

  const today = dateIso(new Date())
  const isToday = date === today

  function prevDay() {
    const d = new Date(`${date}T12:00:00Z`)
    d.setDate(d.getDate() - 1)
    setDate(dateIso(d))
  }

  function nextDay() {
    const d = new Date(`${date}T12:00:00Z`)
    d.setDate(d.getDate() + 1)
    setDate(dateIso(d))
  }

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevDay}
          className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-colors active:scale-[0.95]"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-white capitalize">{formatDayHeader(date)}</p>
          {isToday && <p className="text-[10px] text-[#1f8a65] font-medium">Aujourd'hui</p>}
        </div>
        <button
          onClick={nextDay}
          disabled={isToday}
          className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-colors active:scale-[0.95] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Macro progress (today + protocol active) */}
      {isToday && progress?.hasProtocol && progress.target && (
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl px-4 py-3 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 mb-2">
            Macros du jour
          </p>
          <MacroProgressBar label="P" consumed={progress.consumed.protein_g} target={progress.target.protein_g} color="bg-blue-500" />
          <MacroProgressBar label="G" consumed={progress.consumed.carbs_g} target={progress.target.carbs_g} color="bg-amber-500" />
          <MacroProgressBar label="L" consumed={progress.consumed.fat_g} target={progress.target.fat_g} color="bg-red-400" />
          <div className="flex justify-between pt-1">
            <span className="text-[10px] text-white/35">Calories consommées</span>
            <span className="text-[11px] font-semibold text-white/70">
              {Math.round(progress.consumed.calories)} / {progress.target.calories} kcal
            </span>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-start bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl px-3.5 py-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-8 flex flex-col items-center text-center gap-2">
          <p className="text-[13px] font-medium text-white/30">Aucun événement ce jour</p>
          <p className="text-[11px] text-white/20">Ajoute un repas ou un check-in via le bouton +</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <AgendaEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
