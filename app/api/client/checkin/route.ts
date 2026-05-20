import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const checkinSchema = z.object({
  flow_type: z.enum(['morning', 'evening']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data: z.object({
    sleep_hours:     z.number().min(0).max(24).optional(),
    sleep_quality:   z.number().int().min(1).max(4).optional(),
    energy_level:    z.number().int().min(1).max(5).optional(),
    stress_level:    z.number().int().min(1).max(5).optional(),
    weight_kg:       z.number().min(20).max(300).optional(),
    hunger_level:    z.number().int().min(1).max(4).optional(),
    muscle_soreness: z.number().int().min(1).max(4).optional(),
    notes:           z.string().max(500).optional(),
  }),
  summary: z.string().max(500),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const cc = await resolveClientFromUser(user.id, user.email, db, 'id, first_name')
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const parsed = checkinSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error }, { status: 400 })
  }
  const { flow_type, date, data, summary } = parsed.data

  // Upsert check-in data
  const { error: checkinError } = await db
    .from('client_daily_checkins')
    .upsert(
      { client_id: cc.id, date, flow_type, ...data },
      { onConflict: 'client_id,date,flow_type' }
    )
  if (checkinError) {
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  // Mark chat_session completed
  await db
    .from('chat_sessions')
    .upsert(
      { client_id: cc.id, date, flow_type, completed_at: new Date().toISOString() },
      { onConflict: 'client_id,date,flow_type' }
    )

  // Build system prompt + LLM closing message (non-blocking on failure)
  let closingMessage = flow_type === 'morning'
    ? 'Check-in matin enregistré ✓'
    : 'Check-in soir enregistré ✓'

  try {
    const systemPrompt = await buildSystemPrompt(cc.id as string)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${summary}\n\nGénère un message de clôture court (2-3 lignes max) personnalisé basé sur ces données. Sois direct et positif.`,
        },
      ],
    })
    closingMessage = completion.choices[0]?.message?.content ?? closingMessage
  } catch {
    // Non-blocking — fallback to default message
  }

  // Persist closing message to chat_messages
  const { data: savedMsg } = await db
    .from('chat_messages')
    .insert({
      client_id: cc.id,
      role: 'assistant',
      content: closingMessage,
      message_type: 'text',
    })
    .select('id, role, content, message_type, metadata, created_at')
    .single()

  // Update rate limit counter
  const today = computePhysiologicalDate(new Date())
  const { data: usage } = await db
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', cc.id)
    .eq('date', today)
    .maybeSingle()
  const count = usage?.message_count ?? 0
  await db.from('ai_coach_daily_usage').upsert(
    { client_id: cc.id, date: today, message_count: count + 1 },
    { onConflict: 'client_id,date' }
  )

  return NextResponse.json({
    closingMessage,
    botMessage: savedMsg,
    remaining: Math.max(0, 20 - (count + 1)),
  })
}
