import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getClientId(userId: string): Promise<string | null> {
  const { data } = await svc().from('coach_clients').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'

  const clientId = await getClientId(user.id)

  // Source 1: legacy client_notifications (system + coach messages)
  const legacyQ = svc()
    .from('client_notifications')
    .select('id, type, message, read, created_at')
    .eq('target_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (unreadOnly) legacyQ.eq('read', false)
  const { data: legacy } = await legacyQ

  const legacyMapped = (legacy ?? []).map(n => ({
    id: `legacy_${n.id}`,
    type: (n.type ?? 'system_reminder') as 'coach_note' | 'bilan_pending' | 'program_assigned' | 'system_reminder',
    title: n.message ?? '',
    body: null as string | null,
    payload: null as Record<string, unknown> | null,
    read_at: n.read ? n.created_at : null,
    created_at: n.created_at,
  }))

  // Source 2: coach_client_notifications (new table, requires client_id)
  let coachMapped: typeof legacyMapped = []
  if (clientId) {
    let q = svc()
      .from('coach_client_notifications')
      .select('id, type, title, body, payload, read_at, created_at')
      .eq('client_id', clientId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
    if (unreadOnly) q = q.is('read_at', null)
    const { data: coach } = await q
    coachMapped = (coach ?? []).map(n => ({
      id: n.id,
      type: n.type as 'coach_note' | 'bilan_pending' | 'program_assigned' | 'system_reminder',
      title: n.title,
      body: n.body,
      payload: n.payload,
      read_at: n.read_at,
      created_at: n.created_at,
    }))
  }

  // Merge + sort by created_at desc, cap at 20
  const merged = [...legacyMapped, ...coachMapped]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20)

  return NextResponse.json({ notifications: merged })
}

export async function PATCH(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await getClientId(user.id)
  if (!clientId) return NextResponse.json({ ok: true })

  await svc()
    .from('coach_client_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .is('read_at', null)

  return NextResponse.json({ ok: true })
}
