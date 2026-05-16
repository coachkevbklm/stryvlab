'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { parseTempo, type ParsedTempo } from '@/lib/training/tempo'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TempoCloseResult {
  plannedReps: number
  bonusReps: number
  totalReps: number
}

interface TempoGuideModalProps {
  tempo: string
  reps: number
  exerciseName: string
  prepSeconds: number
  hapticsEnabled: boolean
  onClose: (result: TempoCloseResult) => void
}

// ─── Geometry ────────────────────────────────────────────────────────────────
// Triangle fermé — viewBox 300×280
// CON  : C → A (montée gauche)
// ISO  : point A (sommet)
// ECC  : A → B (descente droite)
// PAUSE: B → C (retour horizontal bas)

const TRI_A = { x: 150, y: 40  }  // sommet ISO
const TRI_B = { x: 280, y: 240 }  // base droite fin ECC
const TRI_C = { x: 20,  y: 240 }  // base gauche fin PAUSE / début CON

const PATH_D = `M ${TRI_C.x} ${TRI_C.y} L ${TRI_A.x} ${TRI_A.y} L ${TRI_B.x} ${TRI_B.y} Z`

function lerpPt(p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }
}

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG = [
  { label: 'CONTRACTER', color: '#22c55e' },  // 0 CON
  { label: 'TENIR',      color: '#ef4444' },  // 1 ISO
  { label: 'FREINER',    color: '#f97316' },  // 2 ECC
  { label: 'PAUSE',      color: '#ef4444' },  // 3 PAUSE
] as const

// Accent for countdown / GO flash — kept separate from phase colors
const ACCENT_TEMPO = '#FFB800'

// Trail length
const TRAIL_LEN = 8

// ─── Landscape hook ───────────────────────────────────────────────────────────

function useIsLandscape(): boolean {
  const [landscape, setLandscape] = useState(false)
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return landscape
}

// ─── Haptic helper ────────────────────────────────────────────────────────────

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern) } catch { /* not supported */ }
}

// ─── Public wrapper — validates tempo ────────────────────────────────────────

