'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NUTRITION_UI_COLORS } from '@/lib/nutrition/ui-colors'

type Props = {
  tdee: number | null
  tdeeSource: string | null
  target: {
    kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  bodyWeightKg?: number | null
  dayName?: string | null
}

type Step = {
  n: number
  title: string
  value: string
  valueColor: string
  body: string
}

function buildSteps(props: Props): Step[] {
  const { tdee, tdeeSource, target, bodyWeightKg, dayName } = props
  const steps: Step[] = []

  // 1. TDEE
  if (tdee != null && tdee > 0) {
    const sourceLabel =
      tdeeSource === 'formula_proxy'
        ? 'Estimé depuis ton programme'
        : tdeeSource === 'adaptive'
        ? 'Calibré depuis tes pesées (14 jours)'
        : 'Estimé'
    steps.push({
      n: 1,
      title: 'Dépense énergétique estimée',
      value: `${Math.round(tdee).toLocaleString('fr-FR')} kcal`,
      valueColor: '#4a90e2',
      body: `${sourceLabel}. Cette valeur est la base de calcul de tes objectifs caloriques.`,
    })
  }

  // 2. Calorie target + delta
  if (target.kcal > 0) {
    const delta = tdee != null && tdee > 0 ? target.kcal - tdee : null
    const deltaStr =
      delta == null
        ? ''
        : delta > 0
        ? ` (+${Math.round(delta)} kcal de surplus)`
        : delta < 0
        ? ` (${Math.round(delta)} kcal de déficit)`
        : ' (maintenance)'
    const goalLabel =
      delta == null
        ? 'Objectif calorique journalier'
        : delta > 100
        ? 'Prise de masse'
        : delta < -100
        ? 'Perte de masse grasse'
        : 'Maintenance'

    steps.push({
      n: tdee != null ? 2 : 1,
      title: goalLabel,
      value: `${Math.round(target.kcal).toLocaleString('fr-FR')} kcal${deltaStr}`,
      valueColor: NUTRITION_UI_COLORS.carbs,
      body: `Objectif calorique${dayName ? ` pour "${dayName}"` : ''}.${
        delta != null && Math.abs(delta) > 100
          ? delta > 0
            ? ' Un surplus calorique favorise la construction musculaire et la récupération.'
            : ' Un déficit calorique permet de réduire la masse grasse tout en préservant le muscle.'
          : ' La maintenance préserve ta composition corporelle actuelle.'
      }`,
    })
  }

  // 3. Protein target
  if (target.protein_g > 0) {
    const gPerKg =
      bodyWeightKg != null && bodyWeightKg > 0
        ? (target.protein_g / bodyWeightKg).toFixed(2)
        : null
    steps.push({
      n: (steps.length + 1),
      title: 'Protéines cibles',
      value: `${Math.round(target.protein_g)}g${gPerKg ? ` · ${gPerKg} g/kg` : ''}`,
      valueColor: NUTRITION_UI_COLORS.protein,
      body: `Les protéines préservent la masse musculaire et favorisent la récupération.${
        gPerKg ? ` Un ratio de ${gPerKg} g/kg est adapté à ton niveau d'activité et ton objectif.` : ''
      }`,
    })
  }

  // 4. Fat / Carb split
  if (target.fat_g > 0 && target.carbs_g > 0) {
    const fatKcal = target.fat_g * 9
    const carbKcal = target.carbs_g * 4
    const totalMacroCal = fatKcal + carbKcal + target.protein_g * 4
    const carbPct = totalMacroCal > 0 ? Math.round((carbKcal / totalMacroCal) * 100) : 0
    const fatPct  = totalMacroCal > 0 ? Math.round((fatKcal  / totalMacroCal) * 100) : 0
    steps.push({
      n: steps.length + 1,
      title: 'Répartition glucides / lipides',
      value: `${Math.round(target.carbs_g)}g G · ${Math.round(target.fat_g)}g L`,
      valueColor: NUTRITION_UI_COLORS.fat,
      body: `Glucides ${carbPct}% des calories — carburant pour l'entraînement et la récupération glycogénique. Lipides ${fatPct}% — essentiels pour la régulation hormonale.`,
    })
  }

  return steps
}

export default function ProtocolRationale({ tdee, tdeeSource, target, bodyWeightKg, dayName }: Props) {
  const [open, setOpen] = useState(false)
  const steps = buildSteps({ tdee, tdeeSource, target, bodyWeightKg, dayName })

  if (steps.length === 0) return null

  return (
    <div className="bg-[#111111] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-white/[0.03] transition-colors"
      >
        <div className="text-left">
          <p className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white/70">
            Comment ton programme a été calculé
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-2"
        >
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
                <div key={step.n} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-[#2e2e2e] flex items-center justify-center">
                      <span className="text-[11px] font-black text-white/70">{step.n}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.08] my-1" style={{ minHeight: 16 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-4 min-w-0 flex-1 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                    <p className="text-[12px] font-semibold text-white/80 mb-0.5">{step.title}</p>
                    <p className="text-[14px] font-black tabular-nums mb-1" style={{ color: step.valueColor }}>
                      {step.value}
                    </p>
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
