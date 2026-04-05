import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/assessments/public/[token]/upload-url — génère une signed upload URL
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const db = serviceClient()

  const { data: submission } = await db
    .from('assessment_submissions')
    .select('id, coach_id, client_id, status, token_expires_at')
    .eq('token', params.token)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
  }

  if (submission.status === 'completed' || submission.status === 'expired') {
    return NextResponse.json({ error: 'Ce bilan ne peut plus être modifié' }, { status: 410 })
  }

  if (new Date(submission.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 })
  }

  const { field_key, file_extension } = await req.json()

  if (!field_key || !file_extension) {
    return NextResponse.json({ error: 'field_key et file_extension sont obligatoires' }, { status: 400 })
  }

  const storagePath = `${submission.coach_id}/${submission.client_id}/${submission.id}/${field_key}.${file_extension}`

  const { data, error } = await db.storage
    .from('assessment-photos')
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    console.error('upload-url:', error)
    return NextResponse.json({ error: 'Impossible de générer l\'URL' }, { status: 500 })
  }

  return NextResponse.json({
    upload_url:   data.signedUrl,
    storage_path: storagePath,
  })
}
