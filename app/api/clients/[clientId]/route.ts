import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/clients/[clientId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await serviceClient()
    .from('coach_clients')
    .select('*')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  return NextResponse.json({ client: data })
}

// PATCH /api/clients/[clientId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json()
  const allowed = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'notes', 'status',
    'training_goal', 'fitness_level', 'sport_practice', 'weekly_frequency', 'equipment_category',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await serviceClient()
    .from('coach_clients')
    .update(update)
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .select()
    .single()

  if (error || !data) {
    console.error('PATCH /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }

  return NextResponse.json({ client: data })
}
