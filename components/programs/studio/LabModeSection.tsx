// components/programs/studio/LabModeSection.tsx
'use client'

import { useState } from 'react'
import { FlaskConical, ChevronDown, ChevronUp, Microscope, Info, Zap, Sliders } from 'lucide-react'
import type { IntelligenceResult, SRAHeatmapWeek } from '@/lib/programs/intelligence'

interface Props {
  result: IntelligenceResult | null
  morphoConnected: boolean
  morphoDate?: string
  sraHeatmap?: SRAHeatmapWeek[]
  labOverrides?: Record<string, number>
  presentPatterns?: string[]
  onOverrideChange?: (pattern: string, value: number) => void
  onOverrideReset?: () => void
}

const RULE_EXPLANATIONS: Record<string, string> = {
  balance: 'Ratio push/pull/jambes/core selon l\'objectif. Cible : ~40% jambes, 30% push+pull, 30% core pour hypertrophie.',
  recovery: 'Fenêtres SRA par groupe musculaire. Un muscle sollicité trop souvent avant récupération complète → pénalité.',
  specificity: 'Coefficient de stimulus moyen pondéré. Les exercices polyarticulaires avec charge lourde ont un coeff élevé.',
  progression: 'RIR semaine 1 doit être ≥1 (marge de progression). Un RIR=0 dès semaine 1 = risque de stagnation rapide.',
  redundancy: 'Exercices identiques (même pattern + mêmes muscles + coeff similaire) → volume dilué sans stimulus nouveau.',
  completeness: 'Patterns requis par objectif. Hypertrophie = push + pull + jambes + core. Manque → score incomplet.',
  jointLoad: 'Charge cumulée sur les articulations (épaule, genou, rachis). Un score faible indique un risque articulaire élevé — adapter le volume ou remplacer les exercices à fort impact.',
  coordination: 'Complexité motrice moyenne du programme. Un score faible signale des exercices très techniques pour le niveau du client — risque de mauvaise exécution et de blessure.',
}

const SUBSCORE_LABEL_FR: Record<string, string> = {
  balance: 'Équilibre',
  recovery: 'Récupération',
  specificity: 'Cohérence obj.',
  progression: 'Progression',
  completeness: 'Couverture',
  redundancy: 'Diversité',
  jointLoad: 'Charge articulaire',
  coordination: 'Coordination',
}

