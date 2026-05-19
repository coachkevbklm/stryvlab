'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { CheckCircle2, Trash2 } from 'lucide-react'

export type SetType = 'warmup' | 'working' | 'cooldown' | 'dropset'

export interface SetRowData {
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
  rest_sec: number | null
}

interface SetRowProps {
  set: SetRowData
  workingIndex: number | null
  recReps?: string
  recWeight?: string
  isPR?: boolean
  coachingCue?: string | null
  onValidate: () => void
  onDelete: () => void
  onChange: (patch: Partial<SetRowData>) => void
  onTypePress: () => void
}

const TYPE_LABELS: Record<SetType, string> = {
  warmup: 'EC',
  working: '',
  cooldown: 'RC',
  dropset: '↘',
}

const TYPE_COLORS: Record<SetType, string> = {
  warmup: 'text-[#FF6B35]',
  working: 'text-white',
  cooldown: 'text-blue-400',
  dropset: 'text-violet-400',
}

function formatRestDisplay(sec: number | null): string {
  if (sec === null) return '—'
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function SetRow({
  set,
  workingIndex,
  recReps,
  recWeight,
  isPR,
  coachingCue,
  onValidate,
  onDelete,
  onChange,
  onTypePress,
}: SetRowProps) {
  const x = useMotionValue(0)
  const hasActioned = useRef(false)
  const [editingRest, setEditingRest] = useState(false)
  const [restInputVal, setRestInputVal] = useState(String(set.rest_sec ?? ''))

  const leftBgOpacity = useTransform(x, [0, 60, 140], [0, 0.04, 0.14])
  const rightBgOpacity = useTransform(x, [-140, -60, 0], [0.14, 0.04, 0])
  const checkOpacity = useTransform(x, [60, 140], [0.3, 1])
  const trashOpacity = useTransform(x, [-140, -60], [1, 0.3])

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (hasActioned.current) return
    if (info.offset.x > 100) {
      hasActioned.current = true
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(40)
      animate(x, 500, { type: 'spring', stiffness: 300, damping: 28 }).then(() => {
        onValidate()
        x.set(0)
        hasActioned.current = false
      })
    } else if (info.offset.x < -100 && !set.completed) {
      hasActioned.current = true
      animate(x, -500, { type: 'spring', stiffness: 300, damping: 28 }).then(() => {
        onDelete()
        x.set(0)
        hasActioned.current = false
      })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  const typeLabel = set.set_type === 'working'
    ? (workingIndex !== null ? String(workingIndex) : '1')
    : TYPE_LABELS[set.set_type]

  const sideLabel = set.side === 'left' ? 'G' : set.side === 'right' ? 'D' : null

  if (set.completed) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer active:scale-[0.99] transition-transform"
          style={{ backgroundColor: 'rgba(255,224,30,0.06)', borderColor: 'rgba(255,224,30,0.20)' }}
          onClick={() => onChange({ completed: false })}
        >
          <CheckCircle2 size={14} className="text-[#ffe01e] shrink-0" />
          <span className={`text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.14em] shrink-0 ${TYPE_COLORS[set.set_type]}`}>
            {sideLabel && <span className="mr-0.5">{sideLabel}</span>}
            {typeLabel}
          </span>
          <span className="text-[12px] font-mono font-bold text-white flex-1 min-w-0 truncate">
            {set.actual_reps || recReps || set.planned_reps} × {set.actual_weight_kg || recWeight || '—'}kg
          </span>
          {set.rir_actual && (
            <span className="text-[11px] text-white/40 shrink-0">RIR {set.rir_actual}</span>
          )}
          {isPR && (
            <span className="bg-[#ffe01e] text-[#0d0d0d] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0">PR</span>
          )}
        </div>
        {coachingCue && (
          <p className="px-1 text-[10px] text-white/40 italic">{coachingCue}</p>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe right → validate (green) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center pl-4"
        style={{ backgroundColor: '#10b981', opacity: leftBgOpacity }}
      >
        <motion.div style={{ opacity: checkOpacity }}>
          <CheckCircle2 size={22} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Swipe left → delete (red) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-4"
        style={{ backgroundColor: '#ef4444', opacity: rightBgOpacity }}
      >
        <motion.div style={{ opacity: trashOpacity }}>
          <Trash2 size={18} className="text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={{ left: 0.06, right: 0.06 }}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative rounded-xl border border-white/[0.08] bg-[#1a1a1a] cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Type pill */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onTypePress() }}
            className={`shrink-0 min-w-[32px] text-center text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.1em] px-1.5 py-1 rounded-lg bg-white/[0.06] active:bg-white/[0.10] transition-colors ${TYPE_COLORS[set.set_type]}`}
          >
            {sideLabel && <span className="mr-0.5 text-white/50">{sideLabel}</span>}
            {typeLabel}
          </button>

          {/* Rest */}
          <div
            className="shrink-0 w-[52px]"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            {editingRest ? (
              <input
                type="number"
                inputMode="numeric"
                value={restInputVal}
                autoFocus
                onChange={e => setRestInputVal(e.target.value)}
                onBlur={() => {
                  const sec = parseInt(restInputVal, 10)
                  if (!isNaN(sec) && sec >= 0) onChange({ rest_sec: sec })
                  setEditingRest(false)
                }}
                className="w-full min-w-0 bg-transparent text-[12px] font-mono text-white text-center border-b border-white/20 outline-none"
              />
            ) : (
              <button
                onClick={() => { setRestInputVal(String(set.rest_sec ?? '')); setEditingRest(true) }}
                className="w-full text-[12px] font-mono text-white/50 text-center"
              >
                {formatRestDisplay(set.rest_sec)}
              </button>
            )}
          </div>

          {/* Reps */}
          <input
            type="number"
            inputMode="numeric"
            value={set.actual_reps}
            placeholder={recReps ?? set.planned_reps}
            min={1}
            max={99}
            onPointerDown={e => e.stopPropagation()}
            onChange={e => onChange({ actual_reps: e.target.value })}
            className="flex-1 min-w-0 bg-transparent text-[14px] font-bold text-white text-center outline-none placeholder:text-white/20"
          />

          {/* Weight */}
          <div
            className="flex items-center gap-0.5 flex-1 min-w-0"
            onPointerDown={e => e.stopPropagation()}
          >
            <input
              type="number"
              inputMode="decimal"
              step={0.25}
              value={set.actual_weight_kg}
              placeholder={recWeight ?? '—'}
              min={0}
              max={999}
              onChange={e => onChange({ actual_weight_kg: e.target.value })}
              className="flex-1 min-w-0 w-0 bg-transparent text-[14px] font-bold text-white text-center outline-none placeholder:text-white/20"
            />
            <span className="text-[10px] text-white/25 shrink-0">kg</span>
          </div>

          {/* Validate button */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onValidate() }}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <CheckCircle2 size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
