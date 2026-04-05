'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Users, CheckCircle2, Loader2, Search, AlertTriangle, Ban, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import {
  rankTemplates,
  scoreLabel,
  scoreBadgeClass,
  EQUIPMENT_CATEGORY_LABELS,
  type Template,
  type ClientProfile,
  type MatchResult,
} from '@/lib/matching/template-matcher'

const GOALS: Record<string, string> = {
  hypertrophy: 'Hypertrophie', strength: 'Force', endurance: 'Endurance',
  fat_loss: 'Perte de gras', recomp: 'Recomposition', maintenance: 'Maintenance', athletic: 'Athletic',
}
const LEVELS: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', elite: 'Élite',
}
const SPORT_PRACTICES: Record<string, string> = {
  sedentary: 'Sédentaire', light: 'Légèrement actif', moderate: 'Modérément actif',
  active: 'Actif', athlete: 'Athlète',
}

export default function AssignTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [nameOverride, setNameOverride] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showIncompatible, setShowIncompatible] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/program-templates/${templateId}`).then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([tmplData, clientsData]) => {
      setTemplate(tmplData.template)
      setClients(clientsData.clients ?? [])
      if (tmplData.template) setNameOverride(tmplData.template.name)
    }).finally(() => setLoading(false))
  }, [templateId])

  // ── Calcul des scores via le matcher 3 phases ──
  const allRanked: Array<any & { match: MatchResult }> = template
    ? clients
        .filter(c => c.status === 'active')
        .filter(c => !search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()))
        .map(c => {
          const profile: ClientProfile = {
            equipment_category: c.equipment_category ?? null,
            fitness_level: c.fitness_level ?? null,
            training_goal: c.training_goal ?? null,
            weekly_frequency: c.weekly_frequency ?? null,
            sport_practice: c.sport_practice ?? null,
          }
          const match = rankTemplates([template], profile)[0]
          return { ...c, match }
        })
        .sort((a, b) => {
          if (a.match.hardStop && !b.match.hardStop) return 1
          if (!a.match.hardStop && b.match.hardStop) return -1
          return b.match.score - a.match.score
        })
    : []

  const compatible = allRanked.filter(c => !c.match.hardStop)
  const incompatible = allRanked.filter(c => c.match.hardStop)
  const displayedClients = showIncompatible ? allRanked : compatible

  async function handleAssign() {
    if (!selectedClient) return
    setAssigning(true)
    setAssignError('')
    const client = clients.find(c => c.id === selectedClient)
    const finalName = nameOverride.trim() || (client ? `${template!.name} — ${client.first_name} ${client.last_name}` : template!.name)
    try {
      const res = await fetch(`/api/program-templates/${templateId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClient, name_override: finalName }),
      })
      const d = await res.json()
      if (d.program_id) {
        setSuccess(true)
        setTimeout(() => router.push(`/coach/clients/${selectedClient}`), 1500)
      } else {
        setAssignError(d.error ?? 'Erreur lors de la création du programme')
      }
    } catch {
      setAssignError('Erreur réseau')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-5">
        <div className="max-w-2xl mx-auto">
          <Link href="/coach/programs/templates" className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-3 font-medium">
            <ChevronLeft size={16} />Templates
          </Link>
          <h1 className="text-xl font-bold text-primary">Assigner — {template?.name}</h1>
          <p className="text-xs text-secondary mt-0.5">
            {GOALS[template?.goal ?? ''] ?? template?.goal}
            {' · '}{LEVELS[template?.level ?? ''] ?? template?.level}
            {' · '}{template?.frequency}j/sem.
            {' · '}{template?.weeks} sem.
            {template?.equipment_archetype && (
              <> · <span className="font-medium">{EQUIPMENT_CATEGORY_LABELS[template.equipment_archetype]}</span></>
            )}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-6 flex flex-col gap-5">
        {success ? (
          <div className="bg-surface rounded-card shadow-soft-out p-10 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <p className="font-bold text-primary text-lg">Programme créé !</p>
            <p className="text-sm text-secondary mt-1">Redirection vers le dossier client…</p>
          </div>
        ) : (
          <>
            {/* Nom du programme */}
            <div className="bg-surface rounded-card shadow-soft-out p-5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-2">
                Nom du programme pour le client
              </label>
              <input
                value={nameOverride}
                onChange={e => setNameOverride(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Sélection client */}
            <div className="bg-surface rounded-card shadow-soft-out p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <Users size={14} className="text-accent" />Choisir un client
                </h3>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="text-green-600 font-semibold">{compatible.length} compatibles</span>
                  {incompatible.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-red-500">{incompatible.length} incompatibles</span>
                    </>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un client…"
                  className="w-full pl-9 pr-4 py-2 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <p className="text-[10px] text-secondary/60 -mt-2">
                Triés par compatibilité — critères éliminatoires : équipement, fréquence (±1 toléré), niveau ±1
              </p>

              <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                {displayedClients.length === 0 && (
                  <div className="text-center py-8 text-secondary text-sm">
                    {search ? 'Aucun client trouvé' : 'Aucun client compatible avec ce template'}
                  </div>
                )}

                {displayedClients.map((client, idx) => {
                  const { match } = client
                  const isSelected = selectedClient === client.id
                  const isTop = !match.hardStop && idx === 0 && match.score >= 65
                  const badgeClass = scoreBadgeClass(match.score, match.hardStop)
                  const label = scoreLabel(match.score, match.hardStop)
                  const hasSubstitutions = match.substitutions.length > 0

                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        if (match.hardStop) return
                        setSelectedClient(client.id)
                        setNameOverride(`${template!.name} — ${client.first_name} ${client.last_name}`)
                      }}
                      disabled={match.hardStop}
                      className={`flex items-start gap-3 p-3 rounded-btn text-left transition-all ${
                        match.hardStop
                          ? 'opacity-50 cursor-not-allowed bg-surface-light'
                          : isSelected
                          ? 'bg-accent/10 ring-2 ring-accent/40'
                          : isTop
                          ? 'bg-surface-light ring-1 ring-accent/20 hover:bg-surface-light/80'
                          : 'bg-surface-light hover:bg-surface-light/80'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        match.hardStop ? 'bg-surface text-secondary'
                        : isSelected ? 'bg-accent text-white'
                        : 'bg-surface shadow-soft-out text-primary'
                      }`}>
                        {match.hardStop
                          ? <Ban size={14} />
                          : <>{client.first_name[0]}{client.last_name[0]}</>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-primary text-sm truncate">
                            {client.first_name} {client.last_name}
                          </p>
                          {isTop && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                              Recommandé
                            </span>
                          )}
                          {hasSubstitutions && !match.hardStop && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0 flex items-center gap-0.5">
                              <ArrowLeftRight size={9} />{match.substitutions.length} substitution{match.substitutions.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Profil structuré */}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {client.equipment_category && (
                            <span className="text-[9px] font-medium text-accent/80">
                              {EQUIPMENT_CATEGORY_LABELS[client.equipment_category as keyof typeof EQUIPMENT_CATEGORY_LABELS] ?? client.equipment_category}
                            </span>
                          )}
                          {client.training_goal && (
                            <span className="text-[9px] text-secondary">{GOALS[client.training_goal] ?? client.training_goal}</span>
                          )}
                          {client.fitness_level && (
                            <span className="text-[9px] text-secondary">{LEVELS[client.fitness_level] ?? client.fitness_level}</span>
                          )}
                          {client.weekly_frequency != null && (
                            <span className="text-[9px] font-mono text-secondary">{client.weekly_frequency}j/sem.</span>
                          )}
                          {client.sport_practice && (
                            <span className="text-[9px] text-secondary">{SPORT_PRACTICES[client.sport_practice] ?? client.sport_practice}</span>
                          )}
                          {!client.training_goal && !client.fitness_level && !client.weekly_frequency && (
                            <span className="text-[9px] text-secondary/40 italic">Profil incomplet</span>
                          )}
                        </div>

                        {/* Raison du hard stop */}
                        {match.hardStop && match.hardStopReason && (
                          <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle size={9} />{match.hardStopReason}
                          </p>
                        )}

                        {/* Warning fréquence ±1 */}
                        {!match.hardStop && match.warning && (
                          <p className="text-[9px] text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={9} />{match.warning}
                          </p>
                        )}

                        {/* Substitutions */}
                        {hasSubstitutions && !match.hardStop && (
                          <div className="mt-1.5 flex flex-col gap-0.5">
                            {match.substitutions.slice(0, 2).map((sub: import('@/lib/matching/template-matcher').SubstitutionResult, i: number) => (
                              <p key={i} className="text-[9px] text-amber-600 flex items-center gap-1">
                                <ArrowLeftRight size={8} />
                                <span className="line-through opacity-60">{sub.originalExercise}</span>
                                {' → '}
                                <span className="font-medium">{sub.substitute?.name ?? 'à remplacer manuellement'}</span>
                              </p>
                            ))}
                            {match.substitutions.length > 2 && (
                              <p className="text-[9px] text-secondary/60">
                                +{match.substitutions.length - 2} substitution{match.substitutions.length - 2 > 1 ? 's' : ''} supplémentaire{match.substitutions.length - 2 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score badge */}
                      {!match.hardStop && (
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded-btn ${badgeClass}`}>
                            {match.score}
                          </span>
                          <span className="text-[9px] text-secondary/70">{label}</span>
                        </div>
                      )}

                      {isSelected && <CheckCircle2 size={16} className="text-accent shrink-0 mt-2" />}
                    </button>
                  )
                })}
              </div>

              {/* Toggle clients incompatibles */}
              {incompatible.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowIncompatible(v => !v)}
                  className="text-xs text-secondary hover:text-primary transition-colors text-center py-1"
                >
                  {showIncompatible
                    ? 'Masquer les clients incompatibles'
                    : `Voir ${incompatible.length} client${incompatible.length > 1 ? 's' : ''} incompatible${incompatible.length > 1 ? 's' : ''}`
                  }
                </button>
              )}
            </div>

            {assignError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-btn px-3 py-2">{assignError}</p>
            )}

            <button
              onClick={handleAssign}
              disabled={!selectedClient || assigning}
              className="flex items-center justify-center gap-2 bg-accent text-white font-bold py-3.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-40 shadow-lg text-sm"
            >
              {assigning ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {assigning ? 'Création du programme…' : 'Créer le programme pour ce client'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
