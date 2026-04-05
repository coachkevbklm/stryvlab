'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'

interface ProgressionEvent {
  id: string
  exercise_id: string
  session_log_id: string
  sets_completed: number
  reps_per_set: number[]
  weight_kg: number
  rir_values: number[]
  trigger_type: 'overload' | 'maintain'
  previous_weight_kg: number | null
  new_weight_kg: number | null
  increment_applied: number | null
  created_at: string
  // joint depuis program_exercises
  exercise_name?: string
}

interface GroupedByExercise {
  exercise_id: string
  exercise_name: string
  events: ProgressionEvent[]
  latest_weight: number | null
  total_overloads: number
}

interface Props {
  clientId: string
}

export default function ProgressionHistory({ clientId }: Props) {
  const [groups, setGroups] = useState<GroupedByExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/progression/history?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => {
        setGroups(d.groups ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-surface rounded-card p-8 text-center">
        <TrendingUp size={32} className="text-secondary mx-auto mb-3 opacity-20" />
        <p className="text-sm text-secondary font-medium">Aucune donnée de progression.</p>
        <p className="text-xs text-secondary/60 mt-1">
          Active la double progression sur un programme et attends la première séance complétée.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={14} className="text-accent" />
        <h3 className="text-sm font-bold text-primary">Historique de progression</h3>
        <span className="text-[10px] text-secondary bg-surface-light px-2 py-0.5 rounded-full">
          {groups.length} exercice{groups.length > 1 ? 's' : ''}
        </span>
      </div>

      {groups.map(g => {
        const isOpen = expanded === g.exercise_id
        const overloadCount = g.total_overloads

        return (
          <div key={g.exercise_id} className="bg-surface rounded-card overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : g.exercise_id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  overloadCount > 0 ? 'bg-accent/10' : 'bg-surface-light'
                }`}>
                  {overloadCount > 0
                    ? <TrendingUp size={13} className="text-accent" />
                    : <Minus size={13} className="text-secondary" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary leading-tight">{g.exercise_name}</p>
                  <p className="text-[10px] text-secondary mt-0.5">
                    {overloadCount > 0
                      ? `${overloadCount} surcharge${overloadCount > 1 ? 's' : ''} déclenchée${overloadCount > 1 ? 's' : ''}`
                      : 'En progression'}
                    {g.latest_weight !== null ? ` · Charge actuelle : ${g.latest_weight}kg` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {g.latest_weight !== null && (
                  <span className="text-xs font-mono font-bold text-primary">{g.latest_weight}kg</span>
                )}
                {isOpen ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-white/40">
                {/* Column headers */}
                <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[9px] font-bold text-secondary uppercase tracking-wider">
                  <div className="col-span-2">Date</div>
                  <div>Charge</div>
                  <div>Reps</div>
                  <div>Résultat</div>
                </div>

                {g.events.map(ev => {
                  const date = new Date(ev.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                  const repsDisplay = ev.reps_per_set.length > 0
                    ? ev.reps_per_set.join('-')
                    : '—'
                  const isOverload = ev.trigger_type === 'overload'

                  return (
                    <div
                      key={ev.id}
                      className={`grid grid-cols-5 gap-2 items-center px-4 py-2.5 border-t border-white/20 text-xs ${
                        isOverload ? 'bg-accent/5' : ''
                      }`}
                    >
                      <div className="col-span-2 text-secondary font-mono">{date}</div>
                      <div className="font-mono font-bold text-primary">{ev.weight_kg}kg</div>
                      <div className="font-mono text-secondary">{repsDisplay}</div>
                      <div className="flex items-center gap-1">
                        {isOverload ? (
                          <>
                            <TrendingUp size={11} className="text-accent shrink-0" />
                            <span className="text-accent font-bold text-[10px]">
                              +{ev.increment_applied}kg
                            </span>
                          </>
                        ) : (
                          <>
                            <Minus size={11} className="text-secondary shrink-0" />
                            <span className="text-secondary text-[10px]">Maintien</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
