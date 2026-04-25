'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Zap, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { IntelligenceResult, IntelligenceAlert, TemplateMeta } from '@/lib/programs/intelligence'
import { VOLUME_SEGMENTS, VOLUME_GROUP_LABELS, getVolumeTargets } from '@/lib/programs/intelligence'

interface Props {
  result: IntelligenceResult
  weeks: number
  meta: TemplateMeta
  onAlertClick?: (sessionIndex: number, exerciseIndex: number) => void
}

const SUBSCORE_LABELS: Record<string, string> = {
  balance: 'Équilibre',
  recovery: 'Récupération',
  specificity: 'Cohérence objectif',
  progression: 'Progression',
  completeness: 'Couverture',
  redundancy: 'Diversité',
  jointLoad: 'Charge articulaire',
  coordination: 'Coordination',
  volumeCoverage: 'Volume MEV/MRV',
}

const SCORE_COLOR = (score: number) =>
  score >= 75 ? '#1f8a65' : score >= 50 ? '#f59e0b' : '#ef4444'

const SUBSCORE_ACCENT: Record<string, string> = {
  jointLoad: '#f97316',
  coordination: '#8b5cf6',
  volumeCoverage: '#3b82f6',
}

const SEVERITY_ICON = { critical: AlertCircle, warning: AlertTriangle, info: Info }
const SEVERITY_COLOR = { critical: 'text-red-400', warning: 'text-amber-400', info: 'text-white/40' }

// Muscles affichés dans le radar — 10 axes
const RADAR_MUSCLES: { key: string; label: string }[] = [
  { key: 'dos', label: 'Dos' },
  { key: 'pectoraux', label: 'Pecto' },
  { key: 'epaules', label: 'Épaules' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'quadriceps', label: 'Quad' },
  { key: 'ischio-jambiers', label: 'Ischio' },
  { key: 'fessiers', label: 'Fessiers' },
  { key: 'mollets', label: 'Mollets' },
  { key: 'abdos', label: 'Abdos' },
]

// Traduction slugs normalisés → français naturel (après normalizeFiberSlug côté moteur)
// Doit rester en sync avec BIOMECH_TO_FR dans scoring.ts
const FIBER_LABEL_FR: Record<string, string> = {
  // Fessiers
  grand_fessier: 'Grand fessier',
  moyen_fessier: 'Moyen fessier',
  petit_fessier: 'Petit fessier',
  fessiers: 'Fessiers',
  // Ischio-jambiers
  ischio_jambiers: 'Ischio-jambiers',
  'ischio-jambiers': 'Ischio-jambiers',
  biceps_femoral: 'Biceps fémoral',
  semi_membraneux: 'Semi-membraneux',
  semi_tendineux: 'Semi-tendineux',
  // Quadriceps
  quadriceps: 'Quadriceps',
  droit_femoral: 'Droit fémoral',
  vaste_lateral: 'Vaste latéral',
  vaste_medial: 'Vaste médial',
  // Dos
  grand_dorsal: 'Grand dorsal',
  dos_superieur: 'Dos sup.',
  dos: 'Dos',
  rhomboides: 'Rhomboïdes',
  trapeze: 'Trapèze',
  trapeze_superieur: 'Trapèze sup.',
  trapeze_moyen: 'Trapèze moy.',
  trapeze_inferieur: 'Trapèze inf.',
  erecteurs_rachis: 'Érecteurs rachis',
  lombaires: 'Lombaires',
  // Pectoraux
  grand_pectoral: 'Grand pectoral',
  grand_pectoral_sup: 'Grand pect. sup.',
  grand_pectoral_inf: 'Grand pect. inf.',
  petit_pectoral: 'Petit pectoral',
  pectoraux: 'Pectoraux',
  // Épaules
  deltoide_anterieur: 'Deltoïde ant.',
  deltoide_lateral: 'Deltoïde lat.',
  deltoide_posterieur: 'Deltoïde post.',
  coiffe_rotateurs: 'Coiffe rotateurs',
  subscapulaire: 'Subscapulaire',
  epaules: 'Épaules',
  // Bras
  biceps: 'Biceps',
  brachial_anterieur: 'Brachial ant.',
  brachio_radial: 'Brachio-radial',
  triceps: 'Triceps',
  // Mollets
  gastrocnemien: 'Gastrocnémien',
  soleaire: 'Soléaire',
  mollets: 'Mollets',
  // Core
  droit_abdominal: 'Droit abdominal',
  droit_abdominal_inf: 'Abdominaux inf.',
  obliques: 'Obliques',
  transverse: 'Transverse',
  sangle_abdominale: 'Sangle abdominale',
  abdos: 'Abdos',
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
  hip_abduction: 'Abduction', hip_adduction: 'Adduction',
  shoulder_rotation: 'Rot. épaule', scapular_retraction: 'Rétraction',
  scapular_protraction: 'Protraction',
}

const PIE_COLORS = ['#1f8a65', '#3b82f6', '#f59e0b', '#8b5cf6']

