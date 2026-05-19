import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { computeNutritionAlerts } from '@/lib/client/smart/nutritionAlerts'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import CoachProtocolCard from '@/components/client/smart/CoachProtocolCard'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import WeeklyTrendStrip from '@/components/client/smart/WeeklyTrendStrip'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'

type SearchParams = { date?: string }

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function ClientNutritionPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id, gender')
  if (!client) return null

  const date = searchParams.date ?? computePhysiologicalDate(new Date())
  const dayStart = `${date}T00:00:00Z`
  const dayEnd   = `${date}T23:59:59Z`
  const clientId = client.id

  // ── Parallel fetches (all direct Supabase, no loopback HTTP) ──────────────
  const [protoResult, mealsResult, waterResult, trendResult] = await Promise.allSettled([
    svc()
      .from('nutrition_protocols')
      .select('tdee_adaptive, tdee_data_source, nutrition_protocol_days(name, calories, protein_g, carbs_g, fat_g, hydration_ml, carb_cycle_type, cycle_sync_phase, recommendations)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    svc()
      .from('nutrition_meals')
      .select('meal_type, title, logged_at, calories, protein_g, carbs_g, fat_g')
      .eq('client_id', clientId)
      .eq('physiological_date', date)
      .order('logged_at', { ascending: true }),

    svc()
      .from('client_water_logs')
      .select('amount_ml, logged_at')
      .eq('client_id', clientId)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),

    // Weekly trend: last 7 days
    (async () => {
      const today = new Date()
      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
      }
      return svc()
        .from('nutrition_meals')
        .select('physiological_date, calories')
        .eq('client_id', clientId)
        .in('physiological_date', days)
    })(),
  ])

  // ── Protocol day ──────────────────────────────────────────────────────────
  const protoData = protoResult.status === 'fulfilled' ? protoResult.value.data : null
  const protocolDay = (protoData?.nutrition_protocol_days as any)?.[0] ?? null
  const tdeeAdaptive = (protoData as any)?.tdee_adaptive ?? null
  const tdeeDataSource = (protoData as any)?.tdee_data_source ?? null

  const td = protocolDay
  const target: NutritionMacros = {
    kcal:      Number(td?.calories     ?? 0),
    protein_g: Number(td?.protein_g    ?? 0),
    carbs_g:   Number(td?.carbs_g      ?? 0),
    fat_g:     Number(td?.fat_g        ?? 0),
    water_ml:  Number(td?.hydration_ml ?? 2500),
  }

  // ── Consumed today ────────────────────────────────────────────────────────
  const meals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const water = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []

  const consumedBase = meals.reduce(
    (acc, m) => ({
      kcal:      acc.kcal      + Number(m.calories  ?? 0),
      protein_g: acc.protein_g + Number(m.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + Number(m.carbs_g   ?? 0),
      fat_g:     acc.fat_g     + Number(m.fat_g     ?? 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
  const water_ml = water.reduce((s, w) => s + Number(w.amount_ml ?? 0), 0)
  const consumed: NutritionMacros = { ...consumedBase, water_ml }

  // ── IA alerts (pure fn, no HTTP) ──────────────────────────────────────────
  const hasLunchLog = meals.some(m => m.meal_type === 'lunch')
  const rawAlerts = computeNutritionAlerts({
    consumed: { ...consumedBase, water_ml },
    target,
    currentHour: new Date().getHours(),
    hasLunchLog,
  })
  const alerts: GenericAlert[] = rawAlerts.map(a => ({
    code: a.code,
    severity: a.severity,
    title: a.title,
    body: a.body,
  }))

  // ── Weekly trend ──────────────────────────────────────────────────────────
  const today = new Date()
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const trendMeals = trendResult.status === 'fulfilled' ? (trendResult.value.data ?? []) : []
  const trendTotals: Record<string, number> = {}
  for (const d of days) trendTotals[d] = 0
  for (const m of trendMeals) {
    trendTotals[m.physiological_date] = (trendTotals[m.physiological_date] ?? 0) + Number(m.calories ?? 0)
  }
  const trend = days.map(d => ({ date: d, consumed: trendTotals[d], target: target.kcal }))

  return (
    <>
      <ClientTopBar section="NUTRITION" title={date} />
      <main className="min-h-screen bg-[#0d0d0d] p-4 pt-[72px] pb-24 max-w-[480px] mx-auto space-y-3">
        <SmartNutritionHero date={date} consumed={consumed} target={target} />

        {/* Adaptive TDEE — only shown when protocol has been calibrated */}
        {tdeeAdaptive != null && (
          <div className="bg-[#161616] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30 mb-0.5">
                Dépense énergétique
              </p>
              <p className="text-[20px] font-black text-white leading-none tabular-nums">
                {tdeeDataSource === 'formula_proxy'
                  ? 'Estimation'
                  : `${(tdeeAdaptive as number).toLocaleString('fr-FR')} kcal/jour`}
              </p>
            </div>
            <p className="text-[10px] text-white/30 text-right max-w-[120px] leading-snug">
              {tdeeDataSource === 'formula_proxy'
                ? 'Basé sur ton programme'
                : 'Basé sur tes pesées des 14 derniers jours'}
            </p>
          </div>
        )}

        <SmartAlertsFeed alerts={alerts} />
        <CoachProtocolCard day={protocolDay} />
        <RemainingBreakdown consumed={consumed} target={target} />
        <WeeklyTrendStrip trend={trend} />
      </main>
    </>
  )
}
