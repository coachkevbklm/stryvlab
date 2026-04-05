import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { insertClientNotification } from '@/lib/notifications/insert-client-notification'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { logId: string } }

// PATCH /api/session-logs/[logId] — mettre à jour (compléter, durée, sets)
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Profil client introuvable' }, { status: 404 })

  const body = await req.json()
  const { completed, duration_min, notes, set_logs } = body

  const db = service()

  // Mettre à jour le session log
  const patch: any = {}
  if (notes !== undefined) patch.notes = notes
  if (duration_min !== undefined) patch.duration_min = duration_min
  if (completed) patch.completed_at = new Date().toISOString()

  if (Object.keys(patch).length > 0) {
    await db
      .from('client_session_logs')
      .update(patch)
      .eq('id', params.logId)
      .eq('client_id', client.id)
  }

  // Double progression — évaluation automatique quand la séance est complétée
  if (completed) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    fetch(`${baseUrl}/api/progression/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify({ session_log_id: params.logId }),
    }).catch(err => console.warn('[progression] evaluate failed silently:', err))
    // Fire-and-forget — non bloquant sur la réponse client
  }

  // Notif coach quand la séance est complétée
  if (completed) {
    const { data: log } = await db
      .from('client_session_logs')
      .select('session_name, coach_clients(coach_id, first_name, last_name)')
      .eq('id', params.logId)
      .single()

    const coachId = (log?.coach_clients as any)?.coach_id
    const clientName = [
      (log?.coach_clients as any)?.first_name,
      (log?.coach_clients as any)?.last_name,
    ].filter(Boolean).join(' ') || 'Le client'

    if (coachId) {
      await insertClientNotification(db, {
        coachId,
        clientId:  client.id,
        type:      'session_reminder',
        message:   `${clientName} a complété la séance "${log?.session_name ?? 'Séance'}".`,
      })
    }
  }

  // Upsert des set logs
  if (Array.isArray(set_logs)) {
    for (const s of set_logs) {
      if (s.id) {
        await db.from('client_set_logs').update({
          actual_reps: s.actual_reps,
          actual_weight_kg: s.actual_weight_kg,
          completed: s.completed,
          rpe: s.rpe,
          notes: s.notes,
        }).eq('id', s.id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