// Couleur de barre selon intensité relative (% du max dans la séance)
function barColor(pct: number): string {
  if (pct >= 60) return '#1f8a65'
  if (pct >= 30) return '#34d399'
  return '#6ee7b7'
}

function DonutChart({ data, colors, size }: { data: { name: string; value: number }[]; colors: string[]; size: number }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  if (total === 0) return null

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.46
  const innerR = size * 0.28
  const gap = 0.04 // radians gap between segments

  let angle = -Math.PI / 2
  const segments = data.map((d, i) => {
    const sweep = (d.value / total) * (Math.PI * 2) - gap
    const startAngle = angle + gap / 2
    const endAngle = startAngle + sweep

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(endAngle)
    const iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle)
    const iy2 = cy + innerR * Math.sin(startAngle)
    const largeArc = sweep > Math.PI ? 1 : 0

    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
    angle += (d.value / total) * Math.PI * 2
    return { path, color: colors[i % colors.length] }
  })

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} />
      ))}
    </svg>
  )
}

export default function ProgramIntelligencePanel({ result, meta, onAlertClick }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [alertsExpanded, setAlertsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const globalColor = SCORE_COLOR(result.globalScore)

  // Radar — normaliser sur le max pour que le graphe soit toujours lisible
  const radarRaw = RADAR_MUSCLES.map(({ key, label }) => ({
    muscle: label,
    volume: result.distribution[key] ?? 0,
  }))
  const radarMax = Math.max(...radarRaw.map(d => d.volume), 1)
  const radarData = radarRaw.map(d => ({
    muscle: d.muscle,
    volume: Math.round((d.volume / radarMax) * 100),
  }))

  // Donut patterns
  const donutData = [
    { name: 'Push', value: result.patternDistribution.push },
    { name: 'Pull', value: result.patternDistribution.pull },
    { name: 'Jambes', value: result.patternDistribution.legs },
    { name: 'Core', value: result.patternDistribution.core },
  ].filter(d => d.value > 0)

  const shownAlerts = alertsExpanded ? result.alerts.slice(0, 8) : result.alerts.slice(0, 3)

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header + score global ── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#1f8a65]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Smart Fit</p>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-white/30 hover:text-white/60">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

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
          {/* ── Grille subscores ── */}
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(result.subscores).map(([key, val]) => {
              const labelAccent = SUBSCORE_ACCENT[key]
              return (
                <div
                  key={key}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5"
                  style={labelAccent ? { borderColor: `${labelAccent}22` } : undefined}
                >
                  <p className="text-[18px] font-black leading-none" style={{ color: SCORE_COLOR(val) }}>
                    {val}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: labelAccent ? `${labelAccent}99` : 'rgba(255,255,255,0.4)' }}>
                    {SUBSCORE_LABELS[key] ?? key}
                  </p>
                </div>
              )
            })}
          </div>

          {/* ── Volume MEV/MAV/MRV par groupe musculaire ── */}
          {Object.keys(result.volumeByMuscle).length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-0.5">
                Volume hebdomadaire
              </p>
              <p className="text-[9px] text-white/25 mb-3">Sets équivalents · MEV / MAV / MRV</p>

              <div className="flex flex-col gap-4">
                {VOLUME_SEGMENTS.map(segment => {
                  const groups = segment.groups.filter(g => result.volumeByMuscle[g] != null)
                  if (groups.length === 0) return null
                  return (
                    <div key={segment.key}>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2">
                        {segment.label}
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {groups.map(group => {
                          const volume = result.volumeByMuscle[group] ?? 0
                          const [mev, mav, mrv] = getVolumeTargets(group, meta.goal, meta.level)
                          const label = VOLUME_GROUP_LABELS[group] ?? group.replace(/_/g, ' ')

                          const isUnderMev = volume < mev
                          const isOverMrv = volume > mrv
                          const isOverMav = volume > mav && !isOverMrv

                          const barColor = isOverMrv ? '#ef4444' : isOverMav ? '#f59e0b' : isUnderMev ? '#6b7280' : '#1f8a65'
                          const fillPct = Math.min((volume / mrv) * 100, 100)

                          return (
                            <div key={group}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] text-white/50">{label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-mono" style={{ color: barColor }}>
                                    {volume.toFixed(1)}
                                  </span>
                                  <span className="text-[8px] text-white/20 font-mono">
                                    /{mrv}
                                  </span>
                                </div>
                              </div>
                              {/* Barre segmentée MEV / MAV / MRV */}
                              <div className="relative h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
                                {/* Zone MEV (0→mev) en vert clair */}
                                <div
                                  className="absolute top-0 left-0 h-full rounded-full opacity-20"
                                  style={{ width: `${Math.min((mev / mrv) * 100, 100)}%`, backgroundColor: '#1f8a65' }}
                                />
                                {/* Zone MAV (mev→mav) en vert plus soutenu */}
                                <div
                                  className="absolute top-0 h-full rounded-full opacity-15"
                                  style={{
                                    left: `${(mev / mrv) * 100}%`,
                                    width: `${Math.min(((mav - mev) / mrv) * 100, 100 - (mev / mrv) * 100)}%`,
                                    backgroundColor: '#1f8a65',
                                  }}
                                />
                                {/* Volume réel */}
                                <motion.div
                                  className="absolute top-0 left-0 h-full rounded-full"
                                  style={{ backgroundColor: barColor }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${fillPct}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                              {/* Marqueurs MEV/MAV */}
                              <div className="relative mt-0.5 h-3">
                                <span
                                  className="absolute text-[7px] text-white/20 transform -translate-x-1/2"
                                  style={{ left: `${(mev / mrv) * 100}%` }}
                                >
                                  MEV
                                </span>
                                <span
                                  className="absolute text-[7px] text-white/20 transform -translate-x-1/2"
                                  style={{ left: `${(mav / mrv) * 100}%` }}
                                >
                                  MAV
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── KPIs globaux ── */}
          {result.programStats.totalSets > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2.5">Volume programme</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Séries/sem.', value: result.programStats.totalSets },
                  {
                    label: 'Reps est.', value: result.programStats.totalEstimatedReps >= 1000
                      ? `${(result.programStats.totalEstimatedReps / 1000).toFixed(1)}k`
                      : result.programStats.totalEstimatedReps
                  },
                  { label: 'Exercices', value: result.programStats.totalExercises },
                  { label: 'Exos/séance', value: result.programStats.avgExercisesPerSession },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.02] rounded-xl p-2 flex items-center justify-between gap-1.5">
                    <p className="text-[8px] text-white/40">{label}</p>
                    <p className="text-[14px] font-black text-white leading-none">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Radar distribution globale ── */}
          {mounted && radarRaw.some(d => d.volume > 0) && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1">
                Distribution musculaire
              </p>
              <p className="text-[9px] text-white/25 mb-3">Volume normalisé — programme complet</p>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="muscle"
                      tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.45)', fontWeight: 600 }}
                    />
                    <Radar
                      name="Volume"
                      dataKey="volume"
                      stroke="#1f8a65"
                      fill="#1f8a65"
                      fillOpacity={0.2}
                      strokeWidth={1.5}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0f0f0f', border: 'none', borderRadius: 8, fontSize: 10 }}
                      itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Donut patterns ── */}
          {donutData.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Patterns de mouvement</p>
              <div className="flex items-center gap-4">
                <DonutChart data={donutData} colors={PIE_COLORS} size={72} />
                <div className="flex flex-col gap-1.5 flex-1">
                  {donutData.map((d, i) => {
                    const total = donutData.reduce((a, b) => a + b.value, 0)
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                    return (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[9px] text-white/50 flex-1">{d.name}</span>
                        <span className="text-[9px] font-mono text-white/35">{d.value}s</span>
                        <span className="text-[9px] font-mono text-white/25 w-7 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Répartition par faisceau musculaire — par séance ── */}
          {result.programStats.sessionsStats.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-0.5">
                Volume par faisceau musculaire
              </p>
              <p className="text-[9px] text-white/25 mb-3">Par séance · volume pondéré (sets × coeff stimulus)</p>

              <div className="flex flex-col gap-4">
                {result.programStats.sessionsStats.map((s, i) => {
                  const fibers = Object.entries(s.fiberVolumes).sort(([, a], [, b]) => b - a)
                  if (fibers.length === 0) return null

                  const maxVol = fibers[0][1]

                  return (
                    <div key={i}>
                      {/* En-tête séance */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-white/70 truncate flex-1 mr-2">
                          {s.name || `Séance ${i + 1}`}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] text-white/30 font-mono">{s.totalSets}s</span>
                          <span className="text-[9px] text-white/15">·</span>
                          <span className="text-[9px] text-white/30 font-mono">{s.exerciseCount} ex.</span>
                        </div>
                      </div>

                      {/* Barres faisceaux */}
                      <div className="flex flex-col gap-1.5">
                        {fibers.map(([fiber, vol]) => {
                          const pct = maxVol > 0 ? Math.round((vol / maxVol) * 100) : 0
                          const label = FIBER_LABEL_FR[fiber] ?? fiber.replace(/_/g, ' ')
                          const color = barColor(pct)
                          return (
                            <div key={fiber} className="flex items-center gap-2">
                              <span
                                className="text-[9px] text-white/40 shrink-0 text-right"
                                style={{ width: 96 }}
                              >
                                {label}
                              </span>
                              <div className="flex-1 h-[6px] bg-white/[0.04] rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-white/25 w-8 text-right shrink-0">
                                {vol.toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Patterns de la séance */}
                      {s.patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.patterns.slice(0, 5).map(p => (
                            <span key={p} className="text-[8px] font-medium text-white/30 bg-white/[0.03] px-1.5 py-0.5 rounded">
                              {PATTERN_LABEL_FR[p] ?? p}
                            </span>
                          ))}
                          {s.patterns.length > 5 && (
                            <span className="text-[8px] text-white/20">+{s.patterns.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Séparateur entre séances */}
                      {i < result.programStats.sessionsStats.length - 1 && (
                        <div className="mt-3 h-px bg-white/[0.04]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Alertes ── */}
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
