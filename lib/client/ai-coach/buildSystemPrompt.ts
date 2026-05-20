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

  const nextPhysioDay = (() => {
    const d = new Date(`${today}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const threeDaysAgo = (() => {
    const d = new Date(`${today}T00:00:00`)
    d.setDate(d.getDate() - 3)
    return d.toISOString().split('T')[0]
  })()

  const [
    clientRow,
    nutritionProtocol,
    mealsResult,
    legacyMealsResult,
    waterResult,
    sessionResult,
    activitiesResult,
    restrictionsResult,
    bodyCompResult,
    nutritionTrendsResult,
    checkinsResult,
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
    // Nutrition Composer meals (correct columns)
    db.from('nutrition_meals')
      .select('total_calories, total_protein_g, total_fat_g, total_carbs_g, meal_type, title, logged_at')
      .eq('client_id', clientId)
      .eq('physiological_date', today)
      .order('logged_at', { ascending: true }),
    // Legacy meal_logs
    db.from('meal_logs')
      .select('estimated_macros, logged_at, meal_name')
      .eq('client_id', clientId)
      .gte('logged_at', `${today}T04:00:00.000Z`)
      .lt('logged_at', `${nextPhysioDay}T04:00:00.000Z`)
      .eq('ai_status', 'done'),
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
    db.from('assessment_submissions')
      .select('bilan_date, assessment_responses(field_key, value_number)')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('bilan_date', { ascending: false })
      .limit(2),
    // 3-day nutrition trends
    db.from('nutrition_meals')
      .select('physiological_date, total_calories, total_protein_g')
      .eq('client_id', clientId)
      .gte('physiological_date', threeDaysAgo)
      .lt('physiological_date', today)
      .order('physiological_date', { ascending: false }),
    // Today's check-ins
    db.from('client_daily_checkins')
      .select('flow_type, sleep_hours, sleep_quality, energy_level, stress_level, weight_kg, hunger_level, muscle_soreness')
      .eq('client_id', clientId)
      .eq('date', today),
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

  // ── Today nutrition (both sources) ────────────────────────────────────────
  const composerMeals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const legacyMealsData = legacyMealsResult.status === 'fulfilled' ? (legacyMealsResult.value.data ?? []) : []

  const totalKcal =
    composerMeals.reduce((s, m) => s + Number((m as any).total_calories ?? 0), 0) +
    legacyMealsData.reduce((s: number, m: any) => s + Number(m.estimated_macros?.calories_kcal ?? 0), 0)

  const totalProtein =
    composerMeals.reduce((s, m) => s + Number((m as any).total_protein_g ?? 0), 0) +
    legacyMealsData.reduce((s: number, m: any) => s + Number(m.estimated_macros?.protein_g ?? 0), 0)

  const totalFat =
    composerMeals.reduce((s, m) => s + Number((m as any).total_fat_g ?? 0), 0) +
    legacyMealsData.reduce((s: number, m: any) => s + Number(m.estimated_macros?.fat_g ?? 0), 0)

  const totalCarbs =
    composerMeals.reduce((s, m) => s + Number((m as any).total_carbs_g ?? 0), 0) +
    legacyMealsData.reduce((s: number, m: any) => s + Number(m.estimated_macros?.carbs_g ?? 0), 0)

  const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Petit-déjeuner', lunch: 'Déjeuner',
    dinner: 'Dîner', snack: 'Collation',
  }

  const mealsLines = composerMeals.length > 0 || legacyMealsData.length > 0
    ? [
        ...composerMeals.map((m: any) => {
          const time = new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const label = m.title ?? MEAL_LABELS[m.meal_type as string] ?? 'Repas'
          return `  - ${time} ${label}: ${Math.round(Number(m.total_calories ?? 0))} kcal`
        }),
        ...legacyMealsData.map((m: any) => {
          const time = new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          return `  - ${time} ${m.meal_name ?? 'Repas'}: ${Math.round(Number(m.estimated_macros?.calories_kcal ?? 0))} kcal`
        }),
      ].join('\n')
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

  // ── Body composition ──────────────────────────────────────────────────────
  const bilans = bodyCompResult.status === 'fulfilled' ? (bodyCompResult.value.data ?? []) : []
  type AssessmentResponse = { field_key: string; value_number: number | null }
  const extractValues = (bilan: any): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const r of (bilan?.assessment_responses ?? []) as AssessmentResponse[]) {
      if (r.value_number != null) out[r.field_key] = r.value_number
    }
    return out
  }
  const latestBilan = bilans[0] ? extractValues(bilans[0]) : {}
  const prevBilan   = bilans[1] ? extractValues(bilans[1]) : {}

  const latestWeight = latestBilan['weight_kg']    ?? null
  const latestBF     = latestBilan['body_fat_pct'] ?? null
  const latestLBM    = latestBilan['lean_mass_kg'] ?? null
  const prevWeight   = prevBilan['weight_kg']      ?? null
  const weightDelta  = latestWeight != null && prevWeight != null
    ? +(latestWeight - prevWeight).toFixed(1) : null

  const bodyCompLines = latestWeight != null
    ? [
        `Poids: ${latestWeight}kg${weightDelta != null ? ` (${weightDelta > 0 ? '+' : ''}${weightDelta}kg vs bilan précédent)` : ''}`,
        latestBF  != null ? `Masse grasse: ${latestBF}%`   : null,
        latestLBM != null ? `Masse maigre: ${latestLBM}kg` : null,
        bilans[0]?.bilan_date ? `Dernier bilan: ${fmtDate(bilans[0].bilan_date)}` : null,
      ].filter(Boolean).join(' | ')
    : 'Aucun bilan corporel enregistré'

  // ── Nutrition trends (3 derniers jours) ───────────────────────────────────
  const trendRows = nutritionTrendsResult.status === 'fulfilled'
    ? (nutritionTrendsResult.value.data ?? [])
    : []

  const trendBlock = trendRows.length > 0
    ? trendRows.map((row: any) => {
        const kcal = Math.round(Number(row.total_calories ?? 0))
        const protein = Math.round(Number(row.total_protein_g ?? 0))
        const kcalPct = targetKcal > 0 ? Math.round((kcal / targetKcal) * 100) : 0
        const proteinOk = targetProtein > 0 ? protein >= targetProtein : true
        const d = new Date(row.physiological_date + 'T12:00:00')
        const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
        return `  ${dayLabel}: ${kcal} kcal / ${targetKcal} (${kcalPct}%) | P ${protein}g / ${targetProtein}g ${proteinOk ? '✓' : '❌'}`
      }).join('\n')
    : '  Aucune donnée'

  // ── Check-ins du jour ─────────────────────────────────────────────────────
  const checkins = checkinsResult.status === 'fulfilled' ? (checkinsResult.value.data ?? []) : []
  const morningCheckin = checkins.find((c: any) => c.flow_type === 'morning')
  const eveningCheckin = checkins.find((c: any) => c.flow_type === 'evening')

  const QUALITY_LABELS: Record<number, string> = { 1: 'Mauvais', 2: 'Moyen', 3: 'Bien', 4: 'Excellent' }
  const ENERGY_LABELS: Record<number, string>  = { 1: 'Épuisé', 2: 'Fatigué', 3: 'Normal', 4: 'Chargé', 5: 'Top' }
  const STRESS_LABELS: Record<number, string>  = { 1: 'Aucun', 2: 'Léger', 3: 'Modéré', 4: 'Élevé', 5: 'Intense' }

  const morningLine = morningCheckin
    ? [
        morningCheckin.sleep_hours    != null ? `sommeil ${morningCheckin.sleep_hours}h` : null,
        morningCheckin.sleep_quality  != null ? `qualité ${QUALITY_LABELS[morningCheckin.sleep_quality] ?? morningCheckin.sleep_quality}` : null,
        morningCheckin.energy_level   != null ? `énergie ${ENERGY_LABELS[morningCheckin.energy_level] ?? morningCheckin.energy_level}/5` : null,
        morningCheckin.weight_kg      != null ? `poids ${morningCheckin.weight_kg}kg` : null,
      ].filter(Boolean).join(', ')
    : 'non fait'

  const eveningLine = eveningCheckin
    ? [
        eveningCheckin.energy_level    != null ? `énergie ${ENERGY_LABELS[eveningCheckin.energy_level] ?? eveningCheckin.energy_level}/5` : null,
        eveningCheckin.stress_level    != null ? `stress ${STRESS_LABELS[eveningCheckin.stress_level] ?? eveningCheckin.stress_level}` : null,
        eveningCheckin.muscle_soreness != null ? `courbatures ${eveningCheckin.muscle_soreness}/4` : null,
        eveningCheckin.hunger_level    != null ? `faim ${eveningCheckin.hunger_level}/4` : null,
      ].filter(Boolean).join(', ')
    : 'non fait'

  return `Tu es le Coach IA de ${firstName}. Tu as accès à sa journée et à ses données corporelles.
Réponds en 3 à 5 lignes maximum. Sois direct, bienveillant, factuel.
Si les données montrent une tendance (déficit protéines répété, mauvais sommeil), signale-la avant de répondre.
Pose UNE question de contexte si nécessaire avant de recommander.
Tu peux répondre sur : nutrition du jour, récupération, séance, données corporelles, phases d'entraînement, périodisation, objectifs.
Ne donne jamais de conseils médicaux. Si tu n'as pas assez de données pour répondre, dis-le clairement.
Langue : français.

[PROFIL]
Prénom: ${firstName}
Objectif: ${goal} | TDEE: ${tdee} kcal | Cible: ${targetKcal} kcal
Macros cibles: P ${targetProtein}g / L ${targetFat}g / G ${targetCarbs}g
Niveau: ${fitnessLevel}
Restrictions physiques: ${restrictionsLine}

[DONNÉES CORPORELLES]
${bodyCompLines}

[TENDANCES NUTRITION — 3 derniers jours]
${trendBlock}

[CHECK-INS DU JOUR]
Matin: ${morningLine}
Soir: ${eveningLine}

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
