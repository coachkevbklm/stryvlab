import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'
import OpenAI from 'openai'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DAILY_LIMIT = 20

// GET — messages actifs (3 derniers jours, archived_at IS NULL)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = service()
  const cc = await resolveClientFromUser(user.id, user.email, db, 'id')
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

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

  const completion = await openai.chat.completions.create({
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
