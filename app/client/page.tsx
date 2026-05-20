import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { resolveClientFromUser } from "@/lib/client/resolve-client"
import ChatPage from "@/components/client/ChatPage"

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ClientHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName: string | null = null
  let coachAvatarUrl: string | null = null

  if (user) {
    const db = service()
    const cc = await resolveClientFromUser(user.id, user.email, db, 'id, first_name, coach_id')
    firstName = (cc as any)?.first_name ?? null

    const coachId = (cc as any)?.coach_id ?? null
    if (coachId) {
      const { data: coachProfile } = await db
        .from('coach_profiles')
        .select('logo_url')
        .eq('coach_id', coachId)
        .maybeSingle()
      coachAvatarUrl = (coachProfile as any)?.logo_url ?? null
    }
  }

  return <ChatPage coachAvatarUrl={coachAvatarUrl} clientFirstName={firstName} />
}
