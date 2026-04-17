'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from 'recharts'
import { Zap, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { IntelligenceResult, IntelligenceAlert } from '@/lib/programs/intelligence'

interface Props {
  result: IntelligenceResult
  weeks: number
  onAlertClick?: (alert: IntelligenceAlert) => void
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

const PIE_COLORS = ['#1f8a65', '#3b82f6', '#f59e0b', '#8b5cf6']

export default function ProgramIntelligencePanel({ result, onAlertClick }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [alertsExpanded, setAlertsExpanded] = useState(false)

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
    <div className="w-[280px] shrink-0 flex flex-col gap-3 sticky top-4">
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

          {/* Radar musculaire */}
          {Object.keys(result.distribution).length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2">Distribution musculaire</p>
              <ResponsiveContainer width="100%" height={160}>
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
          )}

          {/* Donut patterns */}
          {donutData.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2">Répartition patterns</p>
              <ResponsiveContainer width="100%" height={100}>
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
                      onClick={() => onAlertClick?.(alert)}
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
