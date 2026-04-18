import { describe, it, expect } from 'vitest'
import { scoreSRA } from '@/lib/programs/intelligence/scoring'
import type { BuilderSession, TemplateMeta, BuilderExercise } from '@/lib/programs/intelligence/types'

const GROUP_A = 'group-aaa'

const pushEx: BuilderExercise = {
  name: 'Développé couché', sets: 3, reps: '8-12', rest_sec: 90, rir: 2,
  notes: '', movement_pattern: 'horizontal_push', equipment_required: ['barbell'],
  primary_muscles: ['pectoraux', 'triceps'], secondary_muscles: ['epaules'],
  group_id: GROUP_A,
}

const pullEx: BuilderExercise = {
  name: 'Rowing barre', sets: 3, reps: '8-12', rest_sec: 90, rir: 2,
  notes: '', movement_pattern: 'horizontal_pull', equipment_required: ['barbell'],
  primary_muscles: ['dos', 'biceps'], secondary_muscles: [],
  group_id: GROUP_A,
}

const meta: TemplateMeta = {
  goal: 'hypertrophy', level: 'intermediate', weeks: 8, frequency: 4,
  equipment_archetype: 'commercial_gym',
}

const sessionA: BuilderSession = { name: 'Day A', day_of_week: 1, exercises: [pushEx, pullEx] }

describe('scoreSRA with group_id', () => {
  it('accepts BuilderExercise with group_id without TypeScript error', () => {
    const result = scoreSRA([sessionA], meta)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('treats grouped exercises as one slot — no intra-group SRA violation', () => {
    const result = scoreSRA([sessionA], meta)
    const violations = result.alerts.filter(a => a.code === 'SRA_VIOLATION')
    expect(violations).toHaveLength(0)
  })
})
