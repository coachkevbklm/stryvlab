'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'

interface TimelinePoint {
  date: string
  volume: number
  sessions: number
}

interface ExerciseProgression {
  name: string
  points: { date: string; maxWeight: number }[]
}

interface Props {
  timeline: TimelinePoint[]
  exerciseProgression: ExerciseProgression[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

function shortDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function ProgressCharts({ timeline, exerciseProgression }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Volume par séance */}
      <section className="bg-surface rounded-card p-4">
        <h2 className="text-sm font-semibold text-primary mb-4">Volume par séance (kg)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : v}
            />
            <Tooltip
              contentStyle={{ background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 12 }}
              labelFormatter={shortDate}
              formatter={(v: number) => [`${v} kg`, 'Volume']}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#volGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Progression par exercice */}
      {exerciseProgression.length > 0 && (
        <section className="bg-surface rounded-card p-4">
          <h2 className="text-sm font-semibold text-primary mb-4">Progression — charge max (kg)</h2>
          <div className="flex flex-col gap-6">
            {exerciseProgression.map((ex, i) => (
              <div key={ex.name}>
                <p className="text-xs text-secondary mb-2 truncate">{ex.name}</p>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={ex.points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 11 }}
                      labelFormatter={shortDate}
                      formatter={(v: number) => [`${v} kg`, 'Charge max']}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
