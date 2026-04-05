'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Dumbbell, Copy, Edit2, Trash2, Search, Filter,
  Target, Users, Calendar, Zap, ChevronRight, Tag, Eye, Lock, BarChart2
} from 'lucide-react'

const GOALS: Record<string, string> = {
  hypertrophy: 'Hypertrophie', strength: 'Force', endurance: 'Endurance',
  fat_loss: 'Perte de gras', recomp: 'Recomposition', maintenance: 'Maintenance', athletic: 'Athletic',
}
const LEVELS: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', elite: 'Élite',
}
const GOAL_COLORS: Record<string, string> = {
  hypertrophy: 'bg-violet-100 text-violet-700',
  strength: 'bg-red-100 text-red-700',
  endurance: 'bg-green-100 text-green-700',
  fat_loss: 'bg-orange-100 text-orange-700',
  recomp: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-slate-100 text-slate-600',
  athletic: 'bg-yellow-100 text-yellow-700',
}
const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-orange-100 text-orange-700',
  elite: 'bg-red-100 text-red-700',
}
const MUSCLES = [
  'Full Body', 'Jambes', 'Fessiers', 'Ischio-jambiers', 'Quadriceps',
  'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps',
  'Abdos', 'Mollets', 'Lombaires', 'Posture',
]
const ARCHETYPES: Record<string, string> = {
  bodyweight: 'Poids du corps', home_dumbbells: 'Domicile — Haltères',
  home_full: 'Domicile — Complet', home_rack: 'Rack à domicile',
  functional_box: 'Box / Fonctionnel', commercial_gym: 'Salle de sport',
}

