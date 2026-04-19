import { describe, it, expect } from 'vitest'
import { scoreRedundancy } from '@/lib/programs/intelligence/scoring'
import type { BuilderSession } from '@/lib/programs/intelligence/types'

const bilateralBench = {
  name: 'Développé couché',
  sets: 3, reps: '8-12', rest_sec: 90, rir: 2, notes: '',
  movement_pattern: 'horizontal_push',
  equipment_required: ['barre'],
  primary_muscles: ['pectoraux', 'triceps'], secondary_muscles: ['epaules'],
  is_compound: true,
}

const unilateralBench = {
  name: 'Développé haltère unilatéral',
  sets: 3, reps: '10-12', rest_sec: 90, rir: 2, notes: '',
  movement_pattern: 'horizontal_push',
  equipment_required: ['halteres'],
  primary_muscles: ['pectoraux', 'triceps'], secondary_muscles: [],
  is_compound: true,
}

const session: BuilderSession = {
  name: 'Push', day_of_week: 1,
  exercises: [bilateralBench, unilateralBench],
}

describe('scoreRedundancy with morpho', () => {
  it('marks bilateral+bilateral same pattern as redundant (no morpho)', () => {
    const duplicateBench = { ...bilateralBench, name: 'Développé couché machine' }
    const s: BuilderSession = { name: 'Push', day_of_week: 1, exercises: [bilateralBench, duplicateBench] }
    const { redundantPairs } = scoreRedundancy([s])
    expect(redundantPairs.length).toBe(1)
  })

  it('marks bilateral+unilateral as redundant when no morpho adjustment', () => {
    const { redundantPairs } = scoreRedundancy([session])
    expect(redundantPairs.length).toBe(1)
  })

  it('does NOT mark bilateral+unilateral as redundant when morpho has unilateral boost', () => {
    const morpho = { unilateral_push: 1.15 } // arm asymmetry → unilateral boost
    const { redundantPairs } = scoreRedundancy([session], morpho)
    expect(redundantPairs.length).toBe(0)
  })

  it('still marks bilateral+bilateral as redundant even with morpho', () => {
    const duplicateBench = { ...bilateralBench, name: 'Développé couché machine' }
    const s: BuilderSession = { name: 'Push', day_of_week: 1, exercises: [bilateralBench, duplicateBench] }
    const morpho = { unilateral_push: 1.15 }
    const { redundantPairs } = scoreRedundancy([s], morpho)
    expect(redundantPairs.length).toBe(1)
  })
})
