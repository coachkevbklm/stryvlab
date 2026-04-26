'use client'

import { useState } from 'react'
import { AlertTriangle, Settings } from 'lucide-react'
import type { NutritionClientData } from '@/lib/nutrition/types'
import type { TrainingConfig, LifestyleConfig } from './useNutritionStudio'
import ParameterAdjustmentPanel from './ParameterAdjustmentPanel'

interface Props {
  clientData: NutritionClientData | null
  loading: boolean
  trainingConfig: TrainingConfig
  lifestyleConfig: LifestyleConfig
  onTrainingChange: (patch: Partial<TrainingConfig>) => void
  onLifestyleChange: (patch: Partial<LifestyleConfig>) => void
  macroResult: { leanMass: number; estimatedBF: number; breakdown: { bmr: number; tdee: number } } | null
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
  const [panelOpen, setPanelOpen] = useState(false)

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
  const tdee = macroResult?.breakdown.tdee

  return (
    <>
      <div className="h-full flex flex-col overflow-y-auto scrollbar-hide p-4">

        {/* Client header */}
        <div>
          <p className="text-[13px] font-semibold text-white leading-tight">{cd.name}</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {cd.gender === 'female' ? 'Femme' : 'Homme'} · {cd.age} ans
          </p>
        </div>

        {/* Composition */}
        <div className="mt-5">
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
        <div className="mt-5">
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

        {/* Spacer to push TDEE to bottom */}
        <div className="flex-1" />

        {/* Large TDEE display at bottom */}
        {tdee && (
          <div className="rounded-xl bg-[#1f8a65]/10 border-[0.3px] border-[#1f8a65]/25 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1f8a65]/60 mb-1">
              TDEE estimé
            </p>
            <p className="text-[28px] font-black text-[#1f8a65] leading-none">
              {Math.round(tdee)}
            </p>
            <p className="text-[10px] text-[#1f8a65]/50 mt-1">kcal/jour</p>
          </div>
        )}

        {/* Parameters button */}
        <button
          onClick={() => setPanelOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[11px] font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
        >
          <Settings size={12} />
          Ajuster les paramètres
        </button>
      </div>

      {/* Slide-in panel */}
      <ParameterAdjustmentPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        clientData={clientData}
        onUpdateTraining={(field, value) => {
          const numValue = value === '' ? null : Number(value)
          const fieldMap: Record<string, keyof TrainingConfig> = {
            weekly_frequency: 'weeklyFrequency',
            session_duration_min: 'sessionDurationMin',
            training_calories: 'trainingCalories',
            cardio_frequency: 'cardioFrequency',
            cardio_duration_min: 'cardioDurationMin',
          }
          const key = fieldMap[field]
          if (key) onTrainingChange({ [key]: numValue } as Partial<TrainingConfig>)
        }}
        onUpdateLifestyle={(field, value) => {
          const numValue = value === '' ? null : Number(value)
          const fieldMap: Record<string, keyof LifestyleConfig> = {
            daily_steps: 'dailySteps',
            sleep_duration_h: 'sleepDurationH',
            sleep_quality: 'sleepQuality',
            stress_level: 'stressLevel',
            energy_level: 'energyLevel',
            work_hours_per_week: 'workHoursPerWeek',
          }
          const key = fieldMap[field]
          if (key) onLifestyleChange({ [key]: numValue } as Partial<LifestyleConfig>)
        }}
        trainingConfig={trainingConfig}
        lifestyleConfig={lifestyleConfig}
      />
    </>
  )
}
