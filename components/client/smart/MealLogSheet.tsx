"use client"

import { Suspense, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mic } from "lucide-react"
import { NutritionLogContent } from "@/app/client/nutrition/log/NutritionLogContent"
import dynamic from "next/dynamic"

const VoiceLogSheet = dynamic(() => import("@/components/client/smart/VoiceLogSheet"), { ssr: false })

interface MealLogSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function MealLogSheet({ open, onClose, onSuccess }: MealLogSheetProps) {
  const [voiceOpen, setVoiceOpen] = useState(false)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet — hauteur fixe 88vh pour que flex-1 des enfants reçoive une hauteur réelle */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] bg-[#111111] rounded-t-2xl"
            style={{ height: "88vh", display: "flex", flexDirection: "column" }}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
            exit={{ y: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />
              <p className="text-[13px] font-bold text-white">Ajouter un repas</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVoiceOpen(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: '#1a1a1a', color: '#808080' }}
                  title="Saisie vocale"
                >
                  <Mic size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Content — flex-1 reçoit la hauteur restante du sheet */}
            <div className="flex-1 overflow-hidden relative min-h-0">
              <Suspense fallback={<div className="h-full bg-[#111111]" />}>
                <NutritionLogContent embedded onSuccess={onSuccess ?? onClose} />
              </Suspense>
            </div>
          </motion.div>

          {/* Voice sheet — z higher than MealLogSheet */}
          <VoiceLogSheet
            open={voiceOpen}
            onClose={() => setVoiceOpen(false)}
            onSuccess={() => { setVoiceOpen(false); onSuccess?.() }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
