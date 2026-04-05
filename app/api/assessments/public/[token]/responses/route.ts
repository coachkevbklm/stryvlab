import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { BulkResponsePayload } from '@/types/assessment'
import { sendBilanCompletedEmail } from '@/lib/email/mailer'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/assessments/public/[token]/responses — sans auth (client)
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const db = serviceClient()

  // Valider token
  const { data: submission } = await db
    .from('assessment_submissions')
    .select(`
      id, coach_id, client_id, status, token_expires_at,
      template_snapshot,
      client:coach_clients(first_name, last_name)
    `)
    .eq('token', params.token)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
  }

  if (submission.status === 'completed' || submission.status === 'expired') {
    return NextResponse.json({ error: 'Ce bilan ne peut plus être modifié' }, { status: 410 })
  }

  if (new Date(submission.token_expires_at) < new Date()) {
    await db.from('assessment_submissions').update({ status: 'expired' }).eq('id', submission.id)
    return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 })
  }

  const body: BulkResponsePayload = await req.json()

  if (!Array.isArray(body.responses) || body.responses.length === 0) {
    return NextResponse.json({ error: 'Aucune réponse fournie' }, { status: 400 })
  }

  const rows = body.responses.map(r => ({
    submission_id: submission.id,
    block_id:      r.block_id,
    field_key:     r.field_key,
    value_text:    r.value_text   ?? null,
    value_number:  r.value_number ?? null,
    value_json:    r.value_json   ?? null,
    storage_path:  r.storage_path ?? null,
  }))

  const { error: upsertError } = await db
    .from('assessment_responses')
    .upsert(rows, { onConflict: 'submission_id,block_id,field_key' })

  if (upsertError) {
    console.error('POST public responses:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  if (body.submit) {
    await db
      .from('assessment_submissions')
      .update({ status: 'completed', submitted_at: new Date().toISOString() })
      .eq('id', submission.id)

    await db.from('client_notifications').insert({
      coach_id:      submission.coach_id,
      client_id:     submission.client_id,
      submission_id: submission.id,
      type:          'assessment_completed',
      message:       `Le client a complété son bilan.`,
    })

    // Email de notification au coach
    try {
      const { data: coachAuth } = await db.auth.admin.getUserById(submission.coach_id)
      const coachEmail = coachAuth?.user?.email
      const coachFirstName = (coachAuth?.user?.user_metadata?.first_name as string | undefined) ?? 'Coach'
      if (coachEmail) {
        const client = submission.client as any
        const templateName = (submission.template_snapshot as any)?.[0]?.name
          ?? (submission.template_snapshot as any)?.name
          ?? 'Bilan'
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/coach/clients/${submission.client_id}`
        await sendBilanCompletedEmail({
          to: coachEmail,
          coachFirstName,
          clientFullName: client ? `${client.first_name} ${client.last_name}` : 'Votre client',
          templateName,
          dashboardUrl,
        })
      }
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError)
    }
  }

  return NextResponse.json({ success: true })
}
