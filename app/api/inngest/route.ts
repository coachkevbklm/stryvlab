import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { checkinStreakEvaluateFunction } from '@/lib/inngest/functions/checkin-streak-evaluate'
import { pointsLevelUpdateFunction } from '@/lib/inngest/functions/points-level-update'
import { checkinStreakExpireFunction } from '@/lib/inngest/functions/checkin-streak-expire'
import { checkinReminderSendFunction } from '@/lib/inngest/functions/checkin-reminder-send'
import { mealAnalyzeFunction } from '@/lib/inngest/functions/meal-analyze'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    checkinStreakEvaluateFunction,
    pointsLevelUpdateFunction,
    checkinStreakExpireFunction,
    checkinReminderSendFunction,
    mealAnalyzeFunction,
  ],
})
