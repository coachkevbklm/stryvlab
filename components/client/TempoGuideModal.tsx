'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

// ─── Double-wave path ─────────────────────────────────────────────────────────
// viewBox 400×160 — 2 bosses visibles simultanément
// Balle avance toujours de gauche à droite (jamais de retour arrière)
// 1 rep = 1 bosse complète (creux→pic→creux), x progresse de 0 à 200
//
// Path : sinusoïde bézier — 3 bosses définies pour que la balle reste toujours
// dans le viewport quelle que soit sa position dans la rep.
//
//   x=0,y=140  creux gauche (hors écran gauche)
//   x=100,y=20  pic 1
//   x=200,y=140 creux centre
//   x=300,y=20  pic 2
//   x=400,y=140 creux droite (hors écran droit)
//
// La balle est positionnée sur ce path via getPointAtLength.
// On décale le viewBox horizontalement selon la progression dans la rep
// pour donner l'illusion de mouvement continu.

const WAVE_W = 400   // largeur d'une période (1 rep)
const WAVE_H = 160   // hauteur viewBox
const WAVE_PEAK_Y  = 20   // y des pics (ISO)
const WAVE_TROUGH_Y = 140 // y des creux (PAUSE/début CON)

// Path avec 3 bosses (largeur totale = 3 × WAVE_W = 1200)
// Chaque bosse : creux → pic → creux via béziers symétriques
function buildWavePath(): string {
  const segs: string[] = []
  segs.push(`M 0,${WAVE_TROUGH_Y}`)
  for (let i = 0; i < 3; i++) {
    const x0 = i * WAVE_W
    const xPeak = x0 + WAVE_W / 2
    const x1 = x0 + WAVE_W
    // montée : creux → pic
    segs.push(`C ${x0 + WAVE_W * 0.25},${WAVE_TROUGH_Y} ${x0 + WAVE_W * 0.25},${WAVE_PEAK_Y} ${xPeak},${WAVE_PEAK_Y}`)
    // descente : pic → creux
    segs.push(`C ${xPeak + WAVE_W * 0.25},${WAVE_PEAK_Y} ${xPeak + WAVE_W * 0.25},${WAVE_TROUGH_Y} ${x1},${WAVE_TROUGH_Y}`)
  }
  return segs.join(' ')
}

const WAVE_PATH_D = buildWavePath()
// Longueur totale du path (3 bosses × longueur d'une bosse)
// Longueur analytique approx d'une bosse sinusoïdale avec ces béziers ≈ 470px
// Calculé dynamiquement via pathRef.getTotalLength() au premier frame.

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG = [
  { label: 'CONTRACTER', color: '#22c55e' },  // 0 CON
  { label: 'TENIR',      color: '#ef4444' },  // 1 ISO
  { label: 'FREINER',    color: '#f97316' },  // 2 ECC
  { label: 'PAUSE',      color: '#ef4444' },  // 3 PAUSE
] as const

const ACCENT_TEMPO = '#FFB800'
const TRAIL_LEN = 6

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

