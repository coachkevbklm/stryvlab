'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Plus, X, Edit2, Save, Loader2,
  Check, Users, Euro, BarChart3, Trash2, Eye, EyeOff,
  ChevronDown, ChevronRight, Tag, TrendingUp, AlertCircle
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Formula = {
  id: string
  name: string
  description: string | null
  price_eur: number
  billing_cycle: string
  duration_months: number | null
  features: string[]
  color: string
  is_active: boolean
  created_at: string
}

type Subscription = {
  id: string
  status: string
  client_id: string
  price_override_eur: number | null
  start_date: string
  client: { id: string; first_name: string; last_name: string; email: string | null } | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<string, string> = {
  one_time: 'Paiement unique', weekly: '/semaine', monthly: '/mois',
  quarterly: '/trimestre', yearly: '/an',
}
const BILLING_OPTIONS = [
  { value: 'one_time', label: 'Paiement unique' },
  { value: 'weekly',   label: 'Hebdomadaire' },
  { value: 'monthly',  label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'yearly',   label: 'Annuel' },
]
const SUB_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  active:    { label: 'Actif',    cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  trial:     { label: 'Essai',    cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400'    },
  paused:    { label: 'Pausé',    cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  cancelled: { label: 'Annulé',   cls: 'bg-red-100 text-red-700',         dot: 'bg-red-400'     },
  expired:   { label: 'Expiré',   cls: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400'    },
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6b7280',
]

type FormState = {
  name: string; description: string; price_eur: string; billing_cycle: string
  duration_months: string; features: string; color: string
}
const EMPTY_FORM: FormState = {
  name: '', description: '', price_eur: '', billing_cycle: 'monthly',
  duration_months: '', features: '', color: '#6366f1',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormulasPage() {
  const router = useRouter()

  const [formulas, setFormulas]     = useState<Formula[]>([])
  const [loading, setLoading]       = useState(true)
  const [mounted, setMounted]       = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // Create / Edit modal
  const [editTarget, setEditTarget] = useState<Formula | null>(null) // null = create
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)

  // Archive confirm
  const [archiveTarget, setArchiveTarget] = useState<Formula | null>(null)
  const [archiving, setArchiving]         = useState(false)

  // Subscribers panel
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [subscribers, setSubscribers]     = useState<Record<string, Subscription[]>>({})
  const [loadingSubs, setLoadingSubs]     = useState<string | null>(null)

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => { setMounted(true) }, [])

  const loadFormulas = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/formulas')
    if (res.ok) setFormulas((await res.json()).formulas ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadFormulas() }, [loadFormulas])

  // ── Load subscribers for a formula ────────────────────────────────────────

  async function loadSubscribers(formulaId: string) {
    if (subscribers[formulaId]) return
    setLoadingSubs(formulaId)
    // Fetch all active subscriptions — filter client-side by formula_id
    const res = await fetch(`/api/payments?client_id=all`) // fallback: get all clients
    // We need a dedicated endpoint; use the payments API with formula context
    // Instead, fetch subscriptions for each client is too expensive.
    // Use the comptabilite subscriptions data — fetch directly via supabase query
    const subsRes = await fetch(`/api/formulas/${formulaId}/subscribers`)
    if (subsRes.ok) {
      const data = await subsRes.json()
      setSubscribers(prev => ({ ...prev, [formulaId]: data.subscriptions ?? [] }))
    }
    setLoadingSubs(null)
  }

  async function toggleExpand(formulaId: string) {
    if (expandedId === formulaId) {
      setExpandedId(null)
      return
    }
    setExpandedId(formulaId)
    await loadSubscribers(formulaId)
  }

  // ── Create / Edit ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowModal(true)
  }

  function openEdit(f: Formula) {
    setEditTarget(f)
    setForm({
      name: f.name,
      description: f.description ?? '',
      price_eur: String(f.price_eur),
      billing_cycle: f.billing_cycle,
      duration_months: f.duration_months != null ? String(f.duration_months) : '',
      features: f.features.join('\n'),
      color: f.color,
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_eur: parseFloat(form.price_eur) || 0,
      billing_cycle: form.billing_cycle,
      duration_months: form.duration_months ? parseInt(form.duration_months) : null,
      features: form.features.split('\n').map(l => l.trim()).filter(Boolean),
      color: form.color,
    }

    const url = editTarget ? `/api/formulas/${editTarget.id}` : '/api/formulas'
    const method = editTarget ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setFormError(data.error ?? 'Erreur lors de la sauvegarde')
      setSaving(false)
      return
    }

    if (editTarget) {
      setFormulas(prev => prev.map(f => f.id === editTarget.id ? { ...f, ...data.formula } : f))
    } else {
      setFormulas(prev => [data.formula, ...prev])
    }

    setShowModal(false)
    setSaving(false)
  }

  // ── Archive / Restore ──────────────────────────────────────────────────────

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    const res = await fetch(`/api/formulas/${archiveTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !archiveTarget.is_active }),
    })
    if (res.ok) {
      const { formula } = await res.json()
      setFormulas(prev => prev.map(f => f.id === formula.id ? formula : f))
    }
    setArchiving(false)
    setArchiveTarget(null)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const active   = formulas.filter(f => f.is_active)
  const archived = formulas.filter(f => !f.is_active)
  const displayed = showArchived ? formulas : active

  const totalMrr = active.reduce((sum, f) => {
    const factor: Record<string, number> = { weekly: 4.33, monthly: 1, quarterly: 1/3, yearly: 1/12, one_time: 0 }
    return sum + f.price_eur * (factor[f.billing_cycle] ?? 0)
  }, 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  const setField = (k: keyof FormState, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <main className="min-h-screen bg-surface font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <p className="text-xs text-secondary font-medium uppercase tracking-widest">Espace Coach</p>
            <h1 className="text-xl font-bold text-primary tracking-tight">Mes Formules</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {archived.length > 0 && (
            <button onClick={() => setShowArchived(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                showArchived ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-light shadow-soft-out border-white/60 text-secondary hover:text-primary'
              }`}>
              {showArchived ? <Eye size={15} /> : <EyeOff size={15} />}
              {showArchived ? 'Masquer archivées' : `Archivées (${archived.length})`}
            </button>
          )}
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-accent transition-all shadow-lg">
            <Plus size={16} />
            Nouvelle formule
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1100px] mx-auto space-y-6">

        {/* STATS */}
        <div className={`grid grid-cols-3 gap-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { icon: CreditCard, label: 'Formules actives', value: active.length, color: 'text-indigo-600' },
            { icon: Users, label: 'Total formules', value: formulas.length, color: 'text-primary' },
            { icon: TrendingUp, label: 'MRR potentiel', value: `${totalMrr.toFixed(0)} €`, color: 'text-emerald-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-surface rounded-2xl px-5 py-4 shadow-soft-out border border-white/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-light shadow-soft-out flex items-center justify-center shrink-0">
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-2xl font-black text-primary font-mono">{value}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FORMULAS LIST */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface shadow-soft-out flex items-center justify-center mb-4">
              <CreditCard size={28} className="text-secondary/30" />
            </div>
            <p className="text-base font-bold text-primary mb-1">Aucune formule créée</p>
            <p className="text-sm text-secondary/60 mb-6">Créez vos offres de coaching pour les assigner à vos clients.</p>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-accent transition-all shadow-lg">
              <Plus size={16} />
              Créer ma première formule
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayed.map((formula, i) => {
              const subs = subscribers[formula.id] ?? []
              const activeSubs = subs.filter(s => s.status === 'active' || s.status === 'trial')
              const isExpanded = expandedId === formula.id

              return (
                <motion.div key={formula.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-surface rounded-2xl shadow-soft-out border overflow-hidden transition-all ${
                    formula.is_active ? 'border-white/60' : 'border-dashed border-gray-200 opacity-60'
                  }`}>

                  {/* Formula header */}
                  <div className="p-5 flex items-start gap-4">
                    {/* Color dot */}
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: formula.color + '20' }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formula.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-primary">{formula.name}</h2>
                            {!formula.is_active && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Archivée</span>
                            )}
                          </div>
                          {formula.description && (
                            <p className="text-sm text-secondary/70 mt-0.5 line-clamp-1">{formula.description}</p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-xl font-black text-primary font-mono">
                            {formula.price_eur.toFixed(2)} €
                          </p>
                          <p className="text-xs text-secondary/60 font-medium">
                            {BILLING_LABELS[formula.billing_cycle]}
                            {formula.duration_months && ` · ${formula.duration_months} mois`}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      {formula.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {formula.features.slice(0, 4).map((f, fi) => (
                            <span key={fi} className="flex items-center gap-1 text-[11px] text-secondary/70 bg-surface-light px-2 py-0.5 rounded-full border border-white/60">
                              <Check size={9} className="text-emerald-500 shrink-0" />
                              {f}
                            </span>
                          ))}
                          {formula.features.length > 4 && (
                            <span className="text-[11px] text-secondary/40 px-2 py-0.5">+{formula.features.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Footer row */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/60">
                        {/* Subscribers count */}
                        <button onClick={() => toggleExpand(formula.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors group">
                          <Users size={13} className="text-secondary/50 group-hover:text-primary transition-colors" />
                          <span>Clients</span>
                          {loadingSubs === formula.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : isExpanded
                              ? <ChevronDown size={11} />
                              : <ChevronRight size={11} />
                          }
                        </button>

                        <div className="flex-1" />

                        {/* Actions */}
                        <button onClick={() => openEdit(formula)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-light">
                          <Edit2 size={12} />
                          Modifier
                        </button>
                        <button onClick={() => setArchiveTarget(formula)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg ${
                            formula.is_active
                              ? 'text-secondary hover:text-amber-600 hover:bg-amber-50'
                              : 'text-secondary hover:text-emerald-600 hover:bg-emerald-50'
                          }`}>
                          {formula.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                          {formula.is_active ? 'Archiver' : 'Restaurer'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subscribers panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/60 bg-surface-light/60 px-5 py-4">
                          {loadingSubs === formula.id ? (
                            <div className="flex justify-center py-4">
                              <Loader2 size={18} className="animate-spin text-accent" />
                            </div>
                          ) : subs.length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-xs text-secondary/40 italic">Aucun client abonné à cette formule</p>
                              <button onClick={() => router.push('/coach/clients')}
                                className="mt-2 text-xs font-semibold text-accent hover:text-primary transition-colors">
                                Assigner depuis un dossier client →
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-3">
                                {subs.length} client{subs.length > 1 ? 's' : ''} — {activeSubs.length} actif{activeSubs.length > 1 ? 's' : ''}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {subs.map(sub => {
                                  const cfg = SUB_STATUS[sub.status] ?? SUB_STATUS.active
                                  const price = sub.price_override_eur ?? formula.price_eur
                                  return (
                                    <button key={sub.id}
                                      onClick={() => router.push(`/coach/clients/${sub.client_id}`)}
                                      className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-white/60 hover:shadow-soft-out hover:-translate-y-0.5 transition-all text-left group">
                                      {/* Avatar */}
                                      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-black text-xs"
                                        style={{ backgroundColor: formula.color }}>
                                        {sub.client ? `${sub.client.first_name[0]}${sub.client.last_name[0]}` : '?'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-primary truncate group-hover:text-accent transition-colors">
                                          {sub.client ? `${sub.client.first_name} ${sub.client.last_name}` : '—'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                                          {sub.price_override_eur != null && (
                                            <span className="text-[10px] text-secondary/50 font-mono">{price.toFixed(2)} €</span>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight size={13} className="text-secondary/30 shrink-0" />
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── MODAL CREATE / EDIT ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
              onClick={() => !saving && setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}>
              <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.18)] border border-white/60 w-full max-w-lg max-h-[90vh] overflow-y-auto">

                {/* Modal header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: form.color + '20' }}>
                      <CreditCard size={18} style={{ color: form.color }} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-primary">
                        {editTarget ? 'Modifier la formule' : 'Nouvelle formule'}
                      </h2>
                      <p className="text-xs text-secondary/60">
                        {editTarget ? `Édition de "${editTarget.name}"` : 'Définissez votre offre de coaching'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} disabled={saving}
                    className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-secondary hover:text-primary transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {formError && (
                  <div className="mx-8 mb-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-800 font-bold">{formError}</p>
                  </div>
                )}

                <form onSubmit={handleSave} className="px-8 pb-8 space-y-4">

                  {/* Nom */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Nom *</label>
                    <input type="text" required placeholder="Coaching Premium"
                      value={form.name} onChange={e => setField('name', e.target.value)}
                      className="ui-input-purity px-4 h-12 text-sm w-full" />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Description</label>
                    <input type="text" placeholder="Coaching personnalisé tout inclus"
                      value={form.description} onChange={e => setField('description', e.target.value)}
                      className="ui-input-purity px-4 h-12 text-sm w-full" />
                  </div>

                  {/* Prix + Cycle */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Prix (€) *</label>
                      <div className="relative">
                        <Euro size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" />
                        <input type="number" step="0.01" min="0" required placeholder="99.00"
                          value={form.price_eur} onChange={e => setField('price_eur', e.target.value)}
                          className="ui-input-purity pl-10 pr-4 h-12 text-sm font-mono w-full" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Facturation</label>
                      <select value={form.billing_cycle} onChange={e => setField('billing_cycle', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm w-full">
                        {BILLING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Durée d'engagement */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">
                      Durée d'engagement (mois) <span className="normal-case font-normal opacity-60">— laisser vide = sans engagement</span>
                    </label>
                    <input type="number" min="1" placeholder="3"
                      value={form.duration_months} onChange={e => setField('duration_months', e.target.value)}
                      className="ui-input-purity px-4 h-12 text-sm font-mono w-full" />
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Ce qui est inclus <span className="normal-case font-normal opacity-60">— une ligne par item</span></label>
                    <textarea value={form.features} onChange={e => setField('features', e.target.value)}
                      rows={4} placeholder={"Programme personnalisé\nSuivi hebdomadaire\nBilans mensuels\nAccès app client"}
                      className="ui-input-purity px-4 py-3 text-sm resize-none w-full" />
                  </div>

                  {/* Couleur */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Couleur</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PALETTE.map(c => (
                        <button key={c} type="button" onClick={() => setField('color', c)}
                          className={`w-7 h-7 rounded-full transition-transform border-2 ${
                            form.color === c ? 'scale-125 border-gray-400' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }} />
                      ))}
                      {/* Preview */}
                      <div className="ml-auto flex items-center gap-2 text-xs text-secondary/60 font-medium">
                        <div className="w-5 h-5 rounded-md" style={{ backgroundColor: form.color }} />
                        Aperçu
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={saving || !form.name || !form.price_eur}
                    className="w-full h-13 flex items-center justify-center gap-3 bg-primary hover:bg-accent text-white font-bold text-sm rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    style={{ height: '52px' }}>
                    {saving
                      ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
                      : <><Save size={16} /> {editTarget ? 'Enregistrer les modifications' : 'Créer la formule'}</>
                    }
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CONFIRM ARCHIVE ──────────────────────────────────────────────────── */}
      {archiveTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-primary mb-2">
              {archiveTarget.is_active ? 'Archiver la formule ?' : 'Restaurer la formule ?'}
            </h3>
            <p className="text-sm text-secondary mb-5">
              {archiveTarget.is_active
                ? <>La formule <span className="font-medium text-primary">"{archiveTarget.name}"</span> sera masquée du catalogue. Les abonnements existants ne sont pas affectés.</>
                : <>La formule <span className="font-medium text-primary">"{archiveTarget.name}"</span> sera de nouveau disponible à l'assignation.</>
              }
            </p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveTarget(null)}
                className="flex-1 py-2.5 rounded-btn bg-surface-light shadow-soft-out text-sm text-secondary hover:text-primary transition-colors font-medium">
                Annuler
              </button>
              <button onClick={handleArchive} disabled={archiving}
                className={`flex-1 py-2.5 rounded-btn text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md ${
                  archiveTarget.is_active ? 'bg-amber-500' : 'bg-emerald-500'
                }`}>
                {archiving ? <Loader2 size={14} className="animate-spin mx-auto" /> : archiveTarget.is_active ? 'Archiver' : 'Restaurer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
