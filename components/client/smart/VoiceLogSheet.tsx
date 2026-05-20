"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mic, X, Trash2, ChevronRight, Plus } from "lucide-react"
import { useClientT } from "@/components/client/ClientI18nProvider"
import { cleanTranscript, type VoiceItem } from "@/lib/nutrition/voice"
import type { MealType } from "@/lib/nutrition/food-items"

type Layer = "recording" | "processing" | "review"
type RecordMode = "idle" | "recording"

// Extends VoiceItem with per-gram nutritional bases for correct quantity recalculation
type DisplayItem = VoiceItem & {
  _kcal_per_g:    number
  _protein_per_g: number
  _carbs_per_g:   number
  _fat_per_g:     number
  _fiber_per_g:   number
}

function withBases(item: VoiceItem): DisplayItem {
  const q = item.quantity_g > 0 ? item.quantity_g : 1
  return {
    ...item,
    _kcal_per_g:    item.kcal      / q,
    _protein_per_g: item.protein_g / q,
    _carbs_per_g:   item.carbs_g   / q,
    _fat_per_g:     item.fat_g     / q,
    _fiber_per_g:   item.fiber_g   / q,
  }
}

interface VoiceLogSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  onTranscriptOnly?: (transcript: string) => void
  mealId?: string
  lang?: string
}

const MAX_RECORD_SEC = 90 // hard recording limit — auto-stops + parses

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   "bg-[#22c55e]/15 text-[#22c55e]",
  medium: "bg-[#f59e0b]/15 text-[#f59e0b]",
  low:    "bg-red-500/15 text-red-400",
}