// ─── Public wrapper ───────────────────────────────────────────────────────────

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
  const phaseDurations = useMemo<number[]>(() => [
    ms(parsed.concentric),
    ms(parsed.isometric ?? parsed.pauseTop),
    ms(parsed.eccentric),
    ms(parsed.pause ?? parsed.pauseBottom),
  ], [parsed]) // eslint-disable-line react-hooks/exhaustive-deps
  const repDuration = phaseDurations.reduce((a, b) => a + b, 0)

  // ── React state (barres reps uniquement — label piloté via DOM refs) ──
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentRep,   setCurrentRep]   = useState(0)
  const [bonusReps,    setBonusReps]     = useState(0)
  const [closing,      setClosing]       = useState(false)
  const [closingResult, setClosingResult] = useState<TempoCloseResult | null>(null)
  const [countdown,    setCountdown]     = useState<number | null>(prepSeconds > 0 ? prepSeconds : null)
  const [phaseTimer,   setPhaseTimer]    = useState<number>(0)
  const [phaseColor,   setPhaseColor]    = useState<string>(PHASE_CONFIG[0].color)

  // Anticipation
  const [isAnticipating, setIsAnticipating] = useState(false)
  const anticipationFiredRef = useRef(false)
  const isAnticipatingRef    = useRef(false)

  // ── SVG DOM refs ──
  const pathRef      = useRef<SVGPathElement>(null)  // pour getTotalLength
  const ballRef      = useRef<SVGCircleElement>(null)
  const ballGlowRef  = useRef<SVGCircleElement>(null)
  const trailRefs    = useRef<SVGCircleElement[]>([])
  const svgRef       = useRef<SVGSVGElement>(null)   // pour animer le viewBox

  // ── Label DOM refs — mis à jour directement dans RAF (zéro latence React) ──
  const phaseLabelRef = useRef<HTMLSpanElement>(null)
  const phaseTimerRef = useRef<HTMLSpanElement>(null)

  // ── RAF mutable refs ──
  const rafRef        = useRef<number>(0)
  const startRef      = useRef<number | null>(null)
  const repRef        = useRef(0)
  const bonusRepsRef  = useRef(0)
  const lastPhaseRef  = useRef(-1)
  const pathLenRef    = useRef<number>(0)    // longueur totale du path (3 bosses)
  const repLenRef     = useRef<number>(0)    // longueur d'une bosse (1 rep)

  // ── Countdown ──
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { setCountdown(null); return }
    const t = setTimeout(() => setCountdown(c => (c !== null && c > 0 ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Init path lengths au premier mount ──
  useEffect(() => {
    if (!pathRef.current) return
    const total = pathRef.current.getTotalLength()
    pathLenRef.current = total
    repLenRef.current  = total / 3  // 3 bosses dans le path
  }, [])

  // ── Position balle pendant prep ──
  useEffect(() => {
    if (!ballRef.current || !ballGlowRef.current || !pathRef.current) return
    if (countdown === null) return
    // Position initiale = début de la bosse 2 (centre du path)
    const startLen = repLenRef.current || pathLenRef.current / 3
    const pt = pathRef.current.getPointAtLength(startLen)
    ballRef.current.setAttribute('cx', String(pt.x))
    ballRef.current.setAttribute('cy', String(pt.y))
    ballRef.current.setAttribute('fill', 'white')
    ballRef.current.setAttribute('r', '14')
    ballGlowRef.current.setAttribute('cx', String(pt.x))
    ballGlowRef.current.setAttribute('cy', String(pt.y))
  }, [countdown])

  // ── Close handler ──
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
    if (!ballRef.current || !ballGlowRef.current || !pathRef.current || !svgRef.current) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Init path lengths si pas encore fait
    if (pathLenRef.current === 0) {
      const total = pathRef.current.getTotalLength()
      pathLenRef.current = total
      repLenRef.current  = total / 3
    }

    if (startRef.current === null) startRef.current = now
    const elapsed = now - startRef.current

    const repIndex = Math.floor(elapsed / repDuration)
    const isBonus  = repIndex >= reps

    if (repIndex !== repRef.current) {
      repRef.current = repIndex
      setCurrentRep(repIndex)
      if (isBonus) {
        bonusRepsRef.current = repIndex - reps + 1
        setBonusReps(bonusRepsRef.current)
      }
      if (repIndex > 0) vib([60, 30, 60])
    }

    const tRep = elapsed % repDuration

    // Déterminer phase et temps dans la phase
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

    const phaseMs     = phaseDurations[phase]
    const tInPhaseFrac = phaseMs > 0 ? Math.min(tInPhaseMs / phaseMs, 1) : 1

    // ── Phase change — DOM direct ──
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase
      setCurrentPhase(phase)
      const cfg = PHASE_CONFIG[phase]
      if (phaseLabelRef.current) {
        phaseLabelRef.current.textContent = cfg.label
        phaseLabelRef.current.style.color  = cfg.color
      }
      if (phaseTimerRef.current) {
        phaseTimerRef.current.style.color = cfg.color
      }
      setPhaseColor(cfg.color)
      isAnticipatingRef.current  = false
      setIsAnticipating(false)
      anticipationFiredRef.current = false
      if (phase === 0) vib(80)
      else if (phase === 1) vib(40)
      else if (phase === 2) vib(40)
      else if (phase === 3) vib(30)
    }

    // ── Phase timer — DOM direct ──
    if (phaseMs > 0) {
      const remaining = Math.ceil((phaseMs - tInPhaseMs) / 1000)
      const timerVal  = Math.max(remaining, 0)
      setPhaseTimer(timerVal)
      if (phaseTimerRef.current) {
        phaseTimerRef.current.textContent = `${timerVal}s`
        phaseTimerRef.current.style.color  = PHASE_CONFIG[phase].color
      }
    }

    // ── Anticipation isométrique ──
    const nextPhaseIsIso  = (phase === 0 && phaseDurations[1] > 0) || (phase === 3 && phaseDurations[1] > 0)
    const phaseDurSec     = phaseMs / 1000
    const anticipationThreshold = phaseDurSec > 0.8 ? 1 - (0.8 / phaseDurSec) : 0
    const shouldAnticipate = nextPhaseIsIso && tInPhaseFrac >= anticipationThreshold

    if (shouldAnticipate && !anticipationFiredRef.current) {
      anticipationFiredRef.current = true
      isAnticipatingRef.current    = true
      setIsAnticipating(true)
      if (hapticsEnabled) { try { navigator.vibrate(10) } catch { /* */ } }
      // Blink label DOM direct
      let blinkCount = 0
      const blinkIv = setInterval(() => {
        if (!phaseLabelRef.current) { clearInterval(blinkIv); return }
        phaseLabelRef.current.style.color = blinkCount % 2 === 0 ? '#f97316' : '#ef4444'
        blinkCount++
        if (blinkCount >= 4) clearInterval(blinkIv)
      }, 125)
    }

    // ── Position balle sur la double courbe ──
    // Stratégie : la balle est toujours sur la bosse centrale du path (bosse 2 sur 3).
    // On calcule la progression dans la rep (0→1) et on la mappe sur la longueur d'une bosse.
    // Le viewBox SVG est décalé horizontalement pour donner l'illusion de mouvement continu.

    const repLen = repLenRef.current
    if (repLen === 0) { rafRef.current = requestAnimationFrame(tick); return }

    // Progression 0→1 dans la rep courante en tenant compte de l'easing par phase
    let repFrac: number
    // Chaque phase occupe une fraction de la bosse
    // CON : 0 → 0.5 (montée), ISO : 0.5 (pic), ECC : 0.5 → 1 (descente), PAUSE : 1 (creux)
    const conDur   = phaseDurations[0]
    const isoDur   = phaseDurations[1]
    const eccDur   = phaseDurations[2]
    const pauseDur = phaseDurations[3]
    const totalDur = conDur + isoDur + eccDur + pauseDur

    // Fraction temporelle dans la rep complète (0→1)
    const timeFrac = Math.min(tRep / totalDur, 1)

    // Mapper timeFrac → position sur la bosse (0=creux gauche, 0.5=pic, 1=creux droite)
    // CON  : 0 → 0.5 linéairement (montée)
    // ISO  : freeze à 0.5
    // ECC  : 0.5 → 1 linéairement (descente)
    // PAUSE: freeze à 1 (= 0 du prochain cycle)
    const conFrac   = totalDur > 0 ? conDur / totalDur : 0.25
    const isoFrac   = totalDur > 0 ? isoDur / totalDur : 0
    const eccFrac   = totalDur > 0 ? eccDur / totalDur : 0.25
    // pauseFrac = 1 - conFrac - isoFrac - eccFrac

    if (timeFrac <= conFrac) {
      // CON phase : 0 → 0.5 sur la bosse, ease-out quad
      const t = conFrac > 0 ? timeFrac / conFrac : 1
      const eased = isAnticipatingRef.current
        ? Math.min(t * (2 - t * 0.3), 1)  // décélération anticipation
        : t * (2 - t)                       // ease-out normal
      repFrac = eased * 0.5
    } else if (timeFrac <= conFrac + isoFrac) {
      // ISO phase : freeze au pic
      repFrac = 0.5
    } else if (timeFrac <= conFrac + isoFrac + eccFrac) {
      // ECC phase : 0.5 → 1, ease-in quad
      const t = eccFrac > 0 ? (timeFrac - conFrac - isoFrac) / eccFrac : 1
      repFrac = 0.5 + (t * t) * 0.5
    } else {
      // PAUSE phase : freeze au creux
      repFrac = 1.0
    }

    // Position sur la bosse centrale (bosse index 1, de repLen à 2×repLen)
    const pathPos = repLen + repFrac * repLen
    const pt = pathRef.current.getPointAtLength(pathPos)

    // Décalage viewBox : centrer la balle horizontalement
    // La balle est à pt.x dans le path (coordonnées du path complet 0→1200)
    // On veut que la balle soit toujours au centre du SVG affiché (WAVE_W/2 = 200)
    const viewBoxX = pt.x - WAVE_W / 2
    svgRef.current.setAttribute('viewBox', `${viewBoxX} 0 ${WAVE_W} ${WAVE_H}`)

    // La balle est toujours au centre horizontal dans le viewBox mouvant
    ballRef.current.setAttribute('cx', String(pt.x))
    ballRef.current.setAttribute('cy', String(pt.y))
    ballGlowRef.current.setAttribute('cx', String(pt.x))
    ballGlowRef.current.setAttribute('cy', String(pt.y))

    // ── Ball appearance ──
    const currentColor  = PHASE_CONFIG[phase].color
    const isStaticPhase = (phase === 1 || phase === 3) && phaseMs > 200

    ballRef.current.setAttribute('fill', currentColor)
    ballRef.current.style.filter = `drop-shadow(0 0 14px ${currentColor}99) drop-shadow(0 0 5px ${currentColor}cc)`
    ballGlowRef.current.setAttribute('fill', currentColor)

    if (isStaticPhase) {
      const r = 14 + tInPhaseFrac * 3
      ballRef.current.setAttribute('r', String(r))
      ballGlowRef.current.setAttribute('r', String(22 + tInPhaseFrac * 6))
      ballGlowRef.current.setAttribute('opacity', String(0.18 + tInPhaseFrac * 0.18))
    } else {
      ballRef.current.setAttribute('r', '14')
      ballGlowRef.current.setAttribute('r', '22')
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
      trail[0]?.setAttribute('cx', String(pt.x))
      trail[0]?.setAttribute('cy', String(pt.y))
      trail.forEach((el, i) => {
        if (!el) return
        el.setAttribute('fill', currentColor)
        el.setAttribute('opacity', String(((TRAIL_LEN - i) / TRAIL_LEN) * 0.22))
        el.setAttribute('r',       String(Math.max(10 - i, 2)))
      })
    } else {
      trail.forEach(el => el?.setAttribute('opacity', '0'))
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [reps, repDuration, phaseDurations, vib, hapticsEnabled])

  useEffect(() => {
    if (countdown !== null) return
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick, countdown])

  // ── Derived (premier rendu uniquement — ensuite DOM direct) ──
  const visualPhaseValues = [
    parsed.concentric,
    parsed.isometric ?? parsed.pauseTop,
    parsed.eccentric,
    parsed.pause ?? parsed.pauseBottom,
  ]
  const phaseValue  = visualPhaseValues[currentPhase]
  const phaseIsX    = phaseValue === 'X'
  const phaseTotalS = phaseIsX ? 0.3 : (phaseValue as number)

  // ── SVG wave ──
  const waveEl = (
    <svg
      ref={svgRef}
      viewBox={`${-WAVE_W / 2} 0 ${WAVE_W} ${WAVE_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      {/* Path invisible pour mesure */}
      <path ref={pathRef} d={WAVE_PATH_D} fill="none" stroke="none" />

      {/* Wave track visible */}
      <path
        d={WAVE_PATH_D}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trail */}
      {Array.from({ length: TRAIL_LEN }).map((_, i) => (
        <circle
          key={i}
          ref={el => { if (el) trailRefs.current[i] = el }}
          r="8"
          fill="white"
          opacity="0"
        />
      ))}

      {/* Glow */}
      <circle ref={ballGlowRef} r="22" fill={ACCENT_TEMPO} opacity="0.18" />

      {/* Ball */}
      <circle
        ref={ballRef}
        r="14"
        fill="white"
        style={{ filter: `drop-shadow(0 0 14px ${ACCENT_TEMPO}99) drop-shadow(0 0 5px white)` }}
      />
    </svg>
  )

  // ── Rep bars ──
  const repBarsEl = (
    <div className={isLandscape ? 'flex flex-col gap-[3px]' : 'flex flex-row gap-[3px]'}
         style={isLandscape ? { width: 32 } : { height: 32 }}>
      {Array.from({ length: reps + bonusReps }).map((_, i) => {
        const isBonus   = i >= reps
        const isDone    = i < currentRep
        const isCurrent = i === currentRep
        return (
          <motion.div
            key={i}
            className={isLandscape ? 'rounded-lg' : 'flex-1 rounded-lg'}
            style={isLandscape ? { height: 20, minWidth: 32 } : {}}
            animate={{
              backgroundColor: isBonus
                ? (isDone || isCurrent ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)')
                : (isDone || isCurrent ? '#ffe01e' : 'rgba(255,255,255,0.09)'),
              boxShadow: isCurrent && !isBonus
                ? '0 0 10px rgba(255,224,30,0.5)'
                : 'none',
            }}
            initial={false}
            transition={{ backgroundColor: { duration: 0.2 } }}
          />
        )
      })}
    </div>
  )

  return (
    <AnimatePresence onExitComplete={() => onClose(closingResult ?? { plannedReps: reps, bonusReps: 0, totalReps: reps })}>
      {!closing && (
        <motion.div
          key="tempo-guide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-[#080808] z-[60] select-none touch-none flex flex-col"
        >
          {/* ── Header fixe ── */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-safe pt-6 pb-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25 mb-0.5">
                Tempo guide
              </p>
              <p className="text-[15px] font-bold text-white leading-tight truncate max-w-[220px]">
                {exerciseName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/35 hover:text-white/70 active:scale-95 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {isLandscape ? (
            /* ── Landscape : courbe à gauche, contrôles à droite ── */
            <div className="flex-1 flex flex-row items-center gap-0 min-h-0 px-4 pb-4">
              {/* Courbe */}
              <div className="flex-1 flex items-center justify-center h-full min-w-0">
                {waveEl}
              </div>

              {/* Contrôles — colonne droite fixe */}
              <div className="shrink-0 flex flex-col items-start justify-center gap-4 w-36 pl-4">
                {/* Label */}
                <span
                  ref={phaseLabelRef}
                  className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-xl"
                  style={{ color: countdown !== null ? ACCENT_TEMPO : phaseColor }}
                >
                  {countdown !== null ? 'PRÊT' : PHASE_CONFIG[currentPhase].label}
                </span>
                {/* Timer */}
                {countdown === null && phaseTotalS > 0 && (
                  <span
                    ref={phaseTimerRef}
                    className="font-mono font-black tabular-nums leading-none"
                    style={{ fontSize: 36, color: phaseColor }}
                  >
                    {phaseIsX ? 'X' : `${phaseTimer}s`}
                  </span>
                )}
                {/* Barres */}
                {repBarsEl}
                {/* Counter */}
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[28px] font-black leading-none tabular-nums" style={{ color: currentRep >= reps ? 'rgba(255,255,255,0.5)' : '#ffe01e' }}>
                    {currentRep + 1}
                  </span>
                  <span className="font-mono text-[18px] font-bold text-white/20 mx-0.5">/</span>
                  <span className="font-mono text-[22px] font-black text-white/55 leading-none tabular-nums">{reps}</span>
                  {bonusReps > 0 && <span className="font-mono text-[13px] font-bold text-white/30 ml-1">+{bonusReps}</span>}
                </div>
                {/* Fermer en landscape */}
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] text-white/35 hover:text-white/60 text-[11px] font-medium transition-all mt-auto"
                >
                  <X size={12} /> Terminer
                </button>
              </div>
            </div>
          ) : (
            /* ── Portrait : layout vertical fixe, hauteurs déterminées ── */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Courbe — hauteur fixe */}
              <div className="shrink-0 relative" style={{ height: 140 }}>
                {waveEl}

                {/* Countdown overlay — centré sur la courbe uniquement */}
                <AnimatePresence>
                  {countdown !== null && countdown > 0 && (
                    <motion.div
                      key={countdown}
                      initial={{ opacity: 0, scale: 1.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span
                        className="font-mono font-black tabular-nums"
                        style={{ fontSize: 80, color: countdown <= 3 ? ACCENT_TEMPO : 'white', lineHeight: 1 }}
                      >
                        {countdown}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* GO flash */}
                <AnimatePresence>
                  {countdown === 0 && (
                    <motion.div
                      key="go"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1.05 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span className="font-mono font-black" style={{ fontSize: 72, color: ACCENT_TEMPO }}>
                        GO
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Séparateur */}
              <div className="shrink-0 h-px bg-white/[0.04] mx-5 mt-2" />

              {/* Label phase */}
              <div className="shrink-0 flex flex-col items-center pt-5 pb-2">
                <span
                  ref={phaseLabelRef}
                  className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-2xl"
                  style={{ color: countdown !== null ? ACCENT_TEMPO : phaseColor }}
                >
                  {countdown !== null ? 'PRÊT' : PHASE_CONFIG[currentPhase].label}
                </span>
                {countdown === null && (
                  <p className="text-[10px] text-white/25 mt-0.5 tracking-[0.06em]">
                    {['entre les séries', 'pic de contraction', 'descente contrôlée', 'étirement initial'][currentPhase]}
                  </p>
                )}
              </div>

              {/* Timer */}
              <div className="shrink-0 flex justify-center pb-4">
                {countdown === null && phaseTotalS > 0 ? (
                  <span
                    ref={phaseTimerRef}
                    className="font-mono font-black tabular-nums leading-none"
                    style={{ fontSize: 52, color: phaseColor }}
                  >
                    {phaseIsX ? 'X' : `${phaseTimer}s`}
                  </span>
                ) : (
                  <div style={{ height: 52 }} />
                )}
              </div>

              {/* Barres reps */}
              <div className="shrink-0 px-5 pb-3">
                {repBarsEl}
              </div>

              {/* Counter */}
              <div className="shrink-0 flex justify-center items-baseline gap-1 pb-8">
                <span
                  className="font-mono font-black leading-none tabular-nums"
                  style={{ fontSize: 40, color: currentRep >= reps ? 'rgba(255,255,255,0.5)' : '#ffe01e' }}
                >
                  {currentRep + 1}
                </span>
                <span className="font-mono text-[24px] font-bold text-white/20 mx-1">/</span>
                <span className="font-mono font-black text-white/55 leading-none tabular-nums" style={{ fontSize: 30 }}>
                  {reps}
                </span>
                {bonusReps > 0 && (
                  <span className="font-mono text-[15px] font-bold text-white/30 ml-1">+{bonusReps}</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
