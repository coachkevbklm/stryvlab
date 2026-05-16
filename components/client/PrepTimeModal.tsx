'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Timer } from 'lucide-react'

interface PrepTimeModalProps {
  exerciseName: string
  onConfirm: (seconds: number) => void
  onClose: () => void
}

const PREP_KEY = (name: string) =>
  `prep_time_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`

export function getPrepTime(exerciseName: string): number {
  try {
    const stored = localStorage.getItem(PREP_KEY(exerciseName))
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n >= 3 && n <= 30) return n
    }
  } catch { /* localStorage unavailable */ }
  return 5 // default
}

export function hasPrepTimeConfigured(exerciseName: string): boolean {
  try {
    return localStorage.getItem(PREP_KEY(exerciseName)) !== null
  } catch {
    return false
  }
}

function savePrepTime(exerciseName: string, seconds: number) {
  try {
    localStorage.setItem(PREP_KEY(exerciseName), String(seconds))
  } catch { /* noop */ }
}

export default function PrepTimeModal({ exerciseName, onConfirm, onClose }: PrepTimeModalProps) {
  const [seconds, setSeconds] = useState<number>(() => getPrepTime(exerciseName))

  const dec = () => setSeconds(s => Math.max(3, s - 1))
  const inc = () => setSeconds(s => Math.min(30, s + 1))

  const handleConfirm = () => {
    savePrepTime(exerciseName, seconds)
    onConfirm(seconds)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="prep-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[65] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          key="prep-card"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xs bg-[#161616] rounded-2xl p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB800]/10">
                <Timer size={15} style={{ color: '#FFB800' }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                  Préparation
                </p>
                <p className="text-[13px] font-bold text-white leading-tight">
                  Temps de mise en place
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Explanation */}
          <p className="text-[11px] text-white/45 leading-relaxed mb-5">
            Combien de secondes vous faut-il pour vous positionner sur{' '}
            <span className="text-white/70 font-medium">{exerciseName}</span> ?
            Ce compte à rebours se lancera avant chaque set.
          </p>

          {/* How to calculate tip */}
          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 mb-5 border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1">
              Comment estimer ?
            </p>
            <p className="text-[10px] text-white/35 leading-relaxed">
              Exercice simple (machine) → 3–5s · Mouvement complexe (barbell, câble) → 5–10s · Setup technique (réglages) → 10–15s
            </p>
          </div>

          {/* Spinner */}
          <div className="flex items-center justify-center gap-5 mb-6">
            <button
              onClick={dec}
              disabled={seconds <= 3}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/60 text-xl font-bold hover:bg-white/[0.08] hover:text-white disabled:opacity-25 active:scale-95 transition-all"
            >
              −
            </button>
            <div className="text-center min-w-[72px]">
              <span
                className="font-mono font-black tabular-nums leading-none"
                style={{ fontSize: 48, color: '#FFB800' }}
              >
                {seconds}
              </span>
              <p className="text-[10px] text-white/30 font-medium mt-0.5">secondes</p>
            </div>
            <button
              onClick={inc}
              disabled={seconds >= 30}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/60 text-xl font-bold hover:bg-white/[0.08] hover:text-white disabled:opacity-25 active:scale-95 transition-all"
            >
              +
            </button>
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl font-bold text-[13px] uppercase tracking-[0.10em] transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FFB800', color: '#0d0d0d' }}
          >
            Commencer
          </button>

          <p className="text-center text-[9px] text-white/20 mt-3">
            Mémorisé pour cet exercice · Modifiable au prochain set
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
