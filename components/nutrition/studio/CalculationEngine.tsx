'use client'

import { AlertTriangle, CheckCircle2, Info, Droplets } from 'lucide-react'
import TdeeWaterfall from './TdeeWaterfall'
import type { MacroResult, MacroGoal } from '@/lib/formulas/macros'
import type { CarbCyclingResult, CarbCycleProtocol, CarbCycleGoal, CarbCycleIntensity, CarbCyclePhase, CarbCycleInsulin } from '@/lib/formulas/carbCycling'
import type { HydrationClimate } from '@/lib/formulas/hydration'
import type { CarbCyclingConfig } from './useNutritionStudio'

interface Props {
  goal: MacroGoal
  onGoalChange: (g: MacroGoal) => void
  calorieAdjustPct: number
  onCalorieAdjustChange: (v: number) => void
  proteinOverride: number | null
  onProteinOverrideChange: (v: number | null) => void
  macroResult: MacroResult | null
  carbCycling: CarbCyclingConfig
  onCarbCyclingChange: (patch: Partial<CarbCyclingConfig>) => void
  ccResult: CarbCyclingResult | null
  hydrationClimate: HydrationClimate
  onHydrationClimateChange: (c: HydrationClimate) => void
  hydrationLiters: number | null
  leanMass: number | null
}

const GOAL_OPTIONS: { value: MacroGoal; label: string }[] = [
  { value: 'deficit',     label: 'Déficit — Perte de gras' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'surplus',     label: 'Surplus — Prise de muscle' },
]

const CC_PROTOCOLS: { value: CarbCycleProtocol; label: string }[] = [
  { value: '2/1', label: '2 hauts / 1 bas' },
  { value: '3/1', label: '3 hauts / 1 bas' },
  { value: '4/1', label: '4 hauts / 1 bas' },
  { value: '5/2', label: '5 hauts / 2 bas' },
]

const CC_GOALS: { value: CarbCycleGoal; label: string }[] = [
  { value: 'moderate',    label: 'Perte modérée' },
  { value: 'recomp',      label: 'Recomposition' },
  { value: 'bulk',        label: 'Prise de masse' },
  { value: 'performance', label: 'Performance' },
]

const CLIMATE_OPTIONS: { value: HydrationClimate; label: string }[] = [
  { value: 'cold',      label: '❄️ Froid' },
  { value: 'temperate', label: '🌤 Tempéré' },
  { value: 'hot',       label: '☀️ Chaud' },
  { value: 'veryHot',   label: '🔥 Très chaud' },
]

