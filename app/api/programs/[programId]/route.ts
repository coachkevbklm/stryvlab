import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { programId: string } }

// PATCH /api/programs/[programId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { name, description, weeks, status, progressive_overload_enabled } = body

  const patch: Record<string, unknown> = {}
  if (name !== undefined) patch.name = name
  if (description !== undefined) patch.description = description
  if (weeks !== undefined) patch.weeks = weeks
  if (status !== undefined) patch.status = status
  if (progressive_overload_enabled !== undefined) patch.progressive_overload_enabled = progressive_overload_enabled

  const { data, error } = await service()
    .from('programs')
    .update(patch)
    .eq('id', params.programId)
    .eq('coach_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 })
  return NextResponse.json({ program: data })
}

// DELETE /api/programs/[programId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await service()
    .from('programs')
    .delete()
    .eq('id', params.programId)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
