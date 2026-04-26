'use client'

import { useState } from 'react'
import { Pencil, AlertTriangle, Moon } from 'lucide-react'
import type { NutritionClientData } from '@/lib/nutrition/types'
import type { TrainingConfig, LifestyleConfig } from './useNutritionStudio'

interface Props {
  clientData: NutritionClientData | null
  loading: boolean
  trainingConfig: TrainingConfig
  lifestyleConfig: LifestyleConfig
  onTrainingChange: (patch: Partial<TrainingConfig>) => void
  onLifestyleChange: (patch: Partial<LifestyleConfig>) => void
  macroResult: { leanMass: number; estimatedBF: number; breakdown: { bmr: number } } | null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">
      {children}
    </p>
  )
}

function DataRow({ label, value, unit, source, warning }: {
  label: string; value: string | number | null; unit?: string; source?: string; warning?: boolean
}) {
  if (value == null) return null
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-white/50">{label}</span>
      <div className="flex items-center gap-1.5">
        {warning && <AlertTriangle size={10} className="text-amber-400" />}
        <span className={`text-[12px] font-medium ${warning ? 'text-amber-400' : 'text-white/85'}`}>
          {value}{unit ? ` ${unit}` : ''}
        </span>
        {source && <span className="text-[9px] text-white/25">{source}</span>}
      </div>
    </div>
  )
}

