'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { NutritionMacros } from './SmartNutritionWidget'

type Props = {
  date: string
  consumed: NutritionMacros
  target: NutritionMacros
}

function shiftDate(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function formatNav(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(iso + 'T00:00:00'))
}

export default function SmartNutritionHero({ date, consumed, target }: Props) {
  const pct = target.kcal > 0 ? Math.min(1, consumed.kcal / target.kcal) : 0
  const total = 251.2
  const offset = total * (1 - pct)
  const prev = shiftDate(date, -1)
  const next = shiftDate(date, 1)

  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px]">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/client/nutrition?date=${prev}`} className="flex items-center gap-1 text-white/60 text-[11px]">
          <ChevronLeft size={14} /> {formatNav(prev)}
        </Link>
        <span className="text-[18px] font-black tracking-[-0.02em] text-white">{formatNav(date)}</span>
        <Link href={`/client/nutrition?date=${next}`} className="flex items-center gap-1 text-white/60 text-[11px]">
          {formatNav(next)} <ChevronRight size={14} />
        </Link>
      </div>

      <div className="relative h-[180px]">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#ffe01e"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={total}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="text-[32px] font-black leading-none text-white tabular-nums">{Math.round(consumed.kcal)}</div>
          <div className="text-[11px] text-white/40 mt-1 tabular-nums">/ {target.kcal} kcal</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        {([
          { key: 'protein_g', label: 'P', color: '#4a90e2' },
          { key: 'carbs_g',   label: 'G', color: '#22c55e' },
          { key: 'fat_g',     label: 'L', color: '#f59e0b' },
        ] as const).map(m => {
          const c = (consumed as any)[m.key] ?? 0
          const tg = (target as any)[m.key] ?? 0
          const w = tg > 0 ? Math.min(100, (c / tg) * 100) : 0
          return (
            <div key={m.key} className="text-center">
              <div className="text-[20px] font-black text-white tabular-nums">
                {Math.round(c)}<span className="text-[12px] text-white/40">/{tg}g</span>
              </div>
              <div className="text-[9px] text-white/55 uppercase font-bold tracking-[0.1em] mt-1">{m.label}</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
                <div className="h-full" style={{ width: `${w}%`, background: m.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
