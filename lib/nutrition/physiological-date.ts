/**
 * Journée physiologique — cutoff 04:00
 * Un repas loggé à 02:30 appartient à la veille (jour physiologique précédent).
 * Conforme au FUNCTIONAL_SPEC.md STRYVR — A.0
 */
export function computePhysiologicalDate(
  timestamp: Date | string,
  cutoffHour = 4
): string {
  const dt = new Date(timestamp)
  // Use local time — toISOString() is UTC and causes 1-2 day offset in non-UTC timezones
  const hour = dt.getHours()
  const year = dt.getFullYear()
  const month = dt.getMonth()
  const day = dt.getDate()

  const localDate = new Date(year, month, hour < cutoffHour ? day - 1 : day)
  const y = localDate.getFullYear()
  const m = String(localDate.getMonth() + 1).padStart(2, "0")
  const d = String(localDate.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Infère le meal_type selon l'heure locale
 */
export function inferMealType(
  timestamp: Date | string
): "breakfast" | "lunch" | "dinner" | "snack" {
  const dt = new Date(timestamp)
  const h = dt.getHours()
  const m = dt.getMinutes()
  const totalMin = h * 60 + m

  if (totalMin >= 5 * 60 && totalMin < 11 * 60) return "breakfast"
  if (totalMin >= 11 * 60 && totalMin < 15 * 60) return "lunch"
  if (totalMin >= 17 * 60 + 30 && totalMin < 22 * 60) return "dinner"
  return "snack"
}
