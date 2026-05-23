'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Droplets, Plus, Minus } from 'lucide-react'
import { useClientT } from '@/components/client/ClientI18nProvider'

const QUICK_AMOUNTS = [150, 250, 330, 500]

interface Props {
  open: boolean
  onClose: () => void
  /** Called immediately with the logged amount — use for optimistic UI updates */
  onLogged?: (ml: number) => void
}

export default function QuickWaterModal({ open, onClose, onLogged }: Props) {
  const { t } = useClientT()
  const router = useRouter()
  const [ml, setMl] = useState(250)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function log() {
    if (saving) return
    setSaving(true)
    setError(null)

    // Optimistic: notify parent immediately so UI updates without waiting
    onLogged?.(ml)

    try {
      const res = await fetch('/api/client/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: ml }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Erreur serveur.')
        setSaving(false)
        return
      }

      setDone(true)
      setTimeout(() => {
        setDone(false)
        setSaving(false)
        onClose()
        router.refresh()
      }, 700)
    } catch {
      setError(t('water.error'))
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-[90px] left-4 right-4 z-[90] max-w-[400px] mx-auto bg-[#111111] rounded-2xl p-5 shadow-[0_12px_48px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-cyan-400" />
                <p className="text-[13px] font-bold text-white">{t('water.title')}</p>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Quick pills */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setMl(a)}
                  className={`h-10 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                    ml === a
                      ? 'bg-[#2e2e2e] text-[#f2f2f2]'
                      : 'bg-[#1a1a1a] text-[#5a5a5a]'
                  }`}
                >
                  {a}ml
                </button>
              ))}
            </div>

            {/* Fine-tune */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setMl(m => Math.max(50, m - 50))}
                className="h-10 w-10 flex items-center justify-center bg-white/[0.06] rounded-xl text-white active:scale-95 shrink-0"
              >
                <Minus size={15} />
              </button>
              <div className="flex-1 text-center">
                <p className="text-[28px] font-black text-white leading-none tabular-nums">{ml}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">millilitres</p>
              </div>
              <button
                onClick={() => setMl(m => Math.min(2000, m + 50))}
                className="h-10 w-10 flex items-center justify-center bg-white/[0.06] rounded-xl text-white active:scale-95 shrink-0"
              >
                <Plus size={15} />
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-red-400 text-center mb-3">{error}</p>
            )}

            <button
              onClick={log}
              disabled={saving && !done}
              className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[12px] font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98] ${
                done
                  ? 'bg-[#222222] text-[#b0b0b0]'
                  : 'bg-[#f2f2f2] text-[#080808] disabled:opacity-60'
              }`}
            >
              <Droplets size={15} />
              {done ? t('water.logged', { ml: String(ml) }) : saving ? t('water.saving') : t('water.log', { ml: String(ml) })}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
