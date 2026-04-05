'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, X, Loader2,
  Mail, Phone, Target, FileText, Search,
  CheckCircle2, AlertCircle, User, Filter,
  LayoutGrid, List, Tag, CreditCard, TrendingUp,
  Clock, Euro, ChevronDown, BarChart3
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tag = { id: string; name: string; color: string }

type Subscription = {
  id: string
  status: string
  formula: { name: string; price_eur: number; billing_cycle: string } | null
}

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  goal: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'archived'
  training_goal: string | null
  fitness_level: string | null
  created_at: string
  // enriched client-side
  tags?: Tag[]
  subscriptions?: Subscription[]
  lastActivity?: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TRAINING_GOALS = [
  { value: 'hypertrophy',  label: 'Hypertrophie' },
  { value: 'strength',     label: 'Force' },
  { value: 'fat_loss',     label: 'Perte de gras' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'recomp',       label: 'Recomposition' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'athletic',     label: 'Athletic' },
]
const FITNESS_LEVELS = [
  { value: 'beginner',     label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced',     label: 'Avancé' },
  { value: 'elite',        label: 'Élite' },
]
const SPORT_PRACTICES = [
  { value: 'sedentary',  label: 'Sédentaire' },
  { value: 'light',      label: 'Légèrement actif' },
  { value: 'moderate',   label: 'Modérément actif' },
  { value: 'active',     label: 'Actif' },
  { value: 'athlete',    label: 'Athlète' },
]

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hypertrophie', strength: 'Force', fat_loss: 'Perte de gras',
  endurance: 'Endurance', recomp: 'Recomposition', maintenance: 'Maintenance', athletic: 'Athletic',
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', elite: 'Élite',
}
const STATUS_CONFIG = {
  active:   { label: 'Actif',    cls: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inactif',  cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Archivé',  cls: 'bg-gray-100 text-gray-500' },
}
const SUB_STATUS_CONFIG: Record<string, { dot: string }> = {
  active:    { dot: 'bg-emerald-400' },
  trial:     { dot: 'bg-blue-400' },
  paused:    { dot: 'bg-amber-400' },
  cancelled: { dot: 'bg-red-400' },
  expired:   { dot: 'bg-gray-400' },
}

