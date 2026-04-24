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

// GET /api/programs?client_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const { data, error } = await service()
    .from('programs')
    .select(`
      id, name, description, goal, level, frequency, weeks, muscle_tags,
      equipment_archetype, session_mode, status, is_client_visible, created_at,
      program_sessions (
        id, name, day_of_week, position, notes,
        program_exercises (
          id, name, sets, reps, rest_sec, rir, notes, position, image_url,
          movement_pattern, equipment_required, primary_muscles, secondary_muscles,
          group_id, is_compound, target_rir, weight_increment_kg,
          plane, mechanic, unilateral, primary_muscle, primary_activation,
          secondary_muscles_detail, secondary_activations, stabilizers,
          joint_stress_spine, joint_stress_knee, joint_stress_shoulder,
          global_instability, coordination_demand, constraint_profile
        )
      )
    `)
    .eq('client_id', clientId)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ programs: data })
}

// POST /api/programs — créer un programme
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { client_id, name, description, weeks } = body

  if (!client_id || !name) return NextResponse.json({ error: 'client_id et name requis' }, { status: 400 })

  const { data, error } = await service()
    .from('programs')
    .insert({ coach_id: user.id, client_id, name, description, weeks: weeks ?? 4 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notif client — programme assigné
  await insertClientNotification(service(), {
    coachId:  user.id,
    clientId: client_id,
    type:     'program_assigned',
    message:  `Ton coach t'a assigné un nouveau programme : "${name}".`,
  })

  return NextResponse.json({ program: data }, { status: 201 })
}
