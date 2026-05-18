"use client"

import { Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { NutritionLogContent } from "@/app/client/nutrition/log/NutritionLogContent"

interface MealLogSheetProps {
  open: boolean
  onClose: () => void
}

export default function MealLogSheet({ open, onClose }: MealLogSheetProps) {
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

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col bg-[#161616] rounded-t-2xl border-t border-white/[0.08]"
            style={{ maxHeight: "88vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
            exit={{ y: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />
              <p className="text-[13px] font-bold text-white">Ajouter un repas</p>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              <Suspense fallback={<div className="h-full bg-[#161616]" />}>
                <NutritionLogContent embedded onSuccess={onClose} />
              </Suspense>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