export default function ProgramTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGoal, setFilterGoal] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterFreq, setFilterFreq] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterGoal) params.set('goal', filterGoal)
    if (filterLevel) params.set('level', filterLevel)
    if (filterFreq) params.set('frequency', filterFreq)
    if (filterMuscle) params.set('muscle', filterMuscle)
    const res = await fetch(`/api/program-templates?${params}`)
    const d = await res.json()
    setTemplates(d.templates ?? [])
    setLoading(false)
  }, [filterGoal, filterLevel, filterFreq, filterMuscle])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/program-templates/${deleteTarget.id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    const res = await fetch(`/api/program-templates/${id}`, { method: 'POST' })
    const d = await res.json()
    if (d.template) setTemplates(prev => [d.template, ...prev])
    setDuplicating(null)
  }

  const activeFilters = [filterGoal, filterLevel, filterFreq, filterMuscle].filter(Boolean).length

  return (
    <div className="min-h-screen bg-surface font-sans">

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-primary mb-2">Supprimer le template ?</h3>
            <p className="text-sm text-secondary mb-5">
              Le template <span className="font-medium text-primary">"{deleteTarget.name}"</span> sera supprimé définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-btn bg-surface-light shadow-soft-out text-sm text-secondary hover:text-primary transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-btn bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Templates d'entraînement</h1>
            <p className="text-xs text-secondary mt-0.5">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/coach/programs/templates/new"
              className="flex items-center gap-2 bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-btn hover:opacity-90 transition-opacity shadow-lg">
              <Plus size={15} />Nouveau template
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-6 flex flex-col gap-5">
        {/* Search + filtres */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un template…"
                className="w-full pl-9 pr-4 py-2.5 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                showFilters || activeFilters > 0
                  ? 'bg-accent text-white shadow'
                  : 'bg-surface-light shadow-soft-in text-secondary hover:text-primary'
              }`}
            >
              <Filter size={14} />
              Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </button>
          </div>

          {showFilters && (
            <div className="bg-surface rounded-card shadow-soft-out p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1.5">Objectif</label>
                <select value={filterGoal} onChange={e => setFilterGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light shadow-soft-in rounded-btn text-xs text-primary outline-none">
                  <option value="">Tous</option>
                  {Object.entries(GOALS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1.5">Niveau</label>
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light shadow-soft-in rounded-btn text-xs text-primary outline-none">
                  <option value="">Tous</option>
                  {Object.entries(LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1.5">Fréquence</label>
                <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light shadow-soft-in rounded-btn text-xs text-primary outline-none">
                  <option value="">Toutes</option>
                  {[2,3,4,5,6].map(f => <option key={f} value={f}>{f}j/sem.</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1.5">Groupe musculaire</label>
                <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light shadow-soft-in rounded-btn text-xs text-primary outline-none">
                  <option value="">Tous</option>
                  {MUSCLES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setFilterGoal(''); setFilterLevel(''); setFilterFreq(''); setFilterMuscle('') }}
                  className="col-span-2 sm:col-span-4 text-xs text-secondary hover:text-red-500 transition-colors text-center py-1"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Templates grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-card shadow-soft-out p-16 text-center">
            <Dumbbell size={40} className="text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-sm text-secondary mb-2">
              {templates.length === 0 ? 'Aucun template créé.' : 'Aucun résultat pour ces filtres.'}
            </p>
            {templates.length === 0 && (
              <Link href="/coach/programs/templates/new" className="text-sm text-accent font-medium hover:underline">
                Créer mon premier template →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => {
              const sessionCount = (t.coach_program_template_sessions ?? []).length
              const totalSets = (t.coach_program_template_sessions ?? [])
                .flatMap((s: any) => s.coach_program_template_exercises ?? [])
                .reduce((acc: number, e: any) => acc + (e.sets ?? 0), 0)
              const isSystem = t.is_system === true

              return (
                <div key={t.id} className="bg-surface rounded-card shadow-soft-out flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  {/* Top color bar */}
                  <div className={`h-1 w-full rounded-t ${isSystem ? 'bg-violet-400' : 'bg-accent/60'}`} />

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {isSystem && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          <Lock size={8} />Système
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GOAL_COLORS[t.goal]}`}>{GOALS[t.goal]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[t.level]}`}>{LEVELS[t.level]}</span>
                      {t.equipment_archetype && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {ARCHETYPES[t.equipment_archetype] ?? t.equipment_archetype}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <h3 className="font-bold text-primary leading-snug">{t.name}</h3>
                      {t.description && <p className="text-xs text-secondary mt-1 line-clamp-2">{t.description}</p>}
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
                      <span className="flex items-center gap-1"><Calendar size={11} />{t.frequency}j/sem.</span>
                      <span className="flex items-center gap-1"><Zap size={11} />{t.weeks} sem.</span>
                      <span className="flex items-center gap-1"><Dumbbell size={11} />{sessionCount} séances</span>
                      {totalSets > 0 && <span className="flex items-center gap-1"><BarChart2 size={11} />{totalSets} séries</span>}
                    </div>

                    {/* Muscle tags */}
                    {t.muscle_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {t.muscle_tags.map((tag: string) => (
                          <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-light text-secondary">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  {isSystem ? (
                    /* ── Template STRYVR — modèle à dupliquer ── */
                    <div className="border-t border-white/40 px-5 py-3 flex flex-col gap-2">
                      <p className="text-[9px] text-secondary/60 text-center italic">
                        Modèle STRYVR — dupliquer pour personnaliser
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDuplicate(t.id)}
                          disabled={duplicating === t.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white text-xs font-bold py-2 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {duplicating === t.id
                            ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                            : <Copy size={12} />}
                          Dupliquer & personnaliser
                        </button>
                        <Link href={`/coach/programs/templates/${t.id}/view`}
                          className="p-2 text-secondary hover:text-primary bg-surface-light rounded-btn transition-colors" title="Visualiser">
                          <Eye size={14} />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* ── Template coach ── */
                    <div className="border-t border-white/40 px-5 py-3 flex items-center gap-2">
                      <Link
                        href={`/coach/programs/templates/${t.id}/assign`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white text-xs font-bold py-2 rounded-btn hover:opacity-90 transition-opacity"
                      >
                        <Users size={12} />Assigner
                      </Link>
                      <Link href={`/coach/programs/templates/${t.id}/view`}
                        className="p-2 text-secondary hover:text-primary bg-surface-light rounded-btn transition-colors" title="Visualiser">
                        <Eye size={14} />
                      </Link>
                      <Link href={`/coach/programs/templates/${t.id}/edit`}
                        className="p-2 text-secondary hover:text-primary bg-surface-light rounded-btn transition-colors" title="Modifier">
                        <Edit2 size={14} />
                      </Link>
                      <button onClick={() => handleDuplicate(t.id)} disabled={duplicating === t.id}
                        className="p-2 text-secondary hover:text-primary bg-surface-light rounded-btn transition-colors" title="Dupliquer">
                        {duplicating === t.id ? <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin" /> : <Copy size={14} />}
                      </button>
                      <button onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                        className="p-2 text-secondary hover:text-red-500 bg-surface-light rounded-btn transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
