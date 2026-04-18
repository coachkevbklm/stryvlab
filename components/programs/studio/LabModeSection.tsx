// components/programs/studio/LabModeSection.tsx
'use client'

import { useState } from 'react'
import { FlaskConical, ChevronDown, ChevronUp, Microscope, Info } from 'lucide-react'
import type { IntelligenceResult } from '@/lib/programs/intelligence'

interface Props {
  result: IntelligenceResult | null
  morphoConnected: boolean
  morphoDate?: string
}

const RULE_EXPLANATIONS: Record<string, string> = {
  balance: 'Ratio push/pull/jambes/core selon l\'objectif. Cible : ~40% jambes, 30% push+pull, 30% core pour hypertrophie.',
  recovery: 'Fenêtres SRA par groupe musculaire. Un muscle sollicité trop souvent avant récupération complète → pénalité.',
  specificity: 'Coefficient de stimulus moyen pondéré. Les exercices polyarticulaires avec charge lourde ont un coeff élevé.',
  progression: 'RIR semaine 1 doit être ≥1 (marge de progression). Un RIR=0 dès semaine 1 = risque de stagnation rapide.',
  redundancy: 'Exercices identiques (même pattern + mêmes muscles + coeff similaire) → volume dilué sans stimulus nouveau.',
  completeness: 'Patterns requis par objectif. Hypertrophie = push + pull + jambes + core. Manque → score incomplet.',
}

export default function LabModeSection({ result, morphoConnected, morphoDate }: Props) {
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
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(result.subscores).map(([key, score]) => (
                  <div key={key} className="rounded-lg bg-black/20 px-2 py-1.5">
                    <div className="text-[9px] text-white/35 mb-0.5 capitalize">
                      {key}
                    </div>
                    <div
                      className="text-[13px] font-bold font-mono"
                      style={{
                        color: score >= 75 ? '#1f8a65' : score >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {Math.round(score)}
                    </div>
                  </div>
                ))}
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
