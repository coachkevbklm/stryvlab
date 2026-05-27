'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { TransformationScoreResult } from '@/lib/coach/transformationScore'

// ── SVG Gauge constants ────────────────────────────────────────────────────────
const CX = 100
const CY = 115
const R = 88
const TRACK_WIDTH = 14
const START_DEG = 225   // 7:30 o'clock (0° = top, clockwise)
const SWEEP = 270

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

const TRACK_PATH = arcPath(CX, CY, R, START_DEG, START_DEG + SWEEP)
const NEEDLE_START = polarToCartesian(CX, CY, R - 18, START_DEG)

// ── Gauge sub-component ───────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))

  return (
    <svg viewBox="0 0 200 148" className="w-full max-w-[220px] mx-auto">
      {/* Background track */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={TRACK_WIDTH}
        strokeLinecap="round"
      />
      {/* Active arc */}
      <motion.path
        d={TRACK_PATH}
        fill="none"
        stroke="#1f8a65"
        strokeWidth={TRACK_WIDTH}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: clamped / 100 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* Needle (rotates around center) */}
      <motion.g
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        initial={{ rotate: 0 }}
        animate={{ rotate: (clamped / 100) * SWEEP }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <line
          x1={CX} y1={CY}
          x2={NEEDLE_START.x} y2={NEEDLE_START.y}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </motion.g>
      {/* Center dot */}
      <circle cx={CX} cy={CY} r={5} fill="rgba(255,255,255,0.9)" />
      {/* Score number */}
      <text
        x={CX}
        y={CY - 20}
        textAnchor="middle"
        fill="white"
        fontSize={34}
        fontWeight={700}
        fontFamily="inherit"
        dominantBaseline="middle"
      >
        {score}
      </text>
    </svg>
  )
}

// ── Dimension pills ────────────────────────────────────────────────────────────
const DIM_LABELS: Record<string, string> = {
  adherence:    'ADH',
  recovery:     'REC',
  bodyProgress: 'CORPS',
  performance:  'PERF',
}

function DimensionPills({ dimensions }: { dimensions: TransformationScoreResult['dimensions'] }) {
  return (
    <div className="flex gap-2 justify-center mt-3">
      {Object.entries(dimensions).map(([key, dim]) => {
        const score = dim.score
        const scoreColor =
          dim.weight === 0 ? 'text-white/20' :
          score < 25       ? 'text-red-400'  :
          score < 50       ? 'text-amber-400':
                             'text-white/70'
        return (
          <div key={key} className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 flex flex-col items-center gap-0.5">
            <span className={`text-[15px] font-bold tabular-nums ${scoreColor}`}>
              {dim.weight === 0 ? '—' : score}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/25">
              {DIM_LABELS[key]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Alert list ────────────────────────────────────────────────────────────────
const SEVERITY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-white/30',
}

const DIM_FULL: Record<string, string> = {
  adherence:    'Adhérence',
  recovery:     'Récupération',
  bodyProgress: 'Corps',
  performance:  'Performance',
}

function AlertList({ alerts }: { alerts: TransformationScoreResult['alerts'] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-1 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1f8a65] flex-shrink-0" />
        <span className="text-[11px] text-white/40">Aucune alerte — client en bonne dynamique</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/30 mb-0.5">
        Priorités
      </p>
      {alerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.1em] mb-0.5">
              {DIM_FULL[alert.dimension]}
            </p>
            <p className="text-[11px] text-white/45 leading-snug">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Window toggle ─────────────────────────────────────────────────────────────
function WindowToggle({
  value,
  onChange,
}: {
  value: 7 | 30
  onChange: (v: 7 | 30) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
      {([7, 30] as const).map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
            value === w
              ? 'bg-white/[0.08] text-white'
              : 'text-white/30 hover:text-white/50'
          }`}
        >
          {w}j
        </button>
      ))}
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
interface Props {
  clientId: string
}

export default function TransformationScoreWidget({ clientId }: Props) {
  const [win, setWin] = useState<7 | 30>(7)
  const [data, setData] = useState<TransformationScoreResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/clients/${clientId}/transformation-score?window=${win}`)
      .then(r => r.json())
      .then((d: TransformationScoreResult) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId, win])

  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
          Score de transformation
        </p>
        <WindowToggle value={win} onChange={setWin} />
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: gauge + pills + label */}
          <div className="flex flex-col items-center">
            <ScoreGauge score={data.score} />
            <p className="text-[11px] text-white/50 -mt-1">{data.label}</p>
            <DimensionPills dimensions={data.dimensions} />
            {data.insufficientData && (
              <p className="text-[9px] text-amber-400/60 mt-2 text-center">
                Données partielles — score estimé
              </p>
            )}
          </div>
          {/* Right: alerts */}
          <div className="pt-1">
            <AlertList alerts={data.alerts} />
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-white/30 text-center py-8">Erreur de chargement</p>
      )}
    </div>
  )
}
