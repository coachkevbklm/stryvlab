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

  const PHASE_SUBLABELS = ['Montée — contraction', 'Maintien au sommet', 'Descente contrôlée', 'Pause bas']

  // ── Rep bars — flex-wrap pour beaucoup de reps ──
  const totalBars = reps + bonusReps
  const repBarsEl = (
    <div className="flex flex-row flex-wrap gap-[3px]" style={{ height: 'auto' }}>
      {Array.from({ length: totalBars }).map((_, i) => {
        const isBonus   = i >= reps
        const isDone    = i < currentRep
        const isCurrent = i === currentRep
        return (
          <motion.div
            key={i}
            className="rounded-lg"
            style={{ width: Math.min(36, Math.max(10, (isLandscape ? 120 : 280) / (reps > 20 ? reps : Math.max(reps, 8)) - 3)), height: 28 }}
            animate={{
              backgroundColor: isBonus
                ? (isDone || isCurrent ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)')
                : (isDone || isCurrent ? '#ffe01e' : 'rgba(255,255,255,0.09)'),
              boxShadow: isCurrent && !isBonus ? '0 0 10px rgba(255,224,30,0.5)' : 'none',
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
          className="fixed inset-0 bg-[#080808] z-[60] select-none touch-none"
          style={{ display: 'flex', flexDirection: isLandscape ? 'row' : 'column' }}
        >
          {isLandscape ? (
            /* ══ LANDSCAPE ══
               Courbe plein hauteur à gauche, panneau contrôles à droite.
               Header intégré dans le panneau droit (pas de bande séparée). */
            <>
              {/* Courbe — occupe toute la hauteur, ~60% de la largeur */}
              <div style={{ flex: '1 1 0', position: 'relative', minWidth: 0 }}>
                {waveEl}
                {/* Countdown overlay sur la courbe */}
                <AnimatePresence>
                  {countdown !== null && countdown > 0 && (
                    <motion.div
                      key={countdown}
                      initial={{ opacity: 0, scale: 1.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.22 }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
                    >
                      <span style={{ fontSize: 96, color: countdown <= 3 ? ACCENT_TEMPO : 'white', fontFamily: 'monospace', fontWeight: 900, lineHeight: 1 }}>
                        {countdown}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {countdown === 0 && (
                    <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: 80, color: ACCENT_TEMPO, fontFamily: 'monospace', fontWeight: 900 }}>GO</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Panneau droit — 180px, flex-col, tout centré verticalement */}
              <div style={{ width: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 16px 16px 12px', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Nom exercice + fermer */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>Tempo</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{exerciseName}</p>
                  </div>
                  <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Phase label + sous-label */}
                <div>
                  <span
                    ref={phaseLabelRef}
                    style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 20, color: countdown !== null ? ACCENT_TEMPO : phaseColor, display: 'block', marginBottom: 2 }}
                  >
                    {countdown !== null ? 'PRÊT' : PHASE_CONFIG[currentPhase].label}
                  </span>
                  {countdown === null && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                      {PHASE_SUBLABELS[currentPhase]}
                    </p>
                  )}
                </div>

                {/* Timer grand */}
                <div style={{ minHeight: 52 }}>
                  {countdown === null && phaseTotalS > 0 && (
                    <span
                      ref={phaseTimerRef}
                      style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 48, lineHeight: 1, color: phaseColor, display: 'block' }}
                    >
                      {phaseIsX ? 'X' : `${phaseTimer}s`}
                    </span>
                  )}
                </div>

                {/* Barres reps */}
                <div>{repBarsEl}</div>

                {/* Counter */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 32, lineHeight: 1, color: currentRep >= reps ? 'rgba(255,255,255,0.5)' : '#ffe01e' }}>
                    {currentRep + 1}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>/</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 24, color: 'rgba(255,255,255,0.55)' }}>{reps}</span>
                  {bonusReps > 0 && <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>+{bonusReps}</span>}
                </div>
              </div>
            </>
          ) : (
            /* ══ PORTRAIT ══
               Header compact → Courbe flex-1 → Label+Timer → Barres → Counter */
            <>
              {/* Header */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 12px' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>Tempo guide</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{exerciseName}</p>
                </div>
                <button onClick={handleClose} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Courbe — flex-1, prend tout l'espace disponible */}
              <div style={{ flex: '1 1 0', position: 'relative', minHeight: 0 }}>
                {waveEl}
                {/* Countdown sur la courbe */}
                <AnimatePresence>
                  {countdown !== null && countdown > 0 && (
                    <motion.div
                      key={countdown}
                      initial={{ opacity: 0, scale: 1.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.22 }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 8 }}
                    >
                      <span style={{ fontSize: 120, color: countdown <= 3 ? ACCENT_TEMPO : 'white', fontFamily: 'monospace', fontWeight: 900, lineHeight: 1 }}>
                        {countdown}
                      </span>
                      {countdown <= 3 && (
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                          Positionnez-vous
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {countdown === 0 && (
                    <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: 96, color: ACCENT_TEMPO, fontFamily: 'monospace', fontWeight: 900 }}>GO</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div style={{ flexShrink: 0, height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 20px' }} />

              {/* Label + sous-label */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 8px' }}>
                <span
                  ref={phaseLabelRef}
                  style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 28, color: countdown !== null ? ACCENT_TEMPO : phaseColor }}
                >
                  {countdown !== null ? 'PRÊT' : PHASE_CONFIG[currentPhase].label}
                </span>
                {countdown === null && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3, letterSpacing: '0.06em' }}>
                    {PHASE_SUBLABELS[currentPhase]}
                  </p>
                )}
              </div>

              {/* Timer */}
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', minHeight: 72, alignItems: 'center', paddingBottom: 8 }}>
                {countdown === null && phaseTotalS > 0 && (
                  <span
                    ref={phaseTimerRef}
                    style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 64, lineHeight: 1, color: phaseColor }}
                  >
                    {phaseIsX ? 'X' : `${phaseTimer}s`}
                  </span>
                )}
              </div>

              {/* Barres reps */}
              <div style={{ flexShrink: 0, padding: '0 20px 12px' }}>
                {repBarsEl}
              </div>

              {/* Counter */}
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6, paddingBottom: 40 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 52, lineHeight: 1, color: currentRep >= reps ? 'rgba(255,255,255,0.5)' : '#ffe01e' }}>
                  {currentRep + 1}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 28, color: 'rgba(255,255,255,0.2)' }}>/</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 36, color: 'rgba(255,255,255,0.55)' }}>{reps}</span>
                {bonusReps > 0 && (
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>+{bonusReps}</span>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
