import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve a coach_clients row from auth user.
 * 1. Try user_id match (normal login)
 * 2. Fallback: email match + auto-link user_id (first magic link login)
 */
export async function resolveClientFromUser(
  userId: string,
  email: string | undefined,
  service: SupabaseClient,
  select = 'id'
) {
  let { data: client } = await service
    .from('coach_clients')
    .select(select)
    .eq('user_id', userId)
    .single()

  if (!client && email) {
    const { data: byEmail } = await service
      .from('coach_clients')
      .select(select)
      .eq('email', email)
      .is('user_id', null)
      .single()

    if (byEmail) {
      await service
        .from('coach_clients')
        .update({ user_id: userId })
        .eq('id', (byEmail as any).id)
      client = byEmail
    }
  }

  return client
}
