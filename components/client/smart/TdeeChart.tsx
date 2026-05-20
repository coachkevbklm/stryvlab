'use client'

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TdeePoint = {
  calculated_at: string
  tdee_adaptive: number
  tdee_formula: number
  delta_kcal: number
  avg_intake_kcal: number
  weight_delta_kg: number
  weight_samples: number
}

type Range = '1M' | '3M' | 'ALL'

const RANGES: Range[] = ['1M', '3M', 'ALL']
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, 'ALL': 9999 }

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d)
}

function svgPath(points: [number, number][]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`
  const d: string[] = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`]
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const cpx = (x0 + x1) / 2
    d.push(`C ${cpx.toFixed(1)} ${y0.toFixed(1)}, ${cpx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`)
  }
  return d.join(' ')
}

export default function TdeeChart() {
  const [data, setData] = useState<TdeePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('ALL')

  useEffect(() => {
    fetch('/api/client/nutrition/tdee-history')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range])
    return data.filter(p => new Date(p.calculated_at) >= cutoff)
  }, [data, range])

  if (loading) {
    return (
      <div className="bg-[#111111] rounded-2xl p-4">
        <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="h-[140px] bg-white/[0.04] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (filtered.length === 0) return null

  // ── SVG layout ─────────────────────────────────────────────────────────────
  const W = 320
  const H = 120
  const PAD = { top: 12, right: 8, bottom: 20, left: 36 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const allAdaptive = filtered.map(p => p.tdee_adaptive)
  const allFormula  = filtered.map(p => p.tdee_formula)
  const allVals = [...allAdaptive, ...allFormula]
  const minY = Math.min(...allVals) - 100
  const maxY = Math.max(...allVals) + 100

  const toX = (i: number) => PAD.left + (filtered.length <= 1 ? innerW / 2 : (i / (filtered.length - 1)) * innerW)
  const toY = (v: number) => PAD.top + innerH - ((v - minY) / (maxY - minY)) * innerH

  const adaptivePts: [number, number][] = filtered.map((p, i) => [toX(i), toY(p.tdee_adaptive)])
  const formulaPts:  [number, number][] = filtered.map((p, i) => [toX(i), toY(p.tdee_formula)])

  // Flux band: min/max of adaptive in window
  const bandMin = Math.min(...allAdaptive)
  const bandMax = Math.max(...allAdaptive)

  // Band polygon (top path forward + bottom path backward)
  const bandTopPts: [number, number][] = filtered.map((_, i) => [toX(i), toY(bandMax)])
  const bandBotPts: [number, number][] = (filtered.map((_, i) => [toX(i), toY(bandMin)] as [number, number])).reverse()
  const bandPath = svgPath(bandTopPts) + ' L ' + bandBotPts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z'

  // Y-axis labels
  const yTicks = [minY + 100, (minY + maxY) / 2, maxY - 100].map(v => Math.round(v / 50) * 50)

  // Latest point
  const latest = filtered[filtered.length - 1]
  const prev   = filtered.length >= 2 ? filtered[filtered.length - 2] : null
  const deltaTrend = prev ? latest.tdee_adaptive - prev.tdee_adaptive : 0
  const deltaVsFormula = latest.tdee_adaptive - latest.tdee_formula

  return (
    <div className="bg-[#111111] rounded-2xl p-4">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white/70 mb-0.5">
            Dépense énergétique
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-black text-white tabular-nums leading-none">
              {latest.tdee_adaptive.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] text-white/40">kcal/jour</span>
            {deltaTrend !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${deltaTrend > 0 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
                {deltaTrend > 0
                  ? <TrendingUp size={11} />
                  : <TrendingDown size={11} />}
                {deltaTrend > 0 ? '+' : ''}{deltaTrend} kcal
              </span>
            )}
          </div>
        </div>

        {/* Range pills */}
        <div className="flex items-center bg-white/[0.06] rounded-lg p-[2px] gap-[2px]">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all leading-none ${
                range === r ? 'bg-[#f2f2f2] text-[#080808]' : 'text-[#5a5a5a] hover:text-[#808080]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
          preserveAspectRatio="none"
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map(tick => {
            const y = toY(tick)
            return (
              <g key={tick}>
                <line
                  x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
                />
                <text
                  x={PAD.left - 4} y={y + 3.5}
                  textAnchor="end"
                  fontSize="7"
                  fill="rgba(255,255,255,0.25)"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Flux range band */}
          {filtered.length > 1 && (
            <path
              d={bandPath}
              fill="rgba(255,224,30,0.07)"
              stroke="none"
            />
          )}

          {/* Formula baseline (dashed gray) */}
          <path
            d={svgPath(formulaPts)}
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Adaptive TDEE line (yellow) */}
          <path
            d={svgPath(adaptivePts)}
            fill="none"
            stroke="#f2f2f2"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on adaptive line */}
          {adaptivePts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y} r={i === adaptivePts.length - 1 ? 3 : 1.5}
              fill={i === adaptivePts.length - 1 ? '#f2f2f2' : 'rgba(255,224,30,0.6)'}
            />
          ))}

          {/* X-axis date labels: first + last */}
          {filtered.length >= 2 && (
            <>
              <text
                x={PAD.left} y={H - 2}
                textAnchor="start"
                fontSize="7"
                fill="rgba(255,255,255,0.25)"
              >
                {formatDate(filtered[0].calculated_at)}
              </text>
              <text
                x={W - PAD.right} y={H - 2}
                textAnchor="end"
                fontSize="7"
                fill="rgba(255,255,255,0.25)"
              >
                {formatDate(filtered[filtered.length - 1].calculated_at)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-[2px] bg-[#f2f2f2] rounded" />
          <span className="text-[9px] text-white/40">Adaptatif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="3 3"/></svg>
          <span className="text-[9px] text-white/40">Formule</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-3 rounded-sm bg-[#f2f2f2]/10" />
          <span className="text-[9px] text-white/40">Plage flux</span>
        </div>
      </div>

      {/* Insights strip */}
      <div className="grid grid-cols-3 gap-2 pt-3">
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] font-bold mb-0.5">vs formule</p>
          <p className={`text-[12px] font-black tabular-nums ${deltaVsFormula >= 0 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
            {deltaVsFormula >= 0 ? '+' : ''}{deltaVsFormula} kcal
          </p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] font-bold mb-0.5">Apport moy.</p>
          <p className="text-[12px] font-black text-white tabular-nums">
            {latest.avg_intake_kcal.toLocaleString('fr-FR')} kcal
          </p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-[0.1em] font-bold mb-0.5">Tendance</p>
          <p className={`text-[12px] font-black flex items-center gap-1 ${
            deltaTrend > 20 ? 'text-[#22c55e]' : deltaTrend < -20 ? 'text-[#f59e0b]' : 'text-white/50'
          }`}>
            {deltaTrend > 20
              ? <><TrendingUp size={12} /> Hausse</>
              : deltaTrend < -20
              ? <><TrendingDown size={12} /> Baisse</>
              : <><Minus size={12} /> Stable</>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
