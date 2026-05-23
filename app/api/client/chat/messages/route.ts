import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'
import OpenAI from 'openai'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { resolveProtocolDayByDate } from '@/lib/nutrition/protocol-schedule'
import { determineFlow } from '@/lib/client/checkin/checkinEngine'
import { computeNutritionAlerts } from '@/lib/client/smart/nutritionAlerts'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DAILY_LIMIT = 20

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

async function ensureAutomatedChatMessages(db: ReturnType<typeof service>, clientId: string) {
  const now = new Date()
  const today = computePhysiologicalDate(now)
  const currentHour = now.getHours()
  const todayStart = `${today}T00:00:00Z`

  const [
    { data: chatSessions },
    { data: initMessages },
    { data: protocol },
    { data: composerMeals },
    { data: legacyMeals },
    { data: waterRows },
    { data: alertMessages },
  ] = await Promise.all([
    db.from('chat_sessions')
      .select('flow_type, completed_at')
      .eq('client_id', clientId)
      .eq('date', today),
    db.from('chat_messages')
      .select('message_type')
      .eq('client_id', clientId)
      .gte('created_at', todayStart)
      .in('message_type', ['morning_init', 'evening_init']),
    db.from('nutrition_protocols')
      .select('schedule_start_date, nutrition_protocol_days(position, calories, protein_g, carbs_g, fat_g, hydration_ml), nutrition_protocol_schedule_slots(week_index, dow, protocol_day_position)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('nutrition_meals')
      .select('meal_type, total_protein_g, total_carbs_g, total_fat_g')
      .eq('client_id', clientId)
      .eq('physiological_date', today),
    db.from('meal_logs')
      .select('meal_type, estimated_macros')
      .eq('client_id', clientId)
      .gte('logged_at', `${today}T04:00:00.000Z`)
      .lt('logged_at', `${today}T23:59:59.999Z`)
      .eq('ai_status', 'done'),
    db.from('client_water_logs')
      .select('amount_ml')
      .eq('client_id', clientId)
      .gte('logged_at', `${today}T00:00:00Z`)
      .lte('logged_at', `${today}T23:59:59Z`),
    db.from('chat_messages')
      .select('metadata')
      .eq('client_id', clientId)
      .eq('message_type', 'nutrition_alert_auto')
      .gte('created_at', todayStart),
  ])

  const sessionRows = (chatSessions ?? []) as { flow_type: string; completed_at: string | null }[]
  const initTypes = new Set((initMessages ?? []).map((m: any) => m.message_type))
  const flow = determineFlow(currentHour, sessionRows)
  const flowType = flow === 'morning' ? 'morning_init' : flow === 'evening' ? 'evening_init' : null

  if (flowType && !initTypes.has(flowType)) {
    const isMorning = flowType === 'morning_init'
    await db.from('chat_messages').insert({
      client_id: clientId,
      role: 'assistant',
      content: isMorning
        ? "Bonjour. C'est l'heure de ton check-in matin."
        : "Bonsoir. C'est l'heure de ton check-in soir.",
      message_type: flowType,
      metadata: {
        component: 'chips',
        key: 'trigger_checkin',
        question: isMorning ? 'Prêt pour ton check-in matin ?' : 'Prêt pour ton check-in soir ?',
        options: [{ label: 'Commencer le check-in', value: 1 }],
      },
    })
  }

  const protocolDay = resolveProtocolDayByDate(
    today,
    (protocol as any)?.schedule_start_date ?? null,
    (protocol as any)?.nutrition_protocol_days ?? [],
    (protocol as any)?.nutrition_protocol_schedule_slots ?? [],
  ) as any

  const target = {
    kcal: Number(protocolDay?.calories ?? 0),
    protein_g: Number(protocolDay?.protein_g ?? 0),
    carbs_g: Number(protocolDay?.carbs_g ?? 0),
    fat_g: Number(protocolDay?.fat_g ?? 0),
    water_ml: Number(protocolDay?.hydration_ml ?? 2500),
  }

  const fromComposer = (composerMeals ?? []).reduce((acc: any, m: any) => ({
    protein_g: acc.protein_g + Number(m.total_protein_g ?? 0),
    carbs_g: acc.carbs_g + Number(m.total_carbs_g ?? 0),
    fat_g: acc.fat_g + Number(m.total_fat_g ?? 0),
  }), { protein_g: 0, carbs_g: 0, fat_g: 0 })

  const fromLegacy = (legacyMeals ?? []).reduce((acc: any, m: any) => {
    const em = (m.estimated_macros ?? {}) as Record<string, number>
    return {
      protein_g: acc.protein_g + Number(em.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(em.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(em.fats_g ?? em.fat_g ?? 0),
    }
  }, { protein_g: 0, carbs_g: 0, fat_g: 0 })

  const consumed = {
    kcal: 0,
    protein_g: fromComposer.protein_g + fromLegacy.protein_g,
    carbs_g: fromComposer.carbs_g + fromLegacy.carbs_g,
    fat_g: fromComposer.fat_g + fromLegacy.fat_g,
    water_ml: (waterRows ?? []).reduce((s: number, w: any) => s + Number(w.amount_ml ?? 0), 0),
  }

  const hasLunchLog = (composerMeals ?? []).some((m: any) => m.meal_type === 'lunch')
    || (legacyMeals ?? []).some((m: any) => m.meal_type === 'lunch')

  const alerts = computeNutritionAlerts({
    consumed,
    target: { ...target, kcal: target.kcal || consumed.kcal },
    currentHour,
    hasLunchLog,
  })

  const sentAlertCodes = new Set(
    (alertMessages ?? [])
      .map((m: any) => String((m.metadata as any)?.code ?? ''))
      .filter(Boolean)
  )

  for (const alert of alerts) {
    if (sentAlertCodes.has(alert.code)) continue
    await db.from('chat_messages').insert({
      client_id: clientId,
      role: 'assistant',
      content: alert.body ? `${alert.title} — ${alert.body}` : alert.title,
      message_type: 'nutrition_alert_auto',
      metadata: {
        code: alert.code,
        severity: alert.severity,
        automated: true,
      },
    })
  }
}

// GET — messages actifs (3 derniers jours, archived_at IS NULL)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = service()
  const cc = await resolveClientFromUser(user.id, user.email, db, 'id')
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  await ensureAutomatedChatMessages(db, cc.id as string)

  const { data: messages } = await db
    .from('chat_messages')
    .select('id, role, content, message_type, metadata, created_at')
    .eq('client_id', cc.id)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  return NextResponse.json({ messages: messages ?? [] })
}

// POST — envoie message user → LLM → sauvegarde les deux → retourne les deux
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = service()
  const cc = await resolveClientFromUser(user.id, user.email, db, 'id, first_name')
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body = await req.json()
  const content: string = String(body.content ?? '').trim().slice(0, 500)
  const message_type: string = ['text', 'quick_reply', 'slider', 'voice'].includes(body.message_type)
    ? body.message_type
    : 'text'
  if (!content) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // Rate limit via ai_coach_daily_usage
  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await db
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', cc.id)
    .eq('date', today)
    .single()

  const count = usage?.message_count ?? 0
  if (count >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'Daily limit reached', remaining: 0 }, { status: 429 })
  }

  // Sauvegarde message utilisateur
  const { data: userMsg } = await db
    .from('chat_messages')
    .insert({ client_id: cc.id, role: 'user', content, message_type })
    .select('id, role, content, message_type, metadata, created_at')
    .single()

  // Historique récent pour contexte LLM (20 derniers messages actifs)
  const { data: history } = await db
    .from('chat_messages')
    .select('role, content')
    .eq('client_id', cc.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  const systemPrompt = await buildSystemPrompt(cc.id)

  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      { role: 'system', content: systemPrompt },
      ...(history ?? []).reverse().map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content),
      })),
    ],
  })

  const botContent = completion.choices[0]?.message?.content ?? ''

  // Sauvegarde réponse bot
  const { data: botMsg } = await db
    .from('chat_messages')
    .insert({ client_id: cc.id, role: 'assistant', content: botContent, message_type: 'text' })
    .select('id, role, content, message_type, metadata, created_at')
    .single()

  // Upsert usage
  await db.from('ai_coach_daily_usage').upsert(
    { client_id: cc.id, date: today, message_count: count + 1 },
    { onConflict: 'client_id,date' }
  )

  return NextResponse.json({
    userMessage: userMsg,
    botMessage: botMsg,
    remaining: DAILY_LIMIT - count - 1,
  })
}
