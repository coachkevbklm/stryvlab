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
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#1a1a1a] flex items-center justify-center">
          {coachAvatarUrl ? (
            <Image src={coachAvatarUrl} alt="Coach" width={28} height={28} className="object-cover" />
          ) : (
            <span className="text-[10px] font-barlow-condensed font-bold text-[#808080] uppercase tracking-wider">
              S
            </span>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] px-3.5 py-2.5 text-[13px] leading-[1.5] ${
          isUser
            ? "bg-[#f2f2f2] text-[#080808] font-medium rounded-2xl rounded-tr-sm"
            : "bg-[#111111] text-[#b0b0b0] rounded-2xl rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
