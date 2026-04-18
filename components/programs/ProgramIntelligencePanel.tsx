'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from 'recharts'
import { Zap, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, Dumbbell } from 'lucide-react'
import type { IntelligenceResult, IntelligenceAlert } from '@/lib/programs/intelligence'

interface Props {
  result: IntelligenceResult
  weeks: number
  onAlertClick?: (sessionIndex: number, exerciseIndex: number) => void
}

const SUBSCORE_LABELS: Record<string, string> = {
  balance: 'Équilibre',
  recovery: 'Récupération',
  specificity: 'Cohérence objectif',
  progression: 'Progression',
  completeness: 'Couverture',
  redundancy: 'Diversité',
}

const SCORE_COLOR = (score: number) =>
  score >= 75 ? '#1f8a65' : score >= 50 ? '#f59e0b' : '#ef4444'

const SEVERITY_ICON = { critical: AlertCircle, warning: AlertTriangle, info: Info }
const SEVERITY_COLOR = { critical: 'text-red-400', warning: 'text-amber-400', info: 'text-white/40' }

const RADAR_MUSCLE_LABELS: Record<string, string> = {
  dos: 'Dos', pectoraux: 'Pecto', epaules: 'Épaules',
  biceps: 'Biceps', triceps: 'Triceps', quadriceps: 'Quad',
  'ischio-jambiers': 'Ischio', fessiers: 'Fessiers',
  mollets: 'Mollets', abdos: 'Abdos',
}

const MUSCLE_LABEL_FR: Record<string, string> = {
  dos: 'Dos', pectoraux: 'Pectoraux', epaules: 'Épaules',
  biceps: 'Biceps', triceps: 'Triceps', quadriceps: 'Quadriceps',
  'ischio-jambiers': 'Ischio-jambiers', fessiers: 'Fessiers',
  mollets: 'Mollets', abdos: 'Abdos', lombaires: 'Lombaires',
  trapezes: 'Trapèzes',
}

const PATTERN_LABEL_FR: Record<string, string> = {
  horizontal_push: 'Push horiz.', vertical_push: 'Push vert.',
  horizontal_pull: 'Pull horiz.', vertical_pull: 'Pull vert.',
  squat_pattern: 'Squat', hip_hinge: 'Hip hinge',
  knee_flexion: 'Flex. genou', knee_extension: 'Ext. genou',
  elbow_flexion: 'Biceps', elbow_extension: 'Triceps',
  lateral_raise: 'Élév. lat.', calf_raise: 'Mollets',
  core_flex: 'Core', core_anti_flex: 'Gainage', core_rotation: 'Rotation',
  carry: 'Carry', scapular_elevation: 'Shrug',
}

const PIE_COLORS = ['#1f8a65', '#3b82f6', '#f59e0b', '#8b5cf6']