function NumberInput({ label, value, unit, onChange, min = 0, max = 999 }: {
  label: string; value: number | null; unit?: string
  onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-white/50">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="w-16 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-0.5 text-[12px] text-white text-right outline-none focus:border-[#1f8a65]/40"
        />
        {unit && <span className="text-[10px] text-white/35 w-6">{unit}</span>}
      </div>
    </div>
  )
}

export default function ClientIntelligencePanel({
  clientData, loading, trainingConfig, lifestyleConfig,
  onTrainingChange, onLifestyleChange, macroResult,
}: Props) {
  const [trainingOpen, setTrainingOpen] = useState(true)
  const [lifestyleOpen, setLifestyleOpen] = useState(true)

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!clientData) return null

  const cd = clientData
  const bfPct = cd.body_fat_pct ?? macroResult?.estimatedBF
  const lbm = cd.lean_mass_kg ?? macroResult?.leanMass
  const bmr = cd.bmr_kcal_measured ?? macroResult?.breakdown.bmr
  const bmrSource = cd.bmr_kcal_measured ? '● balance' : '◐ estimé'
  const sleepWarning = (lifestyleConfig.sleepDurationH ?? 8) < 7

  return (
    <div className="h-full overflow-y-auto scrollbar-hide space-y-5 p-4 pb-8">

      {/* Client header */}
      <div>
        <p className="text-[13px] font-semibold text-white leading-tight">{cd.name}</p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {cd.gender === 'female' ? 'Femme' : 'Homme'} · {cd.age} ans
        </p>
      </div>

      {/* Composition */}
      <div>
        <SectionLabel>Composition</SectionLabel>
        <DataRow label="Poids" value={cd.weight_kg} unit="kg" />
        <DataRow label="Taille" value={cd.height_cm} unit="cm" />
        {bfPct != null && (
          <div className="py-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-white/50">Masse grasse</span>
              <span className="text-[12px] font-medium text-white/85">{bfPct.toFixed(1)}%</span>
            </div>
            <div className="flex w-full h-[3px] rounded-full overflow-hidden bg-white/[0.06]">
              <div className="bg-amber-400/60 transition-all duration-500" style={{ width: `${Math.min(bfPct, 40) / 40 * 100}%` }} />
              <div className="bg-[#1f8a65]/60 flex-1" />
            </div>
          </div>
        )}
        <DataRow label="LBM" value={lbm != null ? lbm.toFixed(1) : null} unit="kg" />
        {cd.muscle_mass_kg && <DataRow label="Masse musc." value={cd.muscle_mass_kg} unit="kg" />}
      </div>

      {/* Métabolisme */}
      <div>
        <SectionLabel>Métabolisme</SectionLabel>
        {bmr && <DataRow label="BMR" value={Math.round(bmr)} unit="kcal" source={bmrSource} />}
        {cd.visceral_fat_level != null && (
          <DataRow
            label="Graisse viscérale"
            value={cd.visceral_fat_level}
            warning={cd.visceral_fat_level >= 10}
          />
        )}
      </div>

      {/* Entraînement — éditable */}
      <div>
        <button
          onClick={() => setTrainingOpen(p => !p)}
          className="flex items-center justify-between w-full mb-2 group"
        >
          <SectionLabel>Entraînement</SectionLabel>
          <Pencil size={10} className="text-white/30 group-hover:text-[#1f8a65] transition-colors mb-2" />
        </button>
        {trainingOpen && (
          <div className="space-y-0.5">
            <NumberInput
              label="Séances/sem" unit="j"
              value={trainingConfig.weeklyFrequency}
              onChange={v => onTrainingChange({ weeklyFrequency: v })}
              min={0} max={14}
            />
            <NumberInput
              label="Durée session" unit="min"
              value={trainingConfig.sessionDurationMin}
              onChange={v => onTrainingChange({ sessionDurationMin: v })}
              min={15} max={240}
            />
            <NumberInput
              label="Cardio/sem" unit="j"
              value={trainingConfig.cardioFrequency}
              onChange={v => onTrainingChange({ cardioFrequency: v })}
              min={0} max={14}
            />
            <NumberInput
              label="Durée cardio" unit="min"
              value={trainingConfig.cardioDurationMin}
              onChange={v => onTrainingChange({ cardioDurationMin: v })}
              min={0} max={180}
            />
            <NumberInput
              label="Pas/jour"
              value={trainingConfig.dailySteps}
              onChange={v => onTrainingChange({ dailySteps: v })}
              min={0} max={30000}
            />
          </div>
        )}
      </div>

      {/* Lifestyle — éditable */}
      <div>
        <button
          onClick={() => setLifestyleOpen(p => !p)}
          className="flex items-center justify-between w-full mb-2 group"
        >
          <SectionLabel>Lifestyle</SectionLabel>
          <Pencil size={10} className="text-white/30 group-hover:text-[#1f8a65] transition-colors mb-2" />
        </button>
        {lifestyleOpen && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <Moon size={10} className={sleepWarning ? 'text-amber-400' : 'text-white/30'} />
                <span className="text-[11px] text-white/50">Sommeil</span>
              </div>
              <div className="flex items-center gap-1">
                {sleepWarning && <AlertTriangle size={9} className="text-amber-400" />}
                <input
                  type="number"
                  step="0.1"
                  value={lifestyleConfig.sleepDurationH ?? ''}
                  min={0} max={12}
                  onChange={e => onLifestyleChange({ sleepDurationH: Number(e.target.value) })}
                  className={`w-14 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-0.5 text-[12px] text-right outline-none focus:border-[#1f8a65]/40 ${sleepWarning ? 'text-amber-400' : 'text-white'}`}
                />
                <span className="text-[10px] text-white/35 w-4">h</span>
              </div>
            </div>
            <NumberInput
              label="Stress (1-10)"
              value={lifestyleConfig.stressLevel}
              onChange={v => onLifestyleChange({ stressLevel: v })}
              min={1} max={10}
            />
            <NumberInput
              label="Caféine" unit="mg"
              value={lifestyleConfig.caffeineDailyMg}
              onChange={v => onLifestyleChange({ caffeineDailyMg: v })}
              min={0} max={1000}
            />
            <NumberInput
              label="Alcool/sem" unit="v"
              value={lifestyleConfig.alcoholWeekly}
              onChange={v => onLifestyleChange({ alcoholWeekly: v })}
              min={0} max={50}
            />
          </div>
        )}
      </div>

    </div>
  )
}
