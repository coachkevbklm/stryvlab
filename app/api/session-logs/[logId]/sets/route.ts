import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: { logId: string } }

const setLogSchema = z.object({
  exercise_id: z.string().uuid().nullable().optional(),
  exercise_name: z.string().min(1),
  set_number: z.number().int().positive(),
  side: z.enum(['left', 'right', 'bilateral']).default('bilateral'),
  planned_reps: z.union([z.string(), z.number()]).nullable().optional(),
  actual_reps: z.number().int().nonnegative().nullable().optional(),
  actual_weight_kg: z.number().nonnegative().nullable().optional(),
  completed: z.boolean().default(false),
  rir_actual: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  rest_sec_actual: z.number().int().nonnegative().nullable().optional(),
  primary_muscles: z.array(z.string()).optional().default([]),
  secondary_muscles: z.array(z.string()).optional().default([]),
})

const bodySchema = z.object({
  set_logs: z.array(setLogSchema),
})

// PATCH /api/session-logs/[logId]/sets — upsert live des sets pendant une séance
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = service()

  // Vérifier ownership : le log appartient au client connecté
  const { data: clientData } = await db
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  const clientId = (clientData as { id: string } | null)?.id
  if (!clientId) return NextResponse.json({ error: 'Profil client introuvable' }, { status: 404 })

  const { data: logData } = await db
    .from('client_session_logs')
    .select('id')
    .eq('id', params.logId)
    .eq('client_id', clientId)
    .is('completed_at', null)
    .single()
  if (!logData) return NextResponse.json({ error: 'Séance introuvable ou déjà terminée' }, { status: 404 })

  const raw = await req.json()
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  // Si set_logs est vide, c'est un ping de validation (draft check) — retourner ok directement
  if (parsed.data.set_logs.length === 0) {
    return NextResponse.json({ success: true })
  }

  const rows = parsed.data.set_logs.map(s => ({
    session_log_id: params.logId,
    exercise_id: null, // FK nullable — exercise_name est la clé métier, pas l'UUID
    exercise_name: s.exercise_name,
    set_number: s.set_number,
    side: s.side,
    planned_reps: s.planned_reps ?? null,
    actual_reps: s.actual_reps ?? null,
    actual_weight_kg: s.actual_weight_kg ?? null,
    completed: s.completed ?? false,
    rir_actual: s.rir_actual ?? null,
    notes: s.notes ?? null,
    rest_sec_actual: s.rest_sec_actual ?? null,
    primary_muscles: s.primary_muscles ?? [],
    secondary_muscles: s.secondary_muscles ?? [],
  }))

  const { error } = await db
    .from('client_set_logs')
    .upsert(rows, {
      onConflict: 'session_log_id,exercise_name,set_number,side',
    })

  if (error) {
    console.error('[session-logs/sets] upsert error', { logId: params.logId, code: error.code, message: error.message })
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Séance introuvable, opération annulée' }, { status: 409 })
    }
    // 42P10 = no unique constraint matching ON CONFLICT specification
    // 23505 = unique constraint violation (doublon réel)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
