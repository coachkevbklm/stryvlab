// app/api/morpho/photos/route.ts
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

const querySchema = z.object({
  clientId: z.string().uuid(),
  position: z.string().optional(),
  source: z.enum(['assessment', 'coach_upload']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const params = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!params.success) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
  }

  const db = service()
  const { clientId, position, source, from, to } = params.data

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

  let query = db
    .from('morpho_photos')
    .select('id, client_id, storage_path, position, taken_at, source, notes, created_at')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: false })

  if (position) query = query.eq('position', position)
  if (source) query = query.eq('source', source)
  if (from) query = query.gte('taken_at', from)
  if (to) query = query.lte('taken_at', to)

  const { data: photos, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ photos: [] })
  }

  // Récupérer les annotations existantes pour ces photos
  const photoIds = (photos as Array<{ id: string }>).map(p => p.id)
  const { data: annotations } = await db
    .from('morpho_annotations')
    .select('photo_id, thumbnail_path')
    .in('photo_id', photoIds)
    .eq('coach_id', user.id)

  const annotationMap = new Map(
    (annotations ?? []).map((a: { photo_id: string; thumbnail_path: string | null }) => [
      a.photo_id,
      a.thumbnail_path,
    ])
  )

  // Générer les signed URLs (bucket selon source)
  const enriched = await Promise.all(
    (photos as Array<{ id: string; storage_path: string; source: string; position: string; taken_at: string; notes: string | null; created_at: string }>).map(async (photo) => {
      const bucket = photo.source === 'assessment' ? 'assessment-photos' : 'morpho-photos'
      const { data: signedUrl } = await db.storage
        .from(bucket)
        .createSignedUrl(photo.storage_path, 3600)

      const thumbnailPath = annotationMap.get(photo.id) ?? null
      let thumbnailUrl: string | null = null
      if (thumbnailPath) {
        const { data: thumbSigned } = await db.storage
          .from('morpho-photos')
          .createSignedUrl(thumbnailPath, 3600)
        thumbnailUrl = thumbSigned?.signedUrl ?? null
      }

      return {
        ...photo,
        signed_url: signedUrl?.signedUrl ?? null,
        has_annotation: annotationMap.has(photo.id),
        thumbnail_url: thumbnailUrl,
      }
    })
  )

  return NextResponse.json({ photos: enriched })
}
