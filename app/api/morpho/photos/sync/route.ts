// app/api/morpho/photos/sync/route.ts
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

const bodySchema = z.object({ clientId: z.string().uuid() })

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
  }

  const db = service()
  const { clientId } = body.data

  // Vérifier ownership coach
  const { data: clientRow } = await db
    .from('coach_clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()

  if (!clientRow) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Récupérer toutes les submissions complétées du client
  const { data: submissions } = await db
    .from('assessment_submissions')
    .select('id, bilan_date')
    .eq('client_id', clientId)
    .eq('status', 'completed')

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const submissionIds = (submissions as Array<{ id: string; bilan_date: string }>).map(s => s.id)

  // Récupérer les assessment_responses avec photos
  const { data: responses } = await db
    .from('assessment_responses')
    .select('id, submission_id, storage_path, field_key')
    .in('submission_id', submissionIds)
    .like('field_key', 'photo_%')
    .not('storage_path', 'is', null)

  if (!responses || responses.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const submissionMap = new Map(
    (submissions as Array<{ id: string; bilan_date: string }>).map(s => [s.id, s.bilan_date])
  )

  function positionFromFieldKey(fieldKey: string): string {
    const key = fieldKey.replace('photo_', '')
    const map: Record<string, string> = {
      front: 'front', back: 'back', left: 'left', right: 'right',
      three_quarter_front_left: 'three_quarter_front_left',
      three_quarter_front_right: 'three_quarter_front_right',
    }
    return map[key] ?? 'front'
  }

  const toInsert = (responses as Array<{ id: string; submission_id: string; storage_path: string; field_key: string }>)
    .filter(r => r.storage_path)
    .map(r => ({
      client_id: clientId,
      coach_id: user.id,
      storage_path: r.storage_path,
      position: positionFromFieldKey(r.field_key),
      taken_at: submissionMap.get(r.submission_id) ?? new Date().toISOString().split('T')[0],
      source: 'assessment',
      assessment_response_id: r.id,
    }))

  const { data: inserted, error: insertError } = await db
    .from('morpho_photos')
    .upsert(toInsert, { onConflict: 'assessment_response_id', ignoreDuplicates: true })
    .select('id')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ synced: inserted?.length ?? 0 })
}
