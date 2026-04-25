import { inngest } from '@/lib/inngest/client'
import { analyzeMorphoJob } from '@/jobs/morpho/analyzeMorphoJob'

export const morphoAnalyzeFunction = inngest.createFunction(
  {
    id: 'morpho-analyze',
    name: 'MorphoPro — Analyse photo client',
    retries: 3,
    timeouts: { finish: '5m' },
  },
  { event: 'morpho/analyze.requested' },
  async ({ event }) => {
    const { morphoAnalysisId } = event.data as { morphoAnalysisId: string }
    await analyzeMorphoJob(morphoAnalysisId)
    return { morphoAnalysisId, status: 'completed' }
  },
)
