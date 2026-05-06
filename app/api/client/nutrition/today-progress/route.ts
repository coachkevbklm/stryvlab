import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/client/nutrition/today-progress
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cc } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  const [{ data: protocol }, { data: meals }] = await Promise.all([
    service()
      .from('nutrition_protocols')
      .select('id, nutrition_protocol_days(*)')
      .eq('client_id', cc.id)
      .eq('status', 'shared')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    service()
      .from('meal_logs')
      .select('estimated_macros, ai_status')
      .eq('client_id', cc.id)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lte('logged_at', `${today}T23:59:59.999Z`)
      .eq('ai_status', 'done'),
  ])

  const consumed = (meals ?? []).reduce(
    (acc, m) => {
      const em = m.estimated_macros as Record<string, number> | null
      if (!em) return acc
      return {
        calories: acc.calories + (em.calories_kcal ?? 0),
        protein_g: acc.protein_g + (em.protein_g ?? 0),
        carbs_g: acc.carbs_g + (em.carbs_g ?? 0),
        fat_g: acc.fat_g + (em.fats_g ?? 0),
      }
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  const days = (protocol as any)?.nutrition_protocol_days ?? []
  const targetDay = days[0] ?? null

  const target = targetDay
    ? {
        calories: Number(targetDay.calories ?? 0),
        protein_g: Number(targetDay.protein_g ?? 0),
        carbs_g: Number(targetDay.carbs_g ?? 0),
        fat_g: Number(targetDay.fat_g ?? 0),
      }
    : null

  return NextResponse.json({
    consumed,
    target,
    hasProtocol: !!protocol,
    mealCount: (meals ?? []).length,
  })
}
