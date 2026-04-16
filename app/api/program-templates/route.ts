import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SELECT = `
  id, name, description, goal, level, frequency, weeks, muscle_tags, notes, is_public, is_system, coach_id, equipment_archetype, created_at,
  coach_program_template_sessions (
    id, name, day_of_week, position, notes,
    coach_program_template_exercises (
      id, name, sets, reps, rest_sec, rir, notes, position, image_url, movement_pattern, equipment_required, primary_muscles, secondary_muscles
    )
  )
`

// GET /api/program-templates — liste avec filtres
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const goal = searchParams.get('goal')
  const level = searchParams.get('level')
  const frequency = searchParams.get('frequency')
  const muscle = searchParams.get('muscle')

  let query = service()
    .from('coach_program_templates')
    .select(SELECT)
    .or(`coach_id.eq.${user.id},is_system.eq.true`)
    .order('is_system', { ascending: true })   // templates système en dernier
    .order('created_at', { ascending: false })

  if (goal) query = query.eq('goal', goal)
  if (level) query = query.eq('level', level)
  if (frequency) query = query.eq('frequency', parseInt(frequency))
  if (muscle) query = query.contains('muscle_tags', [muscle])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST /api/program-templates — créer un template complet
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { name, description, goal, level, frequency, weeks, muscle_tags, notes, sessions } = body

  if (!name) return NextResponse.json({ error: 'name requis' }, { status: 400 })

  const db = service()

  // Créer le template
  const { data: template, error: tErr } = await db
    .from('coach_program_templates')
    .insert({ coach_id: user.id, name, description, goal, level, frequency, weeks, muscle_tags: muscle_tags ?? [], notes, equipment_archetype: body.equipment_archetype || null })
    .select('id')
    .single()

  if (tErr || !template) return NextResponse.json({ error: tErr?.message }, { status: 500 })

  // Créer les sessions + exercices
  for (let si = 0; si < (sessions ?? []).length; si++) {
    const s = sessions[si]
    const { data: session } = await db
      .from('coach_program_template_sessions')
      .insert({ template_id: template.id, name: s.name, day_of_week: s.day_of_week ?? null, position: si, notes: s.notes ?? null })
      .select('id')
      .single()

    if (session && s.exercises?.length) {
      await db.from('coach_program_template_exercises').insert(
        s.exercises.map((e: any, ei: number) => ({
          session_id: session.id,
          name: e.name,
          sets: e.sets ?? 3,
          reps: e.reps ?? '8-12',
          rest_sec: e.rest_sec ?? null,
          rir: e.rir ?? null,
          notes: e.notes ?? null,
          position: ei,
          image_url: e.image_url ?? null,
          movement_pattern: e.movement_pattern ?? null,
          equipment_required: e.equipment_required ?? [],
          primary_muscles: e.primary_muscles ?? [],
          secondary_muscles: e.secondary_muscles ?? [],
        }))
      )
    }
  }

  const { data: full } = await db.from('coach_program_templates').select(SELECT).eq('id', template.id).single()
  return NextResponse.json({ template: full }, { status: 201 })
}
