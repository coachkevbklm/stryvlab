import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function resolveClientId(userId: string): Promise<string | null> {
  const { data } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

// GET /api/client/meals?date=YYYY-MM-DD&page=0&limit=20
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await resolveClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const url = new URL(req.url)
  const dateFilter = url.searchParams.get('date')
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)

  let query = service()
    .from('meal_logs')
    .select('*', { count: 'exact' })
    .eq('client_id', clientId)
    .order('logged_at', { ascending: true })
    .range(page * limit, (page + 1) * limit - 1)

  if (dateFilter) {
    query = query
      .gte('logged_at', `${dateFilter}T00:00:00.000Z`)
      .lte('logged_at', `${dateFilter}T23:59:59.999Z`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit })
}

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  logged_at: z.string().datetime().optional(),
  photo_url: z.string().url().nullable().optional(),
  quality_rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  estimated_macros: z.object({
    calories_kcal: z.number().nonnegative().optional(),
    protein_g: z.number().nonnegative().optional(),
    carbs_g: z.number().nonnegative().optional(),
    fats_g: z.number().nonnegative().optional(),
    fiber_g: z.number().nonnegative().optional(),
  }).nullable().optional(),
})

// POST /api/client/meals
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await resolveClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { data, error } = await service()
    .from('meal_logs')
    .insert({
      client_id: clientId,
      name: body.data.name,
      logged_at: body.data.logged_at ?? new Date().toISOString(),
      photo_url: body.data.photo_url ?? null,
      quality_rating: body.data.quality_rating ?? null,
      notes: body.data.notes ?? null,
      estimated_macros: body.data.estimated_macros ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award points for logging a meal (fire and forget)
  await service().from('client_points').insert({
    client_id: clientId,
    action_type: 'meal',
    points: 3,
    reference_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}
