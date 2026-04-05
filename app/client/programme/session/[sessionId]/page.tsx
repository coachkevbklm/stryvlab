import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import SessionLogger from './SessionLogger'

export default async function SessionLogPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service)
  if (!client) notFound()

  // Fetch session with exercises + colonnes double progression
  const { data: session } = await service
    .from('program_sessions')
    .select(`
      id, name, day_of_week,
      program_id,
      program_exercises (
        id, name, sets, reps, rest_sec, rir, notes, position,
        target_rir, current_weight_kg, rep_min, rep_max, weight_increment_kg
      )
    `)
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  // Vérifier que cette session appartient bien à un programme actif du client
  // et récupérer le flag progressive_overload_enabled
  const { data: program } = await service
    .from('programs')
    .select('id, progressive_overload_enabled')
    .eq('id', (session as any).program_id)
    .eq('client_id', client.id)
    .eq('status', 'active')
    .single()

  if (!program) notFound()

  const progressionEnabled = (program as any).progressive_overload_enabled ?? false

  const exercises = (session.program_exercises ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((ex: any) => ({
      ...ex,
      progressive_overload_enabled: progressionEnabled,
    }))

  return (
    <SessionLogger
      clientId={client.id}
      session={{ id: session.id, name: session.name }}
      exercises={exercises}
    />
  )
}
