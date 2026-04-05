import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/comptabilite — dashboard financier du coach
// Returns: MRR, revenus par mois (12 derniers mois), impayés, top clients
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = serviceClient()

  // Fetch all payments for the coach
  const { data: payments, error: paymentsError } = await db
    .from('subscription_payments')
    .select('*, client:coach_clients(id, first_name, last_name)')
    .eq('coach_id', user.id)
    .order('payment_date', { ascending: false })

  if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 })

  // Fetch active subscriptions for MRR
  const { data: subscriptions, error: subsError } = await db
    .from('client_subscriptions')
    .select('*, formula:coach_formulas(price_eur, billing_cycle)')
    .eq('coach_id', user.id)
    .eq('status', 'active')

  if (subsError) return NextResponse.json({ error: subsError.message }, { status: 500 })

  // --- MRR calculation ---
  // Normalize all active subscriptions to monthly revenue
  const billingToMonthlyFactor: Record<string, number> = {
    weekly: 4.33,
    monthly: 1,
    quarterly: 1 / 3,
    yearly: 1 / 12,
    one_time: 0,
  }

  let mrr = 0
  for (const sub of subscriptions ?? []) {
    const formula = sub.formula as { price_eur: number; billing_cycle: string } | null
    if (!formula) continue
    const price = sub.price_override_eur ?? formula.price_eur
    const factor = billingToMonthlyFactor[formula.billing_cycle] ?? 0
    mrr += price * factor
  }

  // --- Revenue by month (last 12 months) ---
  const monthlyRevenue: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue[key] = 0
  }

  const paidPayments = (payments ?? []).filter((p: { status: string }) => p.status === 'paid')
  for (const p of paidPayments) {
    const key = p.payment_date.substring(0, 7) // YYYY-MM
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += Number(p.amount_eur)
    }
  }

  const revenueByMonth = Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }))

  // --- KPIs ---
  const totalRevenue = paidPayments.reduce((sum: number, p: { amount_eur: number }) => sum + Number(p.amount_eur), 0)
  const pendingPayments = (payments ?? []).filter((p: { status: string }) => p.status === 'pending')
  const pendingAmount = pendingPayments.reduce((sum: number, p: { amount_eur: number }) => sum + Number(p.amount_eur), 0)
  const overduePayments = (payments ?? []).filter((p: { status: string; due_date?: string }) =>
    p.status === 'pending' && p.due_date && new Date(p.due_date) < now
  )
  const overdueAmount = overduePayments.reduce((sum: number, p: { amount_eur: number }) => sum + Number(p.amount_eur), 0)

  // Current month revenue
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonthRevenue = monthlyRevenue[currentMonth] ?? 0

  // --- Top clients by revenue ---
  const clientRevenue: Record<string, { name: string; amount: number }> = {}
  for (const p of paidPayments) {
    const client = p.client as { id: string; first_name: string; last_name: string } | null
    if (!client) continue
    if (!clientRevenue[client.id]) {
      clientRevenue[client.id] = { name: `${client.first_name} ${client.last_name}`, amount: 0 }
    }
    clientRevenue[client.id].amount += Number(p.amount_eur)
  }
  const topClients = Object.entries(clientRevenue)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return NextResponse.json({
    kpis: {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      activeSubscriptions: subscriptions?.length ?? 0,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
    },
    revenueByMonth,
    topClients,
    recentPayments: (payments ?? []).slice(0, 10),
  })
}
