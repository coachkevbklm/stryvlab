"use client"

import { useState, useEffect } from "react"

export interface InteractiveMetadata {
  component: 'chips' | 'slider' | 'number'
  key: string
  question: string
  options?: { label: string; value: number; emoji?: string }[]
  min?: number
  max?: number
  step?: number
  unit?: string
  optional?: boolean
  answered?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  message_type: string
  metadata?: InteractiveMetadata | null
  created_at: string
}

interface ChatBubbleProps {
  message: ChatMessage
  coachAvatarUrl?: string | null
  coachInitial?: string | null
  onInteract?: (messageId: string, key: string, value: number) => void
  onSkip?: (messageId: string, key: string) => void
}

function SliderInput({
  meta,
  answered,
  onInteract,
}: {
  meta: InteractiveMetadata
  answered: boolean
  onInteract: (val: number) => void
}) {
  const min = meta.min ?? 0
  const max = meta.max ?? 10
  const step = meta.step ?? 1
  const mid = Math.round(((min + max) / 2) / step) * step
  const [val, setVal] = useState(mid)
  const pct = ((val - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-2 w-[220px]">
      <div className="flex justify-between text-[10px] text-[#5a5a5a] font-barlow">
        <span>{min}{meta.unit}</span>
        <span className="text-[#e0e0e0] font-semibold text-[13px]">{val}{meta.unit}</span>
        <span>{max}{meta.unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        disabled={answered}
        onChange={e => setVal(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full cursor-pointer disabled:cursor-default"
        style={{
          background: `linear-gradient(to right, #f2f2f2 0%, #f2f2f2 ${pct}%, #2e2e2e ${pct}%, #2e2e2e 100%)`,
        }}
      />
      {!answered && (
        <button
          onClick={() => onInteract(val)}
          className="self-end px-3 py-1 bg-[#f2f2f2] text-[#080808] rounded-lg text-[12px] font-barlow font-semibold active:scale-95 transition-all"
        >
          Confirmer
        </button>
      )}
    </div>
  )
}

function NumberInput({
  meta,
  answered,
  onInteract,
}: {
  meta: InteractiveMetadata
  answered: boolean
  onInteract: (val: number) => void
}) {
  const [val, setVal] = useState('')
  const parsed = parseFloat(val)
  const isValid = !isNaN(parsed) && val.trim() !== ''

  return (
    <>
      <input
        type="number"
        value={val}
        disabled={answered}
        onChange={e => setVal(e.target.value)}
        placeholder="0"
        className="w-20 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-[14px] font-barlow text-[#e0e0e0] text-center outline-none disabled:opacity-50"
      />
      {meta.unit && (
        <span className="text-[12px] text-[#5a5a5a] font-barlow">{meta.unit}</span>
      )}
      {!answered && isValid && (
        <button
          onClick={() => onInteract(parsed)}
          className="px-3 py-1.5 bg-[#f2f2f2] text-[#080808] rounded-lg text-[12px] font-barlow font-semibold active:scale-95 transition-all"
        >
          OK
        </button>
      )}
    </>
  )
}

function CoachAvatar({ url, initial }: { url?: string | null; initial: string }) {
  const [photoReady, setPhotoReady] = useState(false)

  useEffect(() => {
    if (!url) return
    const img = new window.Image()
    img.onload = () => setPhotoReady(true)
    img.onerror = () => setPhotoReady(false)
    img.src = url
  }, [url])

  return (
    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#3a3a3a] flex items-center justify-center relative">
      <span className="text-[12px] font-bold text-white leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        {initial}
      </span>
      {photoReady && url && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${url}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  )
}

export default function ChatBubble({ message, coachAvatarUrl, coachInitial, onInteract, onSkip }: ChatBubbleProps) {
  const isUser = message.role === "user"
  const meta = message.metadata
  const answered = meta?.answered ?? false

  const initial = (coachInitial ?? 'C').trim().charAt(0).toUpperCase() || 'C'

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <CoachAvatar url={coachAvatarUrl} initial={initial} />
      )}

      <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[82%]`}>
        {/* Text bubble */}
        <div
          className={`px-3.5 py-2.5 text-[13px] leading-[1.5] ${
            isUser
              ? "bg-[#f2f2f2] text-[#080808] font-medium rounded-2xl rounded-tr-sm"
              : "bg-[#111111] text-[#b0b0b0] rounded-2xl rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Chips */}
        {!isUser && meta?.component === 'chips' && (
          <div className={`flex flex-wrap gap-1.5 ${answered ? 'opacity-40 pointer-events-none' : ''}`}>
            {(meta.options ?? []).map(opt => (
              <button
                key={opt.value}
                onClick={() => !answered && onInteract?.(message.id, meta.key, opt.value)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] rounded-full text-[12px] font-barlow text-[#808080] active:bg-[#f2f2f2] active:text-[#080808] transition-all"
              >
                {opt.emoji && <span>{opt.emoji}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Slider */}
        {!isUser && meta?.component === 'slider' && (
          <div className={`px-3.5 py-3 bg-[#111111] rounded-xl ${answered ? 'opacity-40 pointer-events-none' : ''}`}>
            <SliderInput
              meta={meta}
              answered={answered}
              onInteract={(val) => onInteract?.(message.id, meta.key, val)}
            />
          </div>
        )}

        {/* Number input */}
        {!isUser && meta?.component === 'number' && (
          <div className={`px-3.5 py-3 bg-[#111111] rounded-xl flex items-center gap-3 ${answered ? 'opacity-40 pointer-events-none' : ''}`}>
            <NumberInput
              meta={meta}
              answered={answered}
              onInteract={(val) => onInteract?.(message.id, meta.key, val)}
            />
            {meta.optional && !answered && (
              <button
                onClick={() => onSkip?.(message.id, meta.key)}
                className="text-[11px] text-[#5a5a5a] font-barlow shrink-0 ml-1"
              >
                Passer →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