const PRIORITY_ICON = {
  critical: <AlertTriangle size={11} className="text-red-400 shrink-0" />,
  high:     <AlertTriangle size={11} className="text-amber-400 shrink-0" />,
  medium:   <Info size={11} className="text-blue-400 shrink-0" />,
  low:      <CheckCircle2 size={11} className="text-white/30 shrink-0" />,
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function SelectInput<T extends string>({ value, options, onChange, className = '' }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className={`rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-1 text-[11px] text-white/80 outline-none focus:border-[#1f8a65]/40 ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-[#181818]">{o.label}</option>
      ))}
    </select>
  )
}

export default function CalculationEngine({
  goal, onGoalChange,
  calorieAdjustPct, onCalorieAdjustChange,
  proteinOverride, onProteinOverrideChange,
  macroResult,
  carbCycling, onCarbCyclingChange,
  ccResult,
  hydrationClimate, onHydrationClimateChange,
  hydrationLiters,
  leanMass,
}: Props) {

  const actionableSuggestions = (macroResult?.smartProtocol ?? [])
    .filter(s => ['critical', 'high'].includes(s.priority))
    .slice(0, 3)

  return (
    <div className="h-full overflow-y-auto scrollbar-hide space-y-5 p-4 pb-8">

      {/* ── DÉPENSE ÉNERGÉTIQUE ───────────────────────────────────────── */}
      <div>
        <SectionDivider label="Dépense énergétique" />
        {macroResult ? (
          <TdeeWaterfall result={macroResult} />
        ) : (
          <div className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
        )}
      </div>

      {/* ── OBJECTIF ─────────────────────────────────────────────────── */}
      <div>
        <SectionDivider label="Objectif" />
        <div className="flex gap-1.5 flex-wrap">
          {GOAL_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onGoalChange(o.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                goal === o.value
                  ? 'bg-[#1f8a65]/15 text-[#1f8a65] border-[0.3px] border-[#1f8a65]/30'
                  : 'bg-white/[0.04] text-white/50 border-[0.3px] border-white/[0.06] hover:text-white/70'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {macroResult && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40">Ajustement calorique</span>
              <span className="text-[11px] font-mono text-white/70">
                {calorieAdjustPct > 0 ? '+' : ''}{calorieAdjustPct}%
              </span>
            </div>
            <input
              type="range" min={-30} max={30} step={1}
              value={calorieAdjustPct}
              onChange={e => onCalorieAdjustChange(Number(e.target.value))}
              className="w-full h-1 accent-[#1f8a65] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/25">
              <span>-30%</span><span>0</span><span>+30%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── MACROS ───────────────────────────────────────────────────── */}
      <div>
        <SectionDivider label="Macronutriments" />
        {macroResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
              <span className="text-[11px] text-white/50">Calories cibles</span>
              <span className="text-[16px] font-bold text-white">{macroResult.calories} <span className="text-[11px] font-normal text-white/40">kcal</span></span>
            </div>

            {/* Protein */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[11px] text-white/70">Protéines</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/35">
                    {leanMass ? (macroResult.macros.p / leanMass).toFixed(1) : '—'}g/kg LBM
                  </span>
                  <span className="text-[13px] font-semibold text-white">{macroResult.macros.p}g</span>
                </div>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${macroResult.percents.p}%` }} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-white/30">Override g/kg LBM</span>
                <input
                  type="number" step="0.1" min={1.5} max={4}
                  value={proteinOverride ?? ''}
                  placeholder="auto"
                  onChange={e => onProteinOverrideChange(e.target.value ? Number(e.target.value) : null)}
                  className="w-16 rounded-md bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-0.5 text-[10px] text-white/70 text-right outline-none placeholder:text-white/20 focus:border-[#1f8a65]/40"
                />
                {proteinOverride && (
                  <button onClick={() => onProteinOverrideChange(null)} className="text-[9px] text-white/30 hover:text-white/60">
                    reset
                  </button>
                )}
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-white/70">Lipides</span>
                </div>
                <span className="text-[13px] font-semibold text-white">{macroResult.macros.f}g</span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${macroResult.percents.f}%` }} />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1f8a65]" />
                  <span className="text-[11px] text-white/70">Glucides</span>
                </div>
                <span className="text-[13px] font-semibold text-white">{macroResult.macros.c}g</span>
              </div>
              <div className="h-[3px] w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-[#1f8a65] transition-all duration-300" style={{ width: `${macroResult.percents.c}%` }} />
              </div>
              <p className="text-[9px] text-white/25 mt-0.5">↳ glucides recalculés automatiquement</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-6 rounded bg-white/[0.04] animate-pulse" />)}
          </div>
        )}
      </div>

      {/* ── CARB CYCLING ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SectionDivider label="Carb Cycling" />
          <button
            onClick={() => onCarbCyclingChange({ enabled: !carbCycling.enabled })}
            title="Alterne entre des jours hauts (glucides élevés) et bas (glucides réduits) selon le plan d'entraînement"
            className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold border-[0.3px] transition-all cursor-help ${
              carbCycling.enabled
                ? 'bg-[#1f8a65]/15 text-[#1f8a65] border-[#1f8a65]/30'
                : 'bg-white/[0.04] text-white/30 border-white/[0.06]'
            }`}
          >
            {carbCycling.enabled ? '● ON' : '○ OFF'}
          </button>
        </div>

        {carbCycling.enabled && (
          <div className="space-y-2">
            <p className="text-[9px] text-white/40 leading-relaxed">
              Alterne automatiquement entre jours hauts (séances) et bas (repos) pour optimiser la partition des macros.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-white/35 mb-1">Protocole</p>
                <SelectInput<CarbCycleProtocol>
                  value={carbCycling.protocol}
                  options={CC_PROTOCOLS}
                  onChange={v => onCarbCyclingChange({ protocol: v })}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-[9px] text-white/35 mb-1">Objectif</p>
                <SelectInput<CarbCycleGoal>
                  value={carbCycling.goal}
                  options={CC_GOALS}
                  onChange={v => onCarbCyclingChange({ goal: v })}
                  className="w-full"
                />
              </div>
            </div>

            {ccResult && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-xl bg-[#1f8a65]/[0.08] border-[0.3px] border-[#1f8a65]/20 p-3">
                  <p className="text-[9px] text-[#1f8a65] font-semibold mb-1">🔥 JOUR HAUT</p>
                  <p className="text-[14px] font-bold text-white">{ccResult.high.kcal} <span className="text-[10px] font-normal text-white/40">kcal</span></p>
                  <p className="text-[10px] text-white/50 mt-0.5">P{ccResult.high.p} · L{ccResult.high.f} · G{ccResult.high.c}</p>
                </div>
                <div className="rounded-xl bg-blue-500/[0.08] border-[0.3px] border-blue-500/20 p-3">
                  <p className="text-[9px] text-blue-400 font-semibold mb-1">🧊 JOUR BAS</p>
                  <p className="text-[14px] font-bold text-white">{ccResult.low.kcal} <span className="text-[10px] font-normal text-white/40">kcal</span></p>
                  <p className="text-[10px] text-white/50 mt-0.5">P{ccResult.low.p} · L{ccResult.low.f} · G{ccResult.low.c}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── HYDRATATION ──────────────────────────────────────────────── */}
      <div>
        <SectionDivider label="Hydratation" />
        <div className="flex items-center gap-2 mb-2">
          <SelectInput<HydrationClimate>
            value={hydrationClimate}
            options={CLIMATE_OPTIONS}
            onChange={onHydrationClimateChange}
          />
        </div>
        {hydrationLiters && (
          <div className="flex items-center gap-3">
            <Droplets size={14} className="text-blue-400 shrink-0" />
            <span className="text-[15px] font-bold text-white">{hydrationLiters.toFixed(1)} L</span>
            <span className="text-[10px] text-white/40">{Math.round(hydrationLiters * 4)} verres · EFSA 2010 ✓</span>
          </div>
        )}
      </div>

      {/* ── SMART ALERTS ─────────────────────────────────────────────── */}
      {actionableSuggestions.length > 0 && (
        <div>
          <SectionDivider label="Smart Alerts" />
          <div className="space-y-2">
            {actionableSuggestions.map(s => (
              <div
                key={s.id}
                className={`rounded-xl p-3 border-[0.3px] ${
                  s.priority === 'critical' ? 'bg-red-500/[0.08] border-red-500/20' : 'bg-amber-500/[0.08] border-amber-500/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {PRIORITY_ICON[s.priority as keyof typeof PRIORITY_ICON]}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/85 leading-snug">{s.title}</p>
                    <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{s.rationale}</p>
                    {s.source && (
                      <p className="text-[9px] text-white/25 mt-0.5 italic">{s.source}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
