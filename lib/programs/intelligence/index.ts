'use client'

import { useState, useEffect, useRef } from 'react'
import { buildIntelligenceResult } from './scoring'
import type { BuilderSession, TemplateMeta, IntelligenceResult, IntelligenceAlert, BuilderExercise } from './types'

export type { IntelligenceResult, IntelligenceAlert, BuilderSession, TemplateMeta, BuilderExercise }
export { scoreAlternatives } from './alternatives'
export type { AlternativeScore } from './alternatives'
export { resolveExerciseCoeff } from './catalog-utils'

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
}

export function useProgramIntelligence(
  sessions: BuilderSession[],
  meta: TemplateMeta,
): {
  result: IntelligenceResult
  alertsFor: (sessionIdx: number, exerciseIdx: number) => IntelligenceAlert[]
} {
  const [result, setResult] = useState<IntelligenceResult>(EMPTY_RESULT)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const next = buildIntelligenceResult(sessions, meta)
      setResult(next)
    }, 400) // debounce 400ms

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sessions, meta])

  function alertsFor(sessionIdx: number, exerciseIdx: number): IntelligenceAlert[] {
    return result.alerts.filter(
      a => a.sessionIndex === sessionIdx && a.exerciseIndex === exerciseIdx,
    )
  }

  return { result, alertsFor }
}
