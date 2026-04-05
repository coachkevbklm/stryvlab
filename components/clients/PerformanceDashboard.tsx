'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar, ReferenceLine, Area, AreaChart,
} from 'recharts'
import { Dumbbell, TrendingUp, Zap, Clock, Target, Activity, ChevronDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type Period = 7 | 30 | 90 | 0
type Metric = 'volume' | 'reps' | 'sets'

interface KPIs {
  totalSessions: number
  completedSessions: number
  totalSets: number
  totalReps: number
  totalVolume: number
  avgDuration: number
}

interface TimelinePoint {
  date: string
  volume: number
  reps: number
  sets: number
  sessions: number
}

interface MuscleGroup {
  name: string
  volume: number
  sets: number
  reps: number
}

interface ExerciseSession {
  date: string
  maxWeight: number
  totalVolume: number
  totalReps: number
  sets: number
}

interface Exercise {
  name: string
  sessions: ExerciseSession[]
}

interface RpeTrend {
  date: string
  avgRpe: number
}

interface PerformanceData {
  kpis: KPIs
  timeline: TimelinePoint[]
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  rpeTrend: RpeTrend[]
}

// ── Helpers ────────────────────────────────────────────────────
const PERIOD_LABELS: Record<Period, string> = { 7: '7 jours', 30: '30 jours', 90: '90 jours', 0: 'Tout' }
const METRIC_LABELS: Record<Metric, string> = { volume: 'Volume (kg)', reps: 'Répétitions', sets: 'Séries' }
const METRIC_COLOR: Record<Metric, string> = { volume: '#6366f1', reps: '#10b981', sets: '#f59e0b' }

const MUSCLE_COLORS: Record<string, string> = {
  'Jambes': '#6366f1', 'Pectoraux': '#10b981', 'Dos': '#3b82f6',
  'Épaules': '#f59e0b', 'Biceps': '#ec4899', 'Triceps': '#8b5cf6',
  'Abdos': '#14b8a6', 'Mollets': '#f97316', 'Autre': '#94a3b8',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}kg`
}

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-surface rounded-card shadow-soft-out p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-primary font-mono mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Custom radar tooltip
function RadarTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface shadow-soft-out rounded-btn px-3 py-2 text-xs border border-white/40">
      <p className="font-bold text-primary mb-1">{payload[0]?.payload?.name}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name} : <span className="font-mono font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

// Custom line tooltip
function LineTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface shadow-soft-out rounded-btn px-3 py-2 text-xs border border-white/40">
      <p className="font-bold text-primary mb-1">{formatDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name} : <span className="font-mono font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function PerformanceDashboard({ clientId }: { clientId: string }) {
  const [period, setPeriod] = useState<Period>(30)
  const [metric, setMetric] = useState<Metric>('volume')
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/clients/${clientId}/performance?days=${period}`)
    const d = await res.json()
    setData(d)
    if (!selectedExercise && d.exercises?.[0]) setSelectedExercise(d.exercises[0].name)
    setLoading(false)
  }, [clientId, period])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const { kpis, timeline, muscleGroups, exercises, rpeTrend } = data

  // Normaliser les données radar (0–100)
  const maxValues = {
    volume: Math.max(...muscleGroups.map(m => m.volume), 1),
    sets: Math.max(...muscleGroups.map(m => m.sets), 1),
    reps: Math.max(...muscleGroups.map(m => m.reps), 1),
  }
  const radarData = muscleGroups.map(m => ({
    name: m.name,
    Volume: Math.round((m.volume / maxValues.volume) * 100),
    Séries: Math.round((m.sets / maxValues.sets) * 100),
    Reps: Math.round((m.reps / maxValues.reps) * 100),
    _raw: m,
  }))

  const selectedEx = exercises.find(e => e.name === selectedExercise)

  const isEmpty = kpis.totalSessions === 0

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filtres ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Période */}
        <div className="flex items-center bg-surface-light shadow-soft-in rounded-btn p-1 gap-1">
          {([7, 30, 90, 0] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                period === p ? 'bg-accent text-white shadow' : 'text-secondary hover:text-primary'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Métrique */}
        <div className="flex items-center bg-surface-light shadow-soft-in rounded-btn p-1 gap-1">
          {(['volume', 'reps', 'sets'] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                metric === m ? 'text-white shadow' : 'text-secondary hover:text-primary'
              }`}
              style={metric === m ? { backgroundColor: METRIC_COLOR[m] } : {}}
            >
              {METRIC_LABELS[m].split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-surface rounded-card shadow-soft-out p-16 text-center">
          <Dumbbell size={40} className="text-secondary mx-auto mb-4 opacity-20" />
          <p className="text-sm text-secondary">Aucune séance sur cette période.</p>
          <p className="text-xs text-secondary/60 mt-1">Le client doit commencer à logger ses séances.</p>
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard label="Séances" value={String(kpis.totalSessions)} sub={`${kpis.completedSessions} complétées`} icon={Dumbbell} color="#6366f1" />
            <KpiCard label="Volume total" value={formatVolume(kpis.totalVolume)} sub="kg soulevés" icon={TrendingUp} color="#10b981" />
            <KpiCard label="Sets complétés" value={String(kpis.totalSets)} icon={Target} color="#f59e0b" />
            <KpiCard label="Répétitions" value={kpis.totalReps.toLocaleString('fr-FR')} icon={Activity} color="#3b82f6" />
            <KpiCard label="Durée moy." value={kpis.avgDuration ? `${kpis.avgDuration} min` : '—'} icon={Clock} color="#ec4899" />
            <KpiCard label="Intensité" value={rpeTrend.length ? `RPE ${(rpeTrend.reduce((a, r) => a + r.avgRpe, 0) / rpeTrend.length).toFixed(1)}` : '—'} sub="moyenne" icon={Zap} color="#f97316" />
          </div>

          {/* ── Volume / Reps / Sets Timeline ── */}
          <div className="bg-surface rounded-card shadow-soft-out p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-primary text-sm">Évolution — {METRIC_LABELS[metric]}</h3>
                <p className="text-xs text-secondary mt-0.5">{timeline.length} jours d'activité</p>
              </div>
            </div>
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeline} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={METRIC_COLOR[metric]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={METRIC_COLOR[metric]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={metric === 'volume' ? formatVolume : undefined}
                  />
                  <Tooltip content={<LineTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    name={METRIC_LABELS[metric]}
                    stroke={METRIC_COLOR[metric]}
                    fill="url(#metricGradient)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: METRIC_COLOR[metric], strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-secondary text-center py-10">Pas assez de données</p>
            )}
          </div>

          {/* ── Radar + RPE ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar groupes musculaires */}
            <div className="bg-surface rounded-card shadow-soft-out p-5">
              <h3 className="font-bold text-primary text-sm mb-1">Répartition musculaire</h3>
              <p className="text-xs text-secondary mb-4">Score normalisé par groupe (0–100)</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Volume" dataKey="Volume" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Séries" dataKey="Séries" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} />
                    <Tooltip content={<RadarTooltipContent />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-secondary text-center py-10">Pas assez de données</p>
              )}
            </div>

            {/* RPE trend */}
            <div className="bg-surface rounded-card shadow-soft-out p-5">
              <h3 className="font-bold text-primary text-sm mb-1">Intensité perçue (RPE)</h3>
              <p className="text-xs text-secondary mb-4">Moyenne par séance · Zone cible 7–8</p>
              {rpeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={rpeTrend} margin={{ top: 10, right: 5, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 8, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip content={<LineTooltipContent />} />
                    <ReferenceLine y={7} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '7', position: 'right', fontSize: 9, fill: '#10b981' }} />
                    <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '8', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
                    <Line type="monotone" dataKey="avgRpe" name="RPE moy." stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-secondary text-center py-10">Aucune donnée RPE</p>
              )}
            </div>
          </div>

          {/* ── Volume par groupe musculaire (bar) ── */}
          <div className="bg-surface rounded-card shadow-soft-out p-5">
            <h3 className="font-bold text-primary text-sm mb-1">Volume par groupe musculaire</h3>
            <p className="text-xs text-secondary mb-5">Total kg soulevés · cliquer sur une barre pour filtrer</p>
            {muscleGroups.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[...muscleGroups].sort((a, b) => b[metric] - a[metric])}
                  margin={{ top: 0, right: 5, bottom: 0, left: 0 }}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={metric === 'volume' ? formatVolume : undefined}
                  />
                  <Tooltip content={<LineTooltipContent />} />
                  <Bar
                    dataKey={metric}
                    name={METRIC_LABELS[metric]}
                    radius={[4, 4, 0, 0]}
                    fill={METRIC_COLOR[metric]}
                    fillOpacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-secondary text-center py-8">Pas assez de données</p>
            )}
          </div>

          {/* ── Progression par exercice ── */}
          <div className="bg-surface rounded-card shadow-soft-out p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-primary text-sm">Progression par exercice</h3>
                <p className="text-xs text-secondary mt-0.5">Évolution du poids max par séance</p>
              </div>
              {exercises.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedExercise ?? ''}
                    onChange={e => setSelectedExercise(e.target.value)}
                    className="appearance-none bg-surface-light shadow-soft-in rounded-btn pl-3 pr-8 py-2 text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
                  >
                    {exercises.map(ex => (
                      <option key={ex.name} value={ex.name}>{ex.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
              )}
            </div>
            {selectedEx && selectedEx.sessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selectedEx.sessions} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<LineTooltipContent />} />
                  <Line type="monotone" dataKey="maxWeight" name="Poids max (kg)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="totalVolume" name="Volume total (kg)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-secondary text-center py-8">Sélectionne un exercice</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
