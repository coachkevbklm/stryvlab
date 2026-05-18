'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { CheckCircle2, Pencil } from 'lucide-react'

export interface SetSwipeCardSet {
  exercise_id: string
  exercise_name: string
  set_number: number
  side: 'left' | 'right' | 'bilateral'
  planned_reps: string
  actual_reps: string
  actual_weight_kg: string
  completed: boolean
  rir_actual: string
}

export interface SetSwipeCardExercise {
  id: string
  name: string
  target_rir: number | null
  rir: number | null
  weight_increment_kg?: number | null
  movement_pattern?: string | null
  tempo?: string | null
  group_id?: string | null
}

export interface SetSwipeCardRecommendation {
  weight_kg: number
  reps: number
  delta_vs_last: number | null
  confidence: 'high' | 'medium' | 'low'
}

export interface SetSwipeCardLastPerf {
  weight: number | null
  reps: number | null
  rir?: number | null
}

interface SetSwipeCardProps {
  set: SetSwipeCardSet
  exercise: SetSwipeCardExercise
  recommendation: SetSwipeCardRecommendation | undefined
  lastPerf: SetSwipeCardLastPerf | null
  isPR: boolean
  showSwipeHint: boolean
  coachingCue: string | null
  supersetColor?: string
  onValidate: () => void
  onEditRequest: () => void
  onTempoGuide?: () => void
  hasTempoGuide?: boolean
}

function sideLabel(side: 'left' | 'right' | 'bilateral'): string | null {
  if (side === 'left') return 'G'
  if (side === 'right') return 'D'
  return null
}

function sideColorClass(side: 'left' | 'right' | 'bilateral'): string {
  if (side === 'left') return 'text-blue-400'
  if (side === 'right') return 'text-violet-400'
  return 'text-white'
}

export default function SetSwipeCard({
  set,
  exercise,
  recommendation,
  lastPerf,
  isPR,
  showSwipeHint,
  coachingCue,
  supersetColor,
  onValidate,
  onEditRequest,
  onTempoGuide,
  hasTempoGuide,
}: SetSwipeCardProps) {
  const x = useMotionValue(0)
  const hasValidated = useRef(false)

  // Derive display values: recommendation > actual > lastPerf > planned
  const displayReps = recommendation
    ? String(recommendation.reps)
    : set.actual_reps || set.planned_reps || (lastPerf?.reps ? String(lastPerf.reps) : '—')

  const displayWeight = recommendation
    ? String(recommendation.weight_kg)
    : set.actual_weight_kg || (lastPerf?.weight ? String(lastPerf.weight) : '—')

  const effectiveRir = exercise.target_rir ?? exercise.rir

  const borderColor = useTransform(
    x,
    [-140, -80, -20, 0],
    ['#10b981', '#10b981', supersetColor ?? 'rgba(255,255,255,0.08)', supersetColor ?? 'rgba(255,255,255,0.08)']
  )
  const bgOpacity = useTransform(x, [-140, -60, 0], [0.12, 0.05, 0])
  const checkOpacity = useTransform(x, [-140, -80, 0], [1, 0.4, 0])

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (hasValidated.current) return
    if (info.offset.x < -140) {
      hasValidated.current = true
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40)
      }
      animate(x, -500, { type: 'spring', stiffness: 300, damping: 28 }).then(() => {
        onValidate()
        x.set(0)
        hasValidated.current = false
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  if (set.completed) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer active:scale-[0.99] transition-transform"
          style={{ backgroundColor: 'rgba(255,224,30,0.06)', borderColor: 'rgba(255,224,30,0.20)' }}
          onClick={onEditRequest}
        >
          <CheckCircle2 size={16} className="text-[#ffe01e] shrink-0" />
          <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/30 shrink-0">
            {set.side !== 'bilateral' ? `${sideLabel(set.side)} ` : ''}SET {set.set_number}
          </span>
          <span className="text-[13px] font-mono font-bold text-white flex-1">
            {set.actual_reps || displayReps} × {set.actual_weight_kg || displayWeight}kg
          </span>
          {set.rir_actual && (
            <span className="text-[11px] text-white/40 shrink-0">RIR {set.rir_actual}</span>
          )}
          {isPR && (
            <span className="bg-[#ffe01e] text-[#0d0d0d] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0">
              PR
            </span>
          )}
          <Pencil size={11} className="text-white/20 shrink-0" />
        </div>
        {coachingCue && (
          <p className="px-1 text-[10px] text-white/40 italic">{coachingCue}</p>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Green background revealed on swipe */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ backgroundColor: '#10b981', opacity: bgOpacity }}
      />
      {/* Check icon revealed on swipe */}
      <motion.div
        className="absolute right-5 top-1/2 -translate-y-1/2"
        style={{ opacity: checkOpacity }}
      >
        <CheckCircle2 size={28} className="text-white" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        style={{ x, borderColor }}
        onDragEnd={handleDragEnd}
        className="relative rounded-2xl border bg-[#161616] p-5 cursor-grab active:cursor-grabbing"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30">
              {set.side !== 'bilateral' && (
                <span className={`${sideColorClass(set.side)} mr-1`}>{sideLabel(set.side)}</span>
              )}
              SET {set.set_number}
            </span>
            {isPR && (
              <span className="bg-[#ffe01e] text-[#0d0d0d] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                PR
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasTempoGuide && onTempoGuide && (
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onTempoGuide() }}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-[#FFB800]/50 hover:text-[#FFB800] hover:bg-[#FFB800]/[0.08] active:scale-95 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <polygon points="2,1 9,5 2,9" />
                </svg>
              </button>
            )}
            {showSwipeHint && (
              <motion.span
                className="text-[10px] text-white/30 font-mono select-none"
                animate={{ opacity: [0.6, 0.2, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              >
                ← swipe
              </motion.span>
            )}
          </div>
        </div>

        {/* Main values row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[32px] font-black text-white leading-none tabular-nums">
              {displayReps}
            </p>
            <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/25 mt-1">
              reps
            </p>
          </div>
          <div className="text-center">
            <p className="text-[32px] font-black text-white leading-none tabular-nums">
              {displayWeight}
            </p>
            <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/25 mt-1">
              kg
            </p>
            {recommendation?.delta_vs_last !== null && recommendation?.delta_vs_last !== undefined && (
              <p className={`text-[10px] font-semibold mt-0.5 ${
                recommendation.delta_vs_last > 0 ? 'text-[#ffe01e]' :
                recommendation.delta_vs_last < 0 ? 'text-amber-400' : 'text-white/30'
              }`}>
                {recommendation.delta_vs_last > 0 ? `↑ +${recommendation.delta_vs_last}kg` :
                 recommendation.delta_vs_last < 0 ? `↓ ${recommendation.delta_vs_last}kg` : '= S-1'}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-[32px] font-black text-white/50 leading-none tabular-nums">
              {effectiveRir !== null && effectiveRir !== undefined ? effectiveRir : '—'}
            </p>
            <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white/25 mt-1">
              RIR cible
            </p>
          </div>
        </div>

        {/* Last perf hint */}
        {lastPerf?.weight && lastPerf?.reps && (
          <p className="mt-3 text-[10px] text-white/20 text-center tabular-nums">
            S-1 : {lastPerf.reps} × {lastPerf.weight}kg
          </p>
        )}
      </motion.div>
    </div>
  )
}
