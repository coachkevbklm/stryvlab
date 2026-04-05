import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendAccessLinkEmail } from '@/lib/email/mailer'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { clientId: string } }

// POST /api/clients/[clientId]/access-token — génère ou renouvelle le lien d'accès
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const sendEmail: boolean = body.send_email === true

  const db = service()

  // Vérifier ownership
  const { data: client } = await db
    .from('coach_clients')
    .select('id, email, first_name, last_name')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'Ce client n\'a pas d\'email' }, { status: 422 })

  // Générer un magic link Supabase via admin API
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: client.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client`,
    },
  })

  if (linkError || !linkData) {
    console.error('generateLink error:', linkError)
    return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 })
  }

  // Extraire le token de la magic link pour construire notre URL relay
  const magicUrl = linkData.properties?.action_link ?? ''

  // Upsert dans client_access_tokens (unique par client)
  const { data: tokenRow, error: tokenError } = await db
    .from('client_access_tokens')
    .upsert(
      {
        coach_id: user.id,
        client_id: params.clientId,
        magic_url: magicUrl,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        revoked: false,
      },
      { onConflict: 'client_id' }
    )
    .select('token')
    .single()

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const accessUrl = `${baseUrl}/client/access/${tokenRow.token}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  if (sendEmail && client.email) {
    const coachFirstName = (user.user_metadata?.first_name as string | undefined) ?? null
    const coachLastName  = (user.user_metadata?.last_name  as string | undefined) ?? null
    const coachName = coachFirstName
      ? `${coachFirstName}${coachLastName ? ' ' + coachLastName : ''}`
      : null
    try {
      await sendAccessLinkEmail({
        to: client.email,
        clientFirstName: client.first_name,
        coachName,
        accessUrl,
        expiresAt,
      })
    } catch (emailError) {
      console.error('Access link email failed (non-blocking):', emailError)
    }
  }

  return NextResponse.json({ token: tokenRow.token, access_url: accessUrl, email_sent: sendEmail && !!client.email })
}

// DELETE /api/clients/[clientId]/access-token — révoque le lien
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await service()
    .from('client_access_tokens')
    .update({ revoked: true })
    .eq('client_id', params.clientId)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// GET /api/clients/[clientId]/access-token — récupère le token actif
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await service()
    .from('client_access_tokens')
    .select('token, expires_at, revoked, created_at')
    .eq('client_id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!data) return NextResponse.json({ token: null })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return NextResponse.json({
    token: data.revoked ? null : data.token,
    expires_at: data.expires_at,
    revoked: data.revoked,
    access_url: data.revoked ? null : `${baseUrl}/client/access/${data.token}`,
  })
}
