import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  movement_pattern: z.string().max(50).nullable().optional(),
  is_compound: z.boolean().optional().default(false),
  equipment: z.array(z.string()).max(10).optional().default([]),
  muscles: z.array(z.string()).max(12).optional().default([]),
  muscle_group: z.string().max(50).nullable().optional(),
  stimulus_coefficient: z.number().min(0).max(1).optional().default(0.60),
  notes: z.string().max(1000).nullable().optional(),
})

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(_req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceClient()
  const { data, error } = await db
    .from('coach_custom_exercises')
    .select('*')
    .eq('coach_id', user.id)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 })
  }

  const db = serviceClient()
  const slug = toSlug(parsed.data.name)

  const { data, error } = await db
    .from('coach_custom_exercises')
    .insert({
      coach_id: user.id,
      slug,
      name: parsed.data.name,
      movement_pattern: parsed.data.movement_pattern ?? null,
      is_compound: parsed.data.is_compound,
      equipment: parsed.data.equipment,
      muscles: parsed.data.muscles,
      muscle_group: parsed.data.muscle_group ?? null,
      stimulus_coefficient: parsed.data.stimulus_coefficient,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un exercice avec ce nom existe déjà.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
