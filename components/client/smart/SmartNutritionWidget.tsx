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
  /** compact=true: arc réduit, barres compressées — pour la grille 2 colonnes home */
  compact?: boolean
}

const MACROS = [
  { key: 'protein_g',  label: 'P', color: '#4a90e2' },
  { key: 'carbs_g',    label: 'G', color: '#22c55e' },
  { key: 'fat_g',      label: 'L', color: '#f59e0b' },
] as const

export default function SmartNutritionWidget({ consumed, target, compact = false }: SmartNutritionWidgetProps) {
  const [waterOpen, setWaterOpen] = useState(false)
  const kcalPct = target.kcal > 0 ? Math.min(1, consumed.kcal / target.kcal) : 0
  // semicircle arc length ≈ π × r
  const r = compact ? 52 : 80
  const arcTotal = Math.PI * r
  const arcOffset = arcTotal * (1 - kcalPct)
  const cx = compact ? 70 : 100
  const cy = compact ? 68 : 100
  const vw = compact ? 140 : 200
  const vh = compact ? 75 : 110

  return (
    <>
      <QuickWaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
      <Link
        href="/client/nutrition"
        className="block bg-[#161616] rounded-2xl border border-white/[0.08] p-[14px] active:scale-[0.99] transition-transform"
      >
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white">Nutrition</span>
          <span className="text-[10px] font-semibold text-[#ffe01e]">→</span>
        </div>

        {/* Arc demi-cercle */}
        <div className="relative" style={{ height: compact ? 72 : 120 }}>
          <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full">
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={compact ? 9 : 12}
              strokeLinecap="round"
            />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="#ffe01e"
              strokeWidth={compact ? 9 : 12}
              strokeLinecap="round"
              strokeDasharray={arcTotal}
              strokeDashoffset={arcOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <div className={`font-black leading-none text-white tabular-nums ${compact ? 'text-[18px]' : 'text-[24px]'}`}>
              {Math.round(consumed.kcal)}
            </div>
            <div className="text-[9px] text-white/40 tabular-nums">/ {target.kcal}</div>
          </div>
        </div>

        {/* Barres macros */}
        <div className={`flex flex-col ${compact ? 'gap-1.5 mt-1' : 'gap-2 mt-2'}`}>
          {MACROS.map(m => {
            const c = (consumed[m.key] as number) ?? 0
            const tg = (target[m.key] as number) ?? 0
            const pct = tg > 0 ? Math.min(100, (c / tg) * 100) : 0
            return (
              <div key={m.key}>
                {!compact && (
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white/55 uppercase tracking-[0.1em] font-bold">{m.label === 'P' ? 'Protéines' : m.label === 'G' ? 'Glucides' : 'Lipides'}</span>
                    <span className="text-white font-bold tabular-nums">{Math.round(c)}/{tg}g</span>
                  </div>
                )}
                {compact && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-white/40 w-3 shrink-0">{m.label}</span>
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.4s ease' }} />
                    </div>
                    <span className="text-[9px] text-white/40 tabular-nums w-6 text-right shrink-0">{Math.round(c)}g</span>
                  </div>
                )}
                {!compact && (
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.4s ease' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Eau */}
        <div className={`flex items-center gap-2 ${compact ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-white/[0.06]`}>
          <div className="flex-1">
            {!compact && (
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/55 uppercase tracking-[0.1em] font-bold">Hydratation</span>
                <span className="text-white font-bold tabular-nums">
                  {(consumed.water_ml / 1000).toFixed(1)} / {(target.water_ml / 1000).toFixed(1)} L
                </span>
              </div>
            )}
            {compact && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-white/40 shrink-0">💧</span>
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{
                      width: `${target.water_ml > 0 ? Math.min(100, (consumed.water_ml / target.water_ml) * 100) : 0}%`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span className="text-[9px] text-white/40 tabular-nums shrink-0">{(consumed.water_ml / 1000).toFixed(1)}L</span>
              </div>
            )}
            {!compact && (
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{
                    width: `${target.water_ml > 0 ? Math.min(100, (consumed.water_ml / target.water_ml) * 100) : 0}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); setWaterOpen(true) }}
            className={`rounded-xl bg-[#ffe01e] flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
          >
            <Plus size={compact ? 13 : 16} strokeWidth={2.5} />
          </button>
        </div>
      </Link>
    </>
  )
}
