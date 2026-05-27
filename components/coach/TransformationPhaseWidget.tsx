'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, RefreshCw, Target, Trophy, Minus, Zap } from 'lucide-react'
import type { TransformationScoreResult, TransformationPhase } from '@/lib/coach/transformationScore'

// ── Phase metadata ────────────────────────────────────────────────────────────
const PHASE_LABELS: Record<TransformationPhase, string> = {
  fat_loss:         'Perte de gras',
  lean_bulk:        'Prise de masse',
  recomp:           'Recomposition',
  competition_prep: 'Pré-compétition',
  competition:      'Compétition',
  maintenance:      'Maintenance',
  deload:           'Recharge',
}

const PHASE_ICONS: Record<TransformationPhase, React.ElementType> = {
  fat_loss:         TrendingDown,
  lean_bulk:        TrendingUp,
  recomp:           RefreshCw,
  competition_prep: Target,
  competition:      Trophy,
  maintenance:      Minus,
  deload:           Zap,
}

// ── Confidence dots ───────────────────────────────────────────────────────────
function ConfidenceDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-white/60' : 'bg-white/15'}`}
        />
      ))}
    </div>
  )
}

// ── Phase box ─────────────────────────────────────────────────────────────────
function PhaseBox({
  phase,
  label,
  highlight,
}: {
  phase: TransformationPhase
  label: 'ACTUELLE' | 'OPTIMALE'
  highlight: boolean
}) {
  const Icon = PHASE_ICONS[phase]
  return (
    <div className={`flex-1 rounded-xl px-4 py-3 ${
      highlight
        ? 'bg-white/[0.06] border-[0.3px] border-[#1f8a65]/25'
        : 'bg-white/[0.04] border-[0.3px] border-white/[0.06]'
    }`}>
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/25 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <span className="text-[13px] font-semibold text-white leading-tight">
          {PHASE_LABELS[phase]}
        </span>
      </div>
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
interface Props {
  clientId: string
}

export default function TransformationPhaseWidget({ clientId }: Props) {
  const [data, setData] = useState<TransformationScoreResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/transformation-score?window=30`)
      .then(r => r.json())
      .then((d: TransformationScoreResult) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

  const rec = data?.phaseRecommendation

  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          Phase de transformation
        </p>
        {rec?.matchesCurrent && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-bold text-[#1f8a65] tracking-[0.06em]"
          >
            ✓ Phase alignée
          </motion.span>
        )}
      </div>

      {loading ? (
        <div className="h-[100px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : rec ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Phase boxes */}
          {rec.matchesCurrent ? (
            <PhaseBox phase={rec.phase} label="ACTUELLE" highlight={false} />
          ) : (
            <div className="flex items-center gap-3">
              <PhaseBox phase={rec.currentMappedPhase} label="ACTUELLE" highlight={false} />
              <span className="text-white/20 text-[18px] flex-shrink-0 select-none">→</span>
              <PhaseBox phase={rec.phase} label="OPTIMALE" highlight={true} />
            </div>
          )}

          {/* Confidence + rationale */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <ConfidenceDots level={rec.confidence} />
              <span className="text-[9px] text-white/25 uppercase tracking-[0.1em]">
                {rec.confidence === 'high' ? 'Haute confiance' :
                 rec.confidence === 'medium' ? 'Confiance moyenne' :
                 'Données insuffisantes'}
              </span>
            </div>
            {rec.rationale.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-white/20 mt-0.5 flex-shrink-0 select-none">•</span>
                <p className="text-[11px] text-white/40 leading-snug">{r}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <p className="text-[11px] text-white/30 text-center py-6">Données insuffisantes</p>
      )}
    </div>
  )
}
