'use client'

import type { MacroResult } from '@/lib/formulas/macros'

interface TdeeWaterfallProps {
  result: MacroResult
}

const SOURCE_LABELS: Record<string, string> = {
  measured: '● Mesuré',
  'katch-mcardle': '◐ Katch',
  mifflin: '◌ Mifflin',
  steps: '● Pas',
  'activity-level': '◐ Activité',
  tracker: '● Tracker',
  'duration-met': '◐ MET',
  table: '◌ Table',
  'duration-met_cardio': '◐ MET',
  none: '',
}

export default function TdeeWaterfall({ result }: TdeeWaterfallProps) {
  const { breakdown, tdee, dataProvenance } = result
  const total = tdee

  const items = [
    { key: 'bmr',  label: 'BMR',  value: breakdown.bmr,                           color: 'bg-blue-500',   source: SOURCE_LABELS[dataProvenance.bmrSource] },
    { key: 'neat', label: 'NEAT', value: breakdown.neat,                           color: 'bg-purple-400', source: SOURCE_LABELS[dataProvenance.neatSource] },
    { key: 'eat',  label: 'EAT',  value: breakdown.eat + breakdown.eatCardio,      color: 'bg-[#1f8a65]',  source: SOURCE_LABELS[dataProvenance.eatSource] },
    { key: 'tef',  label: 'TEF',  value: breakdown.tef,                            color: 'bg-amber-400',  source: '● 10% BMR' },
  ]

  return (
    <div className="space-y-2">
      {/* Equation header */}
      <div className="flex items-center gap-1 text-[11px] font-mono flex-wrap">
        {items.map((item, i) => (
          <span key={item.key} className="flex items-center gap-1">
            {i > 0 && <span className="text-white/30">+</span>}
            <span className="text-white/70">{item.value}</span>
            <span className="text-white/30 text-[9px]">{item.label}</span>
          </span>
        ))}
        <span className="text-white/30">=</span>
        <span className="text-white font-bold">{total}</span>
        <span className="text-white/30 text-[9px]">TDEE</span>
      </div>

      {/* Stacked bar */}
      <div className="flex w-full h-[6px] overflow-hidden rounded-full bg-white/[0.04]">
        {items.map(item => (
          <div
            key={item.key}
            className={`${item.color} transition-all duration-500`}
            style={{ width: `${Math.round((item.value / total) * 100)}%` }}
          />
        ))}
      </div>

      {/* Source labels */}
      <div className="flex gap-3 flex-wrap">
        {items.map(item => item.source ? (
          <span key={item.key} className="text-[9px] text-white/35">
            {item.label} {item.source}
          </span>
        ) : null)}
      </div>
    </div>
  )
}
