'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useClientT } from '../ClientI18nProvider'

type ActivityType = 'running' | 'cycling' | 'swimming' | 'walking' | 'team_sport' | 'other'

export type FreeActivitySheetProps = {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

const TYPES: ActivityType[] = ['running', 'cycling', 'swimming', 'walking', 'team_sport', 'other']

export default function FreeActivitySheet({ open, onClose, onSaved }: FreeActivitySheetProps) {
  const { t } = useClientT()
  const [type, setType] = useState<ActivityType>('running')
  const [customLabel, setCustomLabel] = useState('')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [duration, setDuration] = useState(30)
  const [intensity, setIntensity] = useState(5)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        activity_type: type,
        started_at: new Date(startedAt).toISOString(),
        duration_min: duration,
        intensity,
      }
      if (type === 'other' && customLabel.trim()) body.custom_label = customLabel.trim()
      if (notes.trim()) body.notes = notes.trim()

      const r = await fetch('/api/client/activity-logs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error((j as any).error ?? 'Erreur')
      }
      onSaved?.()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const pct = ((intensity - 1) / 9) * 100

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-[#161616] border-t-[0.3px] border-white/[0.08] flex flex-col"
            style={{ maxHeight: '88vh' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            <div className="px-4 pt-4 pb-3 shrink-0 flex items-center justify-between">
              <h3 className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[13px] text-white">
                Logger une activité
              </h3>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <X size={18} className="text-white/60" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map(tt => (
                    <button
                      key={tt}
                      onClick={() => setType(tt)}
                      className={`h-10 rounded-xl text-[11px] font-semibold transition-colors ${
                        type === tt ? 'bg-[#ffe01e] text-[#0d0d0d]' : 'bg-white/[0.04] text-white/60'
                      }`}
                    >
                      {t(`smart.activity.type.${tt}` as any)}
                    </button>
                  ))}
                </div>
              </div>

              {type === 'other' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">Précise</label>
                  <input
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    maxLength={80}
                    className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0d0d0d] text-white text-[14px] outline-none"
                    placeholder="Ex: Tennis"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">Quand</label>
                <input
                  type="datetime-local"
                  value={startedAt}
                  onChange={e => setStartedAt(e.target.value)}
                  className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0d0d0d] text-white text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">Durée (min)</label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value) || 1)}
                  className="w-full min-w-0 h-11 px-3 rounded-xl bg-[#0d0d0d] text-white text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">
                  Intensité {intensity}/10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={intensity}
                  onChange={e => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 appearance-none rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ffe01e 0%, #ffe01e ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full min-w-0 px-3 py-2 rounded-xl bg-[#0d0d0d] text-white text-[14px] outline-none resize-none"
                />
              </div>

              {error && <p className="text-[12px] text-red-400">{error}</p>}

              <button
                disabled={saving}
                onClick={submit}
                className="w-full h-12 rounded-xl bg-[#ffe01e] text-[#0d0d0d] font-bold uppercase tracking-[0.1em] text-[12px] disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
