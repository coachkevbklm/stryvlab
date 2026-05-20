import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { resolveClientFromUser } from "@/lib/client/resolve-client"
import MetricsPage from "@/components/client/MetricsPage"

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function MetricsRoute() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const db = service()
  const cc = await resolveClientFromUser(
    user.id,
    user.email,
    db,
    'id, first_name, last_name, email, streak_days'
  )

  if (!cc) return null

  const firstName = (cc as any).first_name ?? ""
  const lastName  = (cc as any).last_name  ?? ""
  const initials  = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?"

  return (
    <MetricsPage
      clientName={`${firstName} ${lastName}`.trim()}
      clientEmail={(cc as any).email ?? user.email ?? ""}
      avatarInitials={initials}
      streak={(cc as any).streak_days ?? 0}
    />
  )
}
