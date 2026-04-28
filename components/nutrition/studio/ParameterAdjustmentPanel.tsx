'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X } from 'lucide-react'
import type { NutritionClientData } from '@/lib/nutrition/types'
import type { TrainingConfig, LifestyleConfig } from './useNutritionStudio'

interface Props {
  isOpen: boolean
  onClose: () => void
  clientData: NutritionClientData | null
  onUpdateTraining: (field: string, value: string) => void
  onUpdateLifestyle: (field: string, value: string) => void
  trainingConfig: TrainingConfig
  lifestyleConfig: LifestyleConfig
}

function NumberInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string
  value: string | number | null
  onChange: (v: string) => void
  unit?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
      <span className="text-[10px] font-semibold text-white/50">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          className="w-20 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-1 text-[11px] text-white text-right outline-none placeholder:text-white/20 focus:border-[#1f8a65]/40"
        />
        {unit && <span className="text-[9px] text-white/35 w-6">{unit}</span>}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 mt-4 mb-2">
      {children}
    </p>
  )
}

export default function ParameterAdjustmentPanel({
  isOpen,
  onClose,
  clientData,
  onUpdateTraining,
  onUpdateLifestyle,
  trainingConfig,
  lifestyleConfig,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#181818] z-50 flex flex-col border-l border-white/[0.06]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h3 className="text-[13px] font-semibold text-white">Ajuster les paramètres</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-0">
              {/* Training Section */}
              <SectionLabel>Entraînement</SectionLabel>
              <NumberInput
                label="Fréquence hebdomadaire"
                value={trainingConfig.weeklyFrequency ?? ''}
                onChange={v => onUpdateTraining('weekly_frequency', v)}
                unit="jours"
              />
              <NumberInput
                label="Durée séance"
                value={trainingConfig.sessionDurationMin ?? ''}
                onChange={v => onUpdateTraining('session_duration_min', v)}
                unit="min"
              />
              <NumberInput
                label="Calories entraînement"
                value={trainingConfig.trainingCaloriesWeekly ?? ''}
                onChange={v => onUpdateTraining('training_calories_weekly', v)}
                unit="kcal"
              />
              <NumberInput
                label="Fréquence cardio"
                value={trainingConfig.cardioFrequency ?? ''}
                onChange={v => onUpdateTraining('cardio_frequency', v)}
                unit="séances"
              />
              <NumberInput
                label="Durée cardio"
                value={trainingConfig.cardioDurationMin ?? ''}
                onChange={v => onUpdateTraining('cardio_duration_min', v)}
                unit="min"
              />
              <NumberInput
                label="Étapes quotidiennes"
                value={trainingConfig.dailySteps ?? ''}
                onChange={v => onUpdateTraining('daily_steps', v)}
                unit="pas"
              />

              {/* Lifestyle Section */}
              <SectionLabel>Hygiène de vie</SectionLabel>
              <NumberInput
                label="Heures sommeil"
                value={lifestyleConfig.sleepDurationH ?? ''}
                onChange={v => onUpdateLifestyle('sleep_duration_h', v)}
                unit="h"
              />
              <NumberInput
                label="Qualité sommeil"
                value={lifestyleConfig.sleepQuality ?? ''}
                onChange={v => onUpdateLifestyle('sleep_quality', v)}
                unit="/ 10"
              />
              <NumberInput
                label="Niveau de stress"
                value={lifestyleConfig.stressLevel ?? ''}
                onChange={v => onUpdateLifestyle('stress_level', v)}
                unit="/ 10"
              />
              <NumberInput
                label="Heures travail"
                value={lifestyleConfig.workHoursPerWeek ?? ''}
                onChange={v => onUpdateLifestyle('work_hours_per_week', v)}
                unit="h"
              />
              <NumberInput
                label="Caféine quotidienne"
                value={lifestyleConfig.caffeineDailyMg ?? ''}
                onChange={v => onUpdateLifestyle('caffeine_daily_mg', v)}
                unit="mg"
              />
              <NumberInput
                label="Alcool hebdomadaire"
                value={lifestyleConfig.alcoholWeekly ?? ''}
                onChange={v => onUpdateLifestyle('alcohol_weekly', v)}
                unit="verre"
              />
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] p-4">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[11px] font-medium text-white/60 hover:text-white/80 transition-all"
              >
                <ChevronLeft size={12} />
                Retour
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
