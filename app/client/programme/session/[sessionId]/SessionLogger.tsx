'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Loader2, AlertCircle, RefreshCw, TrendingUp,
  Clock, ChevronUp, X, MessageSquare, Flag, ArrowLeftRight
} from 'lucide-react'
import { useClientT } from '@/components/client/ClientI18nProvider'
import ExerciseSwapSheet from './ExerciseSwapSheet'
import ClientAlternativesSheet from '@/components/client/ClientAlternativesSheet'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string | null
  image_url: string | null
  is_unilateral: boolean
  target_rir: number | null
  current_weight_kg: number | null
  rep_min: number | null
  rep_max: number | null
  progressive_overload_enabled: boolean
  clientAlternatives?: string[]  // coach-pre-configured alternatives
}

interface SetLog {
  exercise_id: string
  exercise_name: string
  set_number: number
  side: 'left' | 'right' | 'bilateral'
  planned_reps: string
  actual_reps: string
  actual_weight_kg: string
  completed: boolean
  rir_actual: string
  notes: string
  rest_sec_actual: number | null
}

interface LastPerf {
  weight: number | null
  reps: number | null
  side?: string | null
}

interface Props {
  clientId: string
  session: { id: string; name: string }
  exercises: Exercise[]
  lastPerformance: Record<string, LastPerf[]>
}

type SaveState = 'idle' | 'saving' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialSets(exercises: Exercise[]): SetLog[] {
  const sets: SetLog[] = []
  for (const ex of exercises) {
    for (let i = 0; i < ex.sets; i++) {
      if (ex.is_unilateral) {
        for (const side of ['left', 'right'] as const) {
          sets.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            set_number: i + 1,
            side,
            planned_reps: ex.reps,
            actual_reps: '',
            actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
            completed: false,
            rir_actual: '',
            notes: '',
            rest_sec_actual: null,
          })
        }
      } else {
        sets.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          set_number: i + 1,
          side: 'bilateral',
          planned_reps: ex.reps,
          actual_reps: '',
          actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
          completed: false,
          rir_actual: '',
          notes: '',
          rest_sec_actual: null,
        })
      }
    }
  }
  return sets
}

function formatTime(sec: number) {
  const abs = Math.abs(sec)
  const m = Math.floor(abs / 60).toString().padStart(2, '0')
  const s = (abs % 60).toString().padStart(2, '0')
  return sec < 0 ? `-${m}:${s}` : `${m}:${s}`
}

function sideLabel(side: 'left' | 'right' | 'bilateral') {
  if (side === 'left') return 'G'
  if (side === 'right') return 'D'
  return null
}

