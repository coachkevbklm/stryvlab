'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'

interface SetEditSheetProps {
  open: boolean
  setNumber: number
  exerciseName: string
  side: 'left' | 'right' | 'bilateral'
  initialReps: string
  initialWeight: string
  initialRir: string
  weightIncrement: number
  onConfirm: (reps: string, weight: string, rir: string) => void
  onClose: () => void
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30 mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, Math.round((value - step) / step) * step))}
          className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/[0.06] text-white active:scale-95 active:bg-white/[0.10] transition-all shrink-0"
        >
          <Minus size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[36px] font-black text-white leading-none tabular-nums">
            {value % 1 === 0 ? value : value.toFixed(1)}
            {unit && <span className="text-[18px] text-white/40 ml-1">{unit}</span>}
          </p>
        </div>
        <button
          onClick={() => onChange(Math.min(max, Math.round((value + step) / step) * step))}
          className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/[0.06] text-white active:scale-95 active:bg-white/[0.10] transition-all shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

export default function SetEditSheet({
  open,
  setNumber,
  exerciseName,
  side,
  initialReps,
  initialWeight,
  initialRir,
  weightIncrement,
  onConfirm,
  onClose,
}: SetEditSheetProps) {
  const [reps, setReps] = useState(parseInt(initialReps, 10) || 8)
  const [weight, setWeight] = useState(parseFloat(initialWeight) || 0)
  const [rir, setRir] = useState(parseInt(initialRir, 10) || 2)

  useEffect(() => {
    if (open) {
      setReps(parseInt(initialReps, 10) || 8)
      setWeight(parseFloat(initialWeight) || 0)
      setRir(parseInt(initialRir, 10) || 2)
    }
  }, [open, initialReps, initialWeight, initialRir])

  const label = side === 'left' ? 'G' : side === 'right' ? 'D' : null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl border-t border-white/[0.08] p-6"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
            exit={{ y: '100%', transition: { duration: 0.18, ease: 'easeIn' } }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[13px] font-bold text-white">
                  Modifier — {label ? `${label} · ` : ''}SET {setNumber}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">{exerciseName}</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-6 mb-6">
              <Stepper
                label="Reps"
                value={reps}
                onChange={setReps}
                min={1}
                max={50}
                step={1}
              />
              <Stepper
                label="Poids"
                value={weight}
                onChange={setWeight}
                min={0}
                max={500}
                step={weightIncrement}
                unit="kg"
              />
              <Stepper
                label="RIR"
                value={rir}
                onChange={setRir}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <button
              onClick={() => {
                onConfirm(String(reps), String(weight), String(rir))
                onClose()
              }}
              className="w-full h-12 flex items-center justify-center bg-[#ffe01e] text-[#0d0d0d] text-[13px] font-black uppercase tracking-[0.1em] rounded-xl active:scale-[0.98] transition-transform"
            >
              Confirmer
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
