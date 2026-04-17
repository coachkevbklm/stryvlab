import { describe, it, expect } from 'vitest'
import { muscleConflictsWithRestriction } from '@/lib/programs/intelligence/catalog-utils'
import type { InjuryRestriction } from '@/lib/programs/intelligence/types'

describe('muscleConflictsWithRestriction', () => {
  it('detects conflict when muscle maps to restricted body_part', () => {
    const restrictions: InjuryRestriction[] = [
      { bodyPart: 'shoulder_right', severity: 'avoid' },
    ]
    expect(muscleConflictsWithRestriction('deltoide_anterieur', restrictions)).toEqual({
      conflicts: true,
      severity: 'avoid',
    })
  })

  it('returns null when no conflict', () => {
    const restrictions: InjuryRestriction[] = [
      { bodyPart: 'knee_right', severity: 'avoid' },
    ]
    expect(muscleConflictsWithRestriction('pectoraux', restrictions)).toBeNull()
  })

  it('handles bilateral restriction (lower_back affects both sides)', () => {
    const restrictions: InjuryRestriction[] = [
      { bodyPart: 'lower_back', severity: 'limit' },
    ]
    expect(muscleConflictsWithRestriction('lombaires', restrictions)).toEqual({
      conflicts: true,
      severity: 'limit',
    })
  })

  it('returns highest severity when multiple muscles conflict', () => {
    const restrictions: InjuryRestriction[] = [
      { bodyPart: 'shoulder_right', severity: 'monitor' },
      { bodyPart: 'shoulder_left', severity: 'avoid' },
    ]
    const result = muscleConflictsWithRestriction('deltoide_anterieur', restrictions)
    expect(result?.severity).toBe('avoid')
  })

  it('returns null for empty restrictions', () => {
    expect(muscleConflictsWithRestriction('quadriceps', [])).toBeNull()
  })
})
