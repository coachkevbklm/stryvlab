'use client'

import Link from 'next/link'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'

export type DayChecklistProps = {
  morningCheckin: boolean
  eveningCheckin: boolean
  sessionCompleted: boolean
  sessionName: string | null
  mealsLogged: number
  waterMl: number
  waterTargetMl: number
}

type ChecklistItem = {
  id: string
  label: string
  sublabel?: string
  done: boolean
  color: string
  href: string
}

export default function DayChecklist({
  morningCheckin,
  eveningCheckin,
  sessionCompleted,
  sessionName,
  mealsLogged,
  waterMl,
  waterTargetMl,
}: DayChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: 'checkin_morning',
      label: 'Check-in matin',
      done: morningCheckin,
      color: '#3b82f6',
      href: '/client/checkin/morning',
    },
    {
      id: 'session',
      label: sessionName ? `Séance — ${sessionName}` : 'Séance du jour',
      done: sessionCompleted,
      color: '#ffe01e',
      href: '/client/programme',
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      sublabel: `${mealsLogged} repas loggé${mealsLogged > 1 ? 's' : ''}`,
      done: mealsLogged >= 2,
      color: '#4ade80',
      href: '/client/nutrition',
    },
    {
      id: 'water',
      label: 'Hydratation',
      sublabel: `${(waterMl / 1000).toFixed(1)}L / ${(waterTargetMl / 1000).toFixed(1)}L`,
      done: waterTargetMl > 0 && waterMl >= waterTargetMl * 0.8,
      color: '#22d3ee',
      href: '/client/nutrition',
    },
    {
      id: 'checkin_evening',
      label: 'Check-in soir',
      done: eveningCheckin,
      color: '#a78bfa',
      href: '/client/checkin/evening',
    },
  ]

  const doneCount = items.filter(i => i.done).length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#161616' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-white/40">
          Aujourd'hui
        </span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: doneCount === items.length ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
          {doneCount}/{items.length}
        </span>
      </div>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        const inner = (
          <div
            className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/[0.02]"
            style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
          >
            {item.done
              ? <CheckCircle size={20} style={{ color: item.color, flexShrink: 0 }} />
              : <Circle size={20} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-semibold leading-tight ${item.done ? 'line-through' : 'text-white'}`}
                style={{ color: item.done ? 'rgba(255,255,255,0.3)' : 'white' }}>
                {item.label}
              </p>
              {item.sublabel && (
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.sublabel}</p>
              )}
            </div>
            {!item.done && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
          </div>
        )

        return (
          <Link key={item.id} href={item.href}>
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
