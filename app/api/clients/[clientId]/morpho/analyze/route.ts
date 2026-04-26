// POST /api/clients/[clientId]/morpho/analyze
// Déclenche une analyse morphologique via OpenAI Vision (async)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const bodySchema = z.object({
  submission_id: z.string().uuid().optional(),
})

type Params = { params: { clientId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const db = service()

  // Vérifier ownership coach → client
  const { data: client } = await db
    .from('coach_clients')
    .select('id')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  // Parser le body (submission_id optionnel)
  const bodyResult = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.message }, { status: 400 })
  }

  // Trouver la soumission (spécifiée ou la plus récente complète)
  let submissionId: string | null = null
  if (bodyResult.data.submission_id) {
    const { data: sub } = await db
      .from('assessment_submissions')
      .select('id')
      .eq('id', bodyResult.data.submission_id)
      .eq('client_id', params.clientId)
      .single()
    if (!sub) {
      return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
    }
    submissionId = sub.id
  } else {
    // Chercher la soumission complétée la plus récente qui contient des photos
    const { data: subs } = await db
      .from('assessment_submissions')
      .select('id')
      .eq('client_id', params.clientId)
      .eq('status', 'completed')
      .order('bilan_date', { ascending: false })
      .limit(10)

    if (!subs || subs.length === 0) {
      return NextResponse.json({ error: 'Aucun bilan complété trouvé' }, { status: 422 })
    }

    // Trouver le premier bilan qui a des photos
    for (const candidate of subs) {
      const { count } = await db
        .from('assessment_responses')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', candidate.id)
        .like('field_key', 'photo_%')
        .not('storage_path', 'is', null)

      if (count && count > 0) {
        submissionId = candidate.id
        break
      }
    }

    if (!submissionId) {
      return NextResponse.json({ error: 'Aucune photo trouvée dans les bilans récents. Ajoutez des photos à un bilan pour démarrer.' }, { status: 422 })
    }
  }

  // Bloquer si ce bilan a déjà une analyse completed (évite de réanalyser les mêmes photos)
  if (submissionId) {
    const { data: existing } = await db
      .from('morpho_analyses')
      .select('id')
      .eq('client_id', params.clientId)
      .eq('assessment_submission_id', submissionId)
      .eq('status', 'completed')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Ce bilan a déjà été analysé. Sélectionnez un autre bilan ou relancez depuis la liste.' },
        { status: 409 }
      )
    }
  }

  // Créer l'enregistrement morpho_analyses avec status=pending
  const jobId = `job_${Date.now()}_${params.clientId.slice(0, 8)}`
  const analysisDate = new Date().toISOString().split('T')[0]

  const { data: morphoAnalysis, error: insertError } = await db
    .from('morpho_analyses')
    .insert({
      client_id: params.clientId,
      assessment_submission_id: submissionId,
      analysis_date: analysisDate,
      status: 'pending',
      job_id: jobId,
      analyzed_by: user.id,
    })
    .select('id, job_id')
    .single()

  if (insertError || !morphoAnalysis) {
    console.error('[morpho/analyze] insert error:', insertError)
    return NextResponse.json({ error: 'Erreur création analyse', detail: insertError?.message }, { status: 500 })
  }

  // Envoyer l'événement Inngest — job géré avec retry, timeout et observabilité
  await inngest.send({
    name: 'morpho/analyze.requested',
    data: { morphoAnalysisId: morphoAnalysis.id },
  })

  return NextResponse.json(
    {
      job_id: morphoAnalysis.job_id,
      morpho_analysis_id: morphoAnalysis.id,
      status: 'queued',
      eta_seconds: 30,
    },
    { status: 202 }
  )
  } catch (err) {
    console.error('[morpho/analyze] unhandled error:', err)
    return NextResponse.json({ error: 'Erreur inattendue', detail: String(err) }, { status: 500 })
  }
}
