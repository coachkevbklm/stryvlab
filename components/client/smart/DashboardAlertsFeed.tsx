'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, MessageSquare, X } from 'lucide-react'
import { computeRecoveryAlerts, type CheckinData } from '@/lib/client/smart/recoveryAlerts'
import type { GenericAlert } from './SmartAlertsFeed'
import type { Notification } from './NotificationsBar'
import type { NutritionMacros } from './SmartNutritionWidget'

type UnifiedAlert = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  body?: string
  dismissable: boolean
  isCoach?: boolean
}

const SEVERITY_STYLE: Record<string, { bg: string; text: string; Icon: React.ElementType }> = {
  critical: { bg: 'bg-red-500/10',    text: 'text-red-400',    Icon: AlertCircle },
  warning:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  Icon: AlertTriangle },
  info:     { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   Icon: Info },
  coach:    { bg: 'bg-[#ffe01e]/10',  text: 'text-[#ffe01e]',  Icon: MessageSquare },
}

export type DashboardAlertsFeedProps = {
  coachNotifications: Notification[]
  morningCheckin: CheckinData | null
  workoutAlerts: GenericAlert[]
  consumed: NutritionMacros
  target: NutritionMacros
  plannedSessionToday: boolean
}

export default function DashboardAlertsFeed({
  coachNotifications,
  morningCheckin,
  workoutAlerts,
  consumed,
  target,
  plannedSessionToday,
}: DashboardAlertsFeedProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const key = `dashboard_alerts_dismissed_${new Date().toISOString().split('T')[0]}`
    try {
      const stored = localStorage.getItem(key)
      if (stored) setDismissed(new Set(JSON.parse(stored)))
    } catch { /* ignore */ }
  }, [])

  function dismiss(id: string) {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    const key = `dashboard_alerts_dismissed_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(key, JSON.stringify(Array.from(next)))
  }

  // ── Build unified alert list ──────────────────────────────────────────────
  const alerts: UnifiedAlert[] = []

  // 1. Coach notifications
  for (const n of coachNotifications) {
    alerts.push({ id: `coach_${n.id}`, severity: 'info', title: n.title, body: n.body ?? undefined, dismissable: false, isCoach: true })
  }

  // 2. Recovery alerts
  const recoveryAlerts = computeRecoveryAlerts(morningCheckin, plannedSessionToday)
  for (const r of recoveryAlerts) {
    if (r.type === 'recovery_ok' || r.type === 'optimal') continue
    alerts.push({ id: r.id, severity: r.severity, title: r.title, body: r.body, dismissable: true })
  }

  // 3. Workout alerts
  for (const a of workoutAlerts) {
    alerts.push({ id: a.code, severity: a.severity, title: a.title, body: a.body, dismissable: true })
  }

  // 4. Nutrition alerts (inline)
  const hour = new Date().getHours()
  if (hour >= 14 && target.protein_g > 0 && consumed.protein_g < target.protein_g * 0.5) {
    alerts.push({
      id: 'nutrition_protein_late',
      severity: 'warning',
      title: 'Protéines en retard',
      body: `${Math.round(consumed.protein_g)}g / ${target.protein_g}g — pense à une source protéinée`,
      dismissable: true,
    })
  }
  if (hour >= 12 && target.water_ml > 0 && consumed.water_ml < target.water_ml * 0.4) {
    alerts.push({
      id: 'nutrition_water_low',
      severity: 'warning',
      title: 'Hydratation faible',
      body: `${(consumed.water_ml / 1000).toFixed(1)}L / ${(target.water_ml / 1000).toFixed(1)}L`,
      dismissable: true,
    })
  }

  const visible = alerts.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  const shown = expanded ? visible : visible.slice(0, 4)
  const remaining = visible.length - 4

  return (
    <div className="space-y-2">
      {shown.map(a => {
        const cfg = SEVERITY_STYLE[a.isCoach ? 'coach' : a.severity]
        return (
          <div key={a.id} className="bg-[#161616] rounded-2xl border border-white/[0.08] p-3 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
              <cfg.Icon size={15} className={cfg.text} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white leading-tight">{a.title}</p>
              {a.body && <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{a.body}</p>}
            </div>
            {a.dismissable && (
              <button
                onClick={() => dismiss(a.id)}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}
      {!expanded && remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 hover:text-white/60 py-1 transition-colors"
        >
          +{remaining} alerte{remaining > 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}
