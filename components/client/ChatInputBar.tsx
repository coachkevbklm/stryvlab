"use client"

import { useState } from "react"
import { ArrowRight, Microphone } from "@phosphor-icons/react"
import dynamic from "next/dynamic"

const VoiceLogSheet = dynamic(() => import("@/components/client/smart/VoiceLogSheet"), { ssr: false })

interface ChatInputBarProps {
  onSend: (content: string, type?: string) => void
  disabled?: boolean
}

export default function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("")
  const [voiceOpen, setVoiceOpen] = useState(false)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, "text")
    setValue("")
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleVoiceSuccess(transcript: string) {
    setVoiceOpen(false)
    if (transcript.trim()) onSend(transcript.trim(), "voice")
  }

  return (
    <>
      <div className="shrink-0 bg-[#080808] px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={() => setVoiceOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-[#5a5a5a] active:bg-[#222222] transition-colors shrink-0"
          aria-label="Saisie vocale"
        >
          <Microphone size={18} />
        </button>

        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écrire un message..."
          disabled={disabled}
          className="flex-1 min-w-0 bg-[#111111] rounded-xl px-3.5 py-2 text-[13px] font-barlow text-[#e0e0e0] placeholder-[#5a5a5a] outline-none transition-colors disabled:opacity-50"
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#f2f2f2] text-[#080808] disabled:opacity-30 active:scale-95 transition-all shrink-0"
          aria-label="Envoyer"
        >
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {voiceOpen && (
        <VoiceLogSheet
          open={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onSuccess={() => setVoiceOpen(false)}
          onTranscriptOnly={handleVoiceSuccess}
        />
      )}
    </>
  )
}
