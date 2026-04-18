'use client'

import { useState, useEffect, useRef } from 'react'
import { buildIntelligenceResult } from './scoring'
import type { BuilderSession, TemplateMeta, IntelligenceResult, IntelligenceAlert, BuilderExercise, IntelligenceProfile } from './types'

export type { IntelligenceResult, IntelligenceAlert, BuilderSession, TemplateMeta, BuilderExercise, IntelligenceProfile }
export { scoreAlternatives } from './alternatives'
export type { AlternativeScore } from './alternatives'
export { resolveExerciseCoeff } from './catalog-utils'
export { scoreSuperset } from './scoring'

const EMPTY_RESULT: IntelligenceResult = {
  globalScore: 0,
  globalNarrative: "Ajoutez des exercices pour voir l'analyse.",
  subscores: { balance: 0, recovery: 0, specificity: 0, progression: 0, completeness: 0, redundancy: 0 },
  alerts: [],
  distribution: {},
  patternDistribution: { push: 0, pull: 0, legs: 0, core: 0 },
  missingPatterns: [],
  redundantPairs: [],
  sraMap: [],
  programStats: { totalSets: 0, totalEstimatedReps: 0, totalExercises: 0, avgExercisesPerSession: 0, sessionsStats: [] },
}

export function useProgramIntelligence(
  sessions: BuilderSession[],
  meta: TemplateMeta,
  profile?: IntelligenceProfile,
): {
  result: IntelligenceResult
  alertsFor: (sessionIdx: number, exerciseIdx: number) => IntelligenceAlert[]
} {
  const [result, setResult] = useState<IntelligenceResult>(EMPTY_RESULT)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const next = buildIntelligenceResult(sessions, meta, profile)
      setResult(next)
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sessions, meta, profile])

  function alertsFor(sessionIdx: number, exerciseIdx: number): IntelligenceAlert[] {
    return result.alerts.filter(
      a => a.sessionIndex === sessionIdx && a.exerciseIndex === exerciseIdx,
    )
  }

  return { result, alertsFor }
}
