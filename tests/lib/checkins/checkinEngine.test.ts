import { describe, it, expect } from 'vitest'
import { determineFlow } from '@/lib/client/checkin/checkinEngine'

type SessionData = { flow_type: string; completed_at: string | null }

const completed = (type: string): SessionData => ({ flow_type: type, completed_at: new Date().toISOString() })
const pending   = (type: string): SessionData => ({ flow_type: type, completed_at: null })

describe('determineFlow', () => {
  it('returns morning when hour < 14 and morning not done', () => {
    expect(determineFlow(9, [])).toBe('morning')
  })

  it('returns morning when hour = 0 and morning not done', () => {
    expect(determineFlow(0, [])).toBe('morning')
  })

  it('returns morning when hour = 13 and morning not done', () => {
    expect(determineFlow(13, [])).toBe('morning')
  })

  it('returns evening when hour >= 14 and evening not done', () => {
    expect(determineFlow(20, [completed('morning')])).toBe('evening')
  })

  it('returns evening when hour = 14 and evening not done', () => {
    expect(determineFlow(14, [])).toBe('evening')
  })

  it('returns evening when hour >= 14 even if morning not done', () => {
    expect(determineFlow(15, [])).toBe('evening')
  })

  it('returns null when both morning and evening are completed', () => {
    expect(determineFlow(21, [completed('morning'), completed('evening')])).toBeNull()
  })

  it('returns null when hour < 14 and morning is done', () => {
    expect(determineFlow(11, [completed('morning')])).toBeNull()
  })

  it('ignores pending sessions (completed_at = null)', () => {
    expect(determineFlow(9, [pending('morning')])).toBe('morning')
  })

  it('returns null when hour >= 14 and evening is done (morning not done)', () => {
    expect(determineFlow(20, [pending('morning'), completed('evening')])).toBeNull()
  })
})
