import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMocks } from '../mocks/supabase'

const mocks = createSupabaseMocks()

vi.mock('@/utils/supabase/server', () => ({ createClient: () => mocks.serverMock }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => mocks.serviceMock }))

import { GET, POST } from '@/app/api/session-logs/route'
import { NextRequest } from '../mocks/next-server'

beforeEach(() => mocks.resetMocks())

function makePost(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/session-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGet(clientId?: string): NextRequest {
  const url = clientId
    ? `http://localhost:3000/api/session-logs?client_id=${clientId}`
    : 'http://localhost:3000/api/session-logs'
  return new NextRequest(url, { method: 'GET' })
}

async function json(res: Response) { return res.json() }

// ─── POST /api/session-logs ───────────────────────────────────

describe('POST /api/session-logs', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.setServerUser(null)
    const res = await POST(makePost({ session_name: 'Séance A' }))
    expect(res.status).toBe(401)
  })

  it('returns 404 when no client profile found for user', async () => {
    // First DB call: coach_clients lookup by user_id → null
    mocks.setServiceResult(null)
    const res = await POST(makePost({ session_name: 'Séance A' }))
    expect(res.status).toBe(404)
    const body = await json(res)
    expect(body.error).toMatch(/introuvable/i)
  })

  it('returns 400 when session_name is missing', async () => {
    // First call: client found
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
    ])
    const res = await POST(makePost({}))
    expect(res.status).toBe(400)
    const body = await json(res)
    expect(body.error).toMatch(/session_name/i)
  })

  it('creates session log without set_logs and returns 201', async () => {
    const sessionLog = { id: 'sl-1', session_name: 'Séance A', client_id: 'client-1' }
    mocks.setServiceResults([
      { data: { id: 'client-1' } },           // coach_clients lookup
      { data: sessionLog },                     // client_session_logs insert
    ])
    const res = await POST(makePost({ session_name: 'Séance A' }))
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.session_log.id).toBe('sl-1')
  })

  it('creates session log with set_logs', async () => {
    const sessionLog = { id: 'sl-1', session_name: 'Séance A' }
    const setLogs = [
      { exercise_name: 'Squat', set_number: 1, actual_reps: 8, actual_weight_kg: 100, completed: true, rpe: 7 },
      { exercise_name: 'Squat', set_number: 2, actual_reps: 7, actual_weight_kg: 100, completed: true, rpe: 8 },
    ]
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
      { data: sessionLog },
      { data: null },   // client_set_logs insert (no return needed)
    ])
    const res = await POST(makePost({ session_name: 'Séance A', set_logs: setLogs }))
    expect(res.status).toBe(201)
  })

  it('passes program_session_id when provided', async () => {
    const sessionLog = { id: 'sl-1', session_name: 'Séance A', program_session_id: 'ps-1' }
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
      { data: sessionLog },
    ])
    const res = await POST(makePost({ session_name: 'Séance A', program_session_id: 'ps-1' }))
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.session_log.program_session_id).toBe('ps-1')
  })

  it('returns 500 on session log DB error', async () => {
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
      { data: null, error: { message: 'Insert failed' } },
    ])
    const res = await POST(makePost({ session_name: 'Séance A' }))
    expect(res.status).toBe(500)
  })
})

// ─── GET /api/session-logs ────────────────────────────────────

describe('GET /api/session-logs', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.setServerUser(null)
    const res = await GET(makeGet('client-1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when client_id is missing', async () => {
    const res = await GET(makeGet())
    expect(res.status).toBe(400)
    const body = await json(res)
    expect(body.error).toMatch(/client_id/i)
  })

  it('returns 404 when client does not belong to coach', async () => {
    // First call: coach_clients ownership check → null
    mocks.setServiceResult(null)
    const res = await GET(makeGet('client-other'))
    expect(res.status).toBe(404)
  })

  it('returns session logs for valid client', async () => {
    const logs = [
      { id: 'sl-1', session_name: 'Séance A', logged_at: '2026-04-05', client_set_logs: [] },
      { id: 'sl-2', session_name: 'Séance B', logged_at: '2026-04-03', client_set_logs: [] },
    ]
    mocks.setServiceResults([
      { data: { id: 'client-1' } },   // ownership check
      { data: logs },                   // session logs query
    ])
    const res = await GET(makeGet('client-1'))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.logs).toHaveLength(2)
    expect(body.logs[0].session_name).toBe('Séance A')
  })

  it('returns empty logs array for client with no sessions', async () => {
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
      { data: [] },
    ])
    const res = await GET(makeGet('client-1'))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.logs).toHaveLength(0)
  })

  it('returns 500 on DB error', async () => {
    mocks.setServiceResults([
      { data: { id: 'client-1' } },
      { data: null, error: { message: 'Query failed' } },
    ])
    const res = await GET(makeGet('client-1'))
    expect(res.status).toBe(500)
  })
})
