import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const schema = z.object({
  amount_ml: z.number().int().min(50).max(3000),
})

/**
 * POST /api/client/water
 * Fast water log — single insert into client_water_logs.
 * No food_items lookup, no nutrition_meals row.
 * Home + nutrition pages both read client_water_logs directly.
 *
 * GET /api/client/water?date=YYYY-MM-DD
 * Returns total ml logged for a given physiological date.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { amount_ml } = body.data

  const db = svc()
  const { data: cc } = await db
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { error } = await db.from('client_water_logs').insert({
    client_id: cc.id,
    amount_ml,
    logged_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return new total for today so client can update UI without a refresh
  const date = computePhysiologicalDate(new Date())
  const dayStart = `${date}T00:00:00Z`
  const dayEnd   = `${date}T23:59:59Z`

  const { data: rows } = await db
    .from('client_water_logs')
    .select('amount_ml')
    .eq('client_id', cc.id)
    .gte('logged_at', dayStart)
    .lte('logged_at', dayEnd)

  const total_ml = (rows ?? []).reduce((s, r) => s + Number(r.amount_ml ?? 0), 0)

  return NextResponse.json({ ok: true, amount_ml, total_ml })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const { data: cc } = await db
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const url = new URL(req.url)
  const date = url.searchParams.get('date') ?? computePhysiologicalDate(new Date())
  const dayStart = `${date}T00:00:00Z`
  const dayEnd   = `${date}T23:59:59Z`

  const { data: rows } = await db
    .from('client_water_logs')
    .select('amount_ml')
    .eq('client_id', cc.id)
    .gte('logged_at', dayStart)
    .lte('logged_at', dayEnd)

  const total_ml = (rows ?? []).reduce((s, r) => s + Number(r.amount_ml ?? 0), 0)
  return NextResponse.json({ total_ml, date })
}
