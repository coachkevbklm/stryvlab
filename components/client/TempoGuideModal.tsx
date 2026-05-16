'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { parseTempo, type ParsedTempo } from '@/lib/training/tempo'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TempoGuideModalProps {
  tempo: string          // already resolved (coach value or getDefaultTempo result)
  reps: number           // planned reps for this set
  exerciseName: string
  prepSeconds: number    // countdown before RAF starts (client-configured, default 5)
  hapticsEnabled: boolean // client-configured vibration toggle
  onClose: () => void    // called on manual close OR end of last rep
}

// Visual phase order: Concentrique → Isométrique → Excentrique → Pause
// DB tempo notation [ECC, PB, CON, PH] remapped to visual order:
//   visual 0 = CON  (parsed.concentric)
//   visual 1 = ISO  (parsed.pauseTop)
//   visual 2 = ECC  (parsed.eccentric)
//   visual 3 = PAUSE(parsed.pauseBottom)
const PHASE_LABELS    = ['Concentrique', 'Isométrique', 'Excentrique', 'Pause'] as const
const PHASE_SUBLABELS = ['Contraction — montée', 'Maintien au sommet', 'Descente contrôlée', 'Étirement — position initiale'] as const
const ACCENT = '#FFB800'
// PAUSE phases (visual 1=ISO and 3=PAUSE) — ball stops and pulses
const PAUSE_PHASES = new Set([1, 3])

// ─── SVG Path definition ─────────────────────────────────────────────────────
// Shape: sinusoidal wave — starts bottom-left, rises (CON), flat top (ISO),
//        falls (ECC), flat bottom-right (PAUSE), then loops.
// The ball starts at the very beginning of the CON rise (x=0, y=bottom).
// viewBox 0 0 400 180. Bottom y=155, top y=25.
//
// Phases (t 0→1 along path):
//   0.00–0.25 : CON   — smooth rise bottom→top (bézier)
//   0.25–0.55 : ISO   — flat top (wider = pause is longer visually)
//   0.55–0.80 : ECC   — smooth fall top→bottom (bézier)
//   0.80–1.00 : PAUSE — flat bottom-right
const PATH_D = [
  'M 0,155',                      // CON start — bottom left
  'C 15,155 45,25 90,25',         // CON rise — smooth bézier
  'L 230,25',                     // ISO — flat top
  'C 270,25 295,155 320,155',     // ECC fall — smooth bézier
  'L 400,155',                    // PAUSE — flat bottom right
].join(' ')

// Phase t-boundaries calibrated to path geometry above
const PHASE_START = [0,    0.25, 0.55, 0.80]
const PHASE_END   = [0.25, 0.55, 0.80, 1.00]

// Easing per visual phase
function easeIn(t: number): number  { return t * t }
function easeOut(t: number): number { return t * (2 - t) }
function linear(t: number): number  { return t }
const PHASE_EASING = [easeOut, linear, easeIn, linear]

// Diamonds at phase transitions
const DIAMOND_T = [0.25, 0.55, 0.80]

// ─── Haptic helper ───────────────────────────────────────────────────────────
function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern) } catch { /* not supported */ }
}

// ─── Public component — validates tempo before rendering inner ────────────────

export default function TempoGuideModal({
  tempo, reps, exerciseName, prepSeconds, hapticsEnabled, onClose,
}: TempoGuideModalProps) {
  const parsed = parseTempo(tempo)
  if (!parsed || reps <= 0) return null

  // Guard: all-zero tempo would cause repDuration=0 and division by zero in RAF
  const phaseMs = (p: typeof parsed.eccentric) => p === 'X' ? 300 : (p as number) * 1000
  const totalMs = phaseMs(parsed.eccentric) + phaseMs(parsed.pauseBottom) + phaseMs(parsed.concentric) + phaseMs(parsed.pauseTop)
  if (totalMs === 0) return null

  return (
    <TempoGuideModalInner
      parsed={parsed}
      reps={reps}
      exerciseName={exerciseName}
      prepSeconds={prepSeconds}
      hapticsEnabled={hapticsEnabled}
      onClose={onClose}
    />
  )
}

// ─── Inner component — receives validated parsed tempo ────────────────────────

