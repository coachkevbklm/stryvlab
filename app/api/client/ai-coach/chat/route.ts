import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'

const DAILY_LIMIT = 20
const MAX_HISTORY = 20  // 10 exchanges × 2 messages each

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(500),
  })).max(MAX_HISTORY),
})

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id, first_name')
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Validate body ─────────────────────────────────────────────────────────
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messages } = parsed.data

  // ── Rate limit ────────────────────────────────────────────────────────────
  const today = computePhysiologicalDate(new Date())
  const { data: usage } = await svc()
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', client.id)
    .eq('date', today)
    .maybeSingle()

  const currentCount = usage?.message_count ?? 0
  if (currentCount >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'limit_reached', remaining: 0 }, { status: 429 })
  }

  // ── Build system prompt (server-side only, never returned to client) ───────
  let systemPrompt: string
  try {
    systemPrompt = await buildSystemPrompt(client.id as string)
  } catch {
    return NextResponse.json({ error: 'Context unavailable' }, { status: 500 })
  }

  // ── Call OpenAI ───────────────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let reply: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    })
    reply = completion.choices[0]?.message?.content ?? "Désolé, je n'ai pas pu générer une réponse."
  } catch {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  // ── Upsert usage ──────────────────────────────────────────────────────────
  await svc()
    .from('ai_coach_daily_usage')
    .upsert(
      { client_id: client.id, date: today, message_count: currentCount + 1 },
      { onConflict: 'client_id,date' }
    )

  const remaining = Math.max(0, DAILY_LIMIT - (currentCount + 1))
  return NextResponse.json({ reply, remaining })
}
