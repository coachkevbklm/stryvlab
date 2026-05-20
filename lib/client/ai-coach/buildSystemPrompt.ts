import { createClient as createServiceClient } from '@supabase/supabase-js'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function pct(val: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((val / total) * 100)}%`
}

function fmtDate(date: string): string {
  const [, m, d] = date.split('-')
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export async function buildSystemPrompt(clientId: string): Promise<string> {
  const db = svc()
  const today = computePhysiologicalDate(new Date())
  const dayStart = `${today}T00:00:00Z`
  const dayEnd = `${today}T23:59:59Z`
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const [
    clientRow,
    nutritionProtocol,
    mealsResult,
    waterResult,
    sessionResult,
    activitiesResult,
    restrictionsResult,
  ] = await Promise.allSettled([
    db.from('coach_clients')
      .select('first_name, goal, tdee, fitness_level')
      .eq('id', clientId)
      .single(),
    db.from('nutrition_protocols')
      .select('name, nutrition_protocol_days(calories, protein_g, fat_g, carbs_g)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('nutrition_meals')
      .select('meal_type, title, logged_at, calories, protein_g, fat_g, carbs_g')
      .eq('client_id', clientId)
      .eq('physiological_date', today)
      .neq('meal_type', 'drinks')
      .order('logged_at', { ascending: true }),
    db.from('client_water_logs')
      .select('amount_ml')
      .eq('client_id', clientId)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),
    db.from('client_session_logs')
      .select('id, completed_at')
      .eq('client_id', clientId)
      .not('completed_at', 'is', null)
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('client_activity_logs')
      .select('activity_type, custom_label, duration_min')
      .eq('client_id', clientId)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd),
    db.from('metric_annotations')
      .select('label, body_part, severity')
      .eq('client_id', clientId)
      .eq('event_type', 'injury')
      .not('body_part', 'is', null),
  ])

  // ── Profile ───────────────────────────────────────────────────────────────
  const profile = clientRow.status === 'fulfilled' ? clientRow.value.data : null
  const firstName = profile?.first_name ?? 'le client'
  const goal = profile?.goal ?? 'non renseigné'
  const tdee = profile?.tdee ?? 0
  const fitnessLevel = profile?.fitness_level ?? 'intermédiaire'

  // ── Macros targets ────────────────────────────────────────────────────────
  const protocol = nutritionProtocol.status === 'fulfilled' ? nutritionProtocol.value.data : null
  const protocolDay = (protocol as any)?.nutrition_protocol_days?.[0]
  const targetKcal: number = protocolDay?.calories ?? tdee
  const targetProtein: number = protocolDay?.protein_g ?? 0
  const targetFat: number = protocolDay?.fat_g ?? 0
  const targetCarbs: number = protocolDay?.carbs_g ?? 0

  // ── Today nutrition ───────────────────────────────────────────────────────
  const meals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const totalKcal = meals.reduce((s, m) => s + Number(m.calories ?? 0), 0)
  const totalProtein = meals.reduce((s, m) => s + Number(m.protein_g ?? 0), 0)
  const totalFat = meals.reduce((s, m) => s + Number(m.fat_g ?? 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + Number(m.carbs_g ?? 0), 0)

  const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Petit-déjeuner', lunch: 'Déjeuner',
    dinner: 'Dîner', snack: 'Collation',
  }
  const mealsLines = meals.length > 0
    ? meals.map(m => {
        const time = new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const label = m.title ?? MEAL_LABELS[m.meal_type as string] ?? 'Repas'
        return `  - ${time} ${label}: ${Math.round(Number(m.calories ?? 0))} kcal`
      }).join('\n')
    : '  - Aucun repas loggé'

  // ── Water ─────────────────────────────────────────────────────────────────
  const water = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []
  const totalWaterMl = water.reduce((s, w) => s + Number(w.amount_ml ?? 0), 0)
  const targetWaterMl = 2500

  // ── Session ───────────────────────────────────────────────────────────────
  const session = sessionResult.status === 'fulfilled' ? sessionResult.value.data : null
  const sessionLine = session
    ? `Séance complétée à ${new Date(session.completed_at as string).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : "Aucune séance aujourd'hui"

  // ── Activities ────────────────────────────────────────────────────────────
  const activities = activitiesResult.status === 'fulfilled' ? (activitiesResult.value.data ?? []) : []
  const activitiesLine = activities.length > 0
    ? activities.map(a => `  - ${a.custom_label ?? a.activity_type} ${a.duration_min}min`).join('\n')
    : '  Aucune'

  // ── Restrictions ──────────────────────────────────────────────────────────
  const restrictions = restrictionsResult.status === 'fulfilled' ? (restrictionsResult.value.data ?? []) : []
  const restrictionsLine = restrictions.length > 0
    ? restrictions.map(r => `${r.label ?? r.body_part} (${r.severity})`).join(', ')
    : 'aucune'

  return `Tu es le Coach IA de ${firstName}. Tu connais sa journée en détail.
Réponds en 3 à 5 lignes maximum. Uniquement nutrition, récupération, entraînement du jour.
Si la question est hors scope, réponds : "Je suis ton coach du quotidien — pose-moi une question sur ta journée, ta nutrition ou ta récupération."
Langue : français. Ton : direct, bienveillant, factuel. Ne donne jamais de conseils médicaux.

[PROFIL]
Prénom: ${firstName}
Objectif: ${goal} | TDEE: ${tdee} kcal | Cible: ${targetKcal} kcal
Macros cibles: P ${targetProtein}g / L ${targetFat}g / G ${targetCarbs}g
Niveau: ${fitnessLevel}
Restrictions physiques: ${restrictionsLine}

[JOURNÉE DU ${fmtDate(today)}]
Heure actuelle: ${nowTime}

Nutrition: ${Math.round(totalKcal)} kcal / ${targetKcal} cible (${pct(totalKcal, targetKcal)})
  Protéines: ${Math.round(totalProtein)}g / ${targetProtein}g
  Lipides: ${Math.round(totalFat)}g / ${targetFat}g
  Glucides: ${Math.round(totalCarbs)}g / ${targetCarbs}g
Repas:
${mealsLines}

Eau: ${totalWaterMl}ml / ${targetWaterMl}ml (${pct(totalWaterMl, targetWaterMl)})

Séance: ${sessionLine}

Activités libres:
${activitiesLine}`
}
