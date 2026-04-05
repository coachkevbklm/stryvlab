'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Euro, TrendingUp, AlertCircle, Clock,
  Users, CreditCard, Plus, Loader2, X, Check,
  Download, Filter, ChevronDown, Receipt, Calendar,
  BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

type Kpis = {
  mrr: number; arr: number; totalRevenue: number; currentMonthRevenue: number
  pendingAmount: number; overdueAmount: number; activeSubscriptions: number
  pendingCount: number; overdueCount: number
}
type RevenuePoint = { month: string; amount: number }
type TopClient = { id: string; name: string; amount: number }
type Payment = {
  id: string; amount_eur: number; status: string; payment_method: string
  payment_date: string; due_date?: string | null; description?: string | null
  reference?: string | null
  client?: { id: string; first_name: string; last_name: string } | null
  subscription?: { id: string; formula?: { name: string; price_eur: number } | null } | null
}
type Formula = {
  id: string; name: string; description?: string | null; price_eur: number
  billing_cycle: string; features: string[]; color: string; is_active: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<string, string> = {
  one_time: 'unique', weekly: '/sem.', monthly: '/mois', quarterly: '/trim.', yearly: '/an',
}
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  paid:     { label: 'Payé',      cls: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700'    },
  failed:   { label: 'Échoué',    cls: 'bg-red-100 text-red-700'         },
  refunded: { label: 'Remboursé', cls: 'bg-gray-100 text-gray-500'       },
}
const METHOD_LABELS: Record<string, string> = {
  manual: 'Manuel', bank_transfer: 'Virement', card: 'Carte',
  cash: 'Espèces', stripe: 'Stripe', other: 'Autre',
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
  '07': 'Juil', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTH_LABELS[m]} ${y}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComptabilitePage() {
  const router = useRouter()

  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenuePoint[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showCreateFormula, setShowCreateFormula] = useState(false)

  // Add payment form
  const [payForm, setPayForm] = useState({
    client_search: '', client_id: '', client_name: '',
    amount_eur: '', status: 'paid', payment_method: 'manual',
    payment_date: new Date().toISOString().split('T')[0],
    description: '', reference: '',
  })
  const [paySaving, setPaySaving] = useState(false)

  // Formula form
  const [formulaForm, setFormulaForm] = useState({
    name: '', description: '', price_eur: '', billing_cycle: 'monthly',
    duration_months: '', features: '', color: '#6366f1',
  })
  const [formulaSaving, setFormulaSaving] = useState(false)

  // Clients list (for payment dropdown)
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterMonth) params.set('month', filterMonth)

    const [statsRes, paymentsRes, formulasRes, clientsRes] = await Promise.all([
      fetch('/api/comptabilite'),
      fetch(`/api/payments?${params.toString()}`),
      fetch('/api/formulas'),
      fetch('/api/clients'),
    ])

    if (statsRes.ok) {
      const d = await statsRes.json()
      setKpis(d.kpis)
      setRevenueByMonth(d.revenueByMonth ?? [])
      setTopClients(d.topClients ?? [])
    }
    if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments ?? [])
    if (formulasRes.ok) setFormulas((await formulasRes.json()).formulas ?? [])
    if (clientsRes.ok) setClients((await clientsRes.json()).clients ?? [])

    setLoading(false)
  }, [filterStatus, filterMonth])

  useEffect(() => { loadData() }, [loadData])

  // ── Add payment ────────────────────────────────────────────────────────────

  async function addPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payForm.client_id || !payForm.amount_eur) return
    setPaySaving(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: payForm.client_id,
        amount_eur: parseFloat(payForm.amount_eur),
        status: payForm.status,
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        description: payForm.description || null,
        reference: payForm.reference || null,
      }),
    })
    if (res.ok) {
      setShowAddPayment(false)
      setPayForm({ client_search: '', client_id: '', client_name: '', amount_eur: '', status: 'paid', payment_method: 'manual', payment_date: new Date().toISOString().split('T')[0], description: '', reference: '' })
      loadData()
    }
    setPaySaving(false)
  }

  // ── Create formula ─────────────────────────────────────────────────────────

  async function createFormula(e: React.FormEvent) {
    e.preventDefault()
    setFormulaSaving(true)
    const res = await fetch('/api/formulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formulaForm.name,
        description: formulaForm.description || null,
        price_eur: parseFloat(formulaForm.price_eur) || 0,
        billing_cycle: formulaForm.billing_cycle,
        duration_months: formulaForm.duration_months ? parseInt(formulaForm.duration_months) : null,
        features: formulaForm.features.split('\n').filter(f => f.trim()),
        color: formulaForm.color,
      }),
    })
    if (res.ok) {
      const { formula } = await res.json()
      setFormulas(prev => [formula, ...prev])
      setShowCreateFormula(false)
      setFormulaForm({ name: '', description: '', price_eur: '', billing_cycle: 'monthly', duration_months: '', features: '', color: '#6366f1' })
    }
    setFormulaSaving(false)
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  function exportCsv() {
    const rows = [
      ['Date', 'Client', 'Description', 'Méthode', 'Statut', 'Montant (€)'],
      ...payments.map(p => [
        p.payment_date,
        p.client ? `${p.client.first_name} ${p.client.last_name}` : '—',
        p.description ?? '—',
        METHOD_LABELS[p.payment_method] ?? p.payment_method,
        STATUS_CONFIG[p.status]?.label ?? p.status,
        Number(p.amount_eur).toFixed(2),
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const chartData = revenueByMonth.map(p => ({
    ...p, label: formatMonth(p.month),
  }))

  const filteredClients = payForm.client_search
    ? clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(payForm.client_search.toLowerCase())).slice(0, 5)
    : []

  return (
    <main className="min-h-screen bg-surface font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-secondary font-medium uppercase tracking-widest">Espace Coach</p>
            <h1 className="text-xl font-bold text-primary tracking-tight">Comptabilité</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateFormula(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-light shadow-soft-out rounded-xl text-sm font-semibold text-secondary hover:text-primary transition-colors">
            <CreditCard size={15} />
            Nouvelle formule
          </button>
          <button onClick={() => setShowAddPayment(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-accent transition-all shadow-lg">
            <Plus size={16} />
            Enregistrer un paiement
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto space-y-6">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* ── KPI STRIP ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="MRR" value={`${kpis?.mrr.toFixed(2) ?? '—'} €`}
                sub={`ARR: ${kpis?.arr.toFixed(0) ?? '—'} €`}
                icon={TrendingUp} iconColor="text-indigo-600"
              />
              <KpiCard
                label="Ce mois"
                value={`${kpis?.currentMonthRevenue.toFixed(2) ?? '—'} €`}
                sub={`Total: ${kpis?.totalRevenue.toFixed(0) ?? '—'} €`}
                icon={Euro} iconColor="text-emerald-600"
              />
              <KpiCard
                label="En attente"
                value={`${kpis?.pendingAmount.toFixed(2) ?? '—'} €`}
                sub={`${kpis?.pendingCount ?? 0} paiement(s)`}
                icon={Clock} iconColor="text-amber-600"
                alert={!!kpis?.pendingAmount}
              />
              <KpiCard
                label="Abonnements actifs"
                value={String(kpis?.activeSubscriptions ?? '—')}
                sub={`${kpis?.overdueAmount?.toFixed(2) ?? '0'} € en retard`}
                icon={Users} iconColor="text-primary"
                alert={!!kpis?.overdueAmount}
              />
            </div>

            {/* ── REVENUE CHART ───────────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl p-6 shadow-soft-out border border-white/60">
              <h3 className="text-sm font-bold text-primary mb-5">Revenus — 12 derniers mois</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v} €`} />
                  <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(2)} €`, 'Revenus']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', fontSize: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2}
                    fill="url(#revGrad)" dot={{ r: 3, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── TWO COLUMNS: Top clients + Formulas ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top clients */}
              <div className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <BarChart3 size={15} className="text-secondary/60" />
                  Top clients (CA total)
                </h3>
                {topClients.length === 0 ? (
                  <p className="text-sm text-secondary/40 italic text-center py-4">Aucune donnée</p>
                ) : (
                  <div className="space-y-3">
                    {topClients.map((c, i) => {
                      const maxAmt = topClients[0]?.amount ?? 1
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="text-xs font-black text-secondary/40 w-4">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <p className="text-sm font-semibold text-primary">{c.name}</p>
                              <p className="text-sm font-black text-primary font-mono">{c.amount.toFixed(2)} €</p>
                            </div>
                            <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full transition-all"
                                style={{ width: `${(c.amount / maxAmt) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Formulas */}
              <div className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                    <CreditCard size={15} className="text-secondary/60" />
                    Mes formules
                  </h3>
                  <button onClick={() => setShowCreateFormula(true)}
                    className="text-xs font-semibold text-accent hover:text-primary transition-colors flex items-center gap-1">
                    <Plus size={12} />
                    Nouvelle
                  </button>
                </div>
                {formulas.filter(f => f.is_active).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-secondary/40 italic mb-3">Aucune formule créée</p>
                    <button onClick={() => setShowCreateFormula(true)}
                      className="text-xs font-semibold text-accent hover:text-primary transition-colors">
                      + Créer ma première formule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formulas.filter(f => f.is_active).map(f => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-light border border-white/60">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{f.name}</p>
                          {f.description && <p className="text-xs text-secondary/60 truncate">{f.description}</p>}
                        </div>
                        <p className="text-sm font-black text-primary font-mono shrink-0">
                          {f.price_eur.toFixed(2)} €
                          <span className="text-xs font-normal text-secondary/50 ml-1">{BILLING_LABELS[f.billing_cycle]}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── PAYMENTS TABLE ───────────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl shadow-soft-out border border-white/60 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/60">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <Receipt size={15} className="text-secondary/60" />
                  Tous les paiements
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      showFilters ? 'bg-accent text-white border-accent' : 'bg-surface-light shadow-soft-out border-white/60 text-secondary hover:text-primary'
                    }`}>
                    <Filter size={13} />
                    Filtres
                  </button>
                  <button onClick={exportCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-light shadow-soft-out border border-white/60 text-secondary hover:text-primary transition-colors">
                    <Download size={13} />
                    Export CSV
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="p-4 border-b border-white/60 bg-surface-light/50 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Statut</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="w-full h-9 px-3 bg-surface rounded-lg border border-white/60 text-sm text-primary outline-none">
                      <option value="all">Tous</option>
                      <option value="paid">Payé</option>
                      <option value="pending">En attente</option>
                      <option value="failed">Échoué</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Mois</label>
                    <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                      className="w-full h-9 px-3 bg-surface rounded-lg border border-white/60 text-sm text-primary outline-none" />
                  </div>
                </div>
              )}

              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt size={24} className="text-secondary/20 mx-auto mb-2" />
                  <p className="text-sm text-secondary/40 italic">Aucun paiement enregistré</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/60">
                      <th className="text-left px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Client</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 hidden md:table-cell">Description</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 hidden lg:table-cell">Méthode</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Statut</th>
                      <th className="text-right px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                      return (
                        <tr key={p.id} className="border-b border-white/40 last:border-0 hover:bg-surface-light/40 transition-colors">
                          <td className="px-5 py-3 text-xs text-secondary/70 font-medium whitespace-nowrap">
                            {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3">
                            {p.client ? (
                              <p className="text-sm font-semibold text-primary">
                                {p.client.first_name} {p.client.last_name}
                              </p>
                            ) : <span className="text-secondary/40">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-secondary/70 max-w-[200px] truncate">
                            {p.description ?? p.subscription?.formula?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-secondary/60">
                            {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-black text-primary font-mono">
                              {Number(p.amount_eur).toFixed(2)} €
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL: Add payment ───────────────────────────────────────────────── */}
      {showAddPayment && (
        <Modal title="Enregistrer un paiement" onClose={() => setShowAddPayment(false)}>
          <form onSubmit={addPayment} className="space-y-4">
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Client *</label>
              <input type="text" placeholder="Rechercher un client..."
                value={payForm.client_name || payForm.client_search}
                onChange={e => {
                  if (payForm.client_id) {
                    setPayForm(f => ({ ...f, client_id: '', client_name: '', client_search: e.target.value }))
                  } else {
                    setPayForm(f => ({ ...f, client_search: e.target.value }))
                  }
                }}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              {filteredClients.length > 0 && !payForm.client_id && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-white/60 overflow-hidden z-10">
                  {filteredClients.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => setPayForm(f => ({ ...f, client_id: c.id, client_name: `${c.first_name} ${c.last_name}`, client_search: '' }))}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-light transition-colors">
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Montant (€) *</label>
                <input type="number" step="0.01" required placeholder="0.00"
                  value={payForm.amount_eur} onChange={e => setPayForm(f => ({ ...f, amount_eur: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Statut</label>
                <select value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Méthode</label>
                <select value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="manual">Manuel</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="card">Carte</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Date</label>
                <input type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Description</label>
              <input type="text" placeholder="Ex: Coaching Novembre" value={payForm.description}
                onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Référence</label>
              <input type="text" placeholder="N° de facture, réf. virement..." value={payForm.reference}
                onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </div>
            <button type="submit" disabled={paySaving || !payForm.client_id || !payForm.amount_eur}
              className="w-full h-11 flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {paySaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Enregistrer
            </button>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Create formula ────────────────────────────────────────────── */}
      {showCreateFormula && (
        <Modal title="Nouvelle formule" onClose={() => setShowCreateFormula(false)}>
          <form onSubmit={createFormula} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Nom *</label>
              <input type="text" required placeholder="Coaching Premium" value={formulaForm.name}
                onChange={e => setFormulaForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Prix (€)</label>
                <input type="number" step="0.01" placeholder="99.00" value={formulaForm.price_eur}
                  onChange={e => setFormulaForm(f => ({ ...f, price_eur: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Facturation</label>
                <select value={formulaForm.billing_cycle} onChange={e => setFormulaForm(f => ({ ...f, billing_cycle: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="one_time">Paiement unique</option>
                  <option value="weekly">Hebdo</option>
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Description</label>
              <input type="text" placeholder="Coaching personnalisé incluant..." value={formulaForm.description}
                onChange={e => setFormulaForm(f => ({ ...f, description: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Ce qui est inclus (une ligne par item)</label>
              <textarea value={formulaForm.features} onChange={e => setFormulaForm(f => ({ ...f, features: e.target.value }))}
                rows={3} placeholder={"Programme personnalisé\nSuivi hebdomadaire\nBilans mensuels"}
                className="w-full px-3 py-2 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none resize-none" />
            </div>
            <button type="submit" disabled={formulaSaving || !formulaForm.name}
              className="w-full h-11 flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {formulaSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Créer la formule
            </button>
          </form>
        </Modal>
      )}
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconColor, alert = false
}: {
  label: string; value: string; sub: string
  icon: React.ElementType; iconColor: string; alert?: boolean
}) {
  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-soft-out border flex items-center gap-4 ${alert ? 'border-amber-200' : 'border-white/60'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert ? 'bg-amber-50' : 'bg-surface-light shadow-soft-out'}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xl font-black text-primary font-mono">{value}</p>
        <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">{label}</p>
        <p className="text-[11px] text-secondary/50 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.18)] border border-white/60 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/60">
          <h3 className="text-sm font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-secondary hover:text-primary transition-colors">
            <X size={13} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
