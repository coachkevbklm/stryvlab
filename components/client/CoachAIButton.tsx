'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import CoachAIChatSheet from './CoachAIChatSheet'

export default function CoachAIButton() {
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState('toi')
  const [remaining, setRemaining] = useState(20)
  const [loaded, setLoaded] = useState(false)

  async function handleOpen() {
    if (!loaded) {
      try {
        const res = await fetch('/api/client/ai-coach/context')
        if (res.ok) {
          const data = await res.json()
          setClientName(data.clientName ?? 'toi')
          setRemaining(data.remainingMessages ?? 20)
        }
      } catch {
        // Fallback: open with defaults
      }
      setLoaded(true)
    }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Ouvrir Coach IA"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.10] text-[#0d0d0d] hover:bg-black/[0.18] active:scale-95 transition-all"
      >
        <MessageCircle size={16} />
      </button>

      <CoachAIChatSheet
        open={open}
        onClose={() => setOpen(false)}
        clientName={clientName}
        initialRemaining={remaining}
      />
    </>
  )
}
