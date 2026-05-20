"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Gear, SignOut } from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import BodyDataSection from "@/components/client/profile/BodyDataSection"

interface MetricsPageProps {
  clientName: string
  clientEmail: string
  avatarInitials: string
  streak: number
}

export default function MetricsPage({ clientName, clientEmail, avatarInitials, streak }: MetricsPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/client/login")
  }

  return (
    <div className="flex flex-col min-h-full bg-[#0d0d0d]">
      {/* TopBar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 shrink-0">
        <div>
          <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30">
            MON PROFIL
          </p>
          <p className="text-[13px] font-barlow font-semibold text-white">Métriques</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-white/40 active:bg-white/[0.08] transition-colors"
          aria-label="Paramètres"
        >
          <Gear size={16} />
        </button>
      </div>

      {/* Hero */}
      <div className="flex items-center gap-3 px-4 pb-5">
        <div className="w-14 h-14 rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center shrink-0">
          <span className="text-[18px] font-barlow-condensed font-bold text-[#ffe01e] uppercase">
            {avatarInitials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-barlow font-semibold text-white truncate">{clientName}</p>
          <p className="text-[11px] text-white/40 truncate">{clientEmail}</p>
        </div>
        {streak > 0 && (
          <div className="px-2.5 py-1 bg-[#ffe01e]/10 border border-[#ffe01e]/20 rounded-full shrink-0">
            <span className="text-[11px] font-barlow-condensed font-bold text-[#ffe01e]">
              🔥 {streak}j
            </span>
          </div>
        )}
      </div>

      {/* Body data */}
      <div className="flex-1 px-4 pb-24">
        <BodyDataSection />
      </div>

      {/* Settings sheet */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#161616] rounded-t-2xl border-t border-white/[0.08] px-4 pt-3 pb-8"
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
              exit={{ y: "100%", transition: { duration: 0.2 } }}
            >
              <div className="w-10 h-1 bg-white/[0.12] rounded-full mx-auto mb-4" />
              <p className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30 mb-3">
                Paramètres
              </p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] text-white/70 active:bg-white/[0.08] transition-colors"
              >
                <SignOut size={16} />
                <span className="text-[13px] font-barlow">Se déconnecter</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
