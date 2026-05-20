'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'

const FIELD_META: Record<string, { label: string; emoji: string; min: number; max: number; step: number; lowLabel: string; highLabel: string }> = {
  sleep_duration: { label: 'Durée du sommeil', emoji: '🌙', min: 0, max: 14, step: 0.5, lowLabel: '0h', highLabel: '14h' },
  sleep_quality:  { label: 'Qualité du sommeil', emoji: '😴', min: 1, max: 5, step: 1, lowLabel: 'Mauvaise', highLabel: 'Excellente' },
  energy:         { label: "Niveau d'énergie", emoji: '⚡', min: 1, max: 5, step: 1, lowLabel: 'Épuisé', highLabel: 'Au top' },
  stress:         { label: 'Niveau de stress', emoji: '🧘', min: 1, max: 5, step: 1, lowLabel: 'Serein', highLabel: 'Très stressé' },
  mood:           { label: 'Humeur', emoji: '😊', min: 1, max: 5, step: 1, lowLabel: 'Bas', highLabel: 'Excellent' },
}

interface Props {
  moment: 'morning' | 'evening'
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CheckinModal({ moment, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true)
  const [configId, setConfigId] = useState('')
  const [fields, setFields] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [points, setPoints] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setStep(0)
    setDone(false)
    setPoints(null)
    setError(null)

    fetch('/api/client/checkin/today')
      .then(r => r.json())
      .then(data => {
        const current = (data?.moments ?? []).find((m: any) => m.moment === moment)
        setConfigId(data?.config_id ?? '')
        const activeFields: string[] = current?.fields ?? []
        setFields(activeFields)
        const defaults: Record<string, number> = {}
        for (const f of activeFields) {
          defaults[f] = FIELD_META[f]?.min ?? 1
        }
        setValues(defaults)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open, moment])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const currentField = fields[step]
  const meta = currentField ? (FIELD_META[currentField] ?? { label: currentField, emoji: '📋', min: 1, max: 5, step: 1, lowLabel: 'Bas', highLabel: 'Haut' }) : null
  const isLast = step >= fields.length - 1
  const pct = meta
    ? (((values[currentField] ?? meta.min) - meta.min) / (meta.max - meta.min)) * 100
    : 0

  async function submit() {
    if (!configId || !fields.length) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/client/checkin/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_id: configId, moment, responses: values }),
      })
      if (res.status === 409) {
        // Already submitted today — treat as success
        setPoints(10)
        setDone(true)
        setTimeout(() => { onSuccess?.(); onClose() }, 1800)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Erreur lors de la soumission. Réessaie.')
        return
      }
      const data = await res.json().catch(() => null)
      setPoints(data?.is_late ? 5 : 10)
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch {
      setError('Pas de connexion. Vérifie ton réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  const momentLabel = moment === 'morning' ? 'Check-in matin' : 'Check-in soir'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden"
            style={{ background: '#161616', maxHeight: '88vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
              <div>
                <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] text-white/40 leading-none mb-1">
                  {moment === 'morning' ? 'MATIN' : 'SOIR'}
                </p>
                <p className="text-[18px] font-barlow-condensed font-bold uppercase tracking-[0.08em] text-white leading-tight">
                  {momentLabel}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/50 hover:bg-white/[0.10] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress dots */}
            {!loading && !done && fields.length > 1 && (
              <div className="flex items-center gap-1.5 px-5 pb-4">
                {fields.map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full transition-all duration-300"
                    style={{
                      background: i <= step ? '#f2f2f2' : 'rgba(255,255,255,0.12)',
                      flex: i === step ? 2 : 1,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="px-5 pb-8 flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-white/40 text-[13px]">Chargement...</div>
              ) : !fields.length ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-white/50">Aucun check-in configuré.</p>
                </div>
              ) : done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center gap-3"
                >
                  <div className="h-14 w-14 rounded-2xl bg-[#f2f2f2] flex items-center justify-center">
                    <CheckCircle size={28} className="text-[#080808]" />
                  </div>
                  <p className="text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.1em] text-white">
                    Check-in validé
                  </p>
                  {points && (
                    <p className="text-[28px] font-black text-[#f2f2f2] font-mono">
                      +{points} pts
                    </p>
                  )}
                </motion.div>
              ) : meta ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentField}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-6"
                  >
                    {/* Question */}
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-[32px] leading-none">{meta.emoji}</span>
                      <p className="text-[16px] font-bold text-white leading-snug">{meta.label}</p>
                    </div>

                    {/* Value display */}
                    <div className="flex items-end gap-1">
                      <span className="text-[48px] font-black text-[#f2f2f2] font-mono leading-none tabular-nums">
                        {meta.step < 1
                          ? (values[currentField] ?? meta.min).toFixed(1)
                          : values[currentField] ?? meta.min}
                      </span>
                      {meta.max === 14 && (
                        <span className="text-[18px] font-bold text-white/40 mb-2">h</span>
                      )}
                      {meta.max === 5 && (
                        <span className="text-[18px] font-bold text-white/40 mb-2">/ 5</span>
                      )}
                    </div>

                    {/* Slider */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={meta.min}
                        max={meta.max}
                        step={meta.step}
                        value={values[currentField] ?? meta.min}
                        onChange={e => setValues(v => ({ ...v, [currentField]: parseFloat(e.target.value) }))}
                        className="w-full h-2 appearance-none rounded-full cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f2f2f2 0%, #f2f2f2 ${pct}%, rgba(255,255,255,0.10) ${pct}%, rgba(255,255,255,0.10) 100%)`,
                        }}
                      />
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white/30 font-barlow-condensed font-bold uppercase tracking-[0.1em]">{meta.lowLabel}</span>
                        <span className="text-[10px] text-white/30 font-barlow-condensed font-bold uppercase tracking-[0.1em]">{meta.highLabel}</span>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-[12px] text-red-400 text-center py-1">{error}</p>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-2 pt-2">
                      {step > 0 && (
                        <button
                          onClick={() => setStep(s => s - 1)}
                          className="h-12 px-5 rounded-xl bg-white/[0.06] text-white/70 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-white/[0.10]"
                        >
                          Retour
                        </button>
                      )}
                      {isLast ? (
                        <button
                          onClick={submit}
                          disabled={submitting}
                          className="flex-1 h-12 rounded-xl font-bold text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-50"
                          style={{ background: '#f2f2f2', color: '#0d0d0d' }}
                        >
                          {submitting ? '...' : 'Valider'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setStep(s => s + 1)}
                          className="flex-1 h-12 rounded-xl font-bold text-[13px] uppercase tracking-[0.1em]"
                          style={{ background: '#f2f2f2', color: '#0d0d0d' }}
                        >
                          Suivant
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
