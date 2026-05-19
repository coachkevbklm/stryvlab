"use client"

import { useState } from "react"
import { Mic } from "lucide-react"
import dynamic from "next/dynamic"

const VoiceLogSheet = dynamic(() => import("@/components/client/smart/VoiceLogSheet"), { ssr: false })

interface VoiceEntryFabProps {
  lang?: string
  onSuccess?: () => void
}

export default function VoiceEntryFab({ lang = "fr", onSuccess }: VoiceEntryFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center justify-center h-11 w-11 rounded-full bg-white/[0.08] border border-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white transition-all active:scale-[0.95]"
        style={{ bottom: "88px", right: "16px" }}
        aria-label="Saisie vocale"
      >
        <Mic size={18} />
      </button>

      <VoiceLogSheet
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); onSuccess?.() }}
        lang={lang}
      />
    </>
  )
}
