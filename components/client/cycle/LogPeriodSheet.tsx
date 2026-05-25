'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { CycleState } from '@/lib/cycle/cycleEngine'

interface Props {
  open: boolean
  cycleState: CycleState | null
  onClose: () => void
  onUpdated: (newState: CycleState) => void
}

type Mode = 'main' | 'pick-start-date' | 'confirm-conflict'

export default function LogPeriodSheet({ open, cycleState, onClose, onUpdated }: Props) {
  const [mode, setMode] = useState<Mode>('main')
  const [pickedDate, setPickedDate] = useState('')
  const [conflictDate, setConflictDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const hasOpenPeriod =
    cycleState?.lastPeriodDate !== null &&
    cycleState?.currentPhase === 'menstrual'

  async function logStart(date: string, _force = false) {
    setLoading(true)
    try {
      const res = await fetch('/api/client/cycle/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'start', date }),
      })
      if (res.status === 409) {
        const data = await res.json()
        setConflictDate(data.existingDate)
        setPickedDate(date)
        setMode('confirm-conflict')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onUpdated(data.cycleState)
      const phaseName = data.cycleState.currentPhase ?? ''
      setSuccessMsg(`Cycle mis à jour · Phase : ${phaseName}`)
      setTimeout(() => { setSuccessMsg(null); onClose() }, 2000)
    } catch {
      setLoading(false)
    } finally {
      setLoading(false)
      if (mode !== 'confirm-conflict') setMode('main')
    }
  }

  async function logEnd() {
    setLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch('/api/client/cycle/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'end', date: today }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onUpdated(data.cycleState)
      setSuccessMsg('Fin de règles enregistrée')
      setTimeout(() => { setSuccessMsg(null); onClose() }, 2000)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setMode('main')
    setPickedDate('')
    setConflictDate('')
    setSuccessMsg(null)
    onClose()
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[80] bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            key="sheet"
            className="fixed left-0 right-0 bottom-0 z-[90] rounded-t-2xl bg-[#111111]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-[3px] rounded-full bg-white/[0.12]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <p className="text-[13px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[#e0e0e0]">
                Cycle
              </p>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-[#5a5a5a] active:bg-white/[0.08]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {successMsg ? (
                <div className="py-6 text-center">
                  <p className="text-[14px] font-barlow font-semibold text-[#e0e0e0]">{successMsg}</p>
                </div>
              ) : mode === 'confirm-conflict' ? (
                <div className="space-y-3">
                  <p className="text-[12px] font-barlow text-[#a0a0a0] leading-relaxed px-1">
                    Un log existe déjà le {conflictDate}. Remplacer ?
                  </p>
                  <button
                    onClick={() => {
                      setMode('main')
                      logStart(pickedDate || today, true)
                    }}
                    disabled={loading}
                    className="w-full h-[52px] rounded-xl bg-[#f2f2f2] text-[#080808] text-[13px] font-barlow font-bold active:opacity-80 disabled:opacity-50"
                  >
                    Confirmer quand même
                  </button>
                  <button
                    onClick={() => setMode('main')}
                    className="w-full h-[44px] rounded-xl bg-white/[0.04] text-[#a0a0a0] text-[13px] font-barlow active:bg-white/[0.08]"
                  >
                    Annuler
                  </button>
                </div>
              ) : mode === 'pick-start-date' ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-barlow text-[#5a5a5a] px-1">Premier jour de règles :</p>
                  <input
                    type="date"
                    value={pickedDate}
                    max={today}
                    onChange={e => setPickedDate(e.target.value)}
                    className="w-full h-[52px] rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#e0e0e0] text-[14px] font-barlow px-4 min-w-0"
                  />
                  <button
                    onClick={() => pickedDate && logStart(pickedDate)}
                    disabled={!pickedDate || loading}
                    className="w-full h-[52px] rounded-xl bg-[#f2f2f2] text-[#080808] text-[13px] font-barlow font-bold active:opacity-80 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement…' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => setMode('main')}
                    className="w-full h-[44px] rounded-xl bg-white/[0.04] text-[#a0a0a0] text-[13px] font-barlow active:bg-white/[0.08]"
                  >
                    Retour
                  </button>
                </div>
              ) : (
                <>
                  {/* Section 1: Début de règles */}
                  <div className="rounded-xl bg-white/[0.04] overflow-hidden">
                    <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[#5a5a5a] px-4 pt-3 pb-1">
                      Début de règles
                    </p>
                    <div className="p-3 space-y-2">
                      <button
                        onClick={() => logStart(today)}
                        disabled={loading}
                        className="w-full h-[52px] rounded-xl bg-[#f2f2f2] text-[#080808] text-[13px] font-barlow font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="w-3 h-3 rounded-full bg-[#c0392b] shrink-0" />
                        Aujourd&apos;hui
                      </button>
                      <button
                        onClick={() => setMode('pick-start-date')}
                        disabled={loading}
                        className="w-full h-[44px] rounded-xl bg-white/[0.04] text-[#a0a0a0] text-[12px] font-barlow active:bg-white/[0.08]"
                      >
                        Choisir une autre date
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Fin de règles — conditional */}
                  {hasOpenPeriod && (
                    <div className="rounded-xl bg-white/[0.04] overflow-hidden">
                      <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[#5a5a5a] px-4 pt-3 pb-1">
                        Fin de règles
                      </p>
                      <div className="p-3">
                        <button
                          onClick={logEnd}
                          disabled={loading}
                          className="w-full h-[44px] rounded-xl bg-white/[0.04] text-[#e0e0e0] text-[13px] font-barlow active:bg-white/[0.08] disabled:opacity-50"
                        >
                          {loading ? 'Enregistrement…' : 'Mes règles sont terminées'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
