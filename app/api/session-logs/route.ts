import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/session-logs — démarrer une séance
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Résoudre client_id depuis user_id
  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Profil client introuvable' }, { status: 404 })

  const body = await req.json()
  const { program_session_id, session_name, set_logs } = body
  if (!session_name) return NextResponse.json({ error: 'session_name requis' }, { status: 400 })

  const db = service()

  // Créer le session log
  const { data: sessionLog, error: slError } = await db
    .from('client_session_logs')
    .insert({ client_id: client.id, program_session_id, session_name })
    .select()
    .single()

  if (slError || !sessionLog) return NextResponse.json({ error: slError?.message }, { status: 500 })

  // Insérer les set logs si fournis
  if (Array.isArray(set_logs) && set_logs.length > 0) {
    const rows = set_logs.map((s: any) => ({
      session_log_id: sessionLog.id,
      exercise_id: s.exercise_id ?? null,
      exercise_name: s.exercise_name,
      set_number: s.set_number,
      planned_reps: s.planned_reps ?? null,
      actual_reps: s.actual_reps ?? null,
      actual_weight_kg: s.actual_weight_kg ?? null,
      completed: s.completed ?? false,
      rpe: s.rpe ?? null,
      notes: s.notes ?? null,
    }))
    await db.from('client_set_logs').insert(rows)
  }

  return NextResponse.json({ session_log: sessionLog }, { status: 201 })
}

// GET /api/session-logs?client_id=xxx — historique (pour le coach)
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  // Vérifier que ce client appartient au coach
  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const { data, error } = await service()
    .from('client_session_logs')
    .select(`
      id, session_name, logged_at, completed_at, duration_min, notes, created_at,
      client_set_logs (
        id, exercise_name, set_number, planned_reps, actual_reps, actual_weight_kg, completed, rpe, notes
      )
    `)
    .eq('client_id', clientId)
    .order('logged_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}
