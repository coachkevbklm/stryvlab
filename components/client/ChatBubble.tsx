"use client"

import Image from "next/image"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  message_type: string
  created_at: string
}

interface ChatBubbleProps {
  message: ChatMessage
  coachAvatarUrl?: string | null
}

export default function ChatBubble({ message, coachAvatarUrl }: ChatBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#161616] border border-white/[0.08] flex items-center justify-center">
          {coachAvatarUrl ? (
            <Image src={coachAvatarUrl} alt="Coach" width={28} height={28} className="object-cover" />
          ) : (
            <span className="text-[10px] font-barlow-condensed font-bold text-[#ffe01e] uppercase tracking-wider">
              S
            </span>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] px-3.5 py-2.5 text-[13px] leading-[1.5] ${
          isUser
            ? "bg-[#ffe01e] text-[#0d0d0d] font-medium rounded-2xl rounded-tr-sm"
            : "bg-[#161616] text-white/80 border border-white/[0.06] rounded-2xl rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
