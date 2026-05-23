type SessionData = { flow_type: string; completed_at: string | null }

/**
 * Determines which check-in flow to run based on current hour and completed sessions.
 * Returns 'morning', 'evening', or null (nothing to do).
 *
 * Rules:
 * - Before 14:00 → morning (if not done), else null
 * - 14:00+ → evening (if not done), else null
 */
export function determineFlow(
  currentHour: number,
  chatSessions: SessionData[]
): 'morning' | 'evening' | null {
  const morningDone = chatSessions.some(
    s => s.flow_type === 'morning' && s.completed_at != null
  )
  const eveningDone = chatSessions.some(
    s => s.flow_type === 'evening' && s.completed_at != null
  )

  // If only one flow is pending, always propose it (no time lock).
  if (morningDone && !eveningDone) return 'evening'
  if (!morningDone && eveningDone) return 'morning'

  // If both are done, nothing to do.
  if (morningDone && eveningDone) return null

  // If both are pending, use time-based default.
  if (currentHour < 14) {
    return 'morning'
  }

  return 'evening'
}
