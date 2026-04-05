'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, CheckCircle2, Circle, Save, Loader2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string | null
  // Double progression
  target_rir: number | null
  current_weight_kg: number | null
  rep_min: number | null
  rep_max: number | null
  progressive_overload_enabled: boolean
}

interface SetLog {
  exercise_id: string
  exercise_name: string
  set_number: number
  planned_reps: string
  actual_reps: string
  actual_weight_kg: string
  completed: boolean
  rpe: string
  rir_actual: string  // RIR réellement ressenti
  notes: string
}

interface Props {
  clientId: string
  session: { id: string; name: string }
  exercises: Exercise[]
}

function buildInitialSets(exercises: Exercise[]): SetLog[] {
  const sets: SetLog[] = []
  for (const ex of exercises) {
    for (let i = 0; i < ex.sets; i++) {
      sets.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
        set_number: i + 1,
        planned_reps: ex.reps,
        actual_reps: '',
        // Pré-remplir avec la charge suggérée si disponible
        actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
        completed: false,
        rpe: '',
        rir_actual: '',
        notes: '',
      })
    }
  }
  return sets
}

type SaveState = 'idle' | 'saving' | 'error'

export default function SessionLogger({ clientId, session, exercises }: Props) {
  const router = useRouter()
  const [sets, setSets] = useState<SetLog[]>(() => buildInitialSets(exercises))
  const [expandedEx, setExpandedEx] = useState<string | null>(exercises[0]?.id ?? null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Chrono global
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])

  // Rest timer
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer !== null && restTimer <= 0) setRestTimer(null)
      return
    }
    restRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t === null || t <= 1) {
          clearInterval(restRef.current!)
          return null
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(restRef.current!)
  }, [restTimer])

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function updateSet(exId: string, setNum: number, patch: Partial<SetLog>) {
    setSets(prev =>
      prev.map(s => (s.exercise_id === exId && s.set_number === setNum ? { ...s, ...patch } : s))
    )
  }

  function toggleSet(exId: string, setNum: number, restSec: number | null) {
    setSets(prev =>
      prev.map(s => {
        if (s.exercise_id !== exId || s.set_number !== setNum) return s
        const nowCompleted = !s.completed
        if (nowCompleted && restSec) setRestTimer(restSec)
        return { ...s, completed: nowCompleted }
      })
    )
  }

  const completedCount = sets.filter(s => s.completed).length
  const progress = sets.length > 0 ? completedCount / sets.length : 0

  async function submitSession() {
    setSaveState('saving')
    setErrorMsg(null)
    const durationMin = Math.round(elapsed / 60)

    let sessionLogId: string | null = null

    try {
      const res = await fetch('/api/session-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_session_id: session.id,
          session_name: session.name,
          set_logs: sets.map(s => ({
            exercise_id: s.exercise_id,
            exercise_name: s.exercise_name,
            set_number: s.set_number,
            planned_reps: s.planned_reps,
            actual_reps: s.actual_reps ? parseInt(s.actual_reps) : null,
            actual_weight_kg: s.actual_weight_kg ? parseFloat(s.actual_weight_kg) : null,
            completed: s.completed,
            rpe: s.rpe ? parseInt(s.rpe) : null,
            rir_actual: s.rir_actual ? parseInt(s.rir_actual) : null,
            notes: s.notes || null,
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erreur serveur (${res.status})`)
      }

      const data = await res.json()
      sessionLogId = data?.session_log?.id ?? null
    } catch (err) {
      setSaveState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau — vérifie ta connexion')
      return
    }

    if (sessionLogId) {
      try {
        const patchRes = await fetch(`/api/session-logs/${sessionLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin }),
        })
        if (!patchRes.ok) {
          console.warn('Could not mark session as completed, but data was saved.')
        }
      } catch {
        console.warn('PATCH /session-logs failed silently — session data preserved.')
      }
    }

    setSaveState('idle')
    router.push('/client/programme?logged=1')
  }

  // Détermine si la double progression est active pour un exercice
  function getProgressionHint(ex: Exercise): string | null {
    if (!ex.progressive_overload_enabled) return null
    if (ex.rep_min === null || ex.rep_max === null) return null
    const effectiveRir = ex.target_rir ?? ex.rir
    if (effectiveRir === null) return null
    return `Atteins ${ex.rep_max} reps à RIR ${effectiveRir} sur toutes tes séries pour augmenter la charge.`
  }

  return (
    <div className="min-h-screen bg-surface font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-secondary hover:text-primary">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-bold text-primary text-sm">{session.name}</p>
            <p className="text-xs text-secondary font-mono">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-accent">{completedCount}/{sets.length}</span>
            <Image
              src="/images/logo.png"
              alt="STRYV"
              width={24}
              height={24}
              className="w-6 h-6 object-contain opacity-60"
            />
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-lg mx-auto mt-3 h-1 bg-surface-light rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      {/* Rest timer banner */}
      {restTimer !== null && (
        <div className="bg-accent/10 border-b border-accent/20 px-6 py-3 text-center">
          <p className="text-sm font-bold text-accent">Repos — {formatTime(restTimer)}</p>
        </div>
      )}

      {/* Error banner */}
      {saveState === 'error' && errorMsg && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-lg mx-auto flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Sauvegarde échouée</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
            <button
              onClick={submitSession}
              className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors shrink-0"
            >
              <RefreshCw size={12} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-6 py-5 flex flex-col gap-4">
        {exercises.length === 0 && (
          <div className="text-center py-16 text-secondary">
            <p className="text-sm font-medium">Aucun exercice dans cette séance.</p>
            <p className="text-xs mt-1 opacity-60">Contacte ton coach pour qu'il complète le programme.</p>
          </div>
        )}

        {exercises.map(ex => {
          const exSets = sets.filter(s => s.exercise_id === ex.id)
          const allDone = exSets.every(s => s.completed)
          const isOpen = expandedEx === ex.id
          const progressionHint = getProgressionHint(ex)
          const hasProgression = ex.progressive_overload_enabled && (ex.rep_min !== null)
          const effectiveRir = ex.target_rir ?? ex.rir

          return (
            <div
              key={ex.id}
              className={`bg-surface rounded-card shadow-soft-out overflow-hidden transition-opacity ${allDone ? 'opacity-70' : ''}`}
            >
              {/* Barre de progression activée */}
              {hasProgression && (
                <div className="h-0.5 w-full bg-gradient-to-r from-accent/40 to-violet-400/40" />
              )}

              {/* Exercise header */}
              <button
                onClick={() => setExpandedEx(isOpen ? null : ex.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  {allDone ? (
                    <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                  ) : (
                    <Circle size={18} className="text-secondary shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-primary text-sm">{ex.name}</p>
                      {hasProgression && (
                        <TrendingUp size={11} className="text-accent shrink-0" aria-label="Double progression activée" />
                      )}
                    </div>
                    <p className="text-[10px] text-secondary">
                      {ex.sets} × {ex.reps}
                      {ex.rest_sec ? ` · ${ex.rest_sec}s repos` : ''}
                      {effectiveRir !== null && effectiveRir !== undefined ? ` · RIR cible ${effectiveRir}` : ''}
                      {ex.current_weight_kg !== null ? ` · Suggéré : ${ex.current_weight_kg}kg` : ''}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp size={15} className="text-secondary" />
                ) : (
                  <ChevronDown size={15} className="text-secondary" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-white/40">
                  {/* Hint progression */}
                  {progressionHint && (
                    <div className="mx-4 mt-3 mb-1 px-3 py-2 bg-accent/5 border border-accent/20 rounded-lg">
                      <p className="text-[10px] text-accent font-medium leading-relaxed">{progressionHint}</p>
                    </div>
                  )}

                  {/* Column headers — grille 13 colonnes : # / Prévu / Reps / Kg / RIR / ✓ */}
                  <div className="grid grid-cols-13 gap-1 px-4 py-2 text-[9px] font-bold text-secondary uppercase tracking-wider"
                       style={{ gridTemplateColumns: '1fr 2.5fr 2.5fr 2.5fr 1.5fr 1fr' }}>
                    <div>#</div>
                    <div>Prévu</div>
                    <div>Reps</div>
                    <div>Kg</div>
                    <div>RIR</div>
                    <div />
                  </div>

                  {exSets.map(s => (
                    <div
                      key={s.set_number}
                      className={`grid gap-1 items-center px-4 py-2 border-t border-white/20 transition-colors ${
                        s.completed ? 'bg-green-50/30' : ''
                      }`}
                      style={{ gridTemplateColumns: '1fr 2.5fr 2.5fr 2.5fr 1.5fr 1fr' }}
                    >
                      <div className="text-xs font-mono font-bold text-secondary">
                        {s.set_number}
                      </div>
                      <div className="text-xs font-mono text-secondary truncate">
                        {s.planned_reps}
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={s.actual_reps}
                        onChange={e => updateSet(ex.id, s.set_number, { actual_reps: e.target.value })}
                        placeholder="—"
                        className="bg-surface-light shadow-soft-in rounded px-2 py-1.5 text-xs font-mono text-primary text-center outline-none focus:ring-1 focus:ring-accent/40 w-full"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={s.actual_weight_kg}
                        onChange={e =>
                          updateSet(ex.id, s.set_number, { actual_weight_kg: e.target.value })
                        }
                        placeholder="—"
                        className="bg-surface-light shadow-soft-in rounded px-2 py-1.5 text-xs font-mono text-primary text-center outline-none focus:ring-1 focus:ring-accent/40 w-full"
                      />
                      {/* RIR réel — affiché uniquement si double progression active */}
                      {hasProgression ? (
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={s.rir_actual}
                          onChange={e => updateSet(ex.id, s.set_number, { rir_actual: e.target.value })}
                          placeholder={effectiveRir !== null ? String(effectiveRir) : '—'}
                          className="bg-surface-light shadow-soft-in rounded px-1 py-1.5 text-xs font-mono text-primary text-center outline-none focus:ring-1 focus:ring-violet-400/40 w-full"
                        />
                      ) : (
                        <div className="text-xs font-mono text-secondary/40 text-center">—</div>
                      )}
                      <button
                        onClick={() => toggleSet(ex.id, s.set_number, ex.rest_sec)}
                        className="flex justify-center"
                      >
                        {s.completed ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Circle
                            size={18}
                            className="text-secondary hover:text-accent transition-colors"
                          />
                        )}
                      </button>
                    </div>
                  ))}

                  {ex.notes && (
                    <div className="px-4 py-2 border-t border-white/20">
                      <p className="text-[10px] text-secondary italic">{ex.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </main>

      {/* Finish button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={submitSession}
            disabled={saveState === 'saving'}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white font-bold py-4 rounded-card shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {saveState === 'saving' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement…
              </>
            ) : saveState === 'error' ? (
              <>
                <RefreshCw size={16} />
                Réessayer · {formatTime(elapsed)}
              </>
            ) : (
              <>
                <Save size={16} />
                Terminer la séance · {formatTime(elapsed)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
