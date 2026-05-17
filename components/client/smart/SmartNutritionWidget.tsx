'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import QuickWaterModal from '../QuickWaterModal'

export type NutritionMacros = {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  water_ml: number
}

export type SmartNutritionWidgetProps = {
  consumed: NutritionMacros
  target: NutritionMacros
}

const MACROS = [
  { key: 'protein_g',  label: 'Protéines', color: '#4a90e2' },
  { key: 'carbs_g',    label: 'Glucides',  color: '#22c55e' },
  { key: 'fat_g',      label: 'Lipides',   color: '#f59e0b' },
] as const

export default function SmartNutritionWidget({ consumed, target }: SmartNutritionWidgetProps) {
  const [waterOpen, setWaterOpen] = useState(false)
  const kcalPct = target.kcal > 0 ? Math.min(1, consumed.kcal / target.kcal) : 0
  // semicircle: half-circle arc ≈ 251px at r=80
  const total = 251.2
  const offset = total * (1 - kcalPct)

  return (
    <>
      <QuickWaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
      <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px]">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white">Nutrition</span>
          <Link href="/client/nutrition/log" className="text-[10px] font-semibold text-[#ffe01e]">+ Repas</Link>
        </div>

        <div className="relative h-[120px]">
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
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className="text-[24px] font-black leading-none text-white tabular-nums">{Math.round(consumed.kcal)}</div>
            <div className="text-[10px] text-white/40 mt-1 tabular-nums">/ {target.kcal} kcal</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {MACROS.map(m => {
            const c = (consumed[m.key] as number) ?? 0
            const tg = (target[m.key] as number) ?? 0
            const pct = tg > 0 ? Math.min(100, (c / tg) * 100) : 0
            return (
              <div key={m.key}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white/55 uppercase tracking-[0.1em] font-bold">{m.label}</span>
                  <span className="text-white font-bold tabular-nums">{Math.round(c)}/{tg}g</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/55 uppercase tracking-[0.1em] font-bold">Hydratation</span>
              <span className="text-white font-bold tabular-nums">
                {(consumed.water_ml / 1000).toFixed(1)} / {(target.water_ml / 1000).toFixed(1)} L
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400"
                style={{
                  width: `${target.water_ml > 0 ? Math.min(100, (consumed.water_ml / target.water_ml) * 100) : 0}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setWaterOpen(true)}
            className="w-8 h-8 rounded-xl bg-[#ffe01e] flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  )
}
