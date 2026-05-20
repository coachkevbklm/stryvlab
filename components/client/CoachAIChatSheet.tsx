'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'Il me reste des calories ce soir',
  'Comment récupérer après ma séance ?',
  'Mon eau est insuffisante, que faire ?',
]

const GREETING = "Bonjour ! Je connais ta journée. Comment puis-je t'aider ?"

export default function CoachAIChatSheet({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [contextReady, setContextReady] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Fetch context on open — resets state each time
  useEffect(() => {
    if (!open) return
    setMessages([])
    setInput('')
    setShowSuggestions(true)
    setContextReady(false)

    fetch('/api/client/ai-coach/context')
      .then(r => r.json())
      .then(data => {
        setRemaining(data.remainingMessages ?? 20)
        setContextReady(true)
      })
      .catch(() => {
        setRemaining(20)
        setContextReady(true)
      })
  }, [open])

  // Auto-scroll on new message or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when context is ready
  useEffect(() => {
    if (contextReady && open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [contextReady, open])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading || remaining === 0) return

    setShowSuggestions(false)
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/client/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (res.status === 429) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Tu as atteint tes 20 messages du jour. Reviens demain !' },
        ])
        setRemaining(0)
        return
      }

      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        setRemaining(data.remaining ?? 0)
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Une erreur est survenue. Réessaie dans un instant.' },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Une erreur est survenue. Réessaie dans un instant.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, remaining])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isLimitReached = remaining === 0
  const canSend = !loading && !isLimitReached && contextReady && input.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col rounded-t-2xl bg-[#161616] border-t border-white/[0.08]"
            style={{ maxHeight: '88vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffe01e] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffe01e]" />
                </span>
                <span className="text-[13px] font-barlow-condensed font-bold uppercase tracking-[0.14em] text-white">
                  Coach IA
                </span>
                {contextReady && (
                  <span className="text-[10px] text-white/40 font-barlow">
                    · Contexte du jour chargé
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white/60 hover:bg-white/[0.10] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            >
              {/* Greeting */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-white/[0.06] px-4 py-3 text-[14px] text-white/90 font-barlow leading-relaxed">
                  {GREETING}
                </div>
              </div>

              {/* Suggestions rapides — visibles uniquement avant le premier message */}
              {showSuggestions && messages.length === 0 && contextReady && (
                <div className="flex flex-col gap-2 mt-1">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="self-start text-left text-[12px] font-barlow px-3 py-2 rounded-xl border border-[#ffe01e]/30 bg-[#ffe01e]/10 text-[#ffe01e] hover:bg-[#ffe01e]/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Conversation */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] font-barlow leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#ffe01e] text-[#0d0d0d]'
                        : 'bg-white/[0.06] text-white/90'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
                    <span className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="block h-1.5 w-1.5 rounded-full bg-white/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!contextReady || isLimitReached || loading}
                  placeholder={
                    isLimitReached
                      ? "Limite atteinte pour aujourd'hui"
                      : 'Tape ton message...'
                  }
                  className="flex-1 min-w-0 h-10 rounded-xl bg-[#1a1a1a] border border-white/[0.08] px-3 text-[14px] font-barlow text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.16] disabled:opacity-40 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!canSend}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe01e] text-[#0d0d0d] disabled:opacity-30 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>
              {remaining !== null && (
                <p className="text-right text-[10px] text-white/30 font-barlow mt-1.5">
                  {remaining}/20 messages
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
