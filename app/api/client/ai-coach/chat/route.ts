import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'

const MAX_MESSAGES = 20
const MAX_HISTORY  = 20

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_HISTORY),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await resolveClientFromUser(
    user.id,
    user.email,
    svc(),
    'id, first_name',
  )
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const today = computePhysiologicalDate(new Date())
  const db = svc()

  // ── Rate limit check ────────────────────────────────────────────────────────
  const { data: usage } = await db
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', client.id)
    .eq('date', today)
    .maybeSingle()

  const used = usage?.message_count ?? 0
  if (used >= MAX_MESSAGES) {
    return NextResponse.json(
      { error: 'limit_reached', remaining: 0 },
      { status: 429 },
    )
  }

  // ── Build system prompt (server-side only, never sent to client) ────────────
  const systemPrompt = await buildSystemPrompt(client.id)

  // ── OpenAI call ─────────────────────────────────────────────────────────────
  let reply: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...body.data.messages,
      ],
    })
    reply = completion.choices[0]?.message?.content?.trim() ?? "Désolé, je n'ai pas pu répondre."
  } catch (err) {
    console.error('[ai-coach/chat] OpenAI error:', err)
    return NextResponse.json({ error: 'openai_error' }, { status: 500 })
  }

  // ── Increment counter (upsert) ──────────────────────────────────────────────
  await db
    .from('ai_coach_daily_usage')
    .upsert(
      { client_id: client.id, date: today, message_count: used + 1 },
      { onConflict: 'client_id,date' },
    )

  return NextResponse.json({
    reply,
    remaining: MAX_MESSAGES - (used + 1),
  })
}
