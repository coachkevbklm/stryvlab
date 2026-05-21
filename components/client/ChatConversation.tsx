"use client"

import { useEffect, useRef } from "react"
import ChatBubble, { type ChatMessage } from "./ChatBubble"

interface ChatConversationProps {
  messages: ChatMessage[]
  coachAvatarUrl?: string | null
  coachInitial?: string | null
  isLoading?: boolean
  onInteract?: (messageId: string, key: string, value: number) => void
  onSkip?: (messageId: string, key: string) => void
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today)) return "Aujourd'hui"
  if (sameDay(d, yesterday)) return "Hier"
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

export default function ChatConversation({ messages, coachAvatarUrl, coachInitial, isLoading, onInteract, onSkip }: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  type Item =
    | { type: "separator"; label: string; key: string }
    | { type: "message"; msg: ChatMessage }

  const items: Item[] = []
  let lastDate = ""
  for (const msg of messages) {
    const day = msg.created_at.split("T")[0]
    if (day !== lastDate) {
      items.push({ type: "separator", label: formatDateSeparator(msg.created_at), key: `sep-${day}` })
      lastDate = day
    }
    items.push({ type: "message", msg })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {items.map(item =>
        item.type === "separator" ? (
          <div key={item.key} className="flex items-center justify-center py-2">
            <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-[#5a5a5a]">
              {item.label}
            </span>
          </div>
        ) : (
          <ChatBubble key={item.msg.id} message={item.msg} coachAvatarUrl={coachAvatarUrl} coachInitial={coachInitial} onInteract={onInteract} onSkip={onSkip} />
        )
      )}

      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#2a2a2a] flex items-center justify-center relative">
            <span className="absolute text-[12px] font-bold text-white select-none">
              {((coachInitial ?? 'C').trim().charAt(0).toUpperCase()) || 'C'}
            </span>
            {coachAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coachAvatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>
          <div className="bg-[#111111] rounded-2xl rounded-tl-sm px-3.5 py-3 flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#404040] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
