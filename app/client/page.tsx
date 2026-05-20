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

  if (user) {
    const db = service()
    const cc = await resolveClientFromUser(user.id, user.email, db, 'id, first_name')
    firstName = (cc as any)?.first_name ?? null
  }

  return <ChatPage coachAvatarUrl={null} clientFirstName={firstName} />
}
