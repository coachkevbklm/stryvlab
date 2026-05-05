'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import type { DashboardCoachData } from '@/components/dashboard/types'

const STORAGE_KEY = 'dashboard_summary_collapsed'

function KpiCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-1.5">{label}</p>
      <p className={`text-xl font-black leading-none ${accent ? 'text-[#1f8a65]' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function OrgCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-1.5">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-white/35 mt-1">{sub}</p>}
    </div>
  )
}

export default function SummaryPanel({ data }: { data: DashboardCoachData }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical').length
  const inactiveClients = data.clients.filter(c => c.status === 'inactive').length

  if (collapsed) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] px-5 h-12">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[9px] text-white/30 uppercase tracking-[0.12em]">MRR </span>
            <span className="text-[13px] font-bold text-white">{data.financial.mrr.toFixed(0)} €</span>
          </div>
          <div>
            <span className="text-[9px] text-white/30 uppercase tracking-[0.12em]">Clients </span>
            <span className="text-[13px] font-bold text-white">{data.hero.activeClients}</span>
          </div>
          {criticalAlerts > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-400" />
              <span className="text-[13px] font-bold text-amber-400">{criticalAlerts} alerte{criticalAlerts > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronDown size={14} />
          Voir le résumé
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-5 space-y-4">
      {/* Row 1 — KPIs Business */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-3">Business</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="MRR" value={`${data.financial.mrr.toFixed(0)} €`} accent />
          <KpiCard label="Clients actifs" value={data.hero.activeClients} />
          <KpiCard label="En attente" value={`${data.financial.pending.toFixed(0)} €`} />
          <KpiCard label="Ce mois" value={`${data.financial.revenueThisMonth.toFixed(0)} €`} />
        </div>
      </div>

      {/* Row 2 — Activité coaching */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-3">Activité coaching</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OrgCard label="Bilans sans réponse" value={data.hero.pendingSubmissions} sub="> 5 jours" />
          <OrgCard label="Clients inactifs" value={inactiveClients} sub="> 14 jours" />
          <OrgCard label="Alertes actives" value={data.hero.alertCount} />
        </div>
      </div>

      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors mx-auto"
      >
        <ChevronUp size={13} />
        Réduire le résumé
      </button>
    </div>
  )
}
