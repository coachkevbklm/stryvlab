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

/**
 * Find an auth user by email without listUsers() pagination truncation.
 * listUsers() defaults to 50 — we use perPage: 1000 to cover real-world scale.
 */
async function findAuthUserByEmail(db: ReturnType<typeof service>, email: string) {
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error || !data) return null
  return data.users.find((u) => u.email === email) ?? null
}

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

  const existingUser = await findAuthUserByEmail(db, client.email)

  if (existingUser) {
    // A suspended client has already set their password — they know their credentials.
    // Just unban and send the reactivation email (no new invite link needed).
    // We use coach_clients.status rather than last_sign_in_at because last_sign_in_at
    // is set by OTP verification even when the user never completed set-password.
    const isSuspended = client.status === 'suspended'

    if (isSuspended) {
      // User has previously logged in: they know their password.
      // Just unban + send "accès restauré" email with login link.
      const { error: unbanError } = await db.auth.admin.updateUserById(existingUser.id, {
        ban_duration: 'none',
      })
      if (unbanError) {
        console.error('unban error:', unbanError)
        return NextResponse.json({ error: 'Impossible de réactiver le compte' }, { status: 500 })
      }

      await db
        .from('coach_clients')
        .update({ status: 'active', user_id: existingUser.id })
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

    // User exists but is NOT suspended (status = 'inactive' or 'active'): they may
    // never have completed set-password, or were manually deactivated. Unban +
    // generate a fresh recovery link so they can complete the flow.
    await db.auth.admin.updateUserById(existingUser.id, { ban_duration: 'none' })
  }

  // Generate a recovery (set-password) link.
  // For a brand-new user: createUser first, then generateLink.
  // For an existing user that never logged in: generateLink directly.
  let authUserId: string

  if (!existingUser) {
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: client.email,
      email_confirm: true,
      password: crypto.randomUUID(), // placeholder — overwritten when client sets their password
    })

    if (createError || !created?.user) {
      console.error('createUser error:', createError)
      return NextResponse.json({ error: 'Impossible de créer le compte' }, { status: 500 })
    }

    authUserId = created.user.id
  } else {
    authUserId = existingUser.id
  }

  // type 'recovery' works for both new and existing users (no 422 on existing email),
  // and reliably produces a #access_token hash on all browsers including mobile Safari.
  // type 'invite' / 'magiclink' can strip the hash on some mobile redirects.
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: client.email,
    options: { redirectTo: `${siteUrl}/client/onboarding` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('generateLink recovery error:', linkError)
    return NextResponse.json({ error: 'Impossible de générer le lien d\'invitation' }, { status: 500 })
  }

  // Link the Supabase auth user to this coach_clients record.
  // Required for ban/unban operations in the access route.
  await db
    .from('coach_clients')
    .update({ status: 'active', user_id: authUserId })
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
