import { inngest } from '@/lib/inngest/client'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const chatEveningBriefFunction = inngest.createFunction(
  {
    id: 'chat-evening-brief',
    retries: 2,
    triggers: [{ cron: '30 21 * * *' }], // 21:30 UTC daily
  },
  async ({ step }: { step: any }) => {
    return await step.run('insert-evening-init-messages', async () => {
      const db = svc()
      const today      = computePhysiologicalDate(new Date())
      const todayStart = `${today}T00:00:00Z`

      const { data: clients, error } = await db
        .from('coach_clients')
        .select('id, first_name')
        .eq('status', 'active')

      if (error) throw new Error(`chat-evening-brief: ${error.message}`)

      let inserted = 0
      let skipped  = 0

      for (const client of clients ?? []) {
        // Skip if evening check-in already completed today
        const { data: checkin } = await db
          .from('client_daily_checkins')
          .select('id')
          .eq('client_id', client.id)
          .eq('date', today)
          .eq('flow_type', 'evening')
          .maybeSingle()

        if (checkin) { skipped++; continue }

        // Retry-safe dedup: skip if evening_init already inserted today
        const { data: existing } = await db
          .from('chat_messages')
          .select('id')
          .eq('client_id', client.id)
          .eq('message_type', 'evening_init')
          .gte('created_at', todayStart)
          .maybeSingle()

        if (existing) { skipped++; continue }

        const { error: insertError } = await db.from('chat_messages').insert({
          client_id:    client.id,
          role:         'assistant',
          content:      `Bonsoir ${client.first_name} ! 🌙 Comment se passe ta soirée ?`,
          message_type: 'evening_init',
          metadata: {
            component: 'chips',
            key:       'trigger_checkin',
            question:  'Prêt pour ton check-in soir ?',
            options:   [{ label: 'Commencer le check-in', value: 1 }],
          },
        })

        if (!insertError) inserted++
      }

      return { date: today, inserted, skipped }
    })
  }
)
