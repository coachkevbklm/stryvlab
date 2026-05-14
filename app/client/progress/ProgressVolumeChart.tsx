'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TimelinePoint {
  date: string
  volume: number
}

interface Props {
  timeline: TimelinePoint[]
}

function shortDate(dateStr: string): string {
  if (typeof dateStr !== 'string') return ''
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`
  return `${Math.round(v)}kg`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-white/40 mb-1">{shortDate(label)}</p>
      <p className="text-[13px] font-black text-white font-mono">
        {formatVolume(payload[0].value)}
      </p>
    </div>
  )
}

export default function ProgressVolumeChart({ timeline }: Props) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart
          data={timeline}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="volGradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1f8a65" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1f8a65" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatVolume}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="#1f8a65"
            strokeWidth={2}
            fill="url(#volGradGreen)"
            dot={false}
            activeDot={{ r: 4, fill: '#1f8a65', stroke: '#121212', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
