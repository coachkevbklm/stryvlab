import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

const WEIGHT_KEY = 'weight_kg'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id')
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data: submissions } = await service
    .from('assessment_submissions')
    .select('id, bilan_date, submitted_at, assessment_responses(field_key, value_number)')
    .eq('client_id', (client as any).id)
    .eq('status', 'completed')
    .order('bilan_date', { ascending: true })
    .limit(20)

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ weightSeries: [], composition: null, measures: null, latestWeight: null })
  }

  const weightSeries: { date: string; value: number }[] = []
  const latestValues: Record<string, number> = {}

  for (const sub of submissions) {
    const date = (sub as any).bilan_date ?? (sub as any).submitted_at?.split('T')[0] ?? ''
    const responses = (sub as any).assessment_responses as { field_key: string; value_number: number | null }[]
    if (!responses) continue

    for (const r of responses) {
      if (r.value_number == null) continue
      if (r.field_key === WEIGHT_KEY) {
        weightSeries.push({ date, value: r.value_number })
      }
      latestValues[r.field_key] = r.value_number
    }
  }

  const composition = {
    body_fat_pct:  latestValues['body_fat_pct']  ?? null,
    lean_mass_kg:  latestValues['lean_mass_kg']  ?? null,
    muscle_mass_kg: latestValues['muscle_mass_kg'] ?? null,
  }

  const measures = {
    waist_cm: latestValues['waist_cm'] ?? null,
    hips_cm:  latestValues['hips_cm']  ?? null,
    arm_cm:   latestValues['arm_cm']   ?? null,
    chest_cm: latestValues['chest_cm'] ?? null,
  }

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null

  return NextResponse.json({ weightSeries, composition, measures, latestWeight })
}
