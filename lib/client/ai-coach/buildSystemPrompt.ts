import { SupabaseClient } from '@supabase/supabase-js'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function fmt(n: number) {
  return Math.round(n).toString()
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export async function buildSystemPrompt(
  clientId: string,
  svc: SupabaseClient
): Promise<string> {
  const today = computePhysiologicalDate(new Date())
  const dayStart = `${today}T00:00:00Z`
  const dayEnd   = `${today}T23:59:59Z`

  const [
    clientRow,
    protocolRow,
    mealsResult,
    waterResult,
    sessionResult,
    checkinResult,
    restrictionsResult,
  ] = await Promise.allSettled([
    // Profil client
    svc
      .from('coach_clients')
      .select('first_name, goal, fitness_level')
      .eq('id', clientId)
      .single(),
    // Protocole nutritionnel actif (contient les macros cibles)
    svc
      .from('nutrition_protocols')
      .select('id, nutrition_protocol_days(*)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Repas du jour
    svc
      .from('nutrition_meals')
      .select('meal_type, title, logged_at, total_calories, total_protein_g, total_fat_g, total_carbs_g')
      .eq('client_id', clientId)
      .eq('physiological_date', today)
      .neq('meal_type', 'drinks')
      .order('logged_at', { ascending: true }),
    // Eau du jour
    svc
      .from('client_water_logs')
      .select('amount_ml')
      .eq('client_id', clientId)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),
    // Séance du jour
    svc
      .from('client_session_logs')
      .select('id, completed_at')
      .eq('client_id', clientId)
      .not('completed_at', 'is', null)
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Check-in matin
    svc
      .from('client_checkins')
      .select('responses')
      .eq('client_id', clientId)
      .eq('moment', 'morning')
      .eq('date', today)
      .maybeSingle(),
    // Restrictions physiques
    svc
      .from('metric_annotations')
      .select('body_part, severity, label')
      .eq('client_id', clientId)
      .eq('event_type', 'injury')
      .not('body_part', 'is', null),
  ])

  const client       = clientRow.status === 'fulfilled'        ? clientRow.value.data         : null
  const protocol     = protocolRow.status === 'fulfilled'      ? protocolRow.value.data        : null
  const meals        = mealsResult.status === 'fulfilled'      ? (mealsResult.value.data ?? []) : []
  const water        = waterResult.status === 'fulfilled'      ? (waterResult.value.data ?? []) : []
  const session      = sessionResult.status === 'fulfilled'    ? sessionResult.value.data       : null
  const checkin      = checkinResult.status === 'fulfilled'    ? checkinResult.value.data       : null
  const restrictions = restrictionsResult.status === 'fulfilled' ? (restrictionsResult.value.data ?? []) : []

  const firstName = client?.first_name ?? 'le client'
  const goal      = client?.goal ?? 'non défini'

  // Macros cibles depuis le protocole nutritionnel partagé (premier jour = jour de référence)
  const protocolDays = (protocol as any)?.nutrition_protocol_days ?? []
  const refDay    = [...protocolDays].sort((a: any, b: any) => a.position - b.position)[0] ?? null
  const targetKcal = refDay?.calories  ? fmt(Number(refDay.calories))  : '?'
  const targetP    = refDay?.protein_g ? fmt(Number(refDay.protein_g)) : '?'
  const targetL    = refDay?.fat_g     ? fmt(Number(refDay.fat_g))     : '?'
  const targetG    = refDay?.carbs_g   ? fmt(Number(refDay.carbs_g))   : '?'

  // Totaux nutrition du jour
  const consumedKcal = meals.reduce((s: number, m: any) => s + Number(m.total_calories ?? 0), 0)
  const consumedP    = meals.reduce((s: number, m: any) => s + Number(m.total_protein_g ?? 0), 0)
  const consumedL    = meals.reduce((s: number, m: any) => s + Number(m.total_fat_g ?? 0), 0)
  const consumedG    = meals.reduce((s: number, m: any) => s + Number(m.total_carbs_g ?? 0), 0)
  const totalWaterMl = water.reduce((s: number, w: any) => s + Number(w.amount_ml ?? 0), 0)
  const targetWaterMl = 2500

  const mealTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
      snack: 'Collation',
    }
    return map[t] ?? 'Repas'
  }

  const mealsLines = meals.length > 0
    ? meals.map((m: any) => {
        const time = new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const label = m.title ?? mealTypeLabel(m.meal_type)
        return `  ${time} — ${label} (${fmt(Number(m.total_calories ?? 0))} kcal)`
      }).join('\n')
    : '  Aucun repas enregistré'

  const restrictionsLines = restrictions.length > 0
    ? (restrictions as any[]).map((r: any) =>
        `  ${r.body_part} — ${r.severity}${r.label ? ` (${r.label})` : ''}`
      ).join('\n')
    : '  Aucune'

  const protocolLine = protocol
    ? 'Protocole nutritionnel actif'
    : 'Aucun protocole nutritionnel partagé'

  const sessionLine = session
    ? `Séance complétée à ${new Date((session as any).completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : "Aucune séance aujourd'hui"

  let checkinLine = 'Non renseignés'
  if (checkin?.responses) {
    const r = checkin.responses as Record<string, unknown>
    const parts: string[] = []
    if (r.energy  != null) parts.push(`énergie ${r.energy}/5`)
    if (r.stress  != null) parts.push(`stress ${r.stress}/5`)
    if (r.sleep_h != null) parts.push(`sommeil ${r.sleep_h}h`)
    if (parts.length > 0) checkinLine = parts.join(', ')
  }

  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return `Tu es le Coach IA de ${firstName}. Tu connais sa journée en détail.
Réponds en 3 à 5 lignes maximum. Sois direct, factuel, bienveillant.
Reste strictement dans le périmètre : nutrition, récupération, entraînement du jour.
Si la question est hors périmètre, réponds exactement : "Je suis ton coach du quotidien — pose-moi une question sur ta journée, ta nutrition ou ta récupération."
Langue : français.

[PROFIL]
Prénom : ${firstName}
Objectif : ${goal}
Cible : ${targetKcal} kcal | P ${targetP}g / L ${targetL}g / G ${targetG}g
Protocole : ${protocolLine}
Restrictions physiques :
${restrictionsLines}

[JOURNÉE DU ${formatDate(today)} — ${currentTime}]

Nutrition : ${fmt(consumedKcal)} kcal / ${targetKcal} cible
  Protéines : ${fmt(consumedP)}g / ${targetP}g
  Lipides   : ${fmt(consumedL)}g / ${targetL}g
  Glucides  : ${fmt(consumedG)}g / ${targetG}g
Repas :
${mealsLines}

Eau : ${Math.round(totalWaterMl / 100) / 10}L / ${Math.round(targetWaterMl / 100) / 10}L cible

Séance : ${sessionLine}

Check-ins : ${checkinLine}`
}
