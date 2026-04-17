'use client'

import type { HeatmapDay } from './page'
import { useClientT } from '@/components/client/ClientI18nProvider'

interface Props {
  data: HeatmapDay[]  // 84 days exactly
}

const LEVEL_COLOR: Record<number, string> = {
  0: 'rgba(255,255,255,0.05)',
  1: 'rgba(31,138,101,0.18)',
  2: 'rgba(31,138,101,0.42)',
  3: 'rgba(31,138,101,0.68)',
  4: 'rgba(31,138,101,1)',
}

const SHOW_DAY  = [true, false, true, false, true, false, true]

const CELL  = 12   // cell width & height in px — MUST be equal
const GAP   = 3    // gap between cells in px
const LABEL = 12   // day-label column width in px

function fmtDate(d: string) {
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}
function fmtVol(v: number) {
  if (v === 0) return 'Repos'
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}kg`
}

export default function ProgressHeatmap({ data }: Props) {
  const { ta } = useClientT()
  const MONTHS = ta('progress.heatmap.months')
  const DAY_ABBR = ta('progress.heatmap.days')

  // Pad so grid starts on Monday
  const firstDate   = data[0] ? new Date(data[0].date + 'T00:00:00') : new Date()
  const firstWkday  = (firstDate.getDay() + 6) % 7  // Mon=0 … Sun=6

  const padded: (HeatmapDay | null)[] = [
    ...Array(firstWkday).fill(null),
    ...data,
  ]

  // Split into weeks (columns of 7 rows)
  const weeks: (HeatmapDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const numWeeks = weeks.length

  // Compute SVG dimensions
  const svgW = LABEL + GAP + numWeeks * CELL + (numWeeks - 1) * GAP
  const svgH = 14 + 7 * CELL + 6 * GAP   // 14px for month labels row

  // Month labels: show when first real day of week changes month
  const monthLabelItems: { x: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find(d => d != null)
    if (!first) return
    const m = new Date(first.date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      const x = LABEL + GAP + wi * (CELL + GAP)
      monthLabelItems.push({ x, label: MONTHS[m] })
      lastMonth = m
    }
  })

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 overflow-x-auto">
      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block', minWidth: '100%' }}
        aria-label="Heatmap d'activité"
      >
        {/* Month labels */}
        {monthLabelItems.map(({ x, label }, i) => (
          <text
            key={i}
            x={x}
            y={9}
            fontSize={9}
            fill="rgba(255,255,255,0.30)"
            fontFamily="inherit"
          >
            {label}
          </text>
        ))}

        {/* Day labels */}
        {DAY_ABBR.map((abbr, di) => {
          if (!SHOW_DAY[di]) return null
          const y = 14 + di * (CELL + GAP) + CELL / 2 + 1
          return (
            <text
              key={di}
              x={LABEL - 2}
              y={y}
              fontSize={8}
              fill="rgba(255,255,255,0.22)"
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="inherit"
            >
              {abbr}
            </text>
          )
        })}

        {/* Cells */}
        {weeks.map((week, wi) => {
          const cx = LABEL + GAP + wi * (CELL + GAP)
          return week.map((day, di) => {
            const cy = 14 + di * (CELL + GAP)
            if (!day) {
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={cx}
                  y={cy}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill="transparent"
                />
              )
            }
            return (
              <rect
                key={`${wi}-${di}`}
                x={cx}
                y={cy}
                width={CELL}
                height={CELL}
                rx={2}
                fill={LEVEL_COLOR[day.level]}
              >
                <title>{`${fmtDate(day.date)} — ${fmtVol(day.volume)}${day.sessions > 1 ? ` · ${day.sessions} séances` : ''}`}</title>
              </rect>
            )
          })
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Moins</span>
        {([0, 1, 2, 3, 4] as const).map(l => (
          <div
            key={l}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 2,
              backgroundColor: LEVEL_COLOR[l],
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Plus</span>
      </div>
    </div>
  )
}
