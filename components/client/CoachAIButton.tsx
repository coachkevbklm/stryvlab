'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import CoachAIChatSheet from './CoachAIChatSheet'

export default function CoachAIButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le Coach IA"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.10] text-[#0d0d0d] hover:bg-black/[0.18] active:scale-95 transition-all"
      >
        <MessageCircle size={16} />
      </button>

      <CoachAIChatSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