function TempoGuideModalInner({
  parsed, reps, exerciseName, prepSeconds, hapticsEnabled, onClose,
}: {
  parsed: ParsedTempo
  reps: number
  exerciseName: string
  prepSeconds: number
  hapticsEnabled: boolean
  onClose: () => void
}) {
  const vib = (pattern: number | number[]) => { if (hapticsEnabled) vibrate(pattern) }
  // DB tempo = [ECC, PB, CON, PH]. Visual order = [CON, PH, ECC, PB].
  // Remap to visual order so phase index 0=CON, 1=PH, 2=ECC, 3=PB.
  const ms = (p: typeof parsed.eccentric) => p === 'X' ? 300 : (p as number) * 1000
  const phaseDurations: number[] = [
    ms(parsed.concentric),   // visual 0: CON (rise)
    ms(parsed.pauseTop),     // visual 1: PH  (flat top)
    ms(parsed.eccentric),    // visual 2: ECC (fall)
    ms(parsed.pauseBottom),  // visual 3: PB  (flat bottom)
  ]
  const repDuration = phaseDurations.reduce((a, b) => a + b, 0)

  // React state — only updated on phase/rep changes, never in the RAF hot path
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentRep, setCurrentRep]     = useState(0)
  const [done, setDone]                 = useState(false)
  const [closing, setClosing]           = useState(false)
  // Countdown prepSeconds→...→1→GO before RAF starts
  const [countdown, setCountdown]       = useState<number | null>(prepSeconds)
  // Remaining seconds in current phase (displayed as timer)
  const [phaseTimer, setPhaseTimer]     = useState<number>(0)

  // SVG DOM refs — mutated directly in RAF loop
  const pathRef      = useRef<SVGPathElement>(null)
  const ballRef      = useRef<SVGCircleElement>(null)
  const ballGlowRef  = useRef<SVGCircleElement>(null)
  const trailRefs    = useRef<SVGCircleElement[]>([])
  const diamondRefs  = useRef<SVGPolygonElement[]>([])

  // RAF mutable state (not React state — no re-render on every frame)
  const rafRef       = useRef<number>(0)
  const startRef     = useRef<number | null>(null)
  const phaseRef     = useRef(0)
  const repRef       = useRef(0)
  const trailBuf     = useRef<{ x: number; y: number }[]>([])
  const lastPhaseRef = useRef(-1)
  const TRAIL_LEN    = 10

  // Positions of 3 diamond transition points on the path (computed once after mount)
  const [diamondPositions, setDiamondPositions] = useState<{ x: number; y: number }[]>([])
  useEffect(() => {
    if (!pathRef.current) return
    const len = pathRef.current.getTotalLength()
    setDiamondPositions(DIAMOND_T.map(t => pathRef.current!.getPointAtLength(t * len)))
  }, [])

  // ── Countdown: tick every second ──
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => (c !== null && c > 0 ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Countdown ball: visible on rail when countdown ≤ 3, creeps toward CON start ──
  // Ball slides from x=leftEdge to x=CON_start (t=0.0 on path) over last 3 seconds
  const prepRafRef = useRef<number>(0)
  const prepStartRef = useRef<number | null>(null)
  const PREP_CRAWL_SECS = 3 // ball appears 3s before GO

  useEffect(() => {
    if (countdown === null || countdown > PREP_CRAWL_SECS) {
      // Ball not yet visible — hide it
      if (ballRef.current) { ballRef.current.setAttribute('opacity', '0') }
      if (ballGlowRef.current) { ballGlowRef.current.setAttribute('opacity', '0') }
      cancelAnimationFrame(prepRafRef.current)
      prepStartRef.current = null
      return
    }

    // countdown is 1, 2 or 3 → ball crawls toward point C
    // point C = t=0.0 on path = leftmost point
    const crawlTick = (now: number) => {
      if (!pathRef.current || !ballRef.current || !ballGlowRef.current) {
        prepRafRef.current = requestAnimationFrame(crawlTick)
        return
      }
      if (prepStartRef.current === null) prepStartRef.current = now
      const remaining = (countdown / PREP_CRAWL_SECS) - ((now - prepStartRef.current) / (PREP_CRAWL_SECS * 1000))
      // t=0 → ball at point C (left). Ball slides in from slightly left of point C.
      // During prep, ball is at t=0.0 (origin) and glows softly.
      const len = pathRef.current.getTotalLength()
      const pt = pathRef.current.getPointAtLength(0) // point C
      ballRef.current.setAttribute('cx', String(pt.x))
      ballRef.current.setAttribute('cy', String(pt.y))
      ballRef.current.setAttribute('opacity', '1')
      ballRef.current.setAttribute('fill', 'white')
      ballRef.current.setAttribute('r', String(11 + (1 - Math.max(remaining, 0)) * 3))
      ballGlowRef.current.setAttribute('cx', String(pt.x))
      ballGlowRef.current.setAttribute('cy', String(pt.y))
      ballGlowRef.current.setAttribute('opacity', String(0.12 + (1 - Math.max(remaining, 0)) * 0.15))
      prepRafRef.current = requestAnimationFrame(crawlTick)
    }

    prepRafRef.current = requestAnimationFrame(crawlTick)
    return () => cancelAnimationFrame(prepRafRef.current)
  }, [countdown])

  // ── Manual close ──
  const handleClose = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setClosing(true)
  }, [])

  // ── Auto-close 400ms after last rep ──
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setClosing(true), 400)
    return () => clearTimeout(t)
  }, [done])

  // ── RAF Loop ──
  const tick = useCallback((now: number) => {
    if (!pathRef.current || !ballRef.current || !ballGlowRef.current) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    if (startRef.current === null) startRef.current = now
    const elapsed = now - startRef.current

    // Which rep are we in?
    const repIndex = Math.min(Math.floor(elapsed / repDuration), reps)

    // Last rep finished → end
    if (repIndex >= reps) {
      const totalLen = pathRef.current.getTotalLength()
      const pt = pathRef.current.getPointAtLength(totalLen)
      ballRef.current.setAttribute('cx', String(pt.x))
      ballRef.current.setAttribute('cy', String(pt.y))
      ballGlowRef.current.setAttribute('cx', String(pt.x))
      ballGlowRef.current.setAttribute('cy', String(pt.y))
      vib([100, 40, 100, 40, 100])
      setDone(true)
      return
    }

    // Rep change → haptic + update bar
    if (repIndex !== repRef.current) {
      repRef.current = repIndex
      setCurrentRep(repIndex)
      if (repIndex > 0) vib([70, 30, 70])
    }

    // Progress within current rep (0→1)
    const tRep = (elapsed % repDuration) / repDuration

    // Determine current phase from cumulative fractions
    let cumulative = 0
    let phase = 0
    let tInPhase = 1
    for (let i = 0; i < 4; i++) {
      const phaseFrac = phaseDurations[i] / repDuration
      if (phaseFrac === 0) continue // skip instant phases
      if (tRep < cumulative + phaseFrac) {
        phase = i
        tInPhase = (tRep - cumulative) / phaseFrac
        break
      }
      cumulative += phaseFrac
      phase = i
      tInPhase = 1
    }

    // Phase change → haptic + React state
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase
      phaseRef.current = phase
      setCurrentPhase(phase)
      // Visual: 0=CON, 1=PH, 2=ECC, 3=PB
      if (phase === 0) vib(70)        // start CON (explosive — stronger pulse)
      else if (phase === 1) vib(40)  // PH pause starts
      else if (phase === 2) vib(40)  // ECC starts
      else if (phase === 3) vib(40)  // PB pause starts
    }

    // Update phase countdown timer (seconds remaining in current phase)
    const phaseMs = phaseDurations[phase]
    if (phaseMs > 0) {
      const elapsed_in_phase = tInPhase * phaseMs
      const remaining = Math.ceil((phaseMs - elapsed_in_phase) / 1000)
      setPhaseTimer(Math.max(remaining, 0))
    }

    // Compute position on path with easing
    const easedT = PHASE_EASING[phase](Math.min(Math.max(tInPhase, 0), 1))
    const pathT  = PHASE_START[phase] + easedT * (PHASE_END[phase] - PHASE_START[phase])
    const totalLen = pathRef.current.getTotalLength()
    const pt = pathRef.current.getPointAtLength(pathT * totalLen)

    // Move ball — on pause phases, ball stays at path position but pulses
    ballRef.current.setAttribute('cx', String(pt.x))
    ballRef.current.setAttribute('cy', String(pt.y))
    ballGlowRef.current.setAttribute('cx', String(pt.x))
    ballGlowRef.current.setAttribute('cy', String(pt.y))

    // Pulse animation during pause phases (visual 1=PH, 3=PB)
    // Ball grows slightly and turns yellow as pause progresses
    if (PAUSE_PHASES.has(phase) && phaseMs > 300) {
      const pulseT = Math.min(tInPhase, 1)
      const r = 13 + pulseT * 6  // grows from 13 to 19
      const glowR = 22 + pulseT * 10
      // Color: white → yellow (lerp via filter)
      const yellowMix = pulseT  // 0=white, 1=full yellow
      ballRef.current.setAttribute('r', String(r))
      ballGlowRef.current.setAttribute('r', String(glowR))
      ballGlowRef.current.setAttribute('opacity', String(0.18 + pulseT * 0.25))
      // Simulate color shift: use filter brightness/saturate trick via style
      ballRef.current.style.filter = `drop-shadow(0 0 ${14 + pulseT * 10}px rgba(255,184,0,${0.7 + pulseT * 0.3}))`
      if (yellowMix > 0.5) {
        ballRef.current.setAttribute('fill', ACCENT)
      } else {
        ballRef.current.setAttribute('fill', 'white')
      }
    } else {
      // Active phase — reset to normal white ball
      ballRef.current.setAttribute('r', '13')
      ballGlowRef.current.setAttribute('r', '22')
      ballGlowRef.current.setAttribute('opacity', '0.18')
      ballRef.current.setAttribute('fill', 'white')
      ballRef.current.style.filter = 'drop-shadow(0 0 16px rgba(255,184,0,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))'
    }

    // Update comet trail buffer
    trailBuf.current.unshift({ x: pt.x, y: pt.y })
    if (trailBuf.current.length > TRAIL_LEN) trailBuf.current.length = TRAIL_LEN
    trailRefs.current.forEach((el, i) => {
      if (!el) return
      const pos = trailBuf.current[i]
      if (!pos) { el.setAttribute('opacity', '0'); return }
      el.setAttribute('cx', String(pos.x))
      el.setAttribute('cy', String(pos.y))
      el.setAttribute('opacity', String(((TRAIL_LEN - i) / TRAIL_LEN) * 0.38))
      el.setAttribute('r', String(Math.max(11 - i * 0.9, 1)))
    })

    // Diamond pulse: scale up when ball is within 0.04 of transition point
    const transitionPts = DIAMOND_T
    diamondRefs.current.forEach((el, i) => {
      if (!el || !pathRef.current) return
      const dist = Math.abs(pathT - transitionPts[i])
      const near  = dist < 0.04
      const dPt   = pathRef.current.getPointAtLength(transitionPts[i] * totalLen)
      const scale = near ? 1.5 : 1.0
      el.setAttribute('opacity', near ? '1.0' : '0.55')
      el.setAttribute('transform', `translate(${dPt.x}, ${dPt.y}) scale(${scale})`)
    })

    rafRef.current = requestAnimationFrame(tick)
  }, [reps, repDuration, phaseDurations])

  // Only start RAF after countdown completes
  useEffect(() => {
    if (countdown !== null) return
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, countdown])

  // ── Derived label values — visual order [CON, ISO, ECC, PAUSE] ──
  // DB: [ECC=eccentric, PB=pauseBottom, CON=concentric, PH=pauseTop]
  // Visual remap: [visual0=CON=concentric, visual1=ISO=pauseTop, visual2=ECC=eccentric, visual3=PAUSE=pauseBottom]
  const visualPhaseValues = [parsed.concentric, parsed.pauseTop, parsed.eccentric, parsed.pauseBottom]
  const phaseValue  = visualPhaseValues[currentPhase]
  const phaseIsX    = phaseValue === 'X'
  const phaseTotalS = phaseIsX ? 0.3 : (phaseValue as number)

  return (
    <AnimatePresence onExitComplete={onClose}>
      {!closing && (
        <motion.div
          key="tempo-guide"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-[#080808] z-[60] flex flex-col select-none touch-none"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2 shrink-0">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25 mb-0.5">
                Tempo guide
              </p>
              <p className="text-[15px] font-bold text-white leading-tight truncate max-w-[240px]">
                {exerciseName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/35 hover:text-white/70 hover:bg-white/[0.10] active:scale-95 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Countdown overlay ── */}
          <AnimatePresence>
            {countdown !== null && countdown > 0 && (
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none gap-2"
              >
                <span
                  className="font-mono font-black tabular-nums"
                  style={{ fontSize: 110, color: countdown <= 3 ? ACCENT : 'white', lineHeight: 1, textShadow: countdown <= 3 ? `0 0 60px rgba(255,184,0,0.6)` : 'none' }}
                >
                  {countdown}
                </span>
                {countdown <= 3 && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/30">
                    Positionnez-vous
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── GO flash ── */}
          <AnimatePresence>
            {countdown === 0 && (
              <motion.div
                key="go"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              >
                <span
                  className="font-mono font-black"
                  style={{ fontSize: 90, color: ACCENT, textShadow: `0 0 80px rgba(255,184,0,0.8)` }}
                >
                  GO
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SVG Circuit ── */}
          <div className="flex-1 flex items-center px-2 min-h-0">
            <svg
              viewBox="-5 10 410 165"
              preserveAspectRatio="xMidYMid meet"
              className="w-full"
              style={{ overflow: 'visible' }}
            >
              {/* Base track — single clean rail, no glow, no accent line */}
              <path
                d={PATH_D}
                fill="none"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="36"
                strokeLinecap="round"
              />
              {/* Invisible measurement path */}
              <path ref={pathRef} d={PATH_D} fill="none" stroke="none" />

              {/* Comet trail */}
              {Array.from({ length: TRAIL_LEN }).map((_, i) => (
                <circle
                  key={i}
                  ref={el => { if (el) trailRefs.current[i] = el }}
                  r="9"
                  fill="white"
                  opacity="0"
                />
              ))}

              {/* Diamond transition markers — NO filter (filter creates stacking context, puts ball under) */}
              {diamondPositions.map((pos, i) => (
                <polygon
                  key={i}
                  ref={el => { if (el) diamondRefs.current[i] = el }}
                  points="-7,0 0,-7 7,0 0,7"
                  fill={ACCENT}
                  opacity="0.55"
                  transform={`translate(${pos.x}, ${pos.y})`}
                />
              ))}

              {/* Ball glow halo */}
              <circle
                ref={ballGlowRef}
                r="22"
                fill={ACCENT}
                opacity="0.18"
              />

              {/* Ball — white with yellow glow, r managed by RAF */}
              <circle
                ref={ballRef}
                r="13"
                fill="white"
                style={{ filter: `drop-shadow(0 0 16px rgba(255,184,0,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))` }}
              />
            </svg>
          </div>

          {/* ── Phase label + live timer ── */}
          <div className="shrink-0 flex flex-col items-center px-6 pb-1" style={{ height: 72 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col items-center gap-0"
              >
                <span className="font-mono text-[13px] font-black uppercase tracking-[0.20em]" style={{ color: ACCENT }}>
                  {countdown !== null ? 'PRÊT' : PHASE_LABELS[currentPhase]}
                </span>
                {countdown === null && (
                  <span className="text-[9px] font-medium text-white/30 mt-0.5">
                    {PHASE_SUBLABELS[currentPhase]}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            {/* Live countdown timer — large, dominant */}
            {countdown === null && phaseTotalS > 0 && (
              <motion.span
                key={`timer-${currentPhase}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono font-black tabular-nums leading-none mt-0.5"
                style={{ fontSize: 34, color: ACCENT }}
              >
                {phaseIsX ? 'X' : `${phaseTimer}s`}
              </motion.span>
            )}
          </div>

          {/* ── Rep bars (Technogym style) ── */}
          <div className="shrink-0 px-6 pb-4">
            <div className="flex gap-[3px]" style={{ height: 38 }}>
              {Array.from({ length: reps }).map((_, i) => {
                const isDone    = i < currentRep
                const isCurrent = i === currentRep
                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-xl"
                    animate={{
                      backgroundColor: isDone || isCurrent ? ACCENT : 'rgba(255,255,255,0.10)',
                      boxShadow: isCurrent
                        ? `0 0 14px rgba(255,184,0,0.6), 0 0 4px rgba(255,184,0,0.9)`
                        : 'none',
                      scaleY: isCurrent ? [1, 1.06, 1] : 1,
                    }}
                    initial={false}
                    transition={{
                      backgroundColor: { duration: 0.25 },
                      boxShadow: { duration: 0.25 },
                      scaleY: { duration: 0.4, repeat: isCurrent ? Infinity : 0, repeatType: 'reverse' },
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* ── Rep counter ── */}
          <div className="shrink-0 flex justify-center items-baseline gap-1 pb-14">
            <span
              className="font-mono text-[36px] font-black leading-none tabular-nums"
              style={{ color: ACCENT }}
            >
              {currentRep + 1}
            </span>
            <span className="font-mono text-[22px] font-bold text-white/20 mx-1">/</span>
            <span className="font-mono text-[28px] font-black text-white/60 leading-none tabular-nums">
              {reps}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
