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

// ── SVG tick geometry ──────────────────────────────────────────────────────────
// 21 radial ticks (3 per phase × 7 phases) in 180° arc
// Arc: 270° (left) → clockwise through 0° (top) → 90° (right)
// Each tick is a radial line pointing toward center, like clock tick marks

const CX         = 100
const CY         = 100
const R_INNER    = 52
const TICK_COUNT = 21
const STRIDE     = 180 / (TICK_COUNT - 1)   // 9° between ticks

// Compass → SVG coords (y-axis flipped)
function cxy(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) }
}

// Wave height: short at edges (10px), tall at center (28px)
function tickH(i: number): number {
  return Math.round(10 + Math.sin((i / (TICK_COUNT - 1)) * Math.PI) * 18)
}

// SVG path for tick i — radial line from inner to outer radius
function tickPath(i: number): string {
  const angle = 270 + i * STRIDE
  const h = tickH(i)
  const p1 = cxy(R_INNER, angle)
  const p2 = cxy(R_INNER + h, angle)
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

// Which of the 7 phases does tick i belong to?
function phaseOf(i: number): TransformationPhase {
  return PHASES[Math.min(Math.floor(i / 3), 6)]
}

function tickColor(i: number, rec: PhaseRecommendation): string {
  const phase = phaseOf(i)
  if (phase === rec.phase) return '#1f8a65'
  if (!rec.matchesCurrent && phase === rec.currentMappedPhase) return 'rgba(255,255,255,0.38)'
  return 'rgba(255,255,255,0.10)'
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
        <div key={i}
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
          {/* Tick arc + center overlay */}
          <div className="relative w-full max-w-[300px] mx-auto">
            {/* ViewBox: 200×110. CX=100 CY=100. Arc endpoints at y=100 (left/right). */}
            <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
              {Array.from({ length: TICK_COUNT }).map((_, i) => {
                const isOptimal = phaseOf(i) === rec.phase
                return (
                  <motion.path
                    key={i}
                    d={tickPath(i)}
                    stroke={tickColor(i, rec)}
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    style={isOptimal
                      ? { filter: 'drop-shadow(0 0 3px rgba(31,138,101,0.70))' }
                      : undefined
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025, duration: 0.2, ease: 'easeOut' }}
                  />
                )
              })}
            </svg>

            {/* Center text in arc hollow — ~62% from top of SVG */}
            <div
              className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
              style={{ top: '62%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              {OptimalIcon && <OptimalIcon className="w-5 h-5 text-white/40 mb-0.5" />}
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

          {/* Phase label strip — 7 labels aligned under their 3-tick groups */}
          <div className="flex justify-between w-full max-w-[300px] mx-auto px-1 -mt-2 mb-5">
            {PHASES.map(phase => (
              <span
                key={phase}
                className={`text-[8px] font-bold uppercase tracking-[0.10em] ${
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
