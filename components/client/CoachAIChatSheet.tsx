'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  open: boolean
  onClose: () => void
  clientName: string
  initialRemaining: number
}

const QUICK_SUGGESTIONS = [
  'Il me reste des calories ce soir',
  'Comment récupérer après ma séance ?',
  'Mon eau est insuffisante, que faire ?',
]

export default function CoachAIChatSheet({ open, onClose, clientName, initialRemaining }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setMessages([{
        role: 'assistant',
        content: `Salut ${clientName} ! Je connais ta journée d'aujourd'hui. Comment puis-je t'aider ?`,
      }])
      setShowSuggestions(true)
      setInput('')
      setRemaining(initialRemaining)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, clientName, initialRemaining])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || remaining <= 0) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setShowSuggestions(false)
    setLoading(true)

    const historyForApi = newMessages.slice(-20)

    try {
      const res = await fetch('/api/client/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Tu as atteint tes 20 messages du jour. Reviens demain !',
        }])
        setRemaining(0)
        return
      }

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Réessaie dans quelques instants.',
        }])
        return
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setRemaining(data.remaining)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Pas de connexion. Vérifie ton réseau et réessaie.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isLimitReached = remaining <= 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ffe01e]" />
                <span className="text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white">
                  Coach IA
                </span>
                <span className="text-[10px] text-white/30 font-barlow ml-1">
                  Contexte du jour chargé
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white/60 hover:bg-white/[0.10] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[14px] font-barlow leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#ffe01e] text-[#0d0d0d] rounded-2xl rounded-tr-lg'
                        : 'bg-white/[0.06] text-white rounded-2xl rounded-tl-lg'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] rounded-2xl rounded-tl-lg px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-white/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showSuggestions && messages.length === 1 && (
                <div className="flex flex-col gap-2 mt-1">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="self-start text-[13px] font-barlow px-3 py-1.5 rounded-xl border border-[#ffe01e]/30 bg-[#ffe01e]/10 text-[#ffe01e] hover:bg-[#ffe01e]/20 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLimitReached || loading}
                  maxLength={500}
                  placeholder={isLimitReached ? 'Limite atteinte — reviens demain' : 'Tape ton message...'}
                  className="flex-1 min-w-0 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] font-barlow text-white placeholder:text-white/30 outline-none focus:border-white/20 disabled:opacity-40 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || isLimitReached}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffe01e] text-[#0d0d0d] disabled:opacity-30 transition-opacity"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-right text-[10px] text-white/30 mt-1.5 font-barlow">
                {remaining}/20 messages restants
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
