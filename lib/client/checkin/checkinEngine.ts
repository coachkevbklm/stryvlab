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

  if (currentHour < 14) {
    if (!morningDone) return 'morning'
    return null // morning done, too early for evening
  }

  // hour >= 14
  if (!eveningDone) return 'evening'
  return null
}
