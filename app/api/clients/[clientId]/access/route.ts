import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { clientId: string } }

// DELETE /api/clients/[clientId]/access — suspend client: ban Supabase account + status=suspended
export async function DELETE(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = service()

  // Vérifier ownership
  const { data: client } = await db
    .from('coach_clients')
    .select('id, email')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  // Bannir le compte Supabase si il existe (ban_duration 87600h = ~10 ans = suspension permanente)
  if (client.email) {
    const { data: users } = await db.auth.admin.listUsers()
    const supabaseUser = users?.users?.find((u: { email?: string }) => u.email === client.email)
    if (supabaseUser) {
      await db.auth.admin.updateUserById(supabaseUser.id, {
        ban_duration: '87600h',
      })
    }
  }

  // Mettre à jour le statut en DB
  const { error } = await db
    .from('coach_clients')
    .update({ status: 'suspended' })
    .eq('id', params.clientId)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
