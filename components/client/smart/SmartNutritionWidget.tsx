'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import QuickWaterModal from '../QuickWaterModal'
import { useClientT } from '@/components/client/ClientI18nProvider'

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
  proteinStreakDays?: number
}

export default function SmartNutritionWidget({ consumed, target, proteinStreakDays }: SmartNutritionWidgetProps) {
  const { t } = useClientT()
  const MACROS = [
    { key: 'protein_g' as const, label: t('smart.nutrition.protein'), color: 'var(--data-copper)' },
    { key: 'carbs_g'   as const, label: t('smart.nutrition.carbs'),   color: 'var(--data-gold)' },
    { key: 'fat_g'     as const, label: t('smart.nutrition.fat'),     color: 'var(--data-petrol)' },
  ]
  const [waterOpen, setWaterOpen] = useState(false)
  const [waterDelta, setWaterDelta] = useState(0)
  const effectiveWaterMl = consumed.water_ml + waterDelta

  const kcalPct = target.kcal > 0 ? Math.min(1, consumed.kcal / target.kcal) : 0
  const r = 80
  const arcTotal = Math.PI * r
  const arcOffset = arcTotal * (1 - kcalPct)

  return (
    <>
      <QuickWaterModal
        open={waterOpen}
        onClose={() => setWaterOpen(false)}
        onLogged={ml => setWaterDelta(d => d + ml)}
      />
      <Link
        href="/client/nutrition"
        className="block bg-[#111111] rounded-2xl p-5 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white/30">Nutrition</span>
          <span className="text-[10px] font-semibold text-[#f2f2f2]">→</span>
        </div>

        {/* Arc demi-cercle */}
        <div className="relative" style={{ height: 110 }}>
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <defs>
              <linearGradient id="arcGradWidget" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="var(--data-copper)" />
                <stop offset="50%"  stopColor="var(--data-gold)" />
                <stop offset="100%" stopColor="var(--data-petrol)" />
              </linearGradient>
            </defs>
            <path
              d={`M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100`}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={12}
              strokeLinecap="round"
            />
            <path
              d={`M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100`}
              fill="none"
              stroke="url(#arcGradWidget)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={arcTotal}
              strokeDashoffset={arcOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <div className="font-black leading-none text-white tabular-nums text-[28px]">
              {Math.round(consumed.kcal)}
            </div>
            <div className="text-[10px] text-white/40 tabular-nums">/ {target.kcal} kcal</div>
          </div>
        </div>

        {/* Barres macros */}
        <div className="flex flex-col gap-2 mt-3">
          {MACROS.map(m => {
            const c = (consumed[m.key] as number) ?? 0
            const tg = (target[m.key] as number) ?? 0
            const pct = tg > 0 ? Math.min(100, (c / tg) * 100) : 0
            return (
              <div key={m.key}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white/50 uppercase tracking-[0.1em] font-bold">{m.label}</span>
                  <span className="text-white font-bold tabular-nums">{Math.round(c)}/{tg}g</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Eau */}
        <div className="flex items-center gap-3 mt-4 pt-3">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/50 uppercase tracking-[0.1em] font-bold">Hydratation</span>
              <span className="text-white font-bold tabular-nums">
                {(effectiveWaterMl / 1000).toFixed(1)} / {(target.water_ml / 1000).toFixed(1)} L
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: 'var(--data-steel)',
                  width: `${target.water_ml > 0 ? Math.min(100, (effectiveWaterMl / target.water_ml) * 100) : 0}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
          <button
            onClick={e => { e.preventDefault(); setWaterOpen(true) }}
            className="w-9 h-9 rounded-xl bg-[#f2f2f2] flex items-center justify-center text-[#080808] active:scale-95 transition-transform shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Régularité protéines */}
        {proteinStreakDays !== undefined && target.protein_g > 0 && (
          <div className="mt-3 pt-3">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-white/40 uppercase tracking-[0.1em] font-bold">{t('nutrition.consistency')}</span>
              <span className="text-white/60 tabular-nums font-bold">{proteinStreakDays}/7j</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f2f2f2]"
                style={{ width: `${(proteinStreakDays / 7) * 100}%`, transition: 'width 0.6s ease' }}
              />
            </div>
          </div>
        )}
      </Link>
    </>
  )
}