export default function VoiceLogSheet({ open, onClose, onSuccess, onTranscriptOnly, mealId, lang = "fr" }: VoiceLogSheetProps) {
  const { t } = useClientT()

  const [layer, setLayer]                   = useState<Layer>("recording")
  const [mode, setMode]                     = useState<RecordMode>("idle")
  const [rawTranscript, setRawTranscript]   = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError]                   = useState<string | null>(null)
  const [items, setItems]                   = useState<DisplayItem[]>([])
  const [qtyDrafts, setQtyDrafts]           = useState<Record<number, string>>({})
  const [mealType, setMealType]             = useState<MealType>("snack")
  const [logging, setLogging]               = useState(false)
  const [waveBars, setWaveBars]             = useState<number[]>([6, 6, 6, 6, 6, 6, 6])
  const [elapsedSec, setElapsedSec]         = useState(0)

  const recognitionRef  = useRef<any>(null)
  const analyserRef     = useRef<AnalyserNode | null>(null)
  const audioCtxRef     = useRef<AudioContext | null>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waveFrameRef    = useRef<number | null>(null)
  const modeRef         = useRef<RecordMode>("idle")
  const accRef          = useRef("")
  const openRef         = useRef(open)
  const startingRef     = useRef(false) // prevent double-start

  const isSpeechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  openRef.current = open
  function setModeSync(m: RecordMode) { modeRef.current = m; setMode(m) }
  const isActive = mode === "recording"

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setLayer("recording")
      setModeSync("idle")
      setRawTranscript("")
      setInterimTranscript("")
      setError(null)
      setItems([])
      setElapsedSec(0)
      setWaveBars([6, 6, 6, 6, 6, 6, 6])
      accRef.current = ""
    } else {
      // Sheet closed — kill everything immediately, no parse
      stopAll()
      setModeSync("idle")
      accRef.current = ""
    }
  }, [open])

  useEffect(() => () => stopAll(), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setQtyDrafts({}) }, [items.length])

  // Stop recording if user locks phone or switches tab
  useEffect(() => {
    function onHide() {
      if (modeRef.current === "recording") stopRecording()
    }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [])

  // ── Stop everything — called on close, unmount, timeout, visibility change ──
  function stopAll() {
    if (timerRef.current)    { clearInterval(timerRef.current);  timerRef.current = null }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null }
    if (waveFrameRef.current){ cancelAnimationFrame(waveFrameRef.current); waveFrameRef.current = null }
    if (streamRef.current)   { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    try { recognitionRef.current?.abort() } catch {}
    recognitionRef.current = null
    analyserRef.current = null
    startingRef.current = false
  }

  // ── Waveform animation ────────────────────────────────────────────────────
  function startWave() {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Uint8Array(analyser.frequencyBinCount)
    function frame() {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(buf)
      const bars = Array.from({ length: 7 }, (_, i) => {
        const slice = Array.from(buf.slice(i * 5, i * 5 + 5))
        const avg = slice.reduce((a, b) => a + b, 0) / 5
        return Math.max(4, Math.min(40, Math.round(avg / 2.8)))
      })
      setWaveBars(bars)
      waveFrameRef.current = requestAnimationFrame(frame)
    }
    waveFrameRef.current = requestAnimationFrame(frame)
  }

  // ── Parse transcript ───────────────────────────────────────────────────────
  const parseTranscript = useCallback(async (raw: string) => {
    if (!openRef.current) return
    const clean = cleanTranscript(raw, lang)
    setLayer("processing")
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    try {
      const res = await fetch("/api/client/nutrition/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: clean, physiological_date: today, lang, client_hour: new Date().getHours() }),
      })
      if (res.status === 429) { setError(t("voice.error_rate_limit")); setLayer("recording"); return }
      if (!res.ok)            { setError(t("voice.error_parse"));      setLayer("recording"); return }
      const data = await res.json()
      if (!openRef.current) return
      setItems((data.items ?? []).map(withBases))
      setMealType(data.meal_type ?? "snack")
      setLayer("review")
    } catch {
      setError(t("voice.error_parse"))
      setLayer("recording")
    }
  }, [lang, t])

  // ── Stop recording + parse ─────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current)    clearInterval(timerRef.current)
    if (waveFrameRef.current) cancelAnimationFrame(waveFrameRef.current)
    if (streamRef.current)   streamRef.current.getTracks().forEach(t => t.stop())
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
    try { recognitionRef.current?.stop() } catch {}
    setWaveBars([6, 6, 6, 6, 6, 6, 6])
    setModeSync("idle")
    const final = accRef.current.trim()
    accRef.current = ""
    if (final.length > 2 && openRef.current) {
      if (onTranscriptOnly) {
        onTranscriptOnly(final)
      } else {
        parseTranscript(final)
      }
    }
  }, [parseTranscript, onTranscriptOnly])

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!isSpeechSupported) return
    if (startingRef.current || modeRef.current === "recording") return // guard double-start
    startingRef.current = true
    setModeSync("recording")

    setError(null)
    setRawTranscript("")
    setInterimTranscript("")
    setElapsedSec(0)
    accRef.current = ""

    // Request mic — if sheet closed before getUserMedia resolves, abort
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      startingRef.current = false
      setModeSync("idle")
      setError("Microphone inaccessible")
      return
    }

    // Sheet may have closed while awaiting getUserMedia
    if (!openRef.current) {
      stream.getTracks().forEach(t => t.stop())
      startingRef.current = false
      return
    }

    streamRef.current = stream
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      startWave()
    } catch {}

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (e: any) => {
      if (!openRef.current) return
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          accRef.current = (accRef.current + " " + text).trim()
          setRawTranscript(accRef.current)
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (e: any) => {
      // network or no-speech errors — stop cleanly, don't loop
      const fatal = ["network", "service-not-allowed", "not-allowed", "audio-capture"]
      if (fatal.includes(e.error)) stopRecording()
    }

    recognition.onend = () => {
      // Restart only if still actively recording (network blip recovery)
      if (modeRef.current === "recording" && openRef.current) {
        try { recognition.start() } catch { stopRecording() }
      }
    }

    recognition.start()
    startingRef.current = false

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSec(p => {
        if (p + 1 >= MAX_RECORD_SEC) {
          // Auto-stop at limit
          stopRecording()
          return MAX_RECORD_SEC
        }
        return p + 1
      })
    }, 1000)

    // Hard timeout safety net (MAX_RECORD_SEC + 2s buffer)
    maxTimerRef.current = setTimeout(() => {
      if (modeRef.current === "recording") stopRecording()
    }, (MAX_RECORD_SEC + 2) * 1000)

  }, [lang, isSpeechSupported])

  // ── Toggle click ───────────────────────────────────────────────────────────
  function handleToggle() {
    if (modeRef.current === "idle") {
      startRecording()
    } else {
      stopRecording()
    }
  }


  // ── Item editing ───────────────────────────────────────────────────────────
  function updateItem(index: number, field: keyof DisplayItem, value: any) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === "quantity_g") {
        const qty = value as number
        return {
          ...item, quantity_g: qty,
          kcal:      Math.round(item._kcal_per_g    * qty),
          protein_g: parseFloat((item._protein_per_g * qty).toFixed(1)),
          carbs_g:   parseFloat((item._carbs_per_g   * qty).toFixed(1)),
          fat_g:     parseFloat((item._fat_per_g     * qty).toFixed(1)),
          fiber_g:   parseFloat((item._fiber_per_g   * qty).toFixed(1)),
        }
      }
      return { ...item, [field]: value }
    }))
  }

  function removeItem(index: number) { setItems(prev => prev.filter((_, i) => i !== index)) }

  function addEmptyItem() {
    setItems(prev => [...prev, withBases({
      name: "", quantity_g: 100, kcal: 0,
      protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
      confidence: "low" as const, is_new: true,
    })])
  }

  // ── Log meal ───────────────────────────────────────────────────────────────
  async function logMeal() {
    const validItems = items.filter(i => i.name.trim().length > 0)
    if (validItems.length === 0) return
    setLogging(true)
    for (const item of validItems.filter(i => i.is_new && !i.food_item_id)) {
      try {
        const per100 = item.quantity_g > 0
          ? {
              kcal_per_100g:    Math.round(item.kcal     / item.quantity_g * 100),
              protein_per_100g: parseFloat((item.protein_g / item.quantity_g * 100).toFixed(1)),
              carbs_per_100g:   parseFloat((item.carbs_g   / item.quantity_g * 100).toFixed(1)),
              fat_per_100g:     parseFloat((item.fat_g     / item.quantity_g * 100).toFixed(1)),
              fiber_per_100g:   parseFloat((item.fiber_g   / item.quantity_g * 100).toFixed(1)),
            }
          : { kcal_per_100g: item.kcal, protein_per_100g: item.protein_g, carbs_per_100g: item.carbs_g, fat_per_100g: item.fat_g, fiber_per_100g: 0 }
        const res = await fetch("/api/client/food-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name_fr: item.name, category_l1: "extras", category_l2: "divers", ...per100 }),
        })
        if (res.ok) { const c = await res.json(); item.food_item_id = c.id; item.is_new = false }
      } catch {}
    }
    const entries = validItems.filter(i => i.food_item_id).map(i => ({
      food_item_id: i.food_item_id!,
      quantity_g:   i.quantity_g,
      input_mode:   "voice" as const,
    }))
    if (entries.length === 0) { setLogging(false); setError(t("voice.error_parse")); return }
    try {
      const res = await fetch("/api/client/nutrition/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(mealId ? { meal_id: mealId } : {}), meal_type: mealType, entries }),
      })
      if (!res.ok) throw new Error()
      if (onSuccess) onSuccess()
      else onClose()
    } catch {
      setError(t("voice.error_parse"))
    } finally {
      setLogging(false)
    }
  }

  const totalKcal = items.reduce((s, i) => s + i.kcal, 0)
  const totalP    = items.reduce((s, i) => s + i.protein_g, 0)
  const totalC    = items.reduce((s, i) => s + i.carbs_g, 0)
  const totalF    = items.reduce((s, i) => s + i.fat_g, 0)
  const newCount  = items.filter(i => i.is_new).length
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  const timeWarning = isActive && elapsedSec >= 70 // warn last 20s

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t border-white/[0.08]"
            style={{ background: '#0d0d0d', maxHeight: "88vh", display: "flex", flexDirection: "column" }}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
            exit={{ y: "100%", transition: { duration: 0.2, ease: "easeIn" } }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.10]" />
              <p className="text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white">
                {t("voice.title")}
              </p>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-8">

              {!isSpeechSupported && (
                <div className="flex items-center justify-center h-40">
                  <p className="text-white/40 text-[13px] text-center px-4">{t("voice.not_supported")}</p>
                </div>
              )}

              {/* ── LAYER: recording ── */}
              {isSpeechSupported && layer === "recording" && (
                <div className="flex flex-col items-center" style={{ paddingTop: 12, paddingBottom: 16, gap: 0 }}>

                  {/* Waveform */}
                  <div className="flex items-center justify-center gap-[4px]" style={{ height: 44, marginBottom: 10 }}>
                    {waveBars.map((h, i) => (
                      <motion.div key={i}
                        style={{ width: 4, borderRadius: 99, backgroundColor: isActive ? "#ffe01e" : "rgba(255,255,255,0.13)" }}
                        animate={{ height: isActive ? h : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  <span
                    className="tabular-nums font-barlow-condensed font-bold tracking-[0.16em]"
                    style={{ fontSize: 12, color: timeWarning ? '#ef4444' : isActive ? '#ffe01e' : 'rgba(255,255,255,0.18)', marginBottom: 14 }}
                  >
                    {formatTime(elapsedSec)}
                    {timeWarning && ` / ${formatTime(MAX_RECORD_SEC)}`}
                  </span>

                  {/* Transcript */}
                  <div style={{ minHeight: 52, width: '100%', textAlign: 'center', padding: '0 8px', marginBottom: 24 }}>
                    {interimTranscript && (
                      <p className="text-[13px] text-white/35 italic leading-relaxed">{interimTranscript}</p>
                    )}
                    {rawTranscript && !interimTranscript && (
                      <p className="text-[13px] text-white/60 leading-relaxed">{rawTranscript}</p>
                    )}
                    {!interimTranscript && !rawTranscript && (
                      <p className="text-[13px] text-white/15 italic leading-relaxed">
                        {isActive ? "En écoute…" : "Appuyez sur le bouton pour parler…"}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="text-[12px] text-red-400 text-center" style={{ marginBottom: 16 }}>{error}</p>
                  )}

                  {/* ── MIC BUTTON — idle=jaune, recording=gris+contour jaune ── */}
                  <div style={{ marginBottom: 20 }}>
                    <button
                      onClick={handleToggle}
                      className="flex flex-col items-center justify-center select-none"
                      style={{
                        width: 88, height: 88, borderRadius: 22, gap: 5,
                        background: isActive ? '#161616' : '#ffe01e',
                        border: isActive ? '1.5px solid #ffe01e' : 'none',
                      }}
                    >
                      <Mic size={28} strokeWidth={2}
                        style={{ color: isActive ? '#ffe01e' : '#0d0d0d' }}
                      />
                      <span style={{
                        fontSize: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.14em', lineHeight: 1,
                        color: isActive ? '#ffe01e' : '#0d0d0d',
                      }}>
                        {isActive ? "ARRÊTER" : "ENREGISTRER"}
                      </span>
                    </button>
                  </div>

                  {/* Hint */}
                  <p className="font-barlow-condensed font-bold uppercase text-center"
                    style={{ fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.18)', lineHeight: 1.4 }}>
                    {isActive ? "Appuyer pour arrêter et analyser" : "Appuyer pour enregistrer"}
                  </p>
                </div>
              )}

              {/* ── LAYER: processing ── */}
              {layer === "processing" && (
                <div className="flex flex-col items-center justify-center h-48 gap-5">
                  <div className="h-10 w-10 border-2 border-white/10 border-t-[#ffe01e] rounded-full animate-spin" />
                  <p className="text-[13px] text-white/50 font-barlow-condensed uppercase tracking-[0.14em]">
                    {t("voice.processing")}
                  </p>
                </div>
              )}

              {/* ── LAYER: review ── */}
              {layer === "review" && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/40 mt-1">
                    {t("voice.review_title")}
                  </p>

                  {items.map((item, idx) => (
                    <motion.div key={idx} layout
                      className="rounded-xl border border-white/[0.08] p-3"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <input
                          value={item.name}
                          onChange={e => updateItem(idx, "name", e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[13px] text-white border-b border-white/[0.08] pb-0.5 focus:outline-none focus:border-[#ffe01e]/40"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-lg ${CONFIDENCE_STYLES[item.confidence] ?? CONFIDENCE_STYLES.medium}`}>
                            {t(item.confidence === "high" ? "voice.confidence_high" : item.confidence === "medium" ? "voice.confidence_med" : "voice.confidence_low")}
                          </span>
                          {item.is_new && (
                            <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b]">
                              {t("voice.new_badge")}
                            </span>
                          )}
                          <button onClick={() => removeItem(idx)} className="text-white/30 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={qtyDrafts[idx] !== undefined ? qtyDrafts[idx] : String(item.quantity_g)}
                            onChange={e => setQtyDrafts(prev => ({ ...prev, [idx]: e.target.value }))}
                            onFocus={e => { setQtyDrafts(prev => ({ ...prev, [idx]: String(item.quantity_g) })); e.target.select() }}
                            onBlur={() => {
                              const raw = qtyDrafts[idx]
                              if (raw !== undefined) {
                                const v = parseFloat(raw)
                                if (isFinite(v) && v > 0) updateItem(idx, "quantity_g", v)
                                setQtyDrafts(prev => { const n = { ...prev }; delete n[idx]; return n })
                              }
                            }}
                            className="w-16 min-w-0 bg-white/[0.06] rounded-lg px-2 py-1 text-[12px] text-white text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-white/40">g</span>
                        </div>
                        <span className="text-[11px] text-white/60">{Math.round(item.kcal)} kcal</span>
                        <span className="text-[11px] text-white/40">P {item.protein_g.toFixed(1)}g</span>
                        <span className="text-[11px] text-white/40">G {item.carbs_g.toFixed(1)}g</span>
                        <span className="text-[11px] text-white/40">L {item.fat_g.toFixed(1)}g</span>
                      </div>
                    </motion.div>
                  ))}

                  <button onClick={addEmptyItem} className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/60 transition-colors py-2">
                    <Plus size={14} />{t("voice.add_item")}
                  </button>

                  {newCount > 0 && (
                    <p className="text-[11px] text-[#f59e0b]/70">{t("voice.new_items_notice").replace("{n}", String(newCount))}</p>
                  )}

                  <div className="rounded-xl border border-white/[0.06] p-3 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-[13px] font-bold text-white">{Math.round(totalKcal)} kcal</span>
                    <div className="flex gap-3 text-[11px] text-white/50">
                      <span>P {totalP.toFixed(1)}g</span>
                      <span>G {totalC.toFixed(1)}g</span>
                      <span>L {totalF.toFixed(1)}g</span>
                    </div>
                  </div>

                  {error && <p className="text-[12px] text-red-400">{error}</p>}

                  <button
                    onClick={logMeal}
                    disabled={logging || items.filter(i => i.name.trim()).length === 0}
                    className="w-full h-12 rounded-xl font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: '#ffe01e', color: '#0d0d0d' }}
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
