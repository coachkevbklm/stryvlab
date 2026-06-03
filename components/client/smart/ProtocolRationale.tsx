'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientT } from '../ClientI18nProvider'
import { NUTRITION_UI_COLORS } from '@/lib/nutrition/ui-colors'
import { getCycleSyncAdjustment } from '@/lib/nutrition/engine/cycleSync'
import type { CycleState } from '@/lib/cycle/cycleEngine'

interface ProtocolDay {
  name: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  carb_cycle_type?: string | null
}

interface Props {
  protocolDays?: ProtocolDay[]
  tdee: number | null
  tdeeSource: string | null
  bodyWeightKg?: number | null
  activeDayName?: string | null
  cycleState?: CycleState | null
  cycleSyncEnabled?: boolean
  // Legacy single-day support (backwards compat)
  target?: { kcal: number; protein_g: number; carbs_g: number; fat_g: number }
  dayName?: string | null
}

function DayAccordion({
  day,
  tdee,
  tdeeSource,
  bodyWeightKg,
  cycleState,
  cycleSyncEnabled,
  defaultOpen,
}: {
  day: ProtocolDay
  tdee: number | null
  tdeeSource: string | null
  bodyWeightKg?: number | null
  cycleState?: CycleState | null
  cycleSyncEnabled?: boolean
  defaultOpen: boolean
}) {
  const { t } = useClientT()
  const [open, setOpen] = useState(defaultOpen)

  const delta = tdee != null && tdee > 0 ? day.kcal - tdee : null
  const goalLabel =
    delta == null ? t('protocol.label.caloric_target') :
    delta > 100 ? t('protocol.label.bulk') :
    delta < -100 ? t('protocol.label.cut') : t('protocol.label.maintenance')

  const gPerKg = bodyWeightKg && bodyWeightKg > 0
    ? (day.protein_g / bodyWeightKg).toFixed(2)
    : null

  const fatKcal  = day.fat_g * 9
  const carbKcal = day.carbs_g * 4
  const totalMacroCal = fatKcal + carbKcal + day.protein_g * 4
  const carbPct = totalMacroCal > 0 ? Math.round((carbKcal / totalMacroCal) * 100) : 0
  const fatPct  = totalMacroCal > 0 ? Math.round((fatKcal  / totalMacroCal) * 100) : 0

  const showCycle = !!(cycleSyncEnabled && cycleState?.hasActiveCycle && cycleState.currentPhase)
  const cycleAdj = showCycle ? getCycleSyncAdjustment(cycleState!.currentPhase!) : null

  const steps: Array<{ title: string; value: string; valueColor: string; body: string }> = []

  if (tdee != null && tdee > 0) {
    const sourceKey = tdeeSource === 'formula_proxy' ? 'protocol.tdee.formula' : 'protocol.tdee.adaptive'
    steps.push({
      title: t('protocol.label.tdee'),
      value: `${Math.round(tdee).toLocaleString('fr-FR')} kcal`,
      valueColor: '#4a90e2',
      body: `${t(sourceKey as any)}. Base de calcul de tes objectifs caloriques.`,
    })
  }

  if (day.kcal > 0) {
    let body = t('protocol.maint.desc')
    if (delta != null && Math.abs(delta) > 100) {
      body = delta > 0 ? t('protocol.desc.bulk') : t('protocol.desc.cut')
    }
    steps.push({
      title: goalLabel,
      value: `${Math.round(day.kcal).toLocaleString('fr-FR')} kcal${delta != null ? (delta > 0 ? ` (+${Math.round(delta)})` : ` (${Math.round(delta)})`) : ''}`,
      valueColor: NUTRITION_UI_COLORS.carbs,
      body,
    })
  }

  if (day.protein_g > 0) {
    steps.push({
      title: 'Protéines cibles',
      value: `${Math.round(day.protein_g)}g${gPerKg ? ` · ${gPerKg} g/kg` : ''}`,
      valueColor: NUTRITION_UI_COLORS.protein,
      body: `${t('protocol.desc.protein')}${gPerKg ? ` Ratio ${gPerKg} g/kg adapté à ton objectif.` : ''}`,
    })
  }

  if (day.fat_g > 0 && day.carbs_g > 0) {
    const cycleKey = day.carb_cycle_type === 'high' ? 'protocol.carb_cycle.high' :
                      day.carb_cycle_type === 'low' ? 'protocol.carb_cycle.low' :
                      day.carb_cycle_type === 'medium' ? 'protocol.carb_cycle.medium' : null
    steps.push({
      title: 'Répartition glucides / lipides',
      value: `${Math.round(day.carbs_g)}g G · ${Math.round(day.fat_g)}g L`,
      valueColor: NUTRITION_UI_COLORS.fat,
      body: cycleKey
        ? t(cycleKey as any)
        : `Glucides ${carbPct}% — carburant. Lipides ${fatPct}% — régulation hormonale.`,
    })
  }

  if (showCycle && cycleAdj) {
    const PHASE_COLORS: Record<string, string> = {
      follicular: '#22c55e',
      ovulatory:  '#fbbf24',
      luteal:     '#a855f7',
      menstrual:  '#ef4444',
    }
    const PHASE_NAMES: Record<string, string> = { menstrual: 'Menstruation', follicular: 'Folliculaire', ovulatory: 'Ovulation', luteal: 'Lutéale' }
    const phase = cycleState!.currentPhase!
    const phaseName = PHASE_NAMES[phase] ?? phase
    const phaseColor = PHASE_COLORS[phase] ?? '#a855f7'

    const hasDeltas = cycleAdj.caloriesDelta !== 0 || cycleAdj.proteinDelta !== 0 || cycleAdj.carbsDelta !== 0
    const deltaStr = hasDeltas
      ? [
          cycleAdj.caloriesDelta !== 0 ? `${cycleAdj.caloriesDelta > 0 ? '+' : ''}${cycleAdj.caloriesDelta} kcal` : null,
          cycleAdj.proteinDelta !== 0  ? `${cycleAdj.proteinDelta > 0 ? '+' : ''}${cycleAdj.proteinDelta}g P`    : null,
          cycleAdj.carbsDelta !== 0    ? `${cycleAdj.carbsDelta > 0 ? '+' : ''}${cycleAdj.carbsDelta}g G`        : null,
        ].filter(Boolean).join(' · ')
      : 'Aucun ajustement cette phase'

    const adjustedKcal = day.kcal + cycleAdj.caloriesDelta
    const nextPhaseLabel = cycleState!.nextPhaseIn != null
      ? ` — phase suivante dans ${cycleState!.nextPhaseIn}j`
      : ''

    steps.push({
      title: `Cycle — Phase ${phaseName}`,
      value: hasDeltas ? `${deltaStr} → ${Math.round(adjustedKcal)} kcal` : deltaStr,
      valueColor: phaseColor,
      body: `${cycleAdj.notes[0] ?? ''}${nextPhaseLabel}`,
    })
  }

  return (
    <div className="bg-[#111111] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-white/[0.03] transition-colors"
      >
        <div className="text-left flex-1 min-w-0">
          <p className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white/70 truncate">
            {day.name}
          </p>
          <p className="text-[13px] font-barlow font-semibold text-[#e0e0e0] tabular-nums">
            {Math.round(day.kcal).toLocaleString('fr-FR')} kcal
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 ml-3">
          <ChevronDown size={16} className="text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-[#2e2e2e] flex items-center justify-center">
                      <span className="text-[11px] font-black text-white/70">{i + 1}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.08] my-1" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className={`min-w-0 flex-1 ${i === steps.length - 1 ? '' : 'pb-4'}`}>
                    <p className="text-[12px] font-semibold text-white/80 mb-0.5">{step.title}</p>
                    <p className="text-[14px] font-black tabular-nums mb-1" style={{ color: step.valueColor }}>{step.value}</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProtocolRationale({
  protocolDays,
  tdee,
  tdeeSource,
  bodyWeightKg,
  activeDayName,
  cycleState,
  cycleSyncEnabled,
  target,
  dayName,
}: Props) {
  // Legacy single-day fallback
  const days: ProtocolDay[] = protocolDays?.length
    ? protocolDays
    : target
      ? [{ name: dayName ?? 'Journée', kcal: target.kcal, protein_g: target.protein_g, carbs_g: target.carbs_g, fat_g: target.fat_g }]
      : []

  if (days.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="px-1 pb-1">
        <p className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white/40">
          Comprendre ton protocole
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">Tap sur une journée pour voir le détail</p>
      </div>
      {days.map(day => (
        <DayAccordion
          key={day.name}
          day={day}
          tdee={tdee}
          tdeeSource={tdeeSource}
          bodyWeightKg={bodyWeightKg}
          cycleState={cycleState}
          cycleSyncEnabled={cycleSyncEnabled}
          defaultOpen={day.name === (activeDayName ?? dayName)}
        />
      ))}
    </div>
  )
}
