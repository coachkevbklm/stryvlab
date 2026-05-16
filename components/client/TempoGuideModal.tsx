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
  onClose: () => void    // called on manual close OR end of last rep
}

// Phase names in French
const PHASE_LABELS = ['DESCENTE', 'PAUSE BAS', 'MONTÉE', 'PAUSE HAUT'] as const
const ACCENT = '#FFB800'

// ─── SVG Path definition ─────────────────────────────────────────────────────
// Sinusoidal path crossing full width. 4 phases correspond to positions:
//   0.0  → start ECC (top-left)
//   0.25 → ECC→PB transition (bottom)
//   0.50 → PB→CON transition (bottom)
//   0.75 → CON→PH transition (top)
//   1.0  → end PH (top-right) = wrap to next rep
//
// Drawn in a 400×180 viewBox. Control points tuned to Technogym S-curve.
const PATH_D = 'M 0,45 C 40,45 60,155 100,155 C 140,155 160,45 200,45 C 240,45 260,155 300,155 C 340,155 360,45 400,45'

// Normalised t-values for each phase boundary on the path (0→1)
const PHASE_START = [0, 0.25, 0.50, 0.75]
const PHASE_END   = [0.25, 0.50, 0.75, 1.00]

// Easing functions — tuned for biomechanical fidelity
// ECC: easeIn  — slow start under load, accelerates (gravity + muscle lengthening)
// PB:  linear  — static pause
// CON: easeOut — explosive start, decelerates at top (peak contraction)
// PH:  linear  — static pause at top
function easeIn(t: number): number {
  return t * t
}
function easeOut(t: number): number {
  return t * (2 - t)
}
function linear(t: number): number {
  return t
}
const PHASE_EASING = [easeIn, linear, easeOut, linear]

// ─── Haptic helper ───────────────────────────────────────────────────────────
function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern) } catch { /* not supported */ }
}

// ─── Public component — validates tempo before rendering inner ────────────────

export default function TempoGuideModal({
  tempo, reps, exerciseName, onClose,
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
      onClose={onClose}
    />
  )
}

// ─── Inner component — receives validated parsed tempo ────────────────────────

function TempoGuideModalInner({
  parsed, reps, exerciseName, onClose,
}: {
  parsed: ParsedTempo
  reps: number
  exerciseName: string
  onClose: () => void
}) {
  // Phase durations in ms. "X" = 300ms (explosive flash). 0 = instant (skip).
  const phaseDurations: number[] = [
    parsed.eccentric   === 'X' ? 300 : (parsed.eccentric   as number) * 1000,
    parsed.pauseBottom === 'X' ? 300 : (parsed.pauseBottom as number) * 1000,
    parsed.concentric  === 'X' ? 300 : (parsed.concentric  as number) * 1000,
    parsed.pauseTop    === 'X' ? 300 : (parsed.pauseTop    as number) * 1000,
  ]
  const repDuration = phaseDurations.reduce((a, b) => a + b, 0)

  // React state — only updated on phase/rep changes, never in the RAF hot path
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentRep, setCurrentRep]     = useState(0)
  const [done, setDone]                 = useState(false)
  const [closing, setClosing]           = useState(false)
  // Countdown 3→2→1→GO before RAF starts
  const [countdown, setCountdown]       = useState<number | null>(3)
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
    setDiamondPositions([0.25, 0.50, 0.75].map(t => pathRef.current!.getPointAtLength(t * len)))
  }, [])

  // ── Countdown 3→2→1→null (then RAF starts) ──
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      return
    }
    const t = setTimeout(() => setCountdown(c => (c !== null && c > 0 ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
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
      vibrate([100, 40, 100, 40, 100])
      setDone(true)
      return
    }

    // Rep change → haptic + update bar
    if (repIndex !== repRef.current) {
      repRef.current = repIndex
      setCurrentRep(repIndex)
      if (repIndex > 0) vibrate([70, 30, 70])
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
      if (phase === 1) vibrate(40)       // ECC→PB
      else if (phase === 2) vibrate(70)  // PB→CON (start of movement — stronger)
      else if (phase === 3) vibrate(40)  // CON→PH
    }

    // Update phase countdown timer (seconds remaining in current phase)
    // X phase = 0.3s displayed as "X", 0s phase skipped
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

    // Move ball (DOM mutation — no React state)
    ballRef.current.setAttribute('cx', String(pt.x))
    ballRef.current.setAttribute('cy', String(pt.y))
    ballGlowRef.current.setAttribute('cx', String(pt.x))
    ballGlowRef.current.setAttribute('cy', String(pt.y))

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
      el.setAttribute('r', String(Math.max(9 - i * 0.85, 1)))
    })

    // Diamond pulse: scale up when ball is within 0.04 of transition point
    const transitionPts = [0.25, 0.50, 0.75]
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

  // ── Derived label values ──
  const phaseValue = [parsed.eccentric, parsed.pauseBottom, parsed.concentric, parsed.pauseTop][currentPhase]
  const phaseIsX   = phaseValue === 'X'
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
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              >
                <span
                  className="font-mono font-black tabular-nums"
                  style={{ fontSize: 120, color: ACCENT, lineHeight: 1, textShadow: `0 0 60px rgba(255,184,0,0.5)` }}
                >
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SVG Circuit ── */}
          <div className="flex-1 flex items-center px-2 min-h-0">
            <svg
              viewBox="0 0 400 200"
              preserveAspectRatio="xMidYMid meet"
              className="w-full"
              style={{ overflow: 'visible' }}
            >
              {/* Outer glow track — wide, very transparent */}
              <path
                d={PATH_D}
                fill="none"
                stroke="rgba(255,184,0,0.07)"
                strokeWidth="48"
                strokeLinecap="round"
              />
              {/* Base track — dark rail */}
              <path
                d={PATH_D}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="28"
                strokeLinecap="round"
              />
              {/* Inner accent line — subtle yellow tint on rail center */}
              <path
                d={PATH_D}
                fill="none"
                stroke="rgba(255,184,0,0.12)"
                strokeWidth="4"
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

              {/* Diamond transition markers — rendered after diamondPositions computed */}
              {diamondPositions.map((pos, i) => (
                <polygon
                  key={i}
                  ref={el => { if (el) diamondRefs.current[i] = el }}
                  points="-7,0 0,-7 7,0 0,7"
                  fill={ACCENT}
                  opacity="0.55"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ filter: `drop-shadow(0 0 8px ${ACCENT})` }}
                />
              ))}

              {/* Ball glow halo */}
              <circle
                ref={ballGlowRef}
                r="22"
                fill={ACCENT}
                opacity="0.18"
              />

              {/* Ball — white with yellow glow */}
              <circle
                ref={ballRef}
                r="11"
                fill="white"
                style={{ filter: `drop-shadow(0 0 16px rgba(255,184,0,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))` }}
              />
            </svg>
          </div>

          {/* ── Phase label + live timer ── */}
          <div className="shrink-0 flex flex-col items-center px-6 pb-2" style={{ height: 60 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.13 }}
                className="flex items-baseline gap-2.5"
              >
                <span className="font-mono text-[13px] font-bold uppercase tracking-[0.22em] text-white/80">
                  {countdown !== null ? 'PRÊT...' : PHASE_LABELS[currentPhase]}
                </span>
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
                    className="flex-1 rounded-[2px]"
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
