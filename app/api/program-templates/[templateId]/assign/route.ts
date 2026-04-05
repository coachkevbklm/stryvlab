import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { insertClientNotification } from '@/lib/notifications/insert-client-notification'
import { parseRepsRange } from '@/lib/progression/double-progression'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/program-templates/[templateId]/assign
// Crée un coach_program pour un client depuis un template
export async function POST(req: NextRequest, { params }: { params: { templateId: string } }) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { client_id, name_override } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id requis' }, { status: 400 })

  const db = service()

  // Vérifier ownership template
  const { data: template } = await db
    .from('coach_program_templates')
    .select(`
      id, name, weeks, goal, level,
      coach_program_template_sessions (
        id, name, day_of_week, position, notes,
        coach_program_template_exercises (
          name, sets, reps, rest_sec, rir, notes, position, image_url
        )
      )
    `)
    .eq('id', params.templateId)
    .or(`coach_id.eq.${user.id},is_system.eq.true`)
    .single()

  if (!template) return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })

  // Vérifier ownership client
  const { data: client } = await db
    .from('coach_clients')
    .select('id, first_name, last_name')
    .eq('id', client_id)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const programName = name_override || `${template.name} — ${client.first_name} ${client.last_name}`

  // Créer le programme
  const { data: program, error: programError } = await db
    .from('programs')
    .insert({ coach_id: user.id, client_id, name: programName, weeks: template.weeks, description: `Basé sur le template "${template.name}"` })
    .select('id')
    .single()

  if (programError || !program) {
    console.error('[assign] program insert error:', programError)
    return NextResponse.json({ error: programError?.message ?? 'Erreur création programme' }, { status: 500 })
  }

  // Copier les sessions + exercices
  const sessions = (template.coach_program_template_sessions ?? [])
    .sort((a: any, b: any) => a.position - b.position)

  for (const s of sessions) {
    const { data: session, error: sessionError } = await db
      .from('program_sessions')
      .insert({ program_id: program.id, name: s.name, day_of_week: s.day_of_week, position: s.position, notes: s.notes })
      .select('id')
      .single()

    if (sessionError) console.error('[assign] session insert error:', sessionError)

    if (session && s.coach_program_template_exercises?.length) {
      const { error: exError } = await db.from('program_exercises').insert(
        (s.coach_program_template_exercises as any[])
          .sort((a, b) => a.position - b.position)
          .map((e, ei) => {
            // Parser rep_min/rep_max depuis le champ reps texte
            const parsed = parseRepsRange(e.reps ?? '')
            return {
              session_id: session.id,
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              rest_sec: e.rest_sec,
              rir: e.rir,
              notes: e.notes,
              position: ei,
              image_url: e.image_url ?? null,
              // Double progression — parsé automatiquement depuis le template
              rep_min: parsed?.rep_min ?? null,
              rep_max: parsed?.rep_max ?? null,
              target_rir: e.rir ?? null,
              weight_increment_kg: 2.5,  // défaut — coach peut ajuster ensuite
            }
          })
      )
      if (exError) console.error('[assign] exercises insert error:', exError)
    }
  }

  // Notif client — programme assigné depuis template
  await insertClientNotification(db, {
    coachId:  user.id,
    clientId: client_id,
    type:     'program_assigned',
    message:  `Ton coach t'a assigné un nouveau programme : "${programName}".`,
  })

  return NextResponse.json({ program_id: program.id, client_id }, { status: 201 })
}
