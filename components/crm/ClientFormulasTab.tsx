'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Plus, X, Edit2, Save, Loader2, Check,
  ChevronDown, Euro, Calendar, Clock, AlertCircle,
  CheckCircle2, Pause, Ban, RotateCcw, Receipt, ExternalLink
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Formula = {
  id: string
  name: string
  description?: string | null
  price_eur: number
  billing_cycle: string
  duration_months?: number | null
  features: string[]
  color: string
  is_active: boolean
}

type Subscription = {
  id: string
  status: string
  formula_id: string
  start_date: string
  end_date?: string | null
  next_billing_date?: string | null
  price_override_eur?: number | null
  notes?: string | null
  formula: Formula | null
}

type Payment = {
  id: string
  amount_eur: number
  status: string
  payment_method: string
  payment_date: string
  due_date?: string | null
  description?: string | null
  reference?: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<string, string> = {
  one_time: 'Paiement unique', weekly: '/semaine', monthly: '/mois',
  quarterly: '/trimestre', yearly: '/an',
}
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string; dot: string }> = {
  active:    { label: 'Actif',     icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  trial:     { label: 'Essai',     icon: Clock,        cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400'    },
  paused:    { label: 'Pausé',     icon: Pause,        cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  cancelled: { label: 'Annulé',    icon: Ban,          cls: 'bg-red-100 text-red-700',         dot: 'bg-red-400'     },
  expired:   { label: 'Expiré',    icon: RotateCcw,    cls: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400'    },
}
const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  paid:     { label: 'Payé',     cls: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  failed:   { label: 'Échoué',  cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'Remboursé', cls: 'bg-gray-100 text-gray-500' },
}
const METHOD_LABELS: Record<string, string> = {
  manual: 'Manuel', bank_transfer: 'Virement', card: 'Carte',
  cash: 'Espèces', stripe: 'Stripe', other: 'Autre',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientFormulasTab({ clientId }: { clientId: string }) {

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [allFormulas, setAllFormulas] = useState<Formula[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)

  // Modals state
  const [showAddSub, setShowAddSub] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null) // subscriptionId
  const [showCreateFormula, setShowCreateFormula] = useState(false)

  // Add subscription form
  const [subForm, setSubForm] = useState({
    formula_id: '', status: 'active', start_date: new Date().toISOString().split('T')[0],
    end_date: '', next_billing_date: '', price_override_eur: '', notes: '',
  })
  const [subSaving, setSubSaving] = useState(false)

  // Add payment form
  const [payForm, setPayForm] = useState({
    amount_eur: '', status: 'paid', payment_method: 'manual',
    payment_date: new Date().toISOString().split('T')[0],
    due_date: '', description: '', reference: '',
  })
  const [paySaving, setPaySaving] = useState(false)
  const [stripeLoading, setStripeLoading] = useState<string | null>(null) // subscriptionId en cours

  // Create formula form
  const [formulaForm, setFormulaForm] = useState({
    name: '', description: '', price_eur: '', billing_cycle: 'monthly',
    duration_months: '', features: '', color: '#6366f1',
  })
  const [formulaSaving, setFormulaSaving] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    const [subsRes, formulasRes, paymentsRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/subscriptions`),
      fetch('/api/formulas'),
      fetch(`/api/payments?client_id=${clientId}`),
    ])
    if (subsRes.ok) setSubscriptions((await subsRes.json()).subscriptions ?? [])
    if (formulasRes.ok) setAllFormulas((await formulasRes.json()).formulas ?? [])
    if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  // ── Add subscription ───────────────────────────────────────────────────────

  async function addSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!subForm.formula_id) return
    setSubSaving(true)
    const res = await fetch(`/api/clients/${clientId}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...subForm,
        price_override_eur: subForm.price_override_eur ? parseFloat(subForm.price_override_eur) : null,
        end_date: subForm.end_date || null,
        next_billing_date: subForm.next_billing_date || null,
        notes: subForm.notes || null,
      }),
    })
    if (res.ok) {
      const { subscription } = await res.json()
      setSubscriptions(prev => [subscription, ...prev])
      setShowAddSub(false)
      setSubForm({ formula_id: '', status: 'active', start_date: new Date().toISOString().split('T')[0], end_date: '', next_billing_date: '', price_override_eur: '', notes: '' })
    }
    setSubSaving(false)
  }

  // ── Cancel subscription ────────────────────────────────────────────────────

  async function cancelSubscription(subId: string) {
    const res = await fetch(`/api/subscriptions/${subId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s))
    }
  }

  // ── Stripe checkout ────────────────────────────────────────────────────────

  async function sendStripeCheckout(sub: Subscription) {
    if (!sub.formula) return
    setStripeLoading(sub.id)
    try {
      const res = await fetch('/api/stripe/coaching/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:       clientId,
          subscription_id: sub.id,
          formula_id:      sub.formula_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Erreur Stripe')
        return
      }
      // Ouvre le lien Stripe dans un nouvel onglet (coach envoie le lien au client,
      // ou copie l'URL pour la partager)
      window.open(data.url, '_blank')
    } catch {
      alert('Erreur réseau')
    } finally {
      setStripeLoading(null)
    }
  }

  // ── Add payment ────────────────────────────────────────────────────────────

  async function addPayment(e: React.FormEvent, subId: string) {
    e.preventDefault()
    if (!payForm.amount_eur) return
    setPaySaving(true)

    const sub = subscriptions.find(s => s.id === subId)
    const res = await fetch(`/api/subscriptions/${subId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        amount_eur: parseFloat(payForm.amount_eur),
        status: payForm.status,
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        due_date: payForm.due_date || null,
        description: payForm.description || null,
        reference: payForm.reference || null,
      }),
    })
    if (res.ok) {
      const { payment } = await res.json()
      setPayments(prev => [payment, ...prev])
      setShowAddPayment(null)
      setPayForm({ amount_eur: '', status: 'paid', payment_method: 'manual', payment_date: new Date().toISOString().split('T')[0], due_date: '', description: '', reference: '' })
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
      setAllFormulas(prev => [formula, ...prev])
      setShowCreateFormula(false)
      setFormulaForm({ name: '', description: '', price_eur: '', billing_cycle: 'monthly', duration_months: '', features: '', color: '#6366f1' })
    }
    setFormulaSaving(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  const subPayments = (subId: string) => payments.filter(p => {
    // Associate payments with subscriptions via API (we fetch all client payments)
    return true // show all client payments in each sub's history for now
  })

  const clientPayments = payments

  return (
    <div className="space-y-6">

      {/* ── Subscriptions ───────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-secondary/60" />
            <h3 className="text-sm font-bold text-primary">Formules souscrites</h3>
          </div>
          <button
            onClick={() => setShowAddSub(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-primary transition-colors"
          >
            <Plus size={13} />
            Ajouter une formule
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={24} className="text-secondary/20 mx-auto mb-2" />
            <p className="text-sm text-secondary/40 italic">Aucune formule souscrite</p>
            <button onClick={() => setShowAddSub(true)}
              className="mt-3 text-xs font-semibold text-accent hover:text-primary transition-colors">
              + Assigner une formule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(sub => {
              const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.active
              const StatusIcon = cfg.icon
              const price = sub.price_override_eur ?? sub.formula?.price_eur ?? 0
              const isExpanded = expandedSub === sub.id

              return (
                <div key={sub.id} className="rounded-xl border border-white/60 overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-surface-light cursor-pointer hover:bg-surface transition-colors"
                    onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.formula?.color ?? '#6366f1' }} />
                      <div>
                        <p className="text-sm font-bold text-primary">{sub.formula?.name ?? 'Formule inconnue'}</p>
                        <p className="text-xs text-secondary/60">
                          Depuis le {new Date(sub.start_date).toLocaleDateString('fr-FR')}
                          {sub.end_date && ` → ${new Date(sub.end_date).toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-primary font-mono">
                        {price.toFixed(2)} €
                        <span className="text-xs font-normal text-secondary/60 ml-1">
                          {BILLING_LABELS[sub.formula?.billing_cycle ?? 'monthly']}
                        </span>
                      </p>
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </span>
                      <ChevronDown size={14} className={`text-secondary/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-white/60 space-y-4">
                      {/* Formula details */}
                      {sub.formula?.features && sub.formula.features.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-2">Inclus</p>
                          <ul className="space-y-1">
                            {sub.formula.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-secondary">
                                <Check size={11} className="text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next billing */}
                      {sub.next_billing_date && sub.status === 'active' && (
                        <div className="flex items-center gap-2 text-xs text-secondary bg-blue-50 rounded-lg p-2.5">
                          <Calendar size={12} className="text-blue-500 shrink-0" />
                          Prochain paiement le <strong>{new Date(sub.next_billing_date).toLocaleDateString('fr-FR')}</strong>
                        </div>
                      )}

                      {/* Notes */}
                      {sub.notes && (
                        <p className="text-xs text-secondary/70 italic">{sub.notes}</p>
                      )}

                      {/* Actions */}
                      {sub.status === 'active' && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {/* Stripe — si la formule n'est pas one_time */}
                          {sub.formula?.billing_cycle !== 'one_time' && (
                            <button
                              onClick={() => sendStripeCheckout(sub)}
                              disabled={stripeLoading === sub.id}
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#635BFF] rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                              title="Créer un lien de paiement Stripe pour ce client"
                            >
                              {stripeLoading === sub.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <ExternalLink size={12} />
                              }
                              Lien Stripe
                            </button>
                          )}
                          <button
                            onClick={() => setShowAddPayment(sub.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
                          >
                            <Euro size={12} />
                            Paiement manuel
                          </button>
                          <button
                            onClick={() => cancelSubscription(sub.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2 hover:bg-red-100 transition-colors"
                          >
                            <X size={12} />
                            Résilier
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Payments history ─────────────────────────────────────────────────── */}
      {clientPayments.length > 0 && (
        <div className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60">
          <div className="flex items-center gap-2 mb-5">
            <Receipt size={15} className="text-secondary/60" />
            <h3 className="text-sm font-bold text-primary">Historique des paiements</h3>
          </div>
          <div className="space-y-2">
            {clientPayments.map(payment => {
              const pCfg = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.pending
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-light border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${payment.status === 'paid' ? 'bg-emerald-400' : payment.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-primary">{payment.description || METHOD_LABELS[payment.payment_method]}</p>
                      <p className="text-xs text-secondary/60">
                        {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                        {payment.reference && <span className="ml-2 text-secondary/40">Réf. {payment.reference}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pCfg.cls}`}>{pCfg.label}</span>
                    <p className="text-sm font-black text-primary font-mono">{Number(payment.amount_eur).toFixed(2)} €</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: Add subscription ──────────────────────────────────────────── */}
      {showAddSub && (
        <Modal title="Assigner une formule" onClose={() => setShowAddSub(false)}>
          <form onSubmit={addSubscription} className="space-y-4">
            <FormField label="Formule *">
              <div className="flex gap-2">
                <select required value={subForm.formula_id} onChange={e => setSubForm(f => ({ ...f, formula_id: e.target.value }))}
                  className="flex-1 h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="">— Choisir une formule</option>
                  {allFormulas.filter(f => f.is_active).map(f => (
                    <option key={f.id} value={f.id}>{f.name} — {f.price_eur} €{BILLING_LABELS[f.billing_cycle]}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCreateFormula(true)}
                  className="h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-xs font-semibold text-accent hover:text-primary transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Statut">
                <select value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="paused">Pausé</option>
                </select>
              </FormField>
              <FormField label="Prix personnalisé (€)">
                <input type="number" step="0.01" placeholder="Laisser vide = prix formule"
                  value={subForm.price_override_eur} onChange={e => setSubForm(f => ({ ...f, price_override_eur: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              </FormField>
              <FormField label="Date de début">
                <input type="date" value={subForm.start_date} onChange={e => setSubForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              </FormField>
              <FormField label="Prochain paiement">
                <input type="date" value={subForm.next_billing_date} onChange={e => setSubForm(f => ({ ...f, next_billing_date: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Conditions particulières..."
                className="w-full px-3 py-2 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none resize-none" />
            </FormField>
            <button type="submit" disabled={subSaving || !subForm.formula_id}
              className="w-full h-11 flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {subSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Assigner la formule
            </button>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Add payment ───────────────────────────────────────────────── */}
      {showAddPayment && (
        <Modal title="Enregistrer un paiement" onClose={() => setShowAddPayment(null)}>
          <form onSubmit={e => addPayment(e, showAddPayment)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Montant (€) *">
                <input type="number" step="0.01" required placeholder="0.00"
                  value={payForm.amount_eur} onChange={e => setPayForm(f => ({ ...f, amount_eur: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none font-mono" />
              </FormField>
              <FormField label="Statut">
                <select value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échoué</option>
                </select>
              </FormField>
              <FormField label="Méthode">
                <select value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="manual">Manuel</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="card">Carte</option>
                  <option value="cash">Espèces</option>
                </select>
              </FormField>
              <FormField label="Date de paiement">
                <input type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
              </FormField>
            </div>
            <FormField label="Description">
              <input type="text" placeholder="Ex: Coaching Novembre" value={payForm.description}
                onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </FormField>
            <FormField label="Référence">
              <input type="text" placeholder="N° de facture, réf. virement..." value={payForm.reference}
                onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </FormField>
            <button type="submit" disabled={paySaving || !payForm.amount_eur}
              className="w-full h-11 flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {paySaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Enregistrer le paiement
            </button>
          </form>
        </Modal>
      )}

      {/* ── MODAL: Create formula ────────────────────────────────────────────── */}
      {showCreateFormula && (
        <Modal title="Nouvelle formule" onClose={() => setShowCreateFormula(false)}>
          <form onSubmit={createFormula} className="space-y-4">
            <FormField label="Nom *">
              <input type="text" required placeholder="Coaching Premium" value={formulaForm.name}
                onChange={e => setFormulaForm(f => ({ ...f, name: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prix (€)">
                <input type="number" step="0.01" placeholder="99.00" value={formulaForm.price_eur}
                  onChange={e => setFormulaForm(f => ({ ...f, price_eur: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none font-mono" />
              </FormField>
              <FormField label="Facturation">
                <select value={formulaForm.billing_cycle} onChange={e => setFormulaForm(f => ({ ...f, billing_cycle: e.target.value }))}
                  className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none">
                  <option value="one_time">Paiement unique</option>
                  <option value="weekly">Hebdo</option>
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </FormField>
            </div>
            <FormField label="Description">
              <input type="text" placeholder="Coaching personnalisé incluant..." value={formulaForm.description}
                onChange={e => setFormulaForm(f => ({ ...f, description: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none" />
            </FormField>
            <FormField label="Inclus (une ligne par item)">
              <textarea value={formulaForm.features} onChange={e => setFormulaForm(f => ({ ...f, features: e.target.value }))}
                rows={3} placeholder={"Programme personnalisé\nSuivi hebdomadaire\nBilans mensuels"}
                className="w-full px-3 py-2 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none resize-none" />
            </FormField>
            <button type="submit" disabled={formulaSaving || !formulaForm.name}
              className="w-full h-11 flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              {formulaSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Créer la formule
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">{label}</label>
      {children}
    </div>
  )
}
