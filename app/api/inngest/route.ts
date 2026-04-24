import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { morphoAnalyzeFunction } from '@/lib/inngest/functions/morpho-analyze'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [morphoAnalyzeFunction],
})
