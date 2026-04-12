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

// DELETE /api/clients/[clientId]/access — révoque l'accès client (status inactive + token révoqué)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = service()

  // Vérifier ownership
  const { data: client } = await db
    .from('coach_clients')
    .select('id')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  // Passer status à 'inactive'
  const { error: statusError } = await db
    .from('coach_clients')
    .update({ status: 'inactive' })
    .eq('id', params.clientId)

  if (statusError) return NextResponse.json({ error: statusError.message }, { status: 500 })

  // Révoquer le token d'accès (si existant)
  await db
    .from('client_access_tokens')
    .update({ revoked: true })
    .eq('client_id', params.clientId)
    .eq('coach_id', user.id)

  return NextResponse.json({ success: true })
}
