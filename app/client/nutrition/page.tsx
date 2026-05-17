import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import CoachProtocolCard from '@/components/client/smart/CoachProtocolCard'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import WeeklyTrendStrip from '@/components/client/smart/WeeklyTrendStrip'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'

type SearchParams = { date?: string }

export default async function ClientNutritionPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id, gender')
  if (!client) return null

  const date = searchParams.date ?? computePhysiologicalDate(new Date())

  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const origin = `${proto}://${host}`
  const cookie = h.get('cookie') ?? ''

  const [todayResult, alertsResult, trendResult] = await Promise.allSettled([
    fetch(`${origin}/api/client/nutrition/today?date=${date}`, { headers: { cookie }, cache: 'no-store' }),
    fetch(`${origin}/api/client/nutrition-alerts`, { headers: { cookie }, cache: 'no-store' }),
    fetch(`${origin}/api/client/nutrition/weekly-trend`, { headers: { cookie }, cache: 'no-store' }),
  ])

  const empty: NutritionMacros = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 2500 }
  const todayData = todayResult.status === 'fulfilled' && todayResult.value.ok
    ? await todayResult.value.json()
    : null
  const consumed: NutritionMacros = todayData?.consumed ?? { ...empty, water_ml: 0 }
  const target: NutritionMacros = todayData?.target ?? empty

  const alerts: GenericAlert[] = alertsResult.status === 'fulfilled' && alertsResult.value.ok
    ? (await alertsResult.value.json()).alerts ?? []
    : []

  const trend = trendResult.status === 'fulfilled' && trendResult.value.ok
    ? (await trendResult.value.json()).trend ?? []
    : []

  // Active protocol day
  const { data: proto2 } = await service
    .from('nutrition_protocols')
    .select('nutrition_protocol_days(name, calories, protein_g, carbs_g, fat_g, hydration_ml, carb_cycle_type, cycle_sync_phase, recommendations)')
    .eq('client_id', client.id)
    .eq('status', 'shared')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const protocolDay = (proto2?.nutrition_protocol_days as any)?.[0] ?? null

  return (
    <>
      <ClientTopBar section="NUTRITION" title={date} />
      <main className="min-h-screen bg-[#0d0d0d] p-4 pt-[72px] pb-24 max-w-[480px] mx-auto space-y-3">
        <SmartNutritionHero date={date} consumed={consumed} target={target} />
        <SmartAlertsFeed alerts={alerts} />
        <CoachProtocolCard day={protocolDay} />
        <RemainingBreakdown consumed={consumed} target={target} />
        <WeeklyTrendStrip trend={trend} />
      </main>
    </>
  )
}
