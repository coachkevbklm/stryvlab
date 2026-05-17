'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ForkKnife, Drop, PersonSimpleRun, Moon } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useClientT } from '../ClientI18nProvider'

type ActionId = 'meal' | 'water' | 'activity' | 'checkin'

type Action = {
  id: ActionId
  Icon: React.ElementType
  angleDeg: number
}

const ACTIONS: Action[] = [
  { id: 'meal',     Icon: ForkKnife,       angleDeg: -135 },
  { id: 'water',    Icon: Drop,            angleDeg: -100 },
  { id: 'activity', Icon: PersonSimpleRun, angleDeg:  -80 },
  { id: 'checkin',  Icon: Moon,            angleDeg:  -45 },
]

const RADIUS = 110

const LABEL_KEYS: Record<ActionId, string> = {
  meal: 'smart.radial.meal',
  water: 'smart.radial.water',
  activity: 'smart.radial.activity',
  checkin: 'smart.radial.checkin',
}

export type RadialActionMenuProps = {
  open: boolean
  onClose: () => void
  onOpenWater: () => void
  onOpenActivity: () => void
}

export default function RadialActionMenu({ open, onClose, onOpenWater, onOpenActivity }: RadialActionMenuProps) {
  const router = useRouter()
  const { t } = useClientT()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleAction = (id: ActionId) => {
    onClose()
    switch (id) {
      case 'meal':     router.push('/client/nutrition/log'); break
      case 'water':    onOpenWater(); break
      case 'activity': onOpenActivity(); break
      case 'checkin':  router.push('/client/checkin/onboarding'); break
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 'calc(max(20px, env(safe-area-inset-bottom)) + 62px + 16px)' }}
          >
            {ACTIONS.map((a, i) => {
              const rad = (a.angleDeg * Math.PI) / 180
              const x = Math.cos(rad) * RADIUS
              const y = Math.sin(rad) * RADIUS
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, x, y, scale: 1, transition: { delay: i * 0.04, type: 'spring', stiffness: 380, damping: 28 } }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  onClick={(e) => { e.stopPropagation(); handleAction(a.id) }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-white/[0.08] flex items-center justify-center active:scale-95 transition-transform">
                    <a.Icon size={28} weight="regular" className="text-white" />
                  </div>
                  <span className="mt-1.5 font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[10px] text-white/80 whitespace-nowrap">
                    {t(LABEL_KEYS[a.id] as any)}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
