'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, AlertCircle, RefreshCw,
  Clock, X, Flag, MoreHorizontal, RefreshCw as Rotate
} from 'lucide-react'
import { useClientT } from '@/components/client/ClientI18nProvider'
import ExerciseSwapSheet from './ExerciseSwapSheet'
import ClientAlternativesSheet from '@/components/client/ClientAlternativesSheet'
import { recommendNextSet, type SetRecommendation } from '@/lib/training/setRecommendation'
import { getDefaultTempo, parseTempo } from '@/lib/training/tempo'
import TempoGuideModal from '@/components/client/TempoGuideModal'
import PrepTimeModal, { getPrepTime, hasPrepTimeConfigured, getHapticsEnabled } from '@/components/client/PrepTimeModal'
import ExerciseBlock, { type ExerciseBlockExercise } from '@/components/client/smart/ExerciseBlock'
import SupersetContextMenu from '@/components/client/smart/SupersetContextMenu'
import { motion, AnimatePresence } from 'framer-motion'
import type { SetRowData, SetType } from '@/components/client/smart/SetRow'

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
  weight_increment_kg?: number | null
  primary_muscles?: string[]
  secondary_muscles?: string[]
  group_id?: string | null
  clientAlternatives?: string[]
  tempo?: string | null
  movement_pattern?: string | null
}

interface SetLog {
  exercise_id: string
  exercise_name: string
  set_number: number
  side: 'left' | 'right' | 'bilateral'
  set_type: SetType
  planned_reps: string
  actual_reps: string
  actual_weight_kg: string
  completed: boolean
  rir_actual: string
  notes: string
  rest_sec_actual: number | null
  rest_sec: number | null
  primary_muscles: string[]
  secondary_muscles: string[]
  tempo_used: string | null
}

interface LastPerf {
  weight: number | null
  reps: number | null
  rir?: number | null
  side?: string | null
  set_number?: number | null
}

interface Props {
  clientId: string
  sessionId: string
  session: { id: string; name: string }
  exercises: Exercise[]
  lastPerformance: Record<string, LastPerf[]>
  goal: string
  level: string
  clientWeight?: number
}

