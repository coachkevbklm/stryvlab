import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { BulkResponsePayload } from '@/types/assessment'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/assessments/submissions/[submissionId]/responses — bulk upsert (mode coach)
export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body: BulkResponsePayload = await req.json()
  const db = serviceClient()

  // Vérifier ownership
  const { data: submission } = await db
    .from('assessment_submissions')
    .select('id, client_id, status')
    .eq('id', params.submissionId)
    .eq('coach_id', user.id)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  }

  if (!Array.isArray(body.responses) || body.responses.length === 0) {
    return NextResponse.json({ error: 'Aucune réponse fournie' }, { status: 400 })
  }

  // Upsert des réponses
  const rows = body.responses.map(r => ({
    submission_id: params.submissionId,
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
    console.error('POST responses:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Submit final si demandé
  if (body.submit) {
    await db
      .from('assessment_submissions')
      .update({ status: 'completed', submitted_at: new Date().toISOString() })
      .eq('id', params.submissionId)

    await db.from('client_notifications').insert({
      coach_id:      user.id,
      client_id:     submission.client_id,
      submission_id: params.submissionId,
      type:          'assessment_completed',
      message:       `Bilan rempli par le coach.`,
    })
  }

  return NextResponse.json({ success: true })
}
