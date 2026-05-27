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

// ── SVG arc geometry ──────────────────────────────────────────────────────────
// 180° semi-circle: from 270° (left) clockwise through top to 90° (right)
// ViewBox "0 0 200 120", center (100, 110), radius 80

const CX           = 100
const CY           = 110
const R            = 80
const START_DEG    = 270
const SEGMENT_SWEEP = (180 - 3 * 6) / 7   // 162/7 ≈ 23.14°
const STRIDE        = SEGMENT_SWEEP + 3    // ≈ 26.14°

function compassToXY(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: CX + R * Math.sin(rad), y: CY - R * Math.cos(rad) }
}

function arcD(startDeg: number, endDeg: number): string {
  const s = compassToXY(startDeg)
  const e = compassToXY(endDeg)
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

// Wave effect: edge segments are thin (8px), center segment is thickest (19px)
function strokeW(i: number): number {
  return Math.round(8 + Math.sin((i / 6) * Math.PI) * 11)
}

function segmentColor(phase: TransformationPhase, rec: PhaseRecommendation): string {
  if (phase === rec.phase) return '#1f8a65'
  if (!rec.matchesCurrent && phase === rec.currentMappedPhase) return 'rgba(255,255,255,0.30)'
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
      <div className="flex items-center justify-between mb-4">
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
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : rec ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col"
        >
          {/* Arc + center overlay */}
          <div className="relative w-full max-w-[300px] mx-auto">
            <svg
              viewBox="0 0 200 120"
              className="w-full"
              aria-hidden="true"
            >
              {PHASES.map((phase, i) => {
                const startDeg = START_DEG + i * STRIDE
                const endDeg   = startDeg + SEGMENT_SWEEP
                const isOptimal = phase === rec.phase
                return (
                  <motion.path
                    key={phase}
                    d={arcD(startDeg, endDeg)}
                    stroke={segmentColor(phase, rec)}
                    strokeWidth={strokeW(i)}
                    fill="none"
                    strokeLinecap="round"
                    style={isOptimal
                      ? { filter: 'drop-shadow(0 0 5px rgba(31,138,101,0.55))' }
                      : undefined
                    }
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
                  />
                )
              })}
            </svg>

            {/* Center text — positioned in arc hollow */}
            <div
              className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
              style={{ top: '54%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              {OptimalIcon && (
                <OptimalIcon className="w-5 h-5 text-white/40 mb-1" />
              )}
              <p className="text-[16px] font-bold text-white leading-none text-center whitespace-nowrap">
                {PHASE_LABELS[rec.phase]}
              </p>
              {rec.matchesCurrent ? (
                <span className="text-[9px] font-bold text-[#1f8a65] tracking-[0.08em] mt-1">
                  ✓ Alignée
                </span>
              ) : (
                <p className="text-[8px] uppercase tracking-[0.16em] text-white/25 mt-0.5">
                  Phase optimale
                </p>
              )}
            </div>
          </div>

          {/* Phase label strip — aligned to arc */}
          <div className="flex justify-between w-full max-w-[300px] mx-auto px-0.5 -mt-3 mb-5">
            {PHASES.map(phase => (
              <span
                key={phase}
                className={`text-[8px] font-bold uppercase tracking-[0.10em] ${
                  isActiveLabel(phase, rec) ? 'text-white/60' : 'text-white/14'
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