export default function TempoGuideModal({
  tempo, reps, exerciseName, prepSeconds, hapticsEnabled, onClose,
}: TempoGuideModalProps) {
  const parsed = parseTempo(tempo)
  if (!parsed || reps <= 0) return null

  const ms = (p: typeof parsed.eccentric) => p === 'X' ? 300 : (p as number) * 1000
  const totalMs = ms(parsed.concentric) + ms(parsed.isometric ?? parsed.pauseTop) + ms(parsed.eccentric) + ms(parsed.pause ?? parsed.pauseBottom)
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

// ─── Inner component ──────────────────────────────────────────────────────────

function TempoGuideModalInner({
  parsed, reps, exerciseName, prepSeconds, hapticsEnabled, onClose,
}: {
  parsed: ParsedTempo
  reps: number
  exerciseName: string
  prepSeconds: number
  hapticsEnabled: boolean
  onClose: (result: TempoCloseResult) => void
}) {
  const isLandscape = useIsLandscape()
  const vib = useCallback((pattern: number | number[]) => {
    if (hapticsEnabled) vibrate(pattern)
  }, [hapticsEnabled])

  const ms = (p: typeof parsed.eccentric) => p === 'X' ? 300 : (p as number) * 1000
  const phaseDurations: number[] = useMemo(() => [
    ms(parsed.concentric),
    ms(parsed.isometric ?? parsed.pauseTop),
    ms(parsed.eccentric),
    ms(parsed.pause ?? parsed.pauseBottom),
  ], [parsed]) // eslint-disable-line react-hooks/exhaustive-deps
  const repDuration = phaseDurations.reduce((a, b) => a + b, 0)

  // ── React state ──
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentRep, setCurrentRep]     = useState(0)
  const [bonusReps, setBonusReps]       = useState(0)
  const [closing, setClosing]           = useState(false)
  const [closingResult, setClosingResult] = useState<TempoCloseResult | null>(null)
  const [countdown, setCountdown]       = useState<number | null>(prepSeconds > 0 ? prepSeconds : null)
  const [phaseTimer, setPhaseTimer]     = useState<number>(0)
  const [phaseColor, setPhaseColor]     = useState<string>(PHASE_CONFIG[0].color)

  // Anticipation
  const [isAnticipating, setIsAnticipating]   = useState(false)
  const [blinkOrange, setBlinkOrange]         = useState(false)
  const anticipationFiredRef                  = useRef(false)
  const isAnticipatingRef                     = useRef(false)

  // ── SVG DOM refs ──
  const ballRef         = useRef<SVGCircleElement>(null)
  const ballGlowRef     = useRef<SVGCircleElement>(null)
  const trailRefs       = useRef<SVGCircleElement[]>([])
  const peakDiamondRef  = useRef<SVGPolygonElement>(null)
  const baseRDiamondRef = useRef<SVGPolygonElement>(null)
  const baseLDiamondRef = useRef<SVGPolygonElement>(null)

  // ── RAF mutable refs ──
  const rafRef       = useRef<number>(0)
  const startRef     = useRef<number | null>(null)
  const repRef       = useRef(0)
  const bonusRepsRef = useRef(0)
  const lastPhaseRef = useRef(-1)

  // ── Countdown tick ──
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => (c !== null && c > 0 ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Position ball at start during prep ──
  useEffect(() => {
    if (!ballRef.current || !ballGlowRef.current) return
    if (countdown === null) return
    const pos = TRI_C
    ballRef.current.setAttribute('cx', String(pos.x))
    ballRef.current.setAttribute('cy', String(pos.y))
    ballRef.current.setAttribute('opacity', countdown <= 3 ? '1' : '0.4')
    ballRef.current.setAttribute('fill', 'white')
    ballRef.current.setAttribute('r', '18')
    ballGlowRef.current.setAttribute('cx', String(pos.x))
    ballGlowRef.current.setAttribute('cy', String(pos.y))
    ballGlowRef.current.setAttribute('opacity', countdown <= 3 ? '0.25' : '0.08')
  }, [countdown])

  // ── Blink effect for anticipation ──
  useEffect(() => {
    if (!isAnticipating) { setBlinkOrange(false); return }
    let count = 0
    const iv = setInterval(() => {
      setBlinkOrange(prev => !prev)
      count++
      if (count >= 4) clearInterval(iv)
    }, 125)
    return () => clearInterval(iv)
  }, [isAnticipating])

  // ── Manual close ──
  const handleClose = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const result: TempoCloseResult = {
      plannedReps: reps,
      bonusReps: bonusRepsRef.current,
      totalReps: reps + bonusRepsRef.current,
    }
    setClosingResult(result)
    setClosing(true)
  }, [reps])

  // ── RAF Loop ──
  const tick = useCallback((now: number) => {
    if (!ballRef.current || !ballGlowRef.current) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    if (startRef.current === null) startRef.current = now
    const elapsed = now - startRef.current

    // Rep index — no cap (bonus reps continue past props.reps)
    const repIndex = Math.floor(elapsed / repDuration)
    const isBonus = repIndex >= reps

    if (repIndex !== repRef.current) {
      repRef.current = repIndex
      setCurrentRep(repIndex)
      if (isBonus) {
        bonusRepsRef.current = repIndex - reps + 1
        setBonusReps(bonusRepsRef.current)
      }
      if (repIndex > 0) vib([60, 30, 60])
    }

    // Time within current rep
    const tRep = elapsed % repDuration

    // Determine phase and time-within-phase
    let cumMs = 0
    let phase = 3
    let tInPhaseMs = 0
    for (let i = 0; i < 4; i++) {
      const d = phaseDurations[i]
      if (d > 0 && tRep < cumMs + d) {
        phase = i
        tInPhaseMs = tRep - cumMs
        break
      }
      cumMs += d
      phase = i
      tInPhaseMs = phaseDurations[i]
    }

    // Phase change
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase
      setCurrentPhase(phase)
      setPhaseColor(PHASE_CONFIG[phase].color)
      isAnticipatingRef.current = false
      setIsAnticipating(false)
      anticipationFiredRef.current = false
      if (phase === 0) vib(80)
      else if (phase === 1) vib(40)
      else if (phase === 2) vib(40)
      else if (phase === 3) vib(30)
    }

    // Phase timer
    const phaseMs = phaseDurations[phase]
    if (phaseMs > 0) {
      const remaining = Math.ceil((phaseMs - tInPhaseMs) / 1000)
      setPhaseTimer(Math.max(remaining, 0))
    }

    const tInPhaseFrac = phaseMs > 0 ? Math.min(tInPhaseMs / phaseMs, 1) : 1

    // ── Anticipation isométrique ──
    const nextPhaseIsIso = (phase === 0 && phaseDurations[1] > 0)
                        || (phase === 3 && phaseDurations[1] > 0)
    const phaseDurSec = phaseMs / 1000
    const anticipationThreshold = phaseDurSec > 0.8 ? 1 - (0.8 / phaseDurSec) : 0
    const shouldAnticipate = nextPhaseIsIso && tInPhaseFrac >= anticipationThreshold

    if (shouldAnticipate && !anticipationFiredRef.current) {
      anticipationFiredRef.current = true
      isAnticipatingRef.current = true
      setIsAnticipating(true)
      if (hapticsEnabled) {
        try { navigator.vibrate(10) } catch { /* not supported */ }
      }
    }
    if (!shouldAnticipate && anticipationFiredRef.current && phase === lastPhaseRef.current) {
      // reset only if still in same phase (not handled by phase-change block)
    }

    // ── Ball position ──
    let ballPos: { x: number; y: number }

    if (phase === 0) {
      const easedNormal = tInPhaseFrac * (2 - tInPhaseFrac)
      const easedDecel  = Math.min(tInPhaseFrac * (2 - tInPhaseFrac * 0.3), 1)
      const eased = isAnticipatingRef.current ? easedDecel : easedNormal
      ballPos = lerpPt(TRI_C, TRI_A, Math.min(eased, 1))
    } else if (phase === 1) {
      ballPos = TRI_A
    } else if (phase === 2) {
      const eased = tInPhaseFrac * tInPhaseFrac
      ballPos = lerpPt(TRI_A, TRI_B, eased)
    } else {
      ballPos = lerpPt(TRI_B, TRI_C, tInPhaseFrac)
    }

    ballRef.current.setAttribute('cx', String(ballPos.x))
    ballRef.current.setAttribute('cy', String(ballPos.y))
    ballGlowRef.current.setAttribute('cx', String(ballPos.x))
    ballGlowRef.current.setAttribute('cy', String(ballPos.y))

    // ── Ball appearance ──
    const currentColor = PHASE_CONFIG[phase].color
    const isStaticPhase = (phase === 1 || phase === 3) && phaseDurations[phase] > 200

    ballRef.current.setAttribute('fill', currentColor)
    ballRef.current.style.filter = `drop-shadow(0 0 18px ${currentColor}99) drop-shadow(0 0 6px ${currentColor}cc)`
    ballGlowRef.current.setAttribute('fill', currentColor)

    if (isStaticPhase) {
      const r = 18 + tInPhaseFrac * 4
      ballRef.current.setAttribute('r', String(r))
      ballGlowRef.current.setAttribute('r', String(28 + tInPhaseFrac * 8))
      ballGlowRef.current.setAttribute('opacity', String(0.20 + tInPhaseFrac * 0.22))
    } else {
      ballRef.current.setAttribute('r', '18')
      ballGlowRef.current.setAttribute('r', '28')
      ballGlowRef.current.setAttribute('opacity', '0.18')
    }

    // ── Trail ──
    const trail = trailRefs.current
    if (!isStaticPhase) {
      for (let i = TRAIL_LEN - 1; i > 0; i--) {
        const prev = trail[i - 1]
        if (prev) {
          trail[i]?.setAttribute('cx', prev.getAttribute('cx') ?? '0')
          trail[i]?.setAttribute('cy', prev.getAttribute('cy') ?? '0')
        }
      }
      trail[0]?.setAttribute('cx', String(ballPos.x))
      trail[0]?.setAttribute('cy', String(ballPos.y))
      trail.forEach((el, i) => {
        if (!el) return
        el.setAttribute('fill', currentColor)
        el.setAttribute('opacity', String(((TRAIL_LEN - i) / TRAIL_LEN) * 0.25))
        el.setAttribute('r', String(Math.max(14 - i * 1.3, 2)))
      })
    } else {
      trail.forEach(el => el?.setAttribute('opacity', '0'))
    }

    // ── Diamond markers ──
    const nearA = phase === 1 || (phase === 0 && tInPhaseFrac > 0.85) || (phase === 2 && tInPhaseFrac < 0.1)
    const nearB = phase === 3 || (phase === 2 && tInPhaseFrac > 0.85)
    const nearC = phase === 0 && tInPhaseFrac < 0.1

    if (peakDiamondRef.current) {
      peakDiamondRef.current.setAttribute('opacity', nearA ? '1.0' : '0.55')
      const scale = nearA ? 1.8 : 1.0
      peakDiamondRef.current.setAttribute('transform', `translate(${TRI_A.x}, ${TRI_A.y}) scale(${scale})`)
    }
    if (baseRDiamondRef.current) {
      baseRDiamondRef.current.setAttribute('opacity', nearB ? '1.0' : '0.40')
      const scale = nearB ? 1.8 : 1.0
      baseRDiamondRef.current.setAttribute('transform', `translate(${TRI_B.x}, ${TRI_B.y}) scale(${scale})`)
    }
    if (baseLDiamondRef.current) {
      baseLDiamondRef.current.setAttribute('opacity', nearC ? '1.0' : '0.40')
      const scale = nearC ? 1.8 : 1.0
      baseLDiamondRef.current.setAttribute('transform', `translate(${TRI_C.x}, ${TRI_C.y}) scale(${scale})`)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [reps, repDuration, phaseDurations, vib, hapticsEnabled])

  useEffect(() => {
    if (countdown !== null) return
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, countdown])

  // ── Derived label values ──
  const visualPhaseValues = [
    parsed.concentric,
    parsed.isometric ?? parsed.pauseTop,
    parsed.eccentric,
    parsed.pause ?? parsed.pauseBottom,
  ]
  const phaseValue  = visualPhaseValues[currentPhase]
  const phaseIsX    = phaseValue === 'X'
  const phaseTotalS = phaseIsX ? 0.3 : (phaseValue as number)

  // Anticipation color for label
  const anticipationColor = blinkOrange ? '#f97316' : '#ef4444'
  const labelColor = isAnticipating ? anticipationColor : phaseColor

  // ── SVG section ──
  const svgEl = (
    <svg
      viewBox="0 0 300 280"
      preserveAspectRatio="xMidYMid meet"
      className={isLandscape ? 'h-[80vh] w-auto' : 'w-full'}
      style={{ overflow: 'visible' }}
    >
      {/* Triangle track */}
      <path
        d={PATH_D}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="36"
        strokeLinejoin="round"
      />

      {/* Comet trail */}
      {Array.from({ length: TRAIL_LEN }).map((_, i) => (
        <circle
          key={i}
          ref={el => { if (el) trailRefs.current[i] = el }}
          r="12"
          fill="white"
          opacity="0"
        />
      ))}

      {/* Diamond at ISO peak (A) */}
      <polygon
        ref={peakDiamondRef}
        points="-8,0 0,-8 8,0 0,8"
        fill={ACCENT_TEMPO}
        opacity="0.55"
        transform={`translate(${TRI_A.x}, ${TRI_A.y})`}
      />

      {/* Diamond at base right (B) */}
      <polygon
        ref={baseRDiamondRef}
        points="-8,0 0,-8 8,0 0,8"
        fill={ACCENT_TEMPO}
        opacity="0.40"
        transform={`translate(${TRI_B.x}, ${TRI_B.y})`}
      />

      {/* Diamond at base left (C) */}
      <polygon
        ref={baseLDiamondRef}
        points="-8,0 0,-8 8,0 0,8"
        fill={ACCENT_TEMPO}
        opacity="0.40"
        transform={`translate(${TRI_C.x}, ${TRI_C.y})`}
      />

      {/* Ball glow */}
      <circle ref={ballGlowRef} r="28" fill={ACCENT_TEMPO} opacity="0.18" />

      {/* Ball */}
      <circle
        ref={ballRef}
        r="18"
        fill="white"
        style={{ filter: `drop-shadow(0 0 18px ${ACCENT_TEMPO}99) drop-shadow(0 0 6px white)` }}
      />
    </svg>
  )

  // ── Phase label + timer ──
  const phaseLabelEl = (
    <div className={`flex flex-col ${isLandscape ? 'items-start' : 'items-center'} gap-1`}>
      <span
        className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-2xl transition-colors duration-150"
        style={{ color: countdown !== null ? ACCENT_TEMPO : labelColor }}
      >
        {countdown !== null ? 'PRÊT' : PHASE_CONFIG[currentPhase].label}
      </span>
      {countdown === null && phaseTotalS > 0 && (
        <motion.span
          key={`timer-${currentPhase}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono font-black tabular-nums leading-none"
          style={{ fontSize: 44, color: labelColor }}
        >
          {phaseIsX ? 'X' : `${phaseTimer}s`}
        </motion.span>
      )}
    </div>
  )

  // ── Rep bars ──
  const repBarsEl = (
    <div
      className={isLandscape ? 'flex flex-col gap-[3px]' : 'flex flex-row gap-[3px] px-6'}
      style={isLandscape ? { width: 38 } : { height: 38 }}
    >
      {Array.from({ length: reps + bonusReps }).map((_, i) => {
        const isBonus   = i >= reps
        const isDone    = i < currentRep
        const isCurrent = i === currentRep
        return (
          <motion.div
            key={i}
            className={isLandscape ? 'rounded-xl' : 'flex-1 rounded-xl'}
            style={isLandscape ? { height: 24, minWidth: 38 } : {}}
            animate={{
              backgroundColor: isBonus
                ? (isDone || isCurrent ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.08)')
                : (isDone || isCurrent ? '#ffe01e' : 'rgba(255,255,255,0.10)'),
              boxShadow: isCurrent && !isBonus
                ? '0 0 14px rgba(255,224,30,0.6), 0 0 4px rgba(255,224,30,0.9)'
                : isCurrent && isBonus
                  ? '0 0 10px rgba(255,255,255,0.2)'
                  : 'none',
              scaleY: !isLandscape && isCurrent ? [1, 1.06, 1] : 1,
            }}
            initial={false}
            transition={{
              backgroundColor: { duration: 0.25 },
              boxShadow: { duration: 0.25 },
              scaleY: { duration: 0.4, repeat: isCurrent && !isLandscape ? Infinity : 0, repeatType: 'reverse' },
            }}
          />
        )
      })}
    </div>
  )

  // ── Rep counter ──
  const repCounterEl = (
    <div className={`flex items-baseline gap-1 ${isLandscape ? '' : 'justify-center'}`}>
      <span
        className="font-mono text-[36px] font-black leading-none tabular-nums"
        style={{ color: currentRep >= reps ? 'rgba(255,255,255,0.6)' : '#ffe01e' }}
      >
        {currentRep + 1}
      </span>
      <span className="font-mono text-[22px] font-bold text-white/20 mx-1">/</span>
      <span className="font-mono text-[28px] font-black text-white/60 leading-none tabular-nums">
        {reps}
      </span>
      {bonusReps > 0 && (
        <span className="font-mono text-[16px] font-bold text-white/30 ml-1">
          +{bonusReps}
        </span>
      )}
    </div>
  )

  return (
    <AnimatePresence onExitComplete={() => onClose(closingResult ?? { plannedReps: reps, bonusReps: 0, totalReps: reps })}>
      {!closing && (
        <motion.div
          key="tempo-guide"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-[#080808] z-[60] select-none touch-none"
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
                initial={{ opacity: 0, scale: 1.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none gap-2"
              >
                <span
                  className="font-mono font-black tabular-nums"
                  style={{ fontSize: 110, color: countdown <= 3 ? ACCENT_TEMPO : 'white', lineHeight: 1, textShadow: countdown <= 3 ? `0 0 60px rgba(255,184,0,0.6)` : 'none' }}
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
                <span className="font-mono font-black" style={{ fontSize: 90, color: ACCENT_TEMPO, textShadow: `0 0 80px rgba(255,184,0,0.8)` }}>
                  GO
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Corps principal ── */}
          {isLandscape ? (
            /* Landscape — split horizontal */
            <div className="flex flex-row items-center h-full pt-16 px-4 gap-6">
              {/* Triangle — colonne gauche */}
              <div className="flex items-center justify-center w-[45vw] h-full">
                {svgEl}
              </div>
              {/* Contrôles — colonne droite */}
              <div className="flex flex-col justify-center gap-4 w-[45vw] pb-4">
                {phaseLabelEl}
                {repBarsEl}
                {repCounterEl}
                <button
                  onClick={handleClose}
                  className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/40 hover:text-white/70 transition-all text-[12px] font-medium"
                >
                  <X size={14} /> Terminer
                </button>
              </div>
            </div>
          ) : (
            /* Portrait — colonne verticale */
            <div className="flex flex-col items-center h-full pt-2">
              {/* SVG Triangle */}
              <div className="flex-1 flex items-center w-full px-4 min-h-0">
                {svgEl}
              </div>

              {/* Phase label + timer */}
              <div className="shrink-0 flex flex-col items-center px-6 pt-3 pb-2" style={{ minHeight: 80 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    {phaseLabelEl}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Rep bars */}
              <div className="shrink-0 w-full pb-3">
                {repBarsEl}
              </div>

              {/* Rep counter */}
              <div className="shrink-0 pb-14">
                {repCounterEl}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
