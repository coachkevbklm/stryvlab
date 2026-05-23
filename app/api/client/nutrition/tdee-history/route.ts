import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id')
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data, error } = await svc()
    .from('nutrition_tdee_history')
    .select('calculated_at, tdee_adaptive, tdee_formula, delta_kcal, avg_intake_kcal, weight_delta_kg, weight_samples')
    .eq('client_id', (client as any).id)
    .order('calculated_at', { ascending: true })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
