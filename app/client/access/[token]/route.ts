import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Lookup token
  const { data: tokenRow } = await db
    .from('client_access_tokens')
    .select('magic_url, expires_at, revoked, client_id')
    .eq('token', params.token)
    .single()

  if (!tokenRow || tokenRow.revoked) {
    return NextResponse.redirect(new URL('/client/access/invalid', request.url))
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/client/access/expired', request.url))
  }

  if (!tokenRow.magic_url) {
    return NextResponse.redirect(new URL('/client/access/invalid', request.url))
  }

  // Lier user_id au profil client après connexion via magic link
  // Le magic link redirige vers /client (avec session), on ne peut pas faire le lien ici
  // → la page /client le fait au premier chargement (voir client/page.tsx)

  // Rediriger vers le magic link Supabase
  return NextResponse.redirect(tokenRow.magic_url)
}
