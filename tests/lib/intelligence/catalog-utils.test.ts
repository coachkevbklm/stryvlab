import { describe, it, expect } from 'vitest'
import {
  getStimulusCoeff,
  normalizeMuscleSlug,
  isCompoundFromMuscles,
  resolveExerciseCoeff,
} from '@/lib/programs/intelligence/catalog-utils'

describe('normalizeMuscleSlug', () => {
  it('maps French slugs to canonical form', () => {
    expect(normalizeMuscleSlug('fessiers')).toBe('fessiers')
    expect(normalizeMuscleSlug('ischio-jambiers')).toBe('ischio-jambiers')
    expect(normalizeMuscleSlug('dos')).toBe('dos')
    // slugs EN de l'ancien système → FR
    expect(normalizeMuscleSlug('glutes')).toBe('fessiers')
    expect(normalizeMuscleSlug('hamstrings')).toBe('ischio-jambiers')
    expect(normalizeMuscleSlug('back')).toBe('dos')
    expect(normalizeMuscleSlug('shoulders')).toBe('epaules')
    expect(normalizeMuscleSlug('chest')).toBe('pectoraux')
    expect(normalizeMuscleSlug('quads')).toBe('quadriceps')
    expect(normalizeMuscleSlug('calves')).toBe('mollets')
  })
})

describe('isCompoundFromMuscles', () => {
  it('returns true when ≥2 primary muscle groups', () => {
    expect(isCompoundFromMuscles(['fessiers', 'quadriceps', 'ischio-jambiers'])).toBe(true)
  })
  it('returns false when 1 primary muscle group', () => {
    expect(isCompoundFromMuscles(['biceps'])).toBe(false)
  })
  it('returns false for empty', () => {
    expect(isCompoundFromMuscles([])).toBe(false)
  })
})

describe('getStimulusCoeff', () => {
  it('returns 0.95 for heavy hip_hinge compound (SDT)', () => {
    expect(getStimulusCoeff('souleve-de-terre', 'hip_hinge', true)).toBe(0.95)
  })
  it('returns 0.48 for hip_hinge isolation (extension lombaire)', () => {
    expect(getStimulusCoeff('extension-lombaire-au-banc-45', 'hip_hinge', false)).toBe(0.48)
  })
  it('returns 0.90 for squat_pattern compound free', () => {
    expect(getStimulusCoeff('squat-barre', 'squat_pattern', true)).toBe(0.90)
  })
  it('returns 0.72 for squat_pattern machine', () => {
    expect(getStimulusCoeff('presse-a-cuisse-exercice-musculation', 'squat_pattern', true)).toBe(0.72)
  })
  it('returns 0.35 for lateral_raise', () => {
    expect(getStimulusCoeff('elevation-laterale-machine', 'lateral_raise', false)).toBe(0.35)
  })
  it('applies +0.08 stretch bonus for known slugs', () => {
    // leg-curl-assis-machine : knee_flexion isolation base 0.55 + 0.08 stretch
    expect(getStimulusCoeff('leg-curl-assis-machine', 'knee_flexion', false)).toBe(0.63)
  })
  it('returns 0.50 default for unknown pattern', () => {
    expect(getStimulusCoeff('mystery-exercise', 'unknown_pattern', false)).toBe(0.50)
  })
})

describe('resolveExerciseCoeff', () => {
  it('uses catalog entry when name matches', () => {
    // Soulevé de terre est dans le catalogue avec stimCoeff=0.95
    const coeff = resolveExerciseCoeff({
      name: 'Soulevé de terre',
      movement_pattern: 'hip_hinge',
      primary_muscles: ['fessiers', 'ischio-jambiers', 'dos'],
      is_compound: undefined,
    })
    expect(coeff).toBe(0.95)
  })
  it('uses is_compound flag when set by coach', () => {
    // Exercice custom, composé déclaré par le coach
    const coeff = resolveExerciseCoeff({
      name: 'Mon exercice custom composé',
      movement_pattern: 'squat_pattern',
      primary_muscles: ['fessiers', 'quadriceps'],
      is_compound: true,
    })
    expect(coeff).toBe(0.90)
  })
  it('derives is_compound from primary_muscles when is_compound=undefined', () => {
    // 2 muscles primaires → composé auto
    const coeff = resolveExerciseCoeff({
      name: 'Exercice custom non coché',
      movement_pattern: 'horizontal_push',
      primary_muscles: ['pectoraux', 'triceps'],
      is_compound: undefined,
    })
    expect(coeff).toBe(0.82) // horizontal_push composé libre
  })
  it('returns isolation coeff when 1 primary muscle and is_compound=false', () => {
    const coeff = resolveExerciseCoeff({
      name: 'Custom curl',
      movement_pattern: 'elbow_flexion',
      primary_muscles: ['biceps'],
      is_compound: false,
    })
    expect(coeff).toBe(0.55)
  })
})
