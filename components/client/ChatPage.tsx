"use client"

import { useState, useEffect, useCallback } from "react"
import ChatTodayStrip from "./ChatTodayStrip"
import ChatConversation from "./ChatConversation"
import ChatInputBar from "./ChatInputBar"
import { type ChatMessage } from "./ChatBubble"

interface ChatPageProps {
  coachAvatarUrl?: string | null
}

export default function ChatPage({ coachAvatarUrl }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [remaining, setRemaining] = useState(20)

  useEffect(() => {
    fetch("/api/client/chat/messages")
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {})
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

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <ChatTodayStrip />
      <ChatConversation
        messages={messages}
        coachAvatarUrl={coachAvatarUrl}
        isLoading={isLoading}
      />
      {remaining <= 0 && (
        <div className="shrink-0 px-4 py-2 text-center text-[11px] text-white/30 font-barlow">
          Limite journalière atteinte — reviens demain
        </div>
      )}
      <ChatInputBar onSend={handleSend} disabled={isLoading || remaining <= 0} />
    </div>
  )
}
