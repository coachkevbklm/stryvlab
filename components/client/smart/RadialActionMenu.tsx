'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ForkKnife, Drop, PersonSimpleRun, ClipboardText } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useClientT } from '../ClientI18nProvider'
import MealLogSheet from './MealLogSheet'

type ActionId = 'meal' | 'water' | 'activity' | 'checkin'

type Action = {
  id: ActionId
  Icon: React.ElementType
  angleDeg: number
}

// Arc 120° centré en haut, espacement uniforme 40° entre 4 boutons
// De -150° à -30° (axe X positif, sens trigonométrique)
const ACTIONS: Action[] = [
  { id: 'meal',     Icon: ForkKnife,       angleDeg: -150 },
  { id: 'water',    Icon: Drop,            angleDeg: -110 },
  { id: 'activity', Icon: PersonSimpleRun, angleDeg:  -70 },
  { id: 'checkin',  Icon: ClipboardText,   angleDeg:  -30 },
]

const RADIUS = 96

const LABEL_KEYS: Record<ActionId, string> = {
  meal:     'smart.radial.meal',
  water:    'smart.radial.water',
  activity: 'smart.radial.activity',
  checkin:  'smart.radial.checkin',
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
  const [mealSheetOpen, setMealSheetOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleAction = (id: ActionId) => {
    onClose()
    switch (id) {
      case 'meal':
        setMealSheetOpen(true)
        break
      case 'water':
        onOpenWater()
        break
      case 'activity':
        onOpenActivity()
        break
      case 'checkin':
        router.push('/client/checkin/onboarding')
        break
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Button anchor: centred horizontally, just above the BottomNav */}
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
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1, x, y, scale: 1,
                      transition: {
                        delay: i * 0.035,
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                        mass: 0.8,
                      },
                    }}
                    exit={{
                      opacity: 0, x: 0, y: 0, scale: 0.5,
                      transition: { duration: 0.15, ease: 'easeIn' },
                    }}
                    onClick={(e) => { e.stopPropagation(); handleAction(a.id) }}
                    style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
                    aria-label={String(t(LABEL_KEYS[a.id] as any))}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#ffe01e] flex items-center justify-center active:scale-95 transition-transform shadow-[0_4px_16px_rgba(255,224,30,0.3)]">
                      <a.Icon size={24} weight="fill" className="text-[#0d0d0d]" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MealLogSheet open={mealSheetOpen} onClose={() => setMealSheetOpen(false)} />
    </>
  )
}