export default function ProgramIntelligencePanel({ result, onAlertClick }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [alertsExpanded, setAlertsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const globalColor = SCORE_COLOR(result.globalScore)

  // Radar data
  const radarData = Object.entries(RADAR_MUSCLE_LABELS).map(([key, label]) => ({
    muscle: label,
    volume: Math.round(result.distribution[key] ?? 0),
  }))

  // Donut data
  const donutData = [
    { name: 'Push', value: result.patternDistribution.push },
    { name: 'Pull', value: result.patternDistribution.pull },
    { name: 'Jambes', value: result.patternDistribution.legs },
    { name: 'Core', value: result.patternDistribution.core },
  ].filter(d => d.value > 0)

  const shownAlerts = alertsExpanded ? result.alerts.slice(0, 8) : result.alerts.slice(0, 3)

  return (
    <div className="flex flex-col gap-3">
      {/* Header + score */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#1f8a65]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Intelligence</p>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-white/30 hover:text-white/60">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Score global animé */}
        <div className="flex items-end gap-2 mb-2">
          <motion.span
            key={result.globalScore}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[2.4rem] font-black leading-none"
            style={{ color: globalColor }}
          >
            {result.globalScore}
          </motion.span>
          <span className="text-[13px] text-white/30 mb-1">/100</span>
        </div>

        {/* Barre segmentée subscores */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-3">
          {Object.entries(result.subscores).map(([key, val]) => (
            <div
              key={key}
              className="flex-1 rounded-full"
              style={{ backgroundColor: SCORE_COLOR(val), opacity: 0.7 + (val / 100) * 0.3 }}
              title={`${SUBSCORE_LABELS[key]}: ${val}`}
            />
          ))}
        </div>

        <p className="text-[11px] text-white/50 leading-relaxed">{result.globalNarrative}</p>
      </div>

      {!collapsed && (
        <>
          {/* Grille 2×3 subscores */}
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(result.subscores).map(([key, val]) => (
              <div key={key} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5">
                <p className="text-[18px] font-black leading-none" style={{ color: SCORE_COLOR(val) }}>
                  {val}
                </p>
                <p className="text-[9px] text-white/40 mt-0.5">{SUBSCORE_LABELS[key]}</p>
              </div>
            ))}
          </div>

          {/* KPIs globaux programme */}
          {result.programStats.totalSets > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2.5">Volume programme</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-white/[0.02] rounded-xl p-2">
                  <p className="text-[16px] font-black text-white leading-none">{result.programStats.totalSets}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">séries / sem.</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-2">
                  <p className="text-[16px] font-black text-white leading-none">
                    {result.programStats.totalEstimatedReps >= 1000
                      ? `${(result.programStats.totalEstimatedReps / 1000).toFixed(1)}k`
                      : result.programStats.totalEstimatedReps}
                  </p>
                  <p className="text-[8px] text-white/40 mt-0.5">reps est. / sem.</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-2">
                  <p className="text-[16px] font-black text-white leading-none">{result.programStats.totalExercises}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">exercices uniques</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-2">
                  <p className="text-[16px] font-black text-white leading-none">{result.programStats.avgExercisesPerSession}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">exos / séance moy.</p>
                </div>
              </div>
            </div>
          )}

          {/* Radar musculaire */}
          {mounted && Object.keys(result.distribution).length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2">Distribution musculaire</p>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} />
                    <Radar
                      name="Volume"
                      dataKey="volume"
                      stroke="#1f8a65"
                      fill="#1f8a65"
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Donut patterns */}
          {mounted && donutData.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2">Répartition patterns</p>
              <div style={{ width: '100%', height: 100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={44}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f0f0f', border: 'none', borderRadius: 8, fontSize: 10 }}
                      itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[9px] text-white/40">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats par séance */}
          {result.programStats.sessionsStats.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2.5">Détail par séance</p>
              <div className="flex flex-col gap-3">
                {result.programStats.sessionsStats.map((s, i) => {
                  const sessionTotalVol = Object.values(s.muscleVolumes).reduce((a, b) => a + b, 0)

                  return (
                    <div key={i} className="border-t border-white/[0.04] pt-2.5 first:border-0 first:pt-0">
                      {/* En-tête séance */}
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-white/70 truncate max-w-[140px]">
                          {s.name || `Séance ${i + 1}`}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-white/40 font-mono">{s.totalSets} s.</span>
                          <span className="text-[9px] text-white/25">·</span>
                          <span className="text-[9px] text-white/40 font-mono">{s.exerciseCount} ex.</span>
                        </div>
                      </div>

                      {/* Barres muscles top 3 */}
                      {s.topMuscles.length > 0 && (
                        <div className="flex flex-col gap-1 mb-1.5">
                          {s.topMuscles.map(muscle => {
                            const vol = s.muscleVolumes[muscle] ?? 0
                            const pct = sessionTotalVol > 0 ? Math.round((vol / sessionTotalVol) * 100) : 0
                            return (
                              <div key={muscle} className="flex items-center gap-1.5">
                                <span className="text-[9px] text-white/35 w-[56px] shrink-0 truncate">
                                  {MUSCLE_LABEL_FR[muscle] ?? muscle}
                                </span>
                                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#1f8a65]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-white/25 font-mono w-7 text-right">{pct}%</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Patterns présents */}
                      {s.patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.patterns.slice(0, 4).map(p => (
                            <span
                              key={p}
                              className="text-[9px] font-medium text-white/35 bg-white/[0.04] px-1.5 py-0.5 rounded"
                            >
                              {PATTERN_LABEL_FR[p] ?? p}
                            </span>
                          ))}
                          {s.patterns.length > 4 && (
                            <span className="text-[9px] text-white/20">+{s.patterns.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Alertes */}
          {result.alerts.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2">
                Alertes ({result.alerts.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {shownAlerts.map((alert, i) => {
                  const Icon = SEVERITY_ICON[alert.severity]
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (alert.sessionIndex !== undefined && alert.exerciseIndex !== undefined) {
                          onAlertClick?.(alert.sessionIndex, alert.exerciseIndex)
                        }
                      }}
                      className="flex items-start gap-2 text-left hover:bg-white/[0.03] rounded-lg p-1.5 transition-colors"
                    >
                      <Icon size={11} className={`${SEVERITY_COLOR[alert.severity]} mt-0.5 shrink-0`} />
                      <p className="text-[10px] text-white/60 leading-snug">{alert.title}</p>
                    </button>
                  )
                })}
              </div>
              {result.alerts.length > 3 && (
                <button
                  onClick={() => setAlertsExpanded(!alertsExpanded)}
                  className="text-[9px] text-white/30 hover:text-white/50 transition-colors mt-2"
                >
                  {alertsExpanded ? 'Voir moins' : `+${result.alerts.length - 3} alertes`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
