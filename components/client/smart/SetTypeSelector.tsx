'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { SetType } from './SetRow'

interface SetTypeSelectorProps {
  open: boolean
  current: SetType
  onSelect: (type: SetType) => void
  onClose: () => void
}

const OPTIONS: { type: SetType; label: string; sublabel: string; icon: string; color: string }[] = [
  { type: 'warmup',   label: 'Échauffement',     sublabel: 'EC', icon: '⚡', color: 'text-[#FF6B35]' },
  { type: 'working',  label: 'Série principale',  sublabel: '',   icon: '1',  color: 'text-white' },
  { type: 'cooldown', label: 'Retour au calme',   sublabel: 'RC', icon: '❄', color: 'text-blue-400' },
  { type: 'dropset',  label: 'Dégressive',        sublabel: '',   icon: '↘', color: 'text-violet-400' },
]

export default function SetTypeSelector({ open, current, onSelect, onClose }: SetTypeSelectorProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[65] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl border-t border-white/[0.08] pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
            exit={{ y: '100%', transition: { duration: 0.18, ease: 'easeIn' } }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />
            <p className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/40 text-center pt-6 pb-4">
              Type de série
            </p>
            <div className="divide-y divide-white/[0.05]">
              {OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { onSelect(opt.type); onClose() }}
                  className={`w-full flex items-center gap-4 px-6 py-4 active:bg-white/[0.04] transition-colors ${current === opt.type ? 'bg-white/[0.04]' : ''}`}
                >
                  <span className={`text-[18px] w-6 text-center ${opt.color}`}>{opt.icon}</span>
                  <span className="text-[15px] font-semibold text-white flex-1 text-left">{opt.label}</span>
                  {opt.sublabel && (
                    <span className={`text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.1em] ${opt.color}`}>{opt.sublabel}</span>
                  )}
                  {current === opt.type && (
                    <span className="text-[#ffe01e] text-[12px]">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-4 text-[13px] text-white/40 font-medium"
            >
              Annuler
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
