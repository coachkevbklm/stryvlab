import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { calcAdaptiveTdee } from '@/lib/nutrition/adaptiveTdee'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { clientId: string; protocolId: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const { clientId, protocolId } = params

  const { data: protocol } = await db
    .from('nutrition_protocols')
    .select('id, coach_id, nutrition_protocol_days(id, calories, protein_g, fat_g, carbs_g, position)')
    .eq('id', protocolId)
    .eq('client_id', clientId)
    .eq('coach_id', user.id)
    .single()

  if (!protocol) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const days: any[] = (protocol as any).nutrition_protocol_days ?? []

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: weightRows } = await db
    .from('assessment_responses')
    .select('value_number, assessment_submissions!inner(submitted_at, client_id)')
    .eq('field_key', 'weight_kg')
    .eq('assessment_submissions.client_id', clientId)
    .gte('assessment_submissions.submitted_at', since)

  const weightSamples = (weightRows ?? [])
    .filter((r: any) => r.value_number != null)
    .map((r: any) => ({
      date: (r.assessment_submissions as any).submitted_at.slice(0, 10),
      weight_kg: r.value_number as number,
    }))

  if (weightSamples.length < 2) {
    return NextResponse.json(
      { error: 'Not enough weight samples (minimum 2 in last 14 days)' },
      { status: 422 }
    )
  }

  const { data: mealRows } = await db
    .from('nutrition_meals')
    .select('calories')
    .eq('client_id', clientId)
    .gte('physiological_date', since.slice(0, 10))

  let avgIntakeKcal: number
  let caloriesSource: 'logs' | 'protocol'

  if (mealRows && mealRows.length > 0) {
    avgIntakeKcal = Math.round(
      mealRows.reduce((s: number, m: any) => s + (m.calories ?? 0), 0) / 14
    )
    caloriesSource = 'logs'
  } else {
    const day1 = [...days].sort((a, b) => a.position - b.position)[0]
    avgIntakeKcal = day1?.calories ?? 2000
    caloriesSource = 'protocol'
  }

  const result = calcAdaptiveTdee({ weightSamples, avgIntakeKcal, caloriesSource, windowDays: 14 })
  const day1Cal = [...days].sort((a, b) => a.position - b.position)[0]?.calories ?? 2000
  const tdeeFormula = day1Cal
  const deltaKcal = result.tdeeAdaptive - tdeeFormula
  const ratio = result.tdeeAdaptive / tdeeFormula

  for (const day of days) {
    await db.from('nutrition_protocol_days').update({
      calories: day.calories != null ? Math.round(day.calories * ratio) : null,
      protein_g: day.protein_g != null ? Math.round(day.protein_g * ratio) : null,
      fat_g: day.fat_g != null ? Math.round(day.fat_g * ratio) : null,
      carbs_g: day.carbs_g != null ? Math.round(day.carbs_g * ratio) : null,
    }).eq('id', day.id)
  }

  await db.from('nutrition_protocols').update({
    tdee_adaptive: result.tdeeAdaptive,
    tdee_adaptive_at: new Date().toISOString(),
    tdee_data_source: caloriesSource === 'protocol' ? 'formula_proxy' : 'weight_delta',
  }).eq('id', protocolId)

  await db.from('nutrition_tdee_history').insert({
    protocol_id: protocolId,
    client_id: clientId,
    tdee_formula: tdeeFormula,
    tdee_adaptive: result.tdeeAdaptive,
    delta_kcal: deltaKcal,
    weight_samples: weightSamples.length,
    calories_source: caloriesSource,
    avg_intake_kcal: avgIntakeKcal,
    weight_delta_kg: result.weightDeltaKg,
    protocol_updated: true,
  })

  return NextResponse.json({ tdeeAdaptive: result.tdeeAdaptive, deltaKcal, protocolUpdated: true })
}
