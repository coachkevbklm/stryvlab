'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Utensils, ClipboardCheck } from 'lucide-react'

export default function BottomNavPlusMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()

  function getMoment() {
    const hour = new Date().getHours()
    return hour < 14 ? 'matin' : 'soir'
  }

  function goMeal() {
    onClose()
    router.push('/client/agenda/meals/new')
  }

  function goCheckin() {
    onClose()
    router.push(`/client/checkin/${getMoment()}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed bottom-[90px] left-4 right-4 z-[70] max-w-[480px] mx-auto"
          >
            <div className="bg-[#181818] border-[0.3px] border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
              <button
                onClick={goMeal}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.04] transition-colors active:scale-[0.99] border-b-[0.3px] border-white/[0.05]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#1f8a65]/15 flex items-center justify-center shrink-0">
                  <Utensils size={16} className="text-[#1f8a65]" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-white">Ajouter un repas</p>
                  <p className="text-[11px] text-white/35">Texte, vocal ou photo</p>
                </div>
              </button>

              <button
                onClick={goCheckin}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.04] transition-colors active:scale-[0.99]"
              >
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ClipboardCheck size={16} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-white">Check-in</p>
                  <p className="text-[11px] text-white/35">
                    {typeof window !== 'undefined' && new Date().getHours() < 14 ? 'Check-in du matin' : 'Check-in du soir'}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
