"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ChatTodayStrip from "./ChatTodayStrip"
import ChatConversation from "./ChatConversation"
import ChatInputBar from "./ChatInputBar"
import { type ChatMessage } from "./ChatBubble"

const QUICK_SUGGESTIONS = [
  "Comment je récupère après ma séance ?",
  "Check-in du matin",
  "Aide-moi avec ma nutrition",
  "Programme pour aujourd'hui",
]

interface ChatPageProps {
  coachAvatarUrl?: string | null
  clientFirstName?: string | null
}

export default function ChatPage({ coachAvatarUrl, clientFirstName }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [remaining, setRemaining] = useState(20)
  const [initialized, setInitialized] = useState(false)
  const inputRef = useRef<{ setValue: (v: string) => void } | null>(null)

  useEffect(() => {
    fetch("/api/client/chat/messages")
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? [])
        setInitialized(true)
      })
      .catch(() => setInitialized(true))
  }, [])

  const handleSend = useCallback(async (content: string, type = "text") => {
    if (isLoading || remaining <= 0) return

    const tempId = `tmp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content,
      message_type: type,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    setIsLoading(true)

    try {
      const res = await fetch("/api/client/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, message_type: type }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempId),
          data.userMessage,
          data.botMessage,
        ])
        setRemaining(data.remaining ?? 0)
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, remaining])

  const isEmpty = initialized && messages.length === 0

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-[#0d0d0d]"
      style={{ bottom: "calc(62px + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Today strip */}
      <ChatTodayStrip onCheckinClick={() => handleSend("Je veux faire mon check-in du matin")} />

      {/* Conversation or empty state */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-hidden">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-[72px] h-[72px] rounded-full bg-[#161616] border border-white/[0.08] flex items-center justify-center"
          >
            {coachAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coachAvatarUrl} alt="Coach" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-[26px] font-barlow-condensed font-bold text-[#ffe01e]">S</span>
            )}
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <p className="text-[17px] font-barlow font-semibold text-white leading-snug">
              {clientFirstName ? `Bonjour ${clientFirstName} 👋` : "Bonjour 👋"}
            </p>
            <p className="text-[13px] text-white/40 font-barlow mt-1">
              Pose-moi une question ou dis-moi comment tu vas.
            </p>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="flex flex-wrap gap-2 justify-center w-full max-w-[320px]"
          >
            {QUICK_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] font-barlow text-white/60 active:bg-white/[0.10] active:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        </div>
      ) : (
        <ChatConversation
          messages={messages}
          coachAvatarUrl={coachAvatarUrl}
          isLoading={isLoading}
        />
      )}

      {/* Rate limit banner */}
      <AnimatePresence>
        {remaining <= 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="px-4 py-2 text-center text-[11px] text-white/30 font-barlow bg-white/[0.02] border-t border-white/[0.04]">
              Limite journalière atteinte · Reviens demain
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <ChatInputBar onSend={handleSend} disabled={isLoading || remaining <= 0} />
    </div>
  )
}