export default function LabModeSection({
  result, morphoConnected, morphoDate,
  sraHeatmap, labOverrides, presentPatterns, onOverrideChange, onOverrideReset
}: Props) {
  const [visible, setVisible] = useState(true)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  return (
    <div className="mt-4 rounded-xl border-[0.3px] border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.03] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setVisible(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#8b5cf6]/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={13} className="text-[#8b5cf6]" />
          <span className="text-[11px] font-semibold text-[#8b5cf6]">Lab Mode</span>
          <span className="text-[9px] text-[#8b5cf6]/50 bg-[#8b5cf6]/10 px-1.5 py-0.5 rounded-full">
            BETA
          </span>
          {morphoConnected && (
            <span className="text-[9px] text-[#1f8a65] bg-[#1f8a65]/10 px-1.5 py-0.5 rounded-full">
              Morpho {morphoDate ? `(${morphoDate})` : 'connecté'}
            </span>
          )}
        </div>
        {visible
          ? <ChevronUp size={13} className="text-[#8b5cf6]/50" />
          : <ChevronDown size={13} className="text-[#8b5cf6]/50" />
        }
      </button>

      {visible && (
        <div className="px-4 pb-4 space-y-4">
          {/* Stimulus Debug */}
          {result && Object.keys(result.subscores).length > 0 && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2 flex items-center gap-1.5">
                <Microscope size={10} />
                Debug subscores
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(result.subscores).map(([key, score]) => {
                  const labelAccent = key === 'jointLoad' ? '#f97316' : key === 'coordination' ? '#8b5cf6' : undefined
                  return (
                    <div
                      key={key}
                      className="rounded-lg bg-black/20 px-2 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div
                        className="text-[9px] capitalize truncate"
                        style={{ color: labelAccent ? `${labelAccent}99` : 'rgba(255,255,255,0.35)' }}
                      >
                        {SUBSCORE_LABEL_FR[key] ?? key}
                      </div>
                      <div
                        className="text-[12px] font-bold font-mono shrink-0"
                        style={{
                          color: score >= 75 ? '#1f8a65' : score >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {Math.round(score)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SRA Heatmap */}
          {sraHeatmap && sraHeatmap.some(w => w.muscles.length > 0) && (() => {
            const weeks: SRAHeatmapWeek[] = sraHeatmap
            const allMuscles = Array.from(new Set(weeks.flatMap(w => w.muscles.map(m => m.name))))
            return (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2 flex items-center gap-1.5">
                  <Zap size={10} />
                  Fatigue musculaire (4 semaines)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr>
                        <th className="text-left text-white/25 pr-2 pb-1 font-normal">Muscle</th>
                        {weeks.map(w => (
                          <th key={w.week} className="text-center text-white/25 px-1 pb-1 font-normal">S{w.week}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allMuscles.map(muscle => (
                        <tr key={muscle}>
                          <td className="text-white/40 pr-2 py-0.5 capitalize">{muscle}</td>
                          {weeks.map(week => {
                            const entry = week.muscles.find(x => x.name === muscle)
                            const fatigue = entry?.fatigue ?? 0
                            const bg = fatigue > 60 ? 'bg-red-500/25' : fatigue > 30 ? 'bg-amber-500/20' : 'bg-white/[0.03]'
                            return (
                              <td key={week.week} className={`text-center px-1 py-0.5 rounded ${bg}`}>
                                <span className="font-mono text-white/50">{fatigue > 0 ? fatigue : '–'}</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* Lab Overrides */}
          {presentPatterns && presentPatterns.length > 0 && onOverrideChange && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 flex items-center gap-1.5">
                  <Sliders size={10} />
                  Overrides coefficients
                </p>
                {onOverrideReset && Object.keys(labOverrides ?? {}).length > 0 && (
                  <button
                    onClick={onOverrideReset}
                    className="text-[9px] text-[#8b5cf6]/60 hover:text-[#8b5cf6] transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {presentPatterns.map(pattern => {
                  const currentVal = (labOverrides ?? {})[pattern] ?? 1.0
                  return (
                    <div key={pattern} className="flex items-center gap-2">
                      <span className="text-[9px] text-white/40 w-32 shrink-0 truncate capitalize">
                        {pattern.replace(/_/g, ' ')}
                      </span>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        value={currentVal}
                        onChange={e => onOverrideChange(pattern, parseFloat(e.target.value))}
                        className="flex-1 accent-[#8b5cf6] h-1"
                      />
                      <span
                        className="text-[9px] font-mono w-8 text-right shrink-0"
                        style={{ color: currentVal !== 1.0 ? '#8b5cf6' : 'rgba(255,255,255,0.3)' }}
                      >
                        {currentVal.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rule Transparency */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2 flex items-center gap-1.5">
              <Info size={10} />
              Règles actives
            </p>
            <div className="space-y-1">
              {Object.entries(RULE_EXPLANATIONS).map(([key, explanation]) => (
                <button
                  key={key}
                  onClick={() => setExpandedRule(expandedRule === key ? null : key)}
                  className="w-full text-left rounded-lg px-2.5 py-2 bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white/60 capitalize">{key}</span>
                    {expandedRule === key
                      ? <ChevronUp size={10} className="text-white/25" />
                      : <ChevronDown size={10} className="text-white/25" />
                    }
                  </div>
                  {expandedRule === key && (
                    <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                      {explanation}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Morpho status */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2">
              Morpho
            </p>
            {morphoConnected ? (
              <p className="text-[10px] text-[#1f8a65]/80">
                Ajustements morpho actifs — les coefficients stimulus sont modulés par les asymétries du client.
              </p>
            ) : (
              <p className="text-[10px] text-white/30">
                Aucune analyse morpho disponible — les coefficients utilisent les valeurs catalogue standards.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