type FormState = {
  firstName: string; lastName: string; email: string; phone: string
  training_goal: string; fitness_level: string; sport_practice: string
  weekly_frequency: string; notes: string
}
const EMPTY_FORM: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  training_goal: '', fitness_level: '', sport_practice: '', weekly_frequency: '', notes: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(c: Client) {
  return `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase()
}

function avatarColor(id: string) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xfffffff
  return colors[hash % colors.length]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CoachClientsPage() {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGoal, setFilterGoal] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [filterSub, setFilterSub] = useState<string>('all') // 'all' | 'with_sub' | 'no_sub'
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
    })
  }, [router])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const [clientsRes, tagsRes] = await Promise.all([
      fetch('/api/clients'),
      fetch('/api/tags'),
    ])

    const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] }
    const tagsData = tagsRes.ok ? await tagsRes.json() : { tags: [] }
    setAllTags(tagsData.tags ?? [])

    const baseClients: Client[] = clientsData.clients ?? []

    // Setter clients + loading ensemble pour éviter le flash empty state
    setClients(baseClients)
    setLoading(false)
    // Note: React 18 batche ces deux setState dans le même render en mode concurrent

    // Enrichissement progressif en arrière-plan — un client à la fois pour éviter le N+1 en rafale
    for (const c of baseClients) {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/clients/${c.id}/tags`),
        fetch(`/api/clients/${c.id}/subscriptions`),
      ])
      const tags = tRes.ok ? (await tRes.json()).tags ?? [] : []
      const subscriptions = sRes.ok ? (await sRes.json()).subscriptions ?? [] : []
      setClients(prev => prev.map(p => p.id === c.id ? { ...p, tags, subscriptions } : p))
    }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    if (q && !`${c.first_name} ${c.last_name} ${c.email ?? ''}`.toLowerCase().includes(q)) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterGoal !== 'all' && c.training_goal !== filterGoal) return false
    if (filterTag !== 'all' && !c.tags?.some(t => t.id === filterTag)) return false
    if (filterSub === 'with_sub' && !c.subscriptions?.some(s => s.status === 'active')) return false
    if (filterSub === 'no_sub' && c.subscriptions?.some(s => s.status === 'active')) return false
    return true
  })

  // ── Stats bar ──────────────────────────────────────────────────────────────

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    withSub: clients.filter(c => c.subscriptions?.some(s => s.status === 'active')).length,
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const setField = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        training_goal:    form.training_goal    || null,
        fitness_level:    form.fitness_level    || null,
        sport_practice:   form.sport_practice   || null,
        weekly_frequency: form.weekly_frequency ? parseInt(form.weekly_frequency) : null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Une erreur est survenue.')
      setSubmitting(false)
      return
    }

    setSuccess(`${data.client.first_name} ${data.client.last_name} a été ajouté.`)
    setClients(prev => [{ ...data.client, tags: [], subscriptions: [] }, ...prev])
    setForm(EMPTY_FORM)
    setSubmitting(false)
    setTimeout(() => { setShowModal(false); setSuccess(null) }, 1500)
  }

  const activeFiltersCount = [
    filterStatus !== 'all', filterGoal !== 'all',
    filterTag !== 'all', filterSub !== 'all',
  ].filter(Boolean).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-surface font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <p className="text-xs text-secondary font-medium uppercase tracking-widest">Espace Coach</p>
            <h1 className="text-xl font-bold text-primary tracking-tight">Mes Clients</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Comptabilité link */}
          <button
            onClick={() => router.push('/coach/comptabilite')}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-light shadow-soft-out rounded-xl text-sm font-semibold text-secondary hover:text-primary transition-colors"
          >
            <Euro size={15} />
            <span className="hidden sm:inline">Comptabilité</span>
          </button>
          <button
            onClick={() => { setShowModal(true); setError(null) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-accent transition-all duration-200 shadow-lg"
          >
            <UserPlus size={16} />
            Nouveau client
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto">

        {/* STATS STRIP */}
        <div className={`grid grid-cols-3 gap-4 mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { icon: Users, label: 'Total clients', value: stats.total, color: 'text-primary' },
            { icon: TrendingUp, label: 'Actifs', value: stats.active, color: 'text-emerald-600' },
            { icon: CreditCard, label: 'Avec formule', value: stats.withSub, color: 'text-indigo-600' },
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

        {/* SEARCH + FILTERS BAR */}
        <div className={`flex items-center gap-3 mb-4 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-surface rounded-xl border border-white/80 shadow-soft-in text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent/30 transition-colors"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold transition-all border ${
              showFilters || activeFiltersCount > 0
                ? 'bg-accent text-white border-accent shadow-md'
                : 'bg-surface shadow-soft-out border-white/60 text-secondary hover:text-primary'
            }`}
          >
            <Filter size={15} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/30 text-[11px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View mode */}
          <div className="flex bg-surface rounded-xl shadow-soft-out border border-white/60 p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-primary'
              }`}
            >
              <List size={15} />
            </button>
          </div>

          <p className="text-xs font-bold text-secondary uppercase tracking-widest ml-auto">
            {filtered.length} / {clients.length}
          </p>
        </div>

        {/* FILTER PANEL */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Statut</label>
                  <select
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Objectif</label>
                  <select
                    value={filterGoal} onChange={e => setFilterGoal(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none"
                  >
                    <option value="all">Tous</option>
                    {TRAINING_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Tag</label>
                  <select
                    value={filterTag} onChange={e => setFilterTag(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none"
                  >
                    <option value="all">Tous</option>
                    {allTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Formule</label>
                  <select
                    value={filterSub} onChange={e => setFilterSub(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 shadow-soft-in text-sm text-primary outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="with_sub">Avec formule active</option>
                    <option value="no_sub">Sans formule</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CLIENT LIST */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface shadow-soft-out flex items-center justify-center mb-4">
              <Users size={28} className="text-secondary/40" />
            </div>
            <p className="text-base font-bold text-primary mb-1">
              {search || activeFiltersCount > 0 ? 'Aucun résultat' : "Aucun client pour l'instant"}
            </p>
            <p className="text-sm text-secondary opacity-60 mb-6">
              {search || activeFiltersCount > 0 ? 'Ajustez vos filtres.' : 'Créez votre premier client pour commencer le suivi.'}
            </p>
            {!search && activeFiltersCount === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-accent transition-all shadow-lg"
              >
                <UserPlus size={16} />
                Créer un client
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client, i) => (
              <ClientCard key={client.id} client={client} index={i} onClick={() => router.push(`/coach/clients/${client.id}`)} />
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl shadow-soft-out border border-white/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/60">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Client</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60 hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60 hidden lg:table-cell">Objectif / Niveau</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Formule</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60 hidden md:table-cell">Tags</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <ClientRow key={client.id} client={client} index={i} onClick={() => router.push(`/coach/clients/${client.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CRÉATION CLIENT */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
              onClick={() => !submitting && setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.18),0_8px_24px_rgba(0,0,0,0.10)] border border-white/60 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">

                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <User size={18} className="text-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-primary">Nouveau client</h2>
                      <p className="text-xs text-secondary opacity-60">Remplissez les informations du client</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-secondary hover:text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mx-8 mb-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-800 font-bold">{error}</p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mx-8 mb-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <p className="text-xs text-emerald-800 font-bold">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Prénom *</label>
                      <input type="text" required placeholder="Jean" value={form.firstName}
                        onChange={e => setField('firstName', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Nom *</label>
                      <input type="text" required placeholder="Dupont" value={form.lastName}
                        onChange={e => setField('lastName', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" />
                      <input type="email" placeholder="jean@email.com" value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        className="ui-input-purity pl-10 pr-4 h-12 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Téléphone</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" />
                      <input type="tel" placeholder="+33 6 ..." value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                        className="ui-input-purity pl-10 pr-4 h-12 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Objectif</label>
                      <select value={form.training_goal} onChange={e => setField('training_goal', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm">
                        <option value="">— Non renseigné</option>
                        {TRAINING_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Niveau</label>
                      <select value={form.fitness_level} onChange={e => setField('fitness_level', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm">
                        <option value="">— Non renseigné</option>
                        {FITNESS_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Pratique sportive</label>
                      <select value={form.sport_practice} onChange={e => setField('sport_practice', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm">
                        <option value="">— Non renseigné</option>
                        {SPORT_PRACTICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Fréquence souhaitée</label>
                      <select value={form.weekly_frequency} onChange={e => setField('weekly_frequency', e.target.value)}
                        className="ui-input-purity px-4 h-12 text-sm font-mono">
                        <option value="">— Non renseigné</option>
                        {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}j/sem.</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Notes</label>
                    <div className="relative">
                      <FileText size={14} className="absolute left-4 top-3.5 text-secondary/30" />
                      <textarea placeholder="Contraintes, historique, remarques..." value={form.notes}
                        onChange={e => setField('notes', e.target.value)} rows={3}
                        className="ui-input-purity pl-10 pr-4 py-3 text-sm resize-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full h-13 flex items-center justify-center gap-3 bg-primary hover:bg-accent text-white font-bold text-sm rounded-2xl transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    style={{ height: '52px' }}>
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Création en cours...</> : <><UserPlus size={16} /> Créer le client</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClientCard({ client, index, onClick }: { client: Client; index: number; onClick: () => void }) {
  const activeSub = client.subscriptions?.find(s => s.status === 'active')
  const color = avatarColor(client.id)
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="bg-surface rounded-2xl p-5 shadow-soft-out border border-white/60 hover:-translate-y-0.5 hover:shadow-[8px_8px_24px_#d1d9e6,-4px_-4px_12px_#ffffff] transition-all duration-200 cursor-pointer"
    >
      {/* Avatar + name + status */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          {getInitials(client)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-primary text-sm truncate">{client.first_name} {client.last_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            {client.training_goal && (
              <span className="text-[10px] text-secondary/60 font-medium">
                {GOAL_LABELS[client.training_goal] ?? client.training_goal}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1.5 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Mail size={11} className="shrink-0 opacity-40" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Phone size={11} className="shrink-0 opacity-40" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.fitness_level && (
          <div className="flex items-center gap-2 text-xs text-secondary">
            <BarChart3 size={11} className="shrink-0 opacity-40" />
            <span>{LEVEL_LABELS[client.fitness_level] ?? client.fitness_level}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {client.tags.slice(0, 3).map(tag => (
            <span
              key={tag.id}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-light text-secondary">
              +{client.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: formule + date */}
      <div className="pt-3 border-t border-white/60 flex items-center justify-between">
        {activeSub ? (
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${SUB_STATUS_CONFIG[activeSub.status]?.dot ?? 'bg-gray-400'}`} />
            <span className="text-[11px] font-semibold text-secondary truncate max-w-[120px]">
              {activeSub.formula?.name ?? 'Formule active'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-[11px] text-secondary/40 font-medium">Pas de formule</span>
          </div>
        )}
        <p className="text-[10px] text-secondary/40 font-medium">
          {new Date(client.created_at).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </motion.div>
  )
}

function ClientRow({ client, index, onClick }: { client: Client; index: number; onClick: () => void }) {
  const activeSubs = client.subscriptions?.filter(s => s.status === 'active') ?? []
  const color = avatarColor(client.id)
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="border-b border-white/40 last:border-0 hover:bg-surface-light/60 cursor-pointer transition-colors"
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
            style={{ backgroundColor: color }}>
            {getInitials(client)}
          </div>
          <span className="font-semibold text-primary text-sm">{client.first_name} {client.last_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="space-y-0.5">
          {client.email && <p className="text-xs text-secondary truncate max-w-[160px]">{client.email}</p>}
          {client.phone && <p className="text-xs text-secondary/60">{client.phone}</p>}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="space-y-0.5">
          {client.training_goal && <p className="text-xs text-primary font-medium">{GOAL_LABELS[client.training_goal]}</p>}
          {client.fitness_level && <p className="text-xs text-secondary/60">{LEVEL_LABELS[client.fitness_level]}</p>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          {activeSubs.length === 0 ? (
            <span className="text-[11px] text-secondary/40">—</span>
          ) : activeSubs.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SUB_STATUS_CONFIG[s.status]?.dot ?? 'bg-gray-400'}`} />
              <span className="text-xs font-medium text-primary truncate max-w-[120px]">{s.formula?.name ?? '—'}</span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {(client.tags ?? []).slice(0, 2).map(tag => (
            <span key={tag.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
          {(client.tags?.length ?? 0) > 2 && (
            <span className="text-[10px] text-secondary/40">+{(client.tags?.length ?? 0) - 2}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronDown size={14} className="text-secondary/30 -rotate-90" />
      </td>
    </motion.tr>
  )
}
