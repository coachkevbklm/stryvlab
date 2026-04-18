// POST /api/clients/[clientId]/morpho/job-status
// Polling du statut d'un job d'analyse morphologique

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const bodySchema = z.object({
  job_id: z.string().min(1),
})

type Params = { params: { clientId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const db = service()

  // Vérifier ownership
  const { data: client } = await db
    .from('coach_clients')
    .select('id')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const bodyResult = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!bodyResult.success) {
    return NextResponse.json({ error: bodyResult.error.message }, { status: 400 })
  }

  const { data: analysis } = await db
    .from('morpho_analyses')
    .select(
      'id, status, error_message, body_composition, dimensions, asymmetries, stimulus_adjustments'
    )
    .eq('client_id', params.clientId)
    .eq('job_id', bodyResult.data.job_id)
    .single()

  if (!analysis) {
    return NextResponse.json({ error: 'Job introuvable' }, { status: 404 })
  }

  const response: Record<string, unknown> = {
    status: analysis.status,
    morpho_analysis_id: analysis.id,
  }

  if (analysis.status === 'failed') {
    response.error_message = analysis.error_message
  }

  if (analysis.status === 'completed') {
    response.result = {
      body_composition: analysis.body_composition,
      dimensions: analysis.dimensions,
      asymmetries: analysis.asymmetries,
      stimulus_adjustments: analysis.stimulus_adjustments,
    }
  }

  return NextResponse.json(response)
}