type SaveState = 'idle' | 'saving' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialSets(exercises: Exercise[], goal: string): SetLog[] {
  const sets: SetLog[] = []
  for (const ex of exercises) {
    const resolvedTempo = ex.tempo ?? getDefaultTempo(ex.movement_pattern ?? null, goal)
    for (let i = 0; i < ex.sets; i++) {
      if (ex.is_unilateral) {
        for (const side of ['left', 'right'] as const) {
          sets.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            set_number: i + 1,
            side,
            set_type: 'working',
            planned_reps: ex.reps,
            actual_reps: '',
            actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
            completed: false,
            rir_actual: '',
            notes: '',
            rest_sec_actual: null,
            rest_sec: ex.rest_sec,
            primary_muscles: ex.primary_muscles ?? [],
            secondary_muscles: ex.secondary_muscles ?? [],
            tempo_used: resolvedTempo,
          })
        }
      } else {
        sets.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          set_number: i + 1,
          side: 'bilateral',
          set_type: 'working',
          planned_reps: ex.reps,
          actual_reps: '',
          actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
          completed: false,
          rir_actual: '',
          notes: '',
          rest_sec_actual: null,
          rest_sec: ex.rest_sec,
          primary_muscles: ex.primary_muscles ?? [],
          secondary_muscles: ex.secondary_muscles ?? [],
          tempo_used: resolvedTempo,
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

function formatWeight(kg: number): string {
  return parseFloat(kg.toFixed(2)).toString()
}

function recKey(exerciseId: string, setNumber: number, side: string): string {
  return `${exerciseId}_set${setNumber}_${side}`
}

function resolveReps(ex: Exercise): number {
  const n = parseInt(ex.reps, 10)
  if (!isNaN(n) && String(n) === ex.reps.trim()) return n
  if (ex.rep_min !== null && ex.rep_min > 0) return ex.rep_min
  return 8
}

function getCoachingCue(rir: number | null, setNumber: number, totalSets: number, isLastSet: boolean): string | null {
  if (rir === null) return null
  if (rir === 0) return isLastSet ? 'Maximum atteint — repos complet 3min' : 'Échec musculaire — augmente le repos'
  if (rir <= 1 && isLastSet) return 'Intensité parfaite sur le dernier set 🎯'
  if (rir <= 2) return 'Bonne intensité — continue'
  if (rir >= 5 && setNumber < totalSets) return 'Trop facile — augmente le poids au prochain set'
  if (rir >= 4 && isLastSet) return 'Zone trop confortable — challenge-toi la prochaine fois'
  return null
}

function calcHydrationPlan(weightKg: number, durationMin: number) {
  const rawMl = 150 + weightKg * 5 * (durationMin / 60) + durationMin * 5
  const totalMl = Math.round(rawMl / 50) * 50
  const intervalMin = 15
  const sips = Math.max(1, Math.floor(durationMin / intervalMin))
  const mlPerSip = Math.round(totalMl / sips / 10) * 10
  return { totalMl, intervalMin, mlPerSip }
}

function parseSetForApi(s: SetLog) {
  const reps = s.actual_reps !== '' ? parseInt(s.actual_reps, 10) : null
  const weight = s.actual_weight_kg !== '' ? parseFloat(s.actual_weight_kg) : null
  const rir = s.rir_actual !== '' ? parseInt(s.rir_actual, 10) : null
  return {
    ...s,
    set_type: s.set_type,
    actual_reps: reps !== null && !isNaN(reps) ? reps : null,
    actual_weight_kg: weight !== null && !isNaN(weight) ? weight : null,
    rir_actual: rir !== null && !isNaN(rir) ? rir : null,
    planned_reps: s.planned_reps || null,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SessionLogger({ clientId, sessionId, session, exercises, lastPerformance, goal, level, clientWeight }: Props) {
  const router = useRouter()
  const { t } = useClientT()
  const [sets, setSets] = useState<SetLog[]>(() => buildInitialSets(exercises, goal))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null)
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [swappedNames, setSwappedNames] = useState<Record<string, string>>({})
  const [altSheetTarget, setAltSheetTarget] = useState<number | null>(null)
  const [tempoGuideTarget, setTempoGuideTarget] = useState<{
    tempo: string; reps: number; exerciseName: string; prepSeconds: number; hapticsEnabled: boolean
  } | null>(null)
  const [prepTimeTarget, setPrepTimeTarget] = useState<{
    tempo: string; reps: number; exerciseName: string
  } | null>(null)
  const [recommendations, setRecommendations] = useState<Record<string, SetRecommendation>>({})
  const [manuallyEdited, setManuallyEdited] = useState<Set<string>>(new Set())

  // ── New states for redesign ──
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const [progressionTarget, setProgressionTarget] = useState<{ exId: string; name: string } | null>(null)
  const [deletedExerciseIds, setDeletedExerciseIds] = useState<Set<string>>(new Set())
  const [dissolvedGroupIds, setDissolvedGroupIds] = useState<Set<string>>(new Set())
  const [supersetMenuFor, setSupersetMenuFor] = useState<string | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  // ── Live save ──
  const sessionLogIdRef = useRef<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const DRAFT_KEY = `draft_session_log_id_${sessionId}`

  // ── PR Detection ──
  const [prSets, setPrSets] = useState<Set<string>>(new Set())
  const [prFlash, setPrFlash] = useState<string | null>(null)

  // ── Hydratation ──
  const [showHydrationIntro, setShowHydrationIntro] = useState(true)
  const [showHydration, setShowHydration] = useState(false)
  const [sipsConsumed, setSipsConsumed] = useState(0)
  const hydrationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const HYDRATION_INTERVAL_MS = 15 * 60 * 1000

  const hydrationPlan = useMemo(() => {
    const w = clientWeight ?? 70
    return calcHydrationPlan(w, 60)
  }, [clientWeight])

  // ── Bouton Terminer — appui long ──
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longPressStartRef = useRef<number | null>(null)
  const LONG_PRESS_DURATION = 3000

  // ── Rest timer ──
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
  const [restPrescribed, setRestPrescribed] = useState<number | null>(null)
  const [restElapsed, setRestElapsed] = useState(0)
  const [restModalOpen, setRestModalOpen] = useState(false)
  const [pendingRestSet, setPendingRestSet] = useState<{ exId: string; setNum: number; side: string } | null>(null)
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeInputRef = useRef(false)
  const tempoActiveRef = useRef(false)

  // ── Derived ──
  const completedCount = sets.filter(s => s.completed).length
  const totalSets = sets.length
  const progress = totalSets > 0 ? completedCount / totalSets : 0
  const allDone = completedCount === totalSets && totalSets > 0
  const remainingSets = totalSets - completedCount

  const restRemaining = restPrescribed !== null ? restPrescribed - restElapsed : null
  const isOvertime = restRemaining !== null && restRemaining < 0
  const overtimeLabel = isOvertime ? formatTime(restRemaining!) : null

  // ── Exercise groups ──
  const exerciseGroups: Exercise[][] = useMemo(() => {
    const groups: Exercise[][] = []
    const seenGroupIds = new Set<string>()
    for (const ex of exercises) {
      if (ex.group_id) {
        if (!seenGroupIds.has(ex.group_id)) {
          seenGroupIds.add(ex.group_id)
          groups.push(exercises.filter(e => e.group_id === ex.group_id))
        }
      } else {
        groups.push([ex])
      }
    }
    return groups
  }, [exercises])

  // ── Coaching cues map ──
  const coachingCuesMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const s of sets) {
      if (s.completed) {
        const key = recKey(s.exercise_id, s.set_number, s.side)
        const exSets = sets.filter(st => st.exercise_id === s.exercise_id && st.side === s.side)
        const totalS = exSets.length
        const isLastSet = s.set_number === Math.max(...exSets.map(st => st.set_number))
        const rir = s.rir_actual !== '' ? parseInt(s.rir_actual, 10) : null
        map[key] = getCoachingCue(isNaN(rir!) ? null : rir, s.set_number, totalS, isLastSet)
      }
    }
    return map
  }, [sets])

  // ── API ──
  async function patchSets(currentSets: SetLog[]) {
    const logId = sessionLogIdRef.current
    if (!logId) return
    try {
      const payload = currentSets.map(parseSetForApi)
      const res = await fetch(`/api/session-logs/${logId}/sets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_logs: payload }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[patchSets] failed', res.status, body)
      }
    } catch { /* silent */ }
  }

  // ── Recommendation engine ──
  const triggerRecommendation = useCallback((completedSet: SetLog) => {
    const { exercise_id, exercise_name, set_number, side, actual_reps, actual_weight_kg, rir_actual } = completedSet
    if (!actual_reps || !actual_weight_kg || rir_actual === '') return
    const reps = parseInt(actual_reps, 10)
    const weight = parseFloat(actual_weight_kg)
    const rir = parseInt(rir_actual, 10)
    if (isNaN(reps) || isNaN(weight) || isNaN(rir)) return

    setSets(prev => {
      const exerciseSets = prev.filter(s => s.exercise_id === exercise_id && s.side === side)
      const currentIdx = exerciseSets.findIndex(s => s.set_number === set_number)
      if (currentIdx === -1 || currentIdx >= exerciseSets.length - 1) return prev
      const nextSet = exerciseSets[currentIdx + 1]
      const nextKey = recKey(exercise_id, nextSet.set_number, side)
      if (manuallyEdited.has(nextKey)) return prev

      const ex = exercises.find(e => e.id === exercise_id)
      const history = lastPerformance[exercise_name] ?? []
      const historyEntry = history.find(h =>
        (side === 'bilateral' ? true : h.side === side) &&
        (h as any).set_number === nextSet.set_number
      ) ?? history.find(h => side === 'bilateral' ? true : h.side === side)

      const lastWeek = historyEntry && historyEntry.weight != null && historyEntry.reps != null
        ? { weight_kg: historyEntry.weight, reps: historyEntry.reps, rir_actual: historyEntry.rir ?? 2 }
        : undefined

      const plannedReps = parseInt(nextSet.planned_reps, 10) || 0
      const prevSetWeight = parseFloat(completedSet.actual_weight_kg) || undefined

      const rec = recommendNextSet({
        actual_weight_kg: weight,
        actual_reps: reps,
        rir_actual: rir,
        goal,
        level,
        planned_reps: plannedReps,
        set_number: nextSet.set_number,
        rep_min: ex?.rep_min ?? undefined,
        rep_max: ex?.rep_max ?? undefined,
        target_rir: ex?.target_rir ?? ex?.rir ?? undefined,
        weight_increment_kg: ex?.weight_increment_kg ?? 2.5,
        lastWeek,
        prev_set_weight_kg: prevSetWeight,
      })

      if (!rec) return prev
      setRecommendations(r => ({ ...r, [nextKey]: rec }))
      return prev.map(s => {
        if (s.exercise_id === exercise_id && s.set_number === nextSet.set_number && s.side === side) {
          return { ...s, actual_weight_kg: formatWeight(rec.weight_kg), actual_reps: String(rec.reps) }
        }
        return s
      })
    })
  }, [exercises, lastPerformance, goal, level, manuallyEdited])

  // ── Draft init ──
  useEffect(() => {
    let cancelled = false
    async function initDraft() {
      const existingId = localStorage.getItem(DRAFT_KEY)
      if (existingId) {
        try {
          const res = await fetch(`/api/session-logs/${existingId}/sets`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ set_logs: [] }),
          })
          if (res.ok && !cancelled) {
            sessionLogIdRef.current = existingId
            setDraftReady(true)
            return
          }
          if (res.status === 404 && !cancelled) {
            localStorage.removeItem(DRAFT_KEY)
            setDraftReady(true)
            return
          }
        } catch { /* continue */ }
        if (!cancelled) localStorage.removeItem(DRAFT_KEY)
      }
      try {
        const res = await fetch('/api/session-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_session_id: session.id, session_name: session.name, set_logs: [] }),
        })
        if (res.ok && !cancelled) {
          const data = await res.json()
          const newId = data?.session_log?.id
          if (newId) {
            sessionLogIdRef.current = newId
            localStorage.setItem(DRAFT_KEY, newId)
          }
        }
      } catch { /* no network */ }
      if (!cancelled) setDraftReady(true)
    }
    initDraft()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current) }
  }, [])

  // ── Chrono global ──
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])

  // ── Rest timer tick ──
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

  // ── Hydratation timer ──
  useEffect(() => {
    tempoActiveRef.current = tempoGuideTarget !== null
  }, [tempoGuideTarget])

  const TEMPO_BUSY_RETRY_MS = 90 * 1000

  function resetHydrationTimer(delayMs: number) {
    if (hydrationTimerRef.current) clearInterval(hydrationTimerRef.current)
    hydrationTimerRef.current = setInterval(() => {
      if (tempoActiveRef.current) {
        if (hydrationTimerRef.current) clearInterval(hydrationTimerRef.current)
        hydrationTimerRef.current = setTimeout(() => {
          if (tempoActiveRef.current) { resetHydrationTimer(TEMPO_BUSY_RETRY_MS); return }
          setShowHydration(true)
        }, TEMPO_BUSY_RETRY_MS) as unknown as ReturnType<typeof setInterval>
        return
      }
      setShowHydration(true)
    }, delayMs)
  }

  useEffect(() => {
    hydrationTimerRef.current = setInterval(() => {
      if (tempoActiveRef.current) {
        if (hydrationTimerRef.current) clearInterval(hydrationTimerRef.current)
        hydrationTimerRef.current = setTimeout(() => {
          if (tempoActiveRef.current) { resetHydrationTimer(TEMPO_BUSY_RETRY_MS); return }
          setShowHydration(true)
        }, TEMPO_BUSY_RETRY_MS) as unknown as ReturnType<typeof setInterval>
        return
      }
      setShowHydration(true)
    }, HYDRATION_INTERVAL_MS)
    return () => { if (hydrationTimerRef.current) clearInterval(hydrationTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HYDRATION_INTERVAL_MS])

  // ── Rest helpers ──
  function scheduleModalOpen() {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => {
      if (!activeInputRef.current) setRestModalOpen(true)
      else scheduleModalOpen()
    }, 8000)
  }

  function startRest(exId: string, setNum: number, side: string, prescribed: number | null) {
    if (pendingRestSet && restStartedAt !== null) {
      const actual = Math.floor((Date.now() - restStartedAt) / 1000)
      setSets(prev => prev.map(s =>
        s.exercise_id === pendingRestSet.exId && s.set_number === pendingRestSet.setNum && s.side === pendingRestSet.side
          ? { ...s, rest_sec_actual: actual } : s
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

  function onSetInteraction(exId: string, setNum: number, side: string) {
    if (pendingRestSet && restStartedAt !== null) {
      const isSameSet = pendingRestSet.exId === exId && pendingRestSet.setNum === setNum && pendingRestSet.side === side
      if (!isSameSet) {
        const actual = Math.floor((Date.now() - restStartedAt) / 1000)
        setSets(prev => prev.map(s =>
          s.exercise_id === pendingRestSet.exId && s.set_number === pendingRestSet.setNum && s.side === pendingRestSet.side
            ? { ...s, rest_sec_actual: actual } : s
        ))
        stopRest()
      }
    }
  }

  // ── Set mutations ──
  function updateSet(exId: string, setNum: number, side: string, patch: Partial<SetLog>) {
    onSetInteraction(exId, setNum, side)
    setSets(prev => {
      const next = prev.map(s =>
        s.exercise_id === exId && s.set_number === setNum && s.side === side ? { ...s, ...patch } : s
      )
      const updated = next.find(s => s.exercise_id === exId && s.set_number === setNum && s.side === side)
      if (updated && !updated.completed && (updated.actual_reps || updated.actual_weight_kg)) {
        const ex = exercises.find(e => e.id === exId)
        const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
        if (!alreadyTracking) startRest(exId, setNum, side, ex?.rest_sec ?? null)
        else scheduleModalOpen()
      }
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      const exSetsUpdated = next.filter(s => s.exercise_id === exId)
      saveDebounceRef.current = setTimeout(() => { patchSets(exSetsUpdated) }, 800)
      return next
    })
    // Mark manual edit if reps/weight changed
    if (patch.actual_reps !== undefined || patch.actual_weight_kg !== undefined) {
      const key = recKey(exId, setNum, side)
      setManuallyEdited(prev => new Set(prev).add(key))
    }
  }

  function toggleSet(exId: string, setNum: number, side: string, restSec: number | null) {
    setSets(prev => {
      const current = prev.find(s => s.exercise_id === exId && s.set_number === setNum && s.side === side)
      const wasCompleted = current?.completed ?? false

      const next = prev.map(s => {
        if (s.exercise_id !== exId || s.set_number !== setNum || s.side !== side) return s
        const nowCompleted = !s.completed
        if (nowCompleted) {
          const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
          if (!alreadyTracking) startRest(exId, setNum, side, restSec)
        }
        return { ...s, completed: nowCompleted }
      })

      const exSetsUpdated = next.filter(s => s.exercise_id === exId)
      patchSets(exSetsUpdated)

      if (!wasCompleted && current) {
        triggerRecommendation(current)
        // PR detection
        const exHistory = lastPerformance[current.exercise_name] ?? []
        const historyBest = exHistory.reduce((best, h) => {
          if (h.weight === null || h.reps === null) return best
          return h.weight > (best?.weight ?? 0) ? h : best
        }, null as LastPerf | null)
        const reps = parseInt(current.actual_reps, 10)
        const weight = parseFloat(current.actual_weight_kg)
        if (!isNaN(reps) && !isNaN(weight) && weight > 0 && reps > 0) {
          const isNewPR = !historyBest ||
            weight > (historyBest.weight ?? 0) ||
            (weight === historyBest.weight && reps > (historyBest.reps ?? 0))
          if (isNewPR) {
            const key = recKey(current.exercise_id, current.set_number, current.side)
            setPrSets(prev => new Set(prev).add(key))
            setPrFlash(`⚡ Nouveau record — ${formatWeight(weight)}kg × ${reps} reps`)
            setTimeout(() => setPrFlash(null), 3000)
          }
        }
      }
      return next
    })
  }

  function deleteSet(exId: string, setNum: number, side: string) {
    setSets(prev => prev.filter(s => !(s.exercise_id === exId && s.set_number === setNum && s.side === side)))
  }

  function addSet(exId: string) {
    const ex = exercises.find(e => e.id === exId)
    if (!ex) return
    const exSets = sets.filter(s => s.exercise_id === exId)
    const lastSet = exSets[exSets.length - 1]
    const newSetNum = (lastSet?.set_number ?? 0) + 1
    const resolvedTempo = ex.tempo ?? getDefaultTempo(ex.movement_pattern ?? null, goal)
    const newSet: SetLog = {
      exercise_id: exId,
      exercise_name: ex.name,
      set_number: newSetNum,
      side: 'bilateral',
      set_type: 'working',
      planned_reps: lastSet?.planned_reps ?? ex.reps,
      actual_reps: '',
      actual_weight_kg: lastSet?.actual_weight_kg ?? (ex.current_weight_kg !== null ? String(ex.current_weight_kg) : ''),
      completed: false,
      rir_actual: '',
      notes: '',
      rest_sec_actual: null,
      rest_sec: ex.rest_sec,
      primary_muscles: ex.primary_muscles ?? [],
      secondary_muscles: ex.secondary_muscles ?? [],
      tempo_used: resolvedTempo,
    }
    setSets(prev => [...prev, newSet])
  }

  // ── Long press Terminer ──
  function onFinishPressStart() {
    if (allDone) { submitSession(); return }
    longPressStartRef.current = Date.now()
    longPressRef.current = setInterval(() => {
      const e = Date.now() - (longPressStartRef.current ?? Date.now())
      const p = Math.min(e / LONG_PRESS_DURATION, 1)
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

  // ── Submit session ──
  async function submitSession() {
    setSaveState('saving')
    setErrorMsg(null)
    const durationMin = Math.round(elapsed / 60)
    const logId = sessionLogIdRef.current
    const allSetsPayload = sets.map(parseSetForApi)

    if (logId) {
      try {
        const flushRes = await fetch(`/api/session-logs/${logId}/sets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ set_logs: allSetsPayload }),
        })
        if (!flushRes.ok) {
          const body = await flushRes.json().catch(() => ({}))
          setSaveState('error')
          setErrorMsg(body?.error ?? `Erreur sauvegarde sets (${flushRes.status})`)
          return
        }
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
        return
      }
      try {
        const completeRes = await fetch(`/api/session-logs/${logId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin, notes: JSON.stringify(exerciseNotes) }),
        })
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}))
          setSaveState('error')
          setErrorMsg(body?.error ?? `Erreur finalisation (${completeRes.status})`)
          return
        }
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
        return
      }
      setSaveState('idle')
      localStorage.removeItem(DRAFT_KEY)
      router.refresh()
      router.push(`/client/programme/recap/${logId}`)
    } else {
      try {
        const res = await fetch('/api/session-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_session_id: session.id,
            session_name: session.name,
            exercise_notes: exerciseNotes,
            set_logs: allSetsPayload,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `Erreur serveur (${res.status})`)
        }
        const data = await res.json()
        const newLogId = data?.session_log?.id
        if (!newLogId) throw new Error('Identifiant de séance manquant')
        await fetch(`/api/session-logs/${newLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin }),
        })
        setSaveState('idle')
        localStorage.removeItem(DRAFT_KEY)
        router.refresh()
        router.push(`/client/programme/recap/${newLogId}`)
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
      }
    }
  }

  function handleSwap(exerciseId: string, newName: string) {
    setSwappedNames(prev => ({ ...prev, [exerciseId]: newName }))
    setSwapTarget(null)
  }

  // ── Tempo handler ──
  function handleTempoForExercise(exId: string) {
    const ex = exercises.find(e => e.id === exId)
    if (!ex?.tempo) return
    const resolvedTempo = ex.tempo
    const repCount = resolveReps(ex)
    const exName = swappedNames[exId] ?? ex.name
    if (!hasPrepTimeConfigured(exName)) {
      setPrepTimeTarget({ tempo: resolvedTempo, reps: repCount, exerciseName: exName })
    } else {
      setTempoGuideTarget({ tempo: resolvedTempo, reps: repCount, exerciseName: exName, prepSeconds: getPrepTime(exName), hapticsEnabled: getHapticsEnabled() })
    }
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-white/40 text-sm">Aucun exercice dans cette séance.</p>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d0d0d] font-sans">

      {/* ── Header fixe ── */}
      <header className="sticky top-0 z-40 bg-[#0d0d0d] border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSessionMenuOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/40 hover:text-white/60 active:scale-95 transition-all"
          >
            <MoreHorizontal size={16} />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white">{session.name}</p>
            <p className="text-[13px] font-mono font-bold text-white tabular-nums mt-0.5">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            {restStartedAt !== null && !isOvertime && restRemaining !== null && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-lg">
                <Clock size={9} />{formatTime(restRemaining)}
              </span>
            )}
            {isOvertime && restStartedAt !== null && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg animate-pulse">
                {overtimeLabel}
              </span>
            )}
            <div className="relative overflow-hidden rounded-xl">
              {longPressProgress > 0 && (
                <div
                  className="absolute inset-0 bg-[#ffe01e]/20 origin-left"
                  style={{ transform: `scaleX(${longPressProgress})` }}
                />
              )}
              <button
                onMouseDown={onFinishPressStart}
                onMouseUp={onFinishPressEnd}
                onMouseLeave={onFinishPressEnd}
                onTouchStart={onFinishPressStart}
                onTouchEnd={onFinishPressEnd}
                disabled={saveState === 'saving' || !draftReady}
                className="relative h-9 px-3 flex items-center gap-1.5 rounded-xl bg-white/[0.06] text-white/50 text-[10px] font-bold uppercase tracking-[0.08em] disabled:opacity-50 select-none"
              >
                {saveState === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
                {allDone ? 'Terminer' : 'Fin'}
              </button>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-[2px] bg-white/[0.06] mx-4 mb-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ffe01e] rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-white/25 font-barlow-condensed uppercase tracking-[0.1em] pb-2">
          {completedCount}/{totalSets} séries
        </p>
      </header>

      {/* ── Error banner ── */}
      {saveState === 'error' && errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-red-400">Sauvegarde échouée</p>
              <p className="text-[10px] text-red-400/70 mt-0.5 break-all">{errorMsg}</p>
            </div>
            <button onClick={submitSession} className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1.5 rounded-lg shrink-0">
              <RefreshCw size={10} /> Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── PR flash ── */}
      <AnimatePresence>
        {prFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-4 right-4 z-50 px-4 py-2.5 bg-[#ffe01e]/10 border border-[#ffe01e]/30 rounded-xl text-[12px] font-bold text-[#ffe01e] text-center"
          >
            {prFlash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exercise list ── */}
      <main className="flex flex-col gap-3 px-4 py-4 pb-32">
        {exerciseGroups
          .filter(group => !group.every(ex => deletedExerciseIds.has(ex.id)))
          .map((group) => {
            const isSuperset = group.length > 1
            const groupId = group[0].group_id ?? null
            const isDissolved = groupId ? dissolvedGroupIds.has(groupId) : false

            // Superset (non-dissolved)
            if (isSuperset && !isDissolved && groupId) {
              return (
                <div key={groupId} className="bg-[#161616] rounded-2xl border border-white/[0.08] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Rotate size={12} className="text-white/40" />
                      <span className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/50">Surensemble</span>
                    </div>
                    <button
                      onClick={() => setSupersetMenuFor(groupId)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:text-white/50"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                  {group
                    .filter(ex => !deletedExerciseIds.has(ex.id))
                    .map((ex, ei) => (
                      <div key={ex.id} className={ei > 0 ? 'border-t border-white/[0.05]' : ''}>
                        <ExerciseBlock
                          exercise={ex as ExerciseBlockExercise}
                          sets={sets.filter(s => s.exercise_id === ex.id) as SetRowData[]}
                          recommendations={recommendations}
                          prSets={prSets}
                          coachingCues={coachingCuesMap}
                          inSuperset
                          onValidateSet={(exId, setNum, side) => toggleSet(exId, setNum, side, ex.rest_sec)}
                          onDeleteSet={deleteSet}
                          onChangeSet={(exId, setNum, side, patch) => updateSet(exId, setNum, side, patch as Partial<SetLog>)}
                          onAddSet={addSet}
                          onSwap={exId => setSwapTarget(exId)}
                          onRest={exId => {
                            const e = exercises.find(x => x.id === exId)
                            startRest(exId, 0, 'bilateral', e?.rest_sec ?? null)
                          }}
                          onNote={exId => setShowNoteInput(prev => prev === exId ? null : exId)}
                          onTempo={handleTempoForExercise}
                          onDeleteExercise={exId => setDeletedExerciseIds(prev => new Set(prev).add(exId))}
                          onOpenProgression={(exId, name) => setProgressionTarget({ exId, name })}
                        />
                        {/* Note inline */}
                        {showNoteInput === ex.id && (
                          <div className="px-3 pb-3">
                            <textarea
                              autoFocus
                              rows={2}
                              value={exerciseNotes[ex.id] ?? ''}
                              onFocus={() => { activeInputRef.current = true }}
                              onBlur={() => { activeInputRef.current = false }}
                              onChange={e => setExerciseNotes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                              placeholder={t('logger.note.placeholder')}
                              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 outline-none resize-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )
            }

            // Solo exercises (or dissolved superset members)
            return group
              .filter(ex => !deletedExerciseIds.has(ex.id))
              .map(ex => (
                <div key={ex.id}>
                  <ExerciseBlock
                    exercise={ex as ExerciseBlockExercise}
                    sets={sets.filter(s => s.exercise_id === ex.id) as SetRowData[]}
                    recommendations={recommendations}
                    prSets={prSets}
                    coachingCues={coachingCuesMap}
                    onValidateSet={(exId, setNum, side) => toggleSet(exId, setNum, side, ex.rest_sec)}
                    onDeleteSet={deleteSet}
                    onChangeSet={(exId, setNum, side, patch) => updateSet(exId, setNum, side, patch as Partial<SetLog>)}
                    onAddSet={addSet}
                    onSwap={exId => setSwapTarget(exId)}
                    onRest={exId => {
                      const e = exercises.find(x => x.id === exId)
                      startRest(exId, 0, 'bilateral', e?.rest_sec ?? null)
                    }}
                    onNote={exId => setShowNoteInput(prev => prev === exId ? null : exId)}
                    onTempo={handleTempoForExercise}
                    onDeleteExercise={exId => setDeletedExerciseIds(prev => new Set(prev).add(exId))}
                    onOpenProgression={(exId, name) => setProgressionTarget({ exId, name })}
                  />
                  {/* Note inline */}
                  {showNoteInput === ex.id && (
                    <div className="mt-1 px-1">
                      <textarea
                        autoFocus
                        rows={2}
                        value={exerciseNotes[ex.id] ?? ''}
                        onFocus={() => { activeInputRef.current = true }}
                        onBlur={() => { activeInputRef.current = false }}
                        onChange={e => setExerciseNotes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                        placeholder={t('logger.note.placeholder')}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              ))
          })}
      </main>

      {/* ── Fixed finish button ── */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
        {allDone ? (
          <button
            onClick={submitSession}
            disabled={saveState === 'saving' || !draftReady}
            className="w-full flex items-center justify-between bg-[#ffe01e] pl-5 pr-1.5 py-1.5 rounded-xl hover:bg-[#ffd000] active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0d0d0d]">
              {!draftReady ? 'Initialisation…' : saveState === 'saving' ? 'Enregistrement…' : t('logger.finish')}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.15]">
              {(!draftReady || saveState === 'saving') ? <Loader2 size={15} className="text-white animate-spin" /> : <Flag size={15} className="text-white" />}
            </div>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-xl">
            {longPressProgress > 0 && (
              <div className="absolute inset-0 bg-[#ffe01e] rounded-xl transition-none origin-left" style={{ transform: `scaleX(${longPressProgress})` }} />
            )}
            <button
              onMouseDown={onFinishPressStart}
              onMouseUp={onFinishPressEnd}
              onMouseLeave={onFinishPressEnd}
              onTouchStart={onFinishPressStart}
              onTouchEnd={onFinishPressEnd}
              disabled={saveState === 'saving' || !draftReady}
              className="relative w-full flex items-center justify-between bg-white/[0.06] pl-5 pr-1.5 py-1.5 rounded-xl disabled:opacity-50 select-none"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">
                {!draftReady ? 'Initialisation…' : saveState === 'saving' ? 'Enregistrement…' : 'Terminer · Maintenir 3s'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                {saveState === 'saving' ? <Loader2 size={15} className="text-white/40 animate-spin" /> : <Flag size={15} className="text-white/30" />}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Session context menu ── */}
      <AnimatePresence>
        {sessionMenuOpen && (
          <>
            <motion.div className="fixed inset-0 z-[65] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSessionMenuOpen(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl border-t border-white/[0.08] pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
              exit={{ y: '100%', transition: { duration: 0.18, ease: 'easeIn' } }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />
              <div className="pt-4 divide-y divide-white/[0.05]">
                <button onClick={() => { startRest('', 0, 'bilateral', 120); setSessionMenuOpen(false) }} className="w-full flex items-center gap-4 px-6 py-4 text-white active:bg-white/[0.04]">
                  <Clock size={16} className="opacity-70" /><span className="text-[15px] font-medium">Démarrer un repos manuel</span>
                </button>
                <button onClick={() => { setShowHydration(true); setSessionMenuOpen(false) }} className="w-full flex items-center gap-4 px-6 py-4 text-white active:bg-white/[0.04]">
                  <span className="w-4 text-center text-[16px]">💧</span><span className="text-[15px] font-medium">Hydratation</span>
                </button>
                <div className="pt-1">
                  <button onClick={() => { setSessionMenuOpen(false); setShowFinishConfirm(true) }} className="w-full flex items-center gap-4 px-6 py-4 text-red-400 active:bg-white/[0.04]">
                    <Flag size={16} className="opacity-70" /><span className="text-[15px] font-medium">Terminer la séance</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Superset context menu ── */}
      {supersetMenuFor && (
        <SupersetContextMenu
          open={true}
          onDissolve={() => { setDissolvedGroupIds(prev => new Set(prev).add(supersetMenuFor!)); setSupersetMenuFor(null) }}
          onRest={() => { startRest('', 0, 'bilateral', 120); setSupersetMenuFor(null) }}
          onDelete={() => {
            const group = exerciseGroups.find(g => g[0].group_id === supersetMenuFor)
            if (group) setDeletedExerciseIds(prev => { const next = new Set(prev); group.forEach(ex => next.add(ex.id)); return next })
            setSupersetMenuFor(null)
          }}
          onClose={() => setSupersetMenuFor(null)}
        />
      )}

      {/* ── Swap sheet ── */}
      {swapTarget && (
        <ExerciseSwapSheet
          exercise={exercises.find(e => e.id === swapTarget)!}
          allExercises={exercises}
          onSwap={(newName) => handleSwap(swapTarget, newName)}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* ── Client alternatives ── */}
      {altSheetTarget !== null && exercises[altSheetTarget]?.clientAlternatives?.length ? (
        <ClientAlternativesSheet
          exerciseName={swappedNames[exercises[altSheetTarget].id] ?? exercises[altSheetTarget].name}
          alternatives={exercises[altSheetTarget].clientAlternatives!}
          onSelect={(name) => setSwappedNames(prev => ({ ...prev, [exercises[altSheetTarget].id]: name }))}
          onClose={() => setAltSheetTarget(null)}
        />
      ) : null}

      {/* ── Progression overlay (placeholder — full chart on recap page) ── */}
      {progressionTarget && (
        <div className="fixed inset-0 z-[80] bg-black/70" onClick={() => setProgressionTarget(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#161616] rounded-t-2xl border-t border-white/[0.08] p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/[0.12] mx-auto mb-4" />
            <p className="text-[12px] font-bold text-white mb-1">{progressionTarget.name}</p>
            <p className="text-[11px] text-white/40">Historique visible dans le récap après la séance.</p>
            <button onClick={() => setProgressionTarget(null)} className="mt-4 w-full py-3 rounded-xl bg-white/[0.04] text-[12px] text-white/40">Fermer</button>
          </div>
        </div>
      )}

      {/* ── Rest modal ── */}
      {restModalOpen && restStartedAt !== null && (() => {
        const nextEx = pendingRestSet ? exercises.find(e => e.id === pendingRestSet.exId) : null
        const nextSetNum = pendingRestSet?.setNum ?? null
        const progressPct = restPrescribed !== null ? Math.min(restElapsed / restPrescribed, 1) : 0
        const timeDisplay = restPrescribed !== null ? formatTime(restPrescribed - restElapsed) : formatTime(restElapsed)
        const accentColor = isOvertime ? (restElapsed > (restPrescribed ?? 0) + 30 ? '#ef4444' : '#f97316') : '#ffe01e'
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 gap-6">
            <p className={`text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] ${isOvertime ? 'text-red-400/70' : 'text-white/30'}`}>
              {isOvertime ? 'Temps dépassé' : 'Temps de repos'}
            </p>
            <div className="relative flex items-center justify-center">
              <svg className="w-52 h-52 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                {restPrescribed !== null && (
                  <circle cx="50" cy="50" r="42" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPct)}`}
                    className="transition-all duration-1000"
                  />
                )}
              </svg>
              <div className="absolute text-center">
                <p className={`text-[3rem] font-barlow-condensed font-black leading-none tabular-nums ${isOvertime ? 'text-red-400' : 'text-white'}`}>{timeDisplay}</p>
                {isOvertime && <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-widest text-red-400/60 mt-1">Overtime</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setRestPrescribed(p => p !== null ? Math.max(10, p - 30) : p)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white/80 transition-colors text-[18px] font-bold">−</button>
              <span className="text-[10px] font-barlow-condensed uppercase tracking-wider text-white/25 w-10 text-center">30s</span>
              <button onClick={() => setRestPrescribed(p => p !== null ? p + 30 : p)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/50 hover:bg-white/[0.10] hover:text-white/80 transition-colors text-[18px] font-bold">+</button>
            </div>
            {nextEx && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3 w-full max-w-xs text-center">
                <p className="text-[8px] font-barlow-condensed font-bold uppercase tracking-[0.20em] text-white/25 mb-1">Série suivante</p>
                <p className="text-[13px] font-semibold text-white/80 truncate">{swappedNames[nextEx.id] ?? nextEx.name}</p>
                {nextSetNum !== null && (
                  <p className="text-[11px] text-white/35 mt-0.5">Série <span className="font-bold text-white/55">{nextSetNum}</span> · <span className="font-barlow-condensed font-bold text-[#ffe01e]/70">{nextEx.sets} × {nextEx.reps}</span></p>
                )}
              </div>
            )}
            <button onClick={() => setRestModalOpen(false)} className="w-full max-w-xs py-3.5 rounded-xl bg-white/[0.04] text-[12px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-colors">
              {t('logger.rest.skip')}
            </button>
            <button onClick={() => setRestModalOpen(false)} className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-white/25 hover:text-white/50 transition-colors">
              <X size={14} />
            </button>
          </div>
        )
      })()}

      {/* ── Finish confirm modal ── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">{t('logger.finish.confirm')}</h3>
            <p className="text-[13px] text-white/55 mb-5">
              Il te reste encore <span className="text-white font-semibold">{remainingSets} série{remainingSets > 1 ? 's' : ''}</span> {t('logger.finish.incomplete')}. Tu es sûr de vouloir terminer ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium">
                {t('logger.finish.cancel')}
              </button>
              <button
                onClick={() => { setShowFinishConfirm(false); submitSession() }}
                disabled={saveState === 'saving'}
                className="flex-1 py-2.5 rounded-xl bg-[#ffe01e] text-[#0d0d0d] text-[13px] font-bold uppercase hover:bg-[#ffd000] disabled:opacity-50 transition-colors"
              >
                {saveState === 'saving' ? '…' : t('logger.finish.action')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prep time modal ── */}
      {prepTimeTarget && (
        <PrepTimeModal
          exerciseName={prepTimeTarget.exerciseName}
          onConfirm={(seconds, hapticsEnabled) => {
            setTempoGuideTarget({ ...prepTimeTarget, prepSeconds: seconds, hapticsEnabled })
            setPrepTimeTarget(null)
          }}
          onClose={() => setPrepTimeTarget(null)}
        />
      )}

      {/* ── Tempo guide modal ── */}
      {tempoGuideTarget && (
        <TempoGuideModal
          tempo={tempoGuideTarget.tempo}
          reps={tempoGuideTarget.reps}
          exerciseName={tempoGuideTarget.exerciseName}
          prepSeconds={tempoGuideTarget.prepSeconds}
          hapticsEnabled={tempoGuideTarget.hapticsEnabled}
          onClose={(result) => {
            if (result.bonusReps > 0 && tempoGuideTarget) {
              const targetEx = exercises.find(e =>
                (swappedNames[e.id] ?? e.name) === tempoGuideTarget.exerciseName || e.name === tempoGuideTarget.exerciseName
              )
              if (targetEx) {
                const firstUncompleted = sets.find(s => s.exercise_id === targetEx.id && !s.completed)
                if (firstUncompleted) {
                  const key = recKey(targetEx.id, firstUncompleted.set_number, firstUncompleted.side)
                  setSets(prev => prev.map(s =>
                    s.exercise_id === targetEx.id && s.set_number === firstUncompleted.set_number && s.side === firstUncompleted.side
                      ? { ...s, actual_reps: String(result.totalReps) } : s
                  ))
                  setManuallyEdited(prev => new Set(prev).add(key))
                }
              }
            }
            setTempoGuideTarget(null)
          }}
        />
      )}

      {/* ── Hydratation intro ── */}
      {showHydrationIntro && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex flex-col items-center justify-center p-6 gap-6">
          <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] text-white/30">Hydratation</p>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <path d="M36 8 Q50 28 50 44 Q50 58 36 62 Q22 58 22 44 Q22 28 36 8Z" fill="rgba(96,165,250,0.7)" />
            <ellipse cx="30" cy="38" rx="4" ry="6" fill="rgba(255,255,255,0.18)" />
          </svg>
          <div className="text-center">
            <p className="text-[3.2rem] font-barlow-condensed font-black leading-none tabular-nums text-white">{hydrationPlan.totalMl} ml</p>
            <p className="text-[11px] font-barlow-condensed uppercase tracking-[0.18em] text-white/30 mt-1">objectif pour cette séance</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3 w-full max-w-xs text-center">
            <p className="text-[13px] text-white/55 leading-snug">~<span className="text-white font-semibold">{hydrationPlan.mlPerSip} ml</span> toutes les 15 min, pendant les repos</p>
          </div>
          <button onClick={() => setShowHydrationIntro(false)} className="w-full max-w-xs h-12 rounded-xl font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.14em] active:scale-[0.98]" style={{ backgroundColor: '#ffe01e', color: '#0d0d0d' }}>
            C&apos;est parti
          </button>
        </div>
      )}

      {/* ── Hydratation reminder ── */}
      {showHydration && !showHydrationIntro && !tempoGuideTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex flex-col items-center justify-center p-6 gap-6">
          <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] text-white/30">Rappel hydratation</p>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <path d="M36 8 Q50 28 50 44 Q50 58 36 62 Q22 58 22 44 Q22 28 36 8Z" fill="rgba(96,165,250,0.7)" />
            <ellipse cx="30" cy="38" rx="4" ry="6" fill="rgba(255,255,255,0.18)" />
          </svg>
          <div className="text-center">
            <p className="text-[3.2rem] font-barlow-condensed font-black leading-none tabular-nums text-white">{hydrationPlan.mlPerSip} ml</p>
            <p className="text-[11px] font-barlow-condensed uppercase tracking-[0.18em] text-white/30 mt-1">quelques gorgées maintenant</p>
          </div>
          <button onClick={() => { setSipsConsumed(prev => prev + 1); setShowHydration(false); resetHydrationTimer(HYDRATION_INTERVAL_MS) }} className="w-full max-w-xs h-12 rounded-xl font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.14em] active:scale-[0.98]" style={{ backgroundColor: '#ffe01e', color: '#0d0d0d' }}>
            J&apos;ai bu
          </button>
          <button onClick={() => { setShowHydration(false); resetHydrationTimer(HYDRATION_INTERVAL_MS) }} className="w-full max-w-xs py-3 rounded-xl bg-white/[0.04] text-[12px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/40">
            Ignorer
          </button>
        </div>
      )}
    </div>
  )
}
