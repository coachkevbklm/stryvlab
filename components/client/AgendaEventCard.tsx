'use client'

import { Utensils, Sun, Moon, Dumbbell, ClipboardList, Loader } from 'lucide-react'

export type AgendaEvent = {
  id: string
  event_type: 'meal' | 'checkin' | 'session' | 'assessment'
  event_date: string
  event_time: string | null
  source_id: string | null
  title: string | null
  summary: string | null
  data: Record<string, number> | null
  ai_status?: 'pending' | 'done' | 'failed'
}

const TYPE_CONFIG = {
  meal: {
    icon: Utensils,
    color: 'text-[#1f8a65]',
    bg: 'bg-[#1f8a65]/[0.08]',
    label: 'Repas',
  },
  checkin: {
    icon: Sun,
    color: 'text-blue-400',
    bg: 'bg-blue-500/[0.08]',
    label: 'Check-in',
  },
  session: {
    icon: Dumbbell,
    color: 'text-amber-400',
    bg: 'bg-amber-500/[0.08]',
    label: 'Séance',
  },
  assessment: {
    icon: ClipboardList,
    color: 'text-white/50',
    bg: 'bg-white/[0.04]',
    label: 'Bilan',
  },
}

function MacroLine({ data }: { data: Record<string, number> | null }) {
  if (!data) return null
  const { protein_g, carbs_g, fats_g, calories_kcal } = data
  if (!calories_kcal) return null
  return (
    <div className="flex gap-3 mt-1.5 flex-wrap">
      <span className="text-[11px] font-semibold text-white/70">{Math.round(calories_kcal)} kcal</span>
      {protein_g != null && (
        <span className="text-[10px] text-white/40">P <span className="text-white/60 font-medium">{Math.round(protein_g)}g</span></span>
      )}
      {carbs_g != null && (
        <span className="text-[10px] text-white/40">G <span className="text-white/60 font-medium">{Math.round(carbs_g)}g</span></span>
      )}
      {fats_g != null && (
        <span className="text-[10px] text-white/40">L <span className="text-white/60 font-medium">{Math.round(fats_g)}g</span></span>
      )}
    </div>
  )
}

export default function AgendaEventCard({ event }: { event: AgendaEvent }) {
  const cfg = TYPE_CONFIG[event.event_type]

  const isMorningCheckin = event.event_type === 'checkin' && event.title?.toLowerCase().includes('matin')
  const CheckinIcon = isMorningCheckin ? Sun : Moon
  const Icon = event.event_type === 'checkin' ? CheckinIcon : cfg.icon

  const isPending = event.event_type === 'meal' && event.ai_status === 'pending'

  return (
    <div className="flex gap-3 items-start bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl px-3.5 py-3">
      <div className={`mt-0.5 h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
        <Icon size={15} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-white truncate">{event.title ?? cfg.label}</p>
          {event.event_time && (
            <span className="text-[10px] text-white/30 shrink-0">{event.event_time.slice(0, 5)}</span>
          )}
        </div>
        {isPending ? (
          <div className="flex items-center gap-1.5 mt-1">
            <Loader size={11} className="text-white/30 animate-spin" />
            <span className="text-[11px] text-white/30">Analyse en cours...</span>
          </div>
        ) : (
          <>
            {event.summary && !event.data && (
              <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{event.summary}</p>
            )}
            <MacroLine data={event.data} />
          </>
        )}
      </div>
    </div>
  )
}