function sideColor(side: 'left' | 'right' | 'bilateral') {
  if (side === 'left') return 'text-blue-400'
  if (side === 'right') return 'text-violet-400'
  return ''
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SessionLogger({ clientId, session, exercises, lastPerformance }: Props) {
  const router = useRouter()
  const { t } = useClientT()
  const [sets, setSets] = useState<SetLog[]>(() => buildInitialSets(exercises))
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(true)
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [swappedNames, setSwappedNames] = useState<Record<string, string>>({})
  const [altSheetTarget, setAltSheetTarget] = useState<number | null>(null)

  // ── Chrono repos ──
  // restElapsed : secondes écoulées depuis le début du chrono (peut dépasser restPrescribed → overtime)
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
  const [restPrescribed, setRestPrescribed] = useState<number | null>(null)
  const [restElapsed, setRestElapsed] = useState(0)
  const [restModalOpen, setRestModalOpen] = useState(false)
  // Set qui a déclenché le repos (pour enregistrer rest_sec_actual à la prochaine interaction)
  const [pendingRestSet, setPendingRestSet] = useState<{ exId: string; setNum: number; side: string } | null>(null)
  // Délai d'inactivité avant ouverture du modal
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Bouton Terminer — appui long ──
  const [longPressProgress, setLongPressProgress] = useState(0) // 0→1
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longPressStartRef = useRef<number | null>(null)
  const LONG_PRESS_DURATION = 3000

  const currentEx = exercises[currentExIndex]
  const isFirst = currentExIndex === 0
  const isLast = currentExIndex === exercises.length - 1

  const completedCount = sets.filter(s => s.completed).length
  const totalSets = sets.length
  const progress = totalSets > 0 ? completedCount / totalSets : 0
  const allDone = completedCount === totalSets && totalSets > 0

  // ── Chrono global ──
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])

  // ── Chrono repos — tick ──
  useEffect(() => {
    if (restStartedAt === null) {
      clearInterval(restIntervalRef.current!)
      setRestElapsed(0)
      return
    }
    restIntervalRef.current = setInterval(() => {
      setRestElapsed(Math.floor((Date.now() - restStartedAt) / 1000))
    }, 1000)
    return () => clearInterval(restIntervalRef.current!)
  }, [restStartedAt])

  // ── Ouvrir le modal après 3s d'inactivité ──
  function scheduleModalOpen() {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => {
      setRestModalOpen(true)
    }, 3000)
  }

  function startRest(exId: string, setNum: number, side: string, prescribed: number | null) {
    // Enregistrer le rest_sec_actual du set précédent si applicable
    if (pendingRestSet && restStartedAt !== null) {
      const actual = Math.floor((Date.now() - restStartedAt) / 1000)
      setSets(prev => prev.map(s =>
        s.exercise_id === pendingRestSet.exId &&
        s.set_number === pendingRestSet.setNum &&
        s.side === pendingRestSet.side
          ? { ...s, rest_sec_actual: actual }
          : s
      ))
    }
    setRestStartedAt(Date.now())
    setRestPrescribed(prescribed)
    setRestElapsed(0)
    setPendingRestSet({ exId, setNum, side })
    scheduleModalOpen()
  }

  function stopRest() {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    setRestStartedAt(null)
    setRestPrescribed(null)
    setRestElapsed(0)
    setRestModalOpen(false)
    setPendingRestSet(null)
  }

  // Appelé quand l'utilisateur interagit avec un champ d'un set — enregistre le repos du set précédent
  function onSetInteraction(exId: string, setNum: number, side: string) {
    if (pendingRestSet && restStartedAt !== null) {
      const isSameSet = pendingRestSet.exId === exId && pendingRestSet.setNum === setNum && pendingRestSet.side === side
      if (!isSameSet) {
        // Nouvelle interaction sur un set différent → stopper le chrono et enregistrer
        const actual = Math.floor((Date.now() - restStartedAt) / 1000)
        setSets(prev => prev.map(s =>
          s.exercise_id === pendingRestSet.exId &&
          s.set_number === pendingRestSet.setNum &&
          s.side === pendingRestSet.side
            ? { ...s, rest_sec_actual: actual }
            : s
        ))
        stopRest()
      }
    }
  }

  function updateSet(exId: string, setNum: number, side: string, patch: Partial<SetLog>) {
    onSetInteraction(exId, setNum, side)
    setSets(prev => {
      const next = prev.map(s =>
        s.exercise_id === exId && s.set_number === setNum && s.side === side
          ? { ...s, ...patch }
          : s
      )
      // Déclenchement chrono par saisie : si reps OU poids rempli et set pas encore complété
      const updated = next.find(s => s.exercise_id === exId && s.set_number === setNum && s.side === side)
      if (updated && !updated.completed && (updated.actual_reps || updated.actual_weight_kg)) {
        const ex = exercises.find(e => e.id === exId)
        // Démarrer le repos seulement si pas déjà en cours pour ce set
        const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
        if (!alreadyTracking) {
          startRest(exId, setNum, side, ex?.rest_sec ?? null)
        } else {
          scheduleModalOpen() // reset inactivité
        }
      }
      return next
    })
  }

  function toggleSet(exId: string, setNum: number, side: string, restSec: number | null) {
    setSets(prev =>
      prev.map(s => {
        if (s.exercise_id !== exId || s.set_number !== setNum || s.side !== side) return s
        const nowCompleted = !s.completed
        if (nowCompleted) {
          // Ne relance le repos que si pas déjà en cours pour CE set
          const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
          if (!alreadyTracking) {
            startRest(exId, setNum, side, restSec)
          }
        }
        return { ...s, completed: nowCompleted }
      })
    )
  }

  // Sets de l'exercice courant
  const exSets = currentEx ? sets.filter(s => s.exercise_id === currentEx.id) : []
  const allCurrentDone = exSets.length > 0 && exSets.every(s => s.completed)

  const lastPerf = currentEx ? (lastPerformance[currentEx.name] ?? []) : []
  function getLastPerfLabel(setNum: number, side: 'left' | 'right' | 'bilateral') {
    if (lastPerf.length === 0) return null
    const match = lastPerf.find(p => side !== 'bilateral' ? p.side === side : true)
    return match ?? lastPerf[0]
  }

  function getProgressionHint(ex: Exercise): string | null {
    if (!ex.progressive_overload_enabled) return null
    if (ex.rep_min === null || ex.rep_max === null) return null
    const effectiveRir = ex.target_rir ?? ex.rir
    if (effectiveRir === null) return null
    return `Atteins ${ex.rep_max} reps à RIR ${effectiveRir} sur toutes tes séries pour augmenter la charge.`
  }

  // ── Chrono repos — valeurs dérivées ──
  const restRemaining = restPrescribed !== null ? restPrescribed - restElapsed : null // peut être négatif
  const isOvertime = restRemaining !== null && restRemaining < 0
  const overtimeLabel = isOvertime ? formatTime(restRemaining!) : null

  // ── Long press Terminer ──
  function onFinishPressStart() {
    if (allDone) {
      // Dernier exercice complété → simple clic
      submitSession()
      return
    }
    longPressStartRef.current = Date.now()
    longPressRef.current = setInterval(() => {
      const elapsed = Date.now() - (longPressStartRef.current ?? Date.now())
      const p = Math.min(elapsed / LONG_PRESS_DURATION, 1)
      setLongPressProgress(p)
      if (p >= 1) {
        clearInterval(longPressRef.current!)
        setLongPressProgress(0)
        setShowFinishConfirm(true)
      }
    }, 16)
  }

  function onFinishPressEnd() {
    if (longPressRef.current) clearInterval(longPressRef.current)
    setLongPressProgress(0)
  }

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
          exercise_notes: exerciseNotes,
          set_logs: sets.map(s => ({
            exercise_id: s.exercise_id,
            exercise_name: s.exercise_name,
            set_number: s.set_number,
            side: s.side,
            planned_reps: s.planned_reps,
            actual_reps: s.actual_reps ? parseInt(s.actual_reps) : null,
            actual_weight_kg: s.actual_weight_kg ? parseFloat(s.actual_weight_kg) : null,
            completed: s.completed,
            rir_actual: s.rir_actual ? parseInt(s.rir_actual) : null,
            notes: s.notes || null,
            rest_sec_actual: s.rest_sec_actual ?? null,
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
        await fetch(`/api/session-logs/${sessionLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin }),
        })
      } catch {
        // Silent — session data preserved
      }
    }

    setSaveState('idle')
    if (sessionLogId) {
      router.push(`/client/programme/recap/${sessionLogId}`)
    } else {
      router.push('/client/programme')
    }
  }

  function handleSwap(exerciseId: string, newName: string) {
    setSwappedNames(prev => ({ ...prev, [exerciseId]: newName }))
    setSwapTarget(null)
  }

  if (!currentEx) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-white/40 text-sm">Aucun exercice dans cette séance.</p>
      </div>
    )
  }

  const effectiveRir = currentEx.target_rir ?? currentEx.rir
  const progressionHint = getProgressionHint(currentEx)
  const remainingSets = totalSets - completedCount

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-32">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white">{session.name}</p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1f8a65]">{completedCount}/{totalSets}</span>
            {/* Mini-badge repos — temps restant positif */}
            {restStartedAt !== null && !isOvertime && restRemaining !== null && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-lg">
                <Clock size={10} />
                {formatTime(restRemaining)}
              </span>
            )}
            {/* Mini-badge overtime */}
            {isOvertime && restStartedAt !== null && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg animate-pulse">
                {overtimeLabel}
              </span>
            )}
          </div>
        </div>
        {/* Barre de progression */}
        <div className="max-w-lg mx-auto mt-3 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1f8a65] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      {/* ── Bannière erreur ── */}
      {saveState === 'error' && errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3">
          <div className="max-w-lg mx-auto flex items-start gap-3">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-red-400">Sauvegarde échouée</p>
              <p className="text-[11px] text-red-400/70 mt-0.5 break-all">{errorMsg}</p>
            </div>
            <button
              onClick={submitSession}
              className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
            >
              <RefreshCw size={11} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── Modal repos ── */}
      {restModalOpen && restStartedAt !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-2xl p-8 w-full max-w-xs text-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                {isOvertime ? 'Temps dépassé' : 'Temps de repos'}
              </p>
              <button
                onClick={() => setRestModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:bg-white/[0.07] hover:text-white/60 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Jauge circulaire */}
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                {/* Progress */}
                {restPrescribed !== null && (
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={isOvertime ? (restElapsed > (restPrescribed + 30) ? '#ef4444' : '#f97316') : '#1f8a65'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(restElapsed / restPrescribed, 1))}`}
                    className="transition-all duration-1000"
                  />
                )}
              </svg>
              <div className="absolute text-center">
                <p className={`text-[2.4rem] font-black font-mono leading-none tracking-tight ${isOvertime ? 'text-red-400' : 'text-white'}`}>
                  {restPrescribed !== null
                    ? formatTime(restPrescribed - restElapsed)
                    : formatTime(restElapsed)
                  }
                </p>
                {isOvertime && (
                  <p className="text-[10px] font-bold text-red-400/70 mt-1 uppercase tracking-wider">Overtime</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setRestModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.04] text-[13px] font-bold text-white/60 hover:bg-white/[0.07] hover:text-white/90 transition-colors"
            >
              {t('logger.rest.skip')}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal confirmation Terminer ── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">{t('logger.finish.confirm')}</h3>
            <p className="text-[13px] text-white/55 mb-5">
              Il te reste encore <span className="text-white font-semibold">{remainingSets} série{remainingSets > 1 ? 's' : ''}</span> {t('logger.finish.incomplete')}. Tu es sûr de vouloir terminer ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
              >
                {t('logger.finish.cancel')}
              </button>
              <button
                onClick={() => { setShowFinishConfirm(false); submitSession() }}
                disabled={saveState === 'saving'}
                className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-colors"
              >
                {saveState === 'saving' ? '…' : t('logger.finish.action')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-5 py-5 flex flex-col gap-4">

        {/* ── Navigation exercices ── */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentExIndex(i => Math.max(0, i - 1))}
            disabled={isFirst}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex gap-1.5 items-center flex-1 justify-center">
            {exercises.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentExIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentExIndex
                    ? 'w-6 bg-[#1f8a65]'
                    : sets.filter(s => s.exercise_id === exercises[i].id).every(s => s.completed)
                    ? 'w-1.5 bg-[#1f8a65]/50'
                    : 'w-1.5 bg-white/[0.12]'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentExIndex(i => Math.min(exercises.length - 1, i + 1))}
            disabled={isLast}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── Card exercice courant ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">

          {/* Image de l'exercice — ouverte par défaut, format carré */}
          {currentEx.image_url && (
            <div className="relative">
              {showImage ? (
                <div className="relative w-full aspect-square bg-black/20 overflow-hidden">
                  <Image
                    src={currentEx.image_url}
                    alt={currentEx.name}
                    fill
                    className="object-cover"
                    unoptimized={currentEx.image_url.endsWith('.gif')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 to-transparent" />
                  <button
                    onClick={() => setShowImage(false)}
                    className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium text-white/60 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-black/60 transition-colors"
                  >
                    <ChevronUp size={11} />
                    {t('logger.demo.hide')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowImage(true)}
                  className="w-full h-14 bg-black/20 flex items-center justify-center gap-2 text-[10px] font-medium text-white/35 hover:text-white/55 hover:bg-black/30 transition-colors"
                >
                  <span>{t('logger.demo.show')}</span>
                </button>
              )}
            </div>
          )}

          {/* En-tête exercice */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[15px] font-bold text-white leading-tight">
                    {swappedNames[currentEx.id] ?? currentEx.name}
                  </h2>
                  <button
                    onClick={() => setSwapTarget(currentEx.id)}
                    className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
                    title="Remplacer temporairement"
                  >
                    <ArrowLeftRight size={13} />
                  </button>
                  {currentEx.clientAlternatives && currentEx.clientAlternatives.length > 0 && !swappedNames[currentEx.id] && (
                    <button
                      type="button"
                      onClick={() => setAltSheetTarget(currentExIndex)}
                      className="text-[10px] font-semibold text-white/30 hover:text-amber-400 transition-colors"
                    >
                      Indisponible ?
                    </button>
                  )}
                  {currentEx.progressive_overload_enabled && currentEx.rep_min !== null && (
                    <TrendingUp size={12} className="text-[#1f8a65] shrink-0" />
                  )}
                  {currentEx.is_unilateral && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      Unilatéral
                    </span>
                  )}
                  {allCurrentDone && (
                    <CheckCircle2 size={14} className="text-[#1f8a65] shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#1f8a65]">
                    {currentEx.sets} × {currentEx.reps}
                  </span>
                  {currentEx.rest_sec && (
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <Clock size={10} />{currentEx.rest_sec}s repos
                    </span>
                  )}
                  {effectiveRir !== null && effectiveRir !== undefined && (
                    <span className="text-[11px] text-white/40">
                      {t('logger.rir.target')} : <span className="text-white/70 font-semibold">{effectiveRir}</span>
                    </span>
                  )}
                  {currentEx.current_weight_kg !== null && (
                    <span className="text-[11px] text-white/40">
                      Suggéré : <span className="text-white/70 font-semibold">{currentEx.current_weight_kg}kg</span>
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-white/25 shrink-0 mt-1">
                {currentExIndex + 1}/{exercises.length}
              </span>
            </div>

            {progressionHint && (
              <div className="mt-3 px-3 py-2 bg-[#1f8a65]/[0.08] border border-[#1f8a65]/20 rounded-xl">
                <p className="text-[10px] text-[#1f8a65] font-medium leading-relaxed">{progressionHint}</p>
              </div>
            )}

            {currentEx.notes && (
              <p className="mt-2 text-[11px] text-white/35 italic leading-relaxed">{currentEx.notes}</p>
            )}
          </div>

          {/* ── Sets ── */}
          <div className="border-t border-white/[0.05]">
            <div
              className="grid items-center px-5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/25"
              style={{ gridTemplateColumns: currentEx.is_unilateral ? '1fr 1fr 1.8fr 1.8fr 1.5fr 1fr' : '0.6fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' }}
            >
              <div>#</div>
              {currentEx.is_unilateral && <div>{t('logger.set')}</div>}
              <div>{t('logger.target.label')}</div>
              <div>{t('logger.actual.label')}</div>
              <div>Kg</div>
              <div>{t('logger.rir.label')}</div>
              <div className="text-center">✓</div>
            </div>

            {exSets.map((s, idx) => {
              const lastP = getLastPerfLabel(s.set_number, s.side)
              const isFirstOfSet = !currentEx.is_unilateral || s.side === 'left'

              return (
                <div key={`${s.set_number}-${s.side}`}>
                  {currentEx.is_unilateral && isFirstOfSet && idx > 0 && (
                    <div className="h-px bg-white/[0.04] mx-5" />
                  )}
                  <div
                    className={`grid items-center gap-2 px-5 py-3 transition-colors ${
                      s.completed ? 'bg-[#1f8a65]/[0.04]' : ''
                    } ${!currentEx.is_unilateral ? 'border-t border-white/[0.04]' : ''}`}
                    style={{ gridTemplateColumns: currentEx.is_unilateral ? '1fr 1fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' : '0.6fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' }}
                  >
                    <div className="text-[12px] font-mono font-bold text-white/30">
                      {(!currentEx.is_unilateral || s.side === 'left') ? s.set_number : ''}
                    </div>

                    {currentEx.is_unilateral && (
                      <div className={`text-[11px] font-bold ${sideColor(s.side)}`}>
                        {sideLabel(s.side)}
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] font-mono text-white/30 truncate">{s.planned_reps}</div>
                      {lastP && (!currentEx.is_unilateral || s.side === 'left') && (
                        <div className="text-[9px] text-white/20 mt-0.5 truncate">
                          ↩ {lastP.weight ? `${lastP.weight}kg` : '—'} × {lastP.reps ?? '—'}
                        </div>
                      )}
                    </div>

                    {/* Reps */}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={s.actual_reps}
                      onChange={e => updateSet(currentEx.id, s.set_number, s.side, { actual_reps: e.target.value })}
                      placeholder={lastP?.reps ? String(lastP.reps) : '—'}
                      className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 text-[13px] font-mono font-bold text-white text-center outline-none focus:ring-1 focus:ring-[#1f8a65]/40 focus:border-[#1f8a65]/30 w-full placeholder:text-white/20 transition-colors"
                    />

                    {/* Kg */}
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={s.actual_weight_kg}
                      onChange={e => updateSet(currentEx.id, s.set_number, s.side, { actual_weight_kg: e.target.value })}
                      placeholder={lastP?.weight ? String(lastP.weight) : '—'}
                      className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 text-[13px] font-mono font-bold text-white text-center outline-none focus:ring-1 focus:ring-[#1f8a65]/40 focus:border-[#1f8a65]/30 w-full placeholder:text-white/20 transition-colors"
                    />

                    {/* RIR */}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={10}
                      value={s.rir_actual}
                      onChange={e => updateSet(currentEx.id, s.set_number, s.side, { rir_actual: e.target.value })}
                      placeholder={effectiveRir !== null && effectiveRir !== undefined ? String(effectiveRir) : '—'}
                      className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 text-[13px] font-mono font-bold text-white text-center outline-none focus:ring-1 focus:ring-violet-400/40 focus:border-violet-400/30 w-full placeholder:text-white/20 transition-colors"
                    />

                    {/* Bouton valider — avec label explicite */}
                    <button
                      onClick={() => toggleSet(currentEx.id, s.set_number, s.side, currentEx.rest_sec)}
                      title="Valider et lancer le repos"
                      className="flex justify-center items-center h-10 w-10 rounded-xl transition-colors"
                    >
                      {s.completed ? (
                        <CheckCircle2 size={22} className="text-[#1f8a65]" />
                      ) : (
                        <Circle size={22} className="text-white/20 hover:text-white/50 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Note de ressenti ── */}
          <div className="border-t border-white/[0.05] px-5 py-3">
            {showNoteInput === currentEx.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  rows={3}
                  value={exerciseNotes[currentEx.id] ?? ''}
                  onChange={e => setExerciseNotes(prev => ({ ...prev, [currentEx.id]: e.target.value }))}
                  placeholder={t('logger.note.placeholder')}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#1f8a65]/30 focus:border-[#1f8a65]/20 resize-none transition-colors leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowNoteInput(null)}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNoteInput(currentEx.id)}
                className="flex items-center gap-2 text-[11px] font-medium text-white/30 hover:text-white/55 transition-colors"
              >
                <MessageSquare size={13} />
                {exerciseNotes[currentEx.id]
                  ? <span className="text-white/50 truncate max-w-[260px]">{exerciseNotes[currentEx.id]}</span>
                  : 'Ajouter un ressenti'}
              </button>
            )}
          </div>
        </div>

        {/* ── Exercice suivant ── */}
        {!isLast && (
          <button
            onClick={() => setCurrentExIndex(i => i + 1)}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] text-white/60 font-semibold py-3.5 rounded-xl hover:bg-white/[0.06] hover:text-white/80 transition-colors text-[12px]"
          >
            Exercice suivant
            <ChevronRight size={14} />
          </button>
        )}
      </main>

      {swapTarget && (
        <ExerciseSwapSheet
          exercise={exercises.find(e => e.id === swapTarget)!}
          allExercises={exercises}
          onSwap={(newName) => handleSwap(swapTarget, newName)}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* ── ClientAlternativesSheet ── */}
      {altSheetTarget !== null && exercises[altSheetTarget]?.clientAlternatives?.length ? (
        <ClientAlternativesSheet
          exerciseName={swappedNames[exercises[altSheetTarget].id] ?? exercises[altSheetTarget].name}
          alternatives={exercises[altSheetTarget].clientAlternatives!}
          onSelect={(name) => {
            setSwappedNames(prev => ({ ...prev, [exercises[altSheetTarget].id]: name }))
          }}
          onClose={() => setAltSheetTarget(null)}
        />
      ) : null}

      {/* ── Bouton Terminer (fixe) ── */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-40 bg-[#121212] pt-3 pb-2">
        <div className="max-w-lg mx-auto">
          {allDone ? (
            /* Séance complète → simple clic, vert proéminent */
            <button
              onClick={submitSession}
              disabled={saveState === 'saving'}
              className="group w-full flex items-center justify-between bg-[#1f8a65] pl-5 pr-1.5 py-1.5 rounded-xl hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                {saveState === 'saving' ? 'Enregistrement…' : t('logger.finish')}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.15]">
                {saveState === 'saving'
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Flag size={15} className="text-white" />
                }
              </div>
            </button>
          ) : (
            /* Séance incomplète → appui long 3s, gris discret */
            <div className="relative overflow-hidden rounded-xl">
              {/* Jauge de remplissage */}
              {longPressProgress > 0 && (
                <div
                  className="absolute inset-0 bg-[#1f8a65] rounded-xl transition-none origin-left"
                  style={{ transform: `scaleX(${longPressProgress})` }}
                />
              )}
              <button
                onMouseDown={onFinishPressStart}
                onMouseUp={onFinishPressEnd}
                onMouseLeave={onFinishPressEnd}
                onTouchStart={onFinishPressStart}
                onTouchEnd={onFinishPressEnd}
                disabled={saveState === 'saving'}
                className="relative w-full flex items-center justify-between bg-white/[0.06] pl-5 pr-1.5 py-1.5 rounded-xl disabled:opacity-50 select-none"
              >
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">
                  {saveState === 'saving' ? 'Enregistrement…' : 'Terminer · Maintenir 3s'}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                  {saveState === 'saving'
                    ? <Loader2 size={15} className="text-white/40 animate-spin" />
                    : <Flag size={15} className="text-white/30" />
                  }
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
