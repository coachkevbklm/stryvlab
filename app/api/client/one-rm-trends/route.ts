import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computeOneRMTrends } from '@/lib/training/oneRepMax'

/**
 * GET /api/client/one-rm-trends
 *
 * Fetches last 8 weeks of completed set logs and computes 1RM trends.
 * Returns top 5 exercises by percent change.
 *
 * Auth: Client authenticated via Supabase auth.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const client = await resolveClientFromUser(user.id, user.email, service, 'id')
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch last 8 weeks of completed set logs
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const { data: setLogs, error } = await service
      .from('client_set_logs')
      .select(
        `
        exercise_name,
        actual_weight_kg,
        actual_reps,
        rir_actual,
        client_session_logs (
          completed_at
        )
      `
      )
      .eq('client_session_logs.client_id', client.id)
      .gte('client_session_logs.completed_at', eightWeeksAgo.toISOString())
      .not('client_session_logs.completed_at', 'is', null)
      .order('client_session_logs.completed_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch set logs' },
        { status: 500 }
      )
    }

    // Flatten the nested structure
    const flattened = (setLogs ?? []).map(log => ({
      exercise_name: log.exercise_name,
      actual_weight_kg: log.actual_weight_kg,
      actual_reps: log.actual_reps,
      rir_actual: log.rir_actual,
      completed_at: (log.client_session_logs as any)?.completed_at ?? null,
    }))

    // Compute trends
    const trends = computeOneRMTrends(flattened)

    // Return top 5
    const top5 = trends.slice(0, 5)

    return NextResponse.json(
      {
        trends: top5,
        count: trends.length,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
