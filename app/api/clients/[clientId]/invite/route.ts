import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendInvitationEmail, sendReactivationEmail } from '@/lib/email/mailer'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { clientId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = service()

  const { data: client } = await db
    .from('coach_clients')
    .select('id, email, first_name, last_name, status')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'Ce client n\'a pas d\'email' }, { status: 422 })

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  const coachFirstName = (user.user_metadata?.first_name as string | undefined) ?? null
  const coachLastName  = (user.user_metadata?.last_name  as string | undefined) ?? null
  const coachName = coachFirstName
    ? `${coachFirstName}${coachLastName ? ' ' + coachLastName : ''}`
    : null

  // Chercher si le compte Supabase existe déjà pour cet email
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u: { email?: string }) => u.email === client.email)

  if (existingUser) {
    // Compte existant — réactivation : débannir + email "accès restauré"
    const { error: unbanError } = await db.auth.admin.updateUserById(existingUser.id, {
      ban_duration: 'none',
    })
    if (unbanError) {
      console.error('unban error:', unbanError)
      return NextResponse.json({ error: 'Impossible de réactiver le compte' }, { status: 500 })
    }

    await db
      .from('coach_clients')
      .update({ status: 'active' })
      .eq('id', params.clientId)

    try {
      await sendReactivationEmail({
        to: client.email,
        clientFirstName: client.first_name ?? 'vous',
        coachName,
        loginUrl: `${siteUrl}/client/login`,
      })
    } catch (emailError) {
      console.error('Reactivation email failed:', emailError)
      // Non-bloquant — le compte est réactivé même si l'email échoue
    }

    return NextResponse.json({ success: true, mode: 'reactivated' })
  }

  // Nouveau compte — créer sans email Supabase, puis générer lien recovery
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: client.email,
    email_confirm: true,
    password: crypto.randomUUID(),
  })

  if (createError || !created?.user) {
    console.error('createUser error:', createError)
    return NextResponse.json({ error: 'Impossible de créer le compte' }, { status: 500 })
  }

  // generateLink type 'recovery' : génère le lien reset-password SANS envoyer d'email Supabase
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: client.email,
    options: { redirectTo: `${siteUrl}/client/set-password` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('generateLink recovery error:', linkError)
    return NextResponse.json({ error: 'Impossible de générer le lien d\'invitation' }, { status: 500 })
  }

  await db
    .from('coach_clients')
    .update({ status: 'active' })
    .eq('id', params.clientId)

  try {
    await sendInvitationEmail({
      to: client.email,
      clientFirstName: client.first_name ?? 'vous',
      coachName,
      setupPasswordUrl: linkData.properties.action_link,
    })
  } catch (emailError) {
    console.error('Invitation email failed:', emailError)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }

  return NextResponse.json({ success: true, mode: 'invited' })
}
