// Tempo d'exécution — 4 phases: Excentrique-PauseBasse-Concentrique-PauseHaute
// Notation: "3-1-2-0" = 3s descente, 1s pause basse, 2s montée, 0s pause haute
// Valeur spéciale: "X" = explosif (aussi vite que possible)

export type TempoPhase = number | 'X'

export interface ParsedTempo {
  eccentric: TempoPhase
  pauseBottom: TempoPhase
  concentric: TempoPhase
  pauseTop: TempoPhase
}

// Parse "3-1-2-0" or "X-0-X-0" into structured object.
// Returns null if format is invalid (not 4 parts, non-numeric/X values, out of range).
export function parseTempo(raw: string): ParsedTempo | null {
  if (!raw || typeof raw !== 'string') return null
  const parts = raw.trim().split('-')
  if (parts.length !== 4) return null
  const parsed: TempoPhase[] = []
  for (const part of parts) {
    const upper = part.toUpperCase()
    if (upper === 'X') {
      parsed.push('X')
    } else {
      const n = parseInt(upper, 10)
      if (isNaN(n) || n < 0 || n > 8) return null
      // Reject if part has non-numeric chars (e.g. "1a")
      if (!/^\d+$/.test(upper)) return null
      parsed.push(n)
    }
  }
  return {
    eccentric: parsed[0],
    pauseBottom: parsed[1],
    concentric: parsed[2],
    pauseTop: parsed[3],
  }
}

// Format parsed tempo back to canonical string
export function formatTempo(t: ParsedTempo): string {
  const fmt = (p: TempoPhase) => (p === 'X' ? 'X' : String(p))
  return `${fmt(t.eccentric)}-${fmt(t.pauseBottom)}-${fmt(t.concentric)}-${fmt(t.pauseTop)}`
}

// Time Under Tension in seconds for a given parsed tempo and rep count.
// X phases count as 1s (explosive — near-zero time but not zero for calculation).
export function calcTUT(t: ParsedTempo, reps: number): number {
  const val = (p: TempoPhase) => (p === 'X' ? 1 : p)
  return (val(t.eccentric) + val(t.pauseBottom) + val(t.concentric) + val(t.pauseTop)) * reps
}

// ─── Default Tempos ────────────────────────────────────────────────────────────
// Scientific basis:
//   Hypertrophy: maximize TUT — long eccentric (3-4s), pause, controlled concentric
//   Strength: explosive concentric (X), controlled eccentric for safety
//   Endurance: moderate tempo (2-0-2-0) — sustainable over high reps
//
// Called at render-time only. Result is NEVER persisted when coach hasn't set tempo.

type MovementPattern = string | null | undefined

// Isolation patterns — single-joint movements. Stay controlled even for strength.
const ISOLATION_PATTERNS = new Set([
  'elbow_flexion',
  'elbow_extension',
  'lateral_raise',
  'calf_raise',
  'hip_abduction',
  'hip_adduction',
  'shoulder_rotation',
])

// Per-pattern hypertrophy tempos — research-based TUT targets
const HYPERTROPHY_TEMPO_MAP: Record<string, string> = {
  vertical_pull:         '3-1-2-0', // lat sous tension excentrique
  horizontal_pull:       '3-1-2-0',
  vertical_push:         '2-1-2-0',
  horizontal_push:       '3-1-2-1', // pec sous tension en allongé
  hip_hinge:             '3-1-1-0', // ischio sous tension excentrique
  squat_pattern:         '3-1-2-0',
  knee_flexion:          '3-1-2-0',
  knee_extension:        '3-0-2-0',
  elbow_flexion:         '3-1-2-1',
  elbow_extension:       '3-1-2-1',
  lateral_raise:         '2-1-2-1',
  calf_raise:            '2-1-2-0',
  hip_abduction:         '2-1-2-0',
  hip_adduction:         '2-1-2-0',
  shoulder_rotation:     '2-1-2-0',
  core_anti_flex:        '2-1-2-1',
  core_flex:             '2-1-2-1',
  core_rotation:         '2-1-2-1',
  carry:                 '2-0-2-0',
  scapular_elevation:    '2-1-2-0',
  scapular_retraction:   '2-1-2-0',
  scapular_protraction:  '2-0-2-0',
}

const STRENGTH_COMPOUND  = '2-0-X-0' // explosif concentrique
const STRENGTH_ISOLATION = '2-0-2-0' // contrôlé même en force
const ENDURANCE_DEFAULT  = '2-0-2-0'
const FALLBACK_DEFAULT   = '2-0-2-0'

/**
 * Returns the recommended tempo string for a movement pattern and program goal.
 * Always returns a valid string — never null.
 * Called at render-time; result is NEVER persisted when coach hasn't set a tempo.
 */
export function getDefaultTempo(pattern: MovementPattern, goal: string): string {
  const g = (goal ?? '').toLowerCase()

  if (g === 'endurance' || g === 'athletic') {
    return ENDURANCE_DEFAULT
  }

  if (g === 'strength' || g === 'fat_loss' || g === 'maintenance') {
    if (pattern && ISOLATION_PATTERNS.has(pattern)) {
      return STRENGTH_ISOLATION
    }
    return STRENGTH_COMPOUND
  }

  // hypertrophy, recomp, unknown → per-pattern hypertrophy map
  if (pattern && HYPERTROPHY_TEMPO_MAP[pattern]) {
    return HYPERTROPHY_TEMPO_MAP[pattern]
  }

  return FALLBACK_DEFAULT
}
