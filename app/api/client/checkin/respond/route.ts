import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { inngest } from '@/lib/inngest/client'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const bodySchema = z.object({
  config_id: z.string().uuid(),
  moment: z.enum(['morning', 'evening']),
  responses: z.record(z.string(), z.number()),
})

// POST /api/client/checkin/respond
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  // Verify config belongs to this client and is active
  const { data: config } = await service()
    .from('daily_checkin_configs')
    .select('id, is_active, days_of_week')
    .eq('id', body.data.config_id)
    .eq('client_id', client.id)
    .single()
  if (!config || !config.is_active) {
    return NextResponse.json({ error: 'Check-in not active' }, { status: 403 })
  }

  // Prevent duplicate response for same moment today
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const { data: existing } = await service()
    .from('daily_checkin_responses')
    .select('id')
    .eq('client_id', client.id)
    .eq('moment', body.data.moment)
    .gte('responded_at', todayStart.toISOString())
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Already responded today' }, { status: 409 })
  }

  const now = new Date()
  const utcHour = now.getUTCHours()
  const isLate = utcHour >= 0 && utcHour < 2

  const { data: response, error } = await service()
    .from('daily_checkin_responses')
    .insert({
      client_id: client.id,
      config_id: body.data.config_id,
      moment: body.data.moment,
      responses: body.data.responses,
      is_late: isLate,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger streak evaluation + points attribution asynchronously
  await inngest.send({
    name: 'checkin/streak.evaluate',
    data: {
      client_id: client.id,
      response_id: response.id,
      is_late: isLate,
      days_of_week: config.days_of_week,
    },
  })

  return NextResponse.json(response, { status: 201 })
}
