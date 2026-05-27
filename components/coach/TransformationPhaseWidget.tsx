'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { ElementType } from 'react'
import {
  TrendingDown, TrendingUp, RefreshCw,
  Target, Trophy, Minus, Zap,
} from 'lucide-react'
import type {
  TransformationScoreResult,
  TransformationPhase,
  PhaseRecommendation,
} from '@/lib/coach/transformationScore'

// ── Phase metadata ─────────────────────────────────────────────────────────────

const PHASES: TransformationPhase[] = [
  'deload', 'maintenance', 'fat_loss', 'recomp',
  'lean_bulk', 'competition_prep', 'competition',
]

const PHASE_LABELS: Record<TransformationPhase, string> = {
  fat_loss:         'Perte de gras',
  lean_bulk:        'Prise de masse',
  recomp:           'Recomposition',
  competition_prep: 'Pré-compétition',
  competition:      'Compétition',
  maintenance:      'Maintenance',
  deload:           'Recharge',
}

const PHASE_SHORT: Record<TransformationPhase, string> = {
  deload:           'DL',
  maintenance:      'MN',
  fat_loss:         'PG',
  recomp:           'RC',
  lean_bulk:        'PM',
  competition_prep: 'CP',
  competition:      'CO',
}

const PHASE_ICONS: Record<TransformationPhase, ElementType> = {
  fat_loss:         TrendingDown,
  lean_bulk:        TrendingUp,
  recomp:           RefreshCw,
  competition_prep: Target,
  competition:      Trophy,
  maintenance:      Minus,
  deload:           Zap,
}

const CONFIDENCE_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high:   'Haute confiance',
  medium: 'Confiance moyenne',
  low:    'Données insuffisantes',
}

// ── SVG arc helpers ────────────────────────────────────────────────────────────

const CX = 130
const CY = 150
const R  = 90
const START_DEG     = 225
const SEGMENT_SWEEP = (270 - 3 * 6) / 7   // ≈ 36°
const STRIDE        = SEGMENT_SWEEP + 3    // ≈ 39°

function compassToXY(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: CX + R * Math.sin(rad), y: CY - R * Math.cos(rad) }
}

function arcD(startDeg: number, endDeg: number): string {
  const s = compassToXY(startDeg)
  const e = compassToXY(endDeg)
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${R} ${R} 0 0 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`
}

function segmentColor(phase: TransformationPhase, rec: PhaseRecommendation): string {
  if (phase === rec.phase) return '#1f8a65'
  if (!rec.matchesCurrent && phase === rec.currentMappedPhase) return 'rgba(255,255,255,0.28)'
  return 'rgba(255,255,255,0.07)'
}

function isActiveLabel(phase: TransformationPhase, rec: PhaseRecommendation): boolean {
  return phase === rec.phase || (!rec.matchesCurrent && phase === rec.currentMappedPhase)
}

// ── Confidence dots ────────────────────────────────────────────────────────────

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

// ── Main widget ────────────────────────────────────────────────────────────────

interface Props { clientId: string }

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
  const OptimalIcon = rec ? PHASE_ICONS[rec.phase] : null

  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          Phase de transformation
        </p>
        {rec && (
          <div className="flex items-center gap-1.5">
            <ConfidenceDots level={rec.confidence} />
            <span className="text-[9px] text-white/25 uppercase tracking-[0.1em]">
              {CONFIDENCE_LABELS[rec.confidence]}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : rec ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Arc + center text */}
          <div className="relative">
            <svg
              viewBox="0 0 260 218"
              className="w-full"
              aria-hidden="true"
            >
              {PHASES.map((phase, i) => {
                const startDeg = START_DEG + i * STRIDE
                const endDeg   = startDeg + SEGMENT_SWEEP
                return (
                  <motion.path
                    key={phase}
                    d={arcD(startDeg, endDeg)}
                    stroke={segmentColor(phase, rec)}
                    strokeWidth={20}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  />
                )
              })}
            </svg>

            {/* Center text overlay */}
            <div
              className="absolute flex flex-col items-center gap-1 pointer-events-none"
              style={{ top: '42%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              {OptimalIcon && (
                <OptimalIcon className="w-7 h-7 text-white/50 mb-0.5" />
              )}
              <p className="text-[17px] font-bold text-white leading-none text-center whitespace-nowrap">
                {PHASE_LABELS[rec.phase]}
              </p>
              {rec.matchesCurrent ? (
                <span className="text-[10px] font-bold text-[#1f8a65] tracking-[0.06em] mt-0.5">
                  ✓ Alignée
                </span>
              ) : (
                <p className="text-[8px] uppercase tracking-[0.18em] text-white/25 mt-0.5">
                  Phase optimale
                </p>
              )}
            </div>
          </div>

          {/* Phase label strip */}
          <div className="flex justify-between px-1 -mt-5 mb-4">
            {PHASES.map(phase => (
              <span
                key={phase}
                className={`text-[8px] font-bold uppercase tracking-[0.12em] ${
                  isActiveLabel(phase, rec) ? 'text-white/60' : 'text-white/15'
                }`}
              >
                {PHASE_SHORT[phase]}
              </span>
            ))}
          </div>

          {/* Rationale */}
          {rec.rationale.length > 0 && (
            <>
              <div className="h-px bg-white/[0.05] mb-3" />
              <div className="space-y-2">
                {rec.rationale.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-white/20 mt-0.5 flex-shrink-0 select-none">•</span>
                    <p className="text-[11px] text-white/40 leading-snug">{r}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <p className="text-[11px] text-white/30 text-center py-10">Données insuffisantes</p>
      )}
    </div>
  )
}
