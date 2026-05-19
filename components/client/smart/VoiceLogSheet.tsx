"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mic, MicOff, X, Trash2, ChevronRight, Plus } from "lucide-react"
import { useClientT } from "@/components/client/ClientI18nProvider"
import { cleanTranscript, type VoiceItem } from "@/lib/nutrition/voice"
import type { MealType } from "@/lib/nutrition/food-items"

type Layer = "recording" | "processing" | "review"

interface VoiceLogSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  /** If provided, voice items will be appended to this existing meal */
  mealId?: string
  lang?: string
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   "bg-[#22c55e]/15 text-[#22c55e]",
  medium: "bg-[#f59e0b]/15 text-[#f59e0b]",
  low:    "bg-red-500/15 text-red-400",
}

export default function VoiceLogSheet({ open, onClose, onSuccess, mealId, lang = "fr" }: VoiceLogSheetProps) {
  const { t } = useClientT()
  const [layer, setLayer] = useState<Layer>("recording")
  const [isListening, setIsListening] = useState(false)
  const [rawTranscript, setRawTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<VoiceItem[]>([])
  const [mealType, setMealType] = useState<MealType>("snack")
  const [logging, setLogging] = useState(false)
  const [waveBars, setWaveBars] = useState<number[]>([24, 24, 24, 24, 24])
  const [elapsedSec, setElapsedSec] = useState(0)

  const recognitionRef = useRef<any>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveFrameRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setLayer("recording")
      setIsListening(false)
      setRawTranscript("")
      setInterimTranscript("")
      setError(null)
      setItems([])
      setElapsedSec(0)
    }
  }, [open])

  useEffect(() => {
    return () => stopAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (waveFrameRef.current) cancelAnimationFrame(waveFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    analyserRef.current = null
    audioCtxRef.current = null
    streamRef.current = null
  }

  // ── Waveform animation ─────────────────────────────────────────────────────
  function startWave() {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Uint8Array(analyser.frequencyBinCount)
    function frame() {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(buf)
      const bands = [0, 8, 16, 24, 32].map(i => {
        const slice = Array.from(buf.slice(i, i + 8))
        const avg = slice.reduce((a, b) => a + b, 0) / 8
        return Math.max(8, Math.min(48, Math.round(avg / 2.5)))
      })
      setWaveBars(bands)
      waveFrameRef.current = requestAnimationFrame(frame)
    }
    waveFrameRef.current = requestAnimationFrame(frame)
  }

  // ── Parse transcript via API ───────────────────────────────────────────────
  const parseTranscript = useCallback(async (raw: string) => {
    const clean = cleanTranscript(raw, lang)
    setLayer("processing")
    setError(null)

    const today = new Date().toISOString().slice(0, 10)
    try {
      const res = await fetch("/api/client/nutrition/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: clean, physiological_date: today, lang }),
      })

      if (res.status === 429) {
        setError(t("voice.error_rate_limit"))
        setLayer("recording")
        return
      }
      if (!res.ok) {
        setError(t("voice.error_parse"))
        setLayer("recording")
        return
      }

      const data = await res.json()
      setItems(data.items ?? [])
      setMealType(data.meal_type ?? "snack")
      setLayer("review")
    } catch {
      setError(t("voice.error_parse"))
      setLayer("recording")
    }
  }, [lang, t])

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (waveFrameRef.current) cancelAnimationFrame(waveFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    setWaveBars([24, 24, 24, 24, 24])
    setIsListening(false)

    setRawTranscript(prev => {
      const final = prev.trim()
      if (final.length > 2) {
        parseTranscript(final)
      }
      return final
    })
  }, [parseTranscript])

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!isSpeechSupported) return
    setError(null)
    setRawTranscript("")
    setInterimTranscript("")
    setElapsedSec(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      startWave()
    } catch {
      // Waveform degraded — SpeechRecognition still works
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US"
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (e: any) => {
      let interim = ""
      let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) final += text
        else interim += text
      }
      if (final) setRawTranscript(prev => (prev + " " + final).trim())
      setInterimTranscript(interim)

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => stopRecording(), 2500)
    }

    recognition.onerror = () => stopRecording()
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)

    timerRef.current = setInterval(() => {
      setElapsedSec(prev => {
        if (prev >= 59) { stopRecording(); return 60 }
        return prev + 1
      })
    }, 1000)
  }, [lang, isSpeechSupported, stopRecording])

  // ── Item editing ───────────────────────────────────────────────────────────
  function updateItem(index: number, field: keyof VoiceItem, value: any) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === "quantity_g" && item.quantity_g > 0) {
        const ratio = (value as number) / item.quantity_g
        return {
          ...item,
          quantity_g: value as number,
          kcal: Math.round(item.kcal * ratio),
          protein_g: parseFloat((item.protein_g * ratio).toFixed(1)),
          carbs_g: parseFloat((item.carbs_g * ratio).toFixed(1)),
          fat_g: parseFloat((item.fat_g * ratio).toFixed(1)),
          fiber_g: parseFloat((item.fiber_g * ratio).toFixed(1)),
        }
      }
      return { ...item, [field]: value }
    }))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function addEmptyItem() {
    setItems(prev => [...prev, {
      name: "",
      quantity_g: 100,
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      confidence: "low" as const,
      is_new: true,
    }])
  }

  // ── Log meal ───────────────────────────────────────────────────────────────
  async function logMeal() {
    const validItems = items.filter(i => i.name.trim().length > 0)
    if (validItems.length === 0) return
    setLogging(true)

    // Create new food_items for is_new items
    for (const item of validItems.filter(i => i.is_new && !i.food_item_id)) {
      try {
        const per100 = item.quantity_g > 0
          ? {
              kcal_per_100g: Math.round(item.kcal / item.quantity_g * 100),
              protein_per_100g: parseFloat((item.protein_g / item.quantity_g * 100).toFixed(1)),
              carbs_per_100g: parseFloat((item.carbs_g / item.quantity_g * 100).toFixed(1)),
              fat_per_100g: parseFloat((item.fat_g / item.quantity_g * 100).toFixed(1)),
              fiber_per_100g: parseFloat((item.fiber_g / item.quantity_g * 100).toFixed(1)),
            }
          : { kcal_per_100g: item.kcal, protein_per_100g: item.protein_g, carbs_per_100g: item.carbs_g, fat_per_100g: item.fat_g, fiber_per_100g: 0 }

        const res = await fetch("/api/client/food-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name_fr: item.name,
            category_l1: "extras",
            category_l2: "divers",
            ...per100,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          item.food_item_id = created.id
          item.is_new = false
        }
      } catch {}
    }

    const entries = validItems
      .filter(i => i.food_item_id)
      .map(i => ({
        food_item_id: i.food_item_id!,
        quantity_g: i.quantity_g,
        input_mode: "voice" as const,
      }))

    if (entries.length === 0) {
      setLogging(false)
      setError(t("voice.error_parse"))
      return
    }

    try {
      const res = await fetch("/api/client/nutrition/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mealId ? { meal_id: mealId } : {}),
          meal_type: mealType,
          entries,
        }),
      })
      if (!res.ok) throw new Error()
      onSuccess?.()
      onClose()
    } catch {
      setError(t("voice.error_parse"))
    } finally {
      setLogging(false)
    }
  }

  const totalKcal = items.reduce((s, i) => s + i.kcal, 0)
  const totalP = items.reduce((s, i) => s + i.protein_g, 0)
  const totalC = items.reduce((s, i) => s + i.carbs_g, 0)
  const totalF = items.reduce((s, i) => s + i.fat_g, 0)
  const newCount = items.filter(i => i.is_new).length

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl border-t border-white/[0.08]"
            style={{ maxHeight: "88vh", display: "flex", flexDirection: "column" }}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
            exit={{ y: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />
              <p className="text-[13px] font-bold text-white font-barlow">{t("voice.title")}</p>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-6">

              {/* Not supported */}
              {!isSpeechSupported && (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white/40 text-[13px] text-center font-barlow px-4">
                    {t("voice.not_supported")}
                  </p>
                </div>
              )}

              {/* LAYER: recording */}
              {isSpeechSupported && layer === "recording" && (
                <div className="flex flex-col items-center gap-6 py-8">
                  {/* Waveform */}
                  <div className="flex items-center gap-1 h-14">
                    {waveBars.map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-[5px] rounded-full"
                        style={{ backgroundColor: isListening ? "#ffe01e" : "rgba(255,255,255,0.15)" }}
                        animate={{ height: h }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      />
                    ))}
                  </div>

                  {isListening && (
                    <span className="text-[12px] text-white/40 font-barlow tabular-nums">
                      {formatTime(elapsedSec)}
                    </span>
                  )}

                  {interimTranscript && (
                    <p className="text-[13px] text-white/40 italic font-barlow text-center px-2">
                      {interimTranscript}
                    </p>
                  )}
                  {rawTranscript && !interimTranscript && (
                    <p className="text-[13px] text-white/70 font-barlow text-center px-2">
                      {rawTranscript}
                    </p>
                  )}

                  {error && (
                    <p className="text-[12px] text-red-400 font-barlow text-center">{error}</p>
                  )}

                  {/* Mic button */}
                  <button
                    onClick={isListening ? stopRecording : startRecording}
                    className="h-[72px] w-[72px] rounded-full flex items-center justify-center transition-all active:scale-[0.95]"
                    style={{ backgroundColor: isListening ? "#ef4444" : "#ffe01e" }}
                  >
                    {isListening
                      ? <MicOff size={28} className="text-white" />
                      : <Mic size={28} className="text-[#0d0d0d]" />}
                  </button>

                  <p className="text-[11px] text-white/30 font-barlow-condensed uppercase tracking-[0.18em]">
                    {isListening ? t("voice.listening") : t("voice.tap_to_speak")}
                  </p>
                </div>
              )}

              {/* LAYER: processing */}
              {layer === "processing" && (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <div className="h-8 w-8 border-2 border-white/20 border-t-[#ffe01e] rounded-full animate-spin" />
                  <p className="text-[13px] text-white/50 font-barlow">{t("voice.processing")}</p>
                </div>
              )}

              {/* LAYER: review */}
              {layer === "review" && (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/40 mt-1">
                    {t("voice.review_title")}
                  </p>

                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <input
                          value={item.name}
                          onChange={e => updateItem(idx, "name", e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[13px] text-white font-barlow border-b border-white/[0.08] pb-0.5 focus:outline-none focus:border-[#ffe01e]/40"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-lg ${CONFIDENCE_STYLES[item.confidence] ?? CONFIDENCE_STYLES.medium}`}>
                            {t(
                              item.confidence === "high"
                                ? "voice.confidence_high"
                                : item.confidence === "medium"
                                ? "voice.confidence_med"
                                : "voice.confidence_low"
                            )}
                          </span>
                          {item.is_new && (
                            <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b]">
                              {t("voice.new_badge")}
                            </span>
                          )}
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.quantity_g}
                            onChange={e => updateItem(idx, "quantity_g", parseFloat(e.target.value) || 0)}
                            className="w-16 min-w-0 bg-white/[0.06] rounded-lg px-2 py-1 text-[12px] text-white font-barlow text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-white/40 font-barlow">g</span>
                        </div>
                        <span className="text-[11px] text-white/60 font-barlow">{Math.round(item.kcal)} kcal</span>
                        <span className="text-[11px] text-white/40 font-barlow">P {item.protein_g.toFixed(1)}g</span>
                        <span className="text-[11px] text-white/40 font-barlow">G {item.carbs_g.toFixed(1)}g</span>
                        <span className="text-[11px] text-white/40 font-barlow">L {item.fat_g.toFixed(1)}g</span>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={addEmptyItem}
                    className="flex items-center gap-2 text-[12px] text-white/40 font-barlow hover:text-white/60 transition-colors py-2"
                  >
                    <Plus size={14} />
                    {t("voice.add_item")}
                  </button>

                  {newCount > 0 && (
                    <p className="text-[11px] text-[#f59e0b]/70 font-barlow">
                      {t("voice.new_items_notice").replace("{n}", String(newCount))}
                    </p>
                  )}

                  {/* Totals */}
                  <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[13px] font-bold text-white font-barlow">
                      {Math.round(totalKcal)} kcal
                    </span>
                    <div className="flex gap-3 text-[11px] text-white/50 font-barlow">
                      <span>P {totalP.toFixed(1)}g</span>
                      <span>G {totalC.toFixed(1)}g</span>
                      <span>L {totalF.toFixed(1)}g</span>
                    </div>
                  </div>

                  {error && (
                    <p className="text-[12px] text-red-400 font-barlow">{error}</p>
                  )}

                  <button
                    onClick={logMeal}
                    disabled={logging || items.filter(i => i.name.trim()).length === 0}
                    className="w-full h-12 rounded-xl bg-[#ffe01e] text-[#0d0d0d] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {logging
                      ? <div className="h-4 w-4 border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d] rounded-full animate-spin" />
                      : <><ChevronRight size={16} />{t("voice.log_meal")}</>
                    }
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
