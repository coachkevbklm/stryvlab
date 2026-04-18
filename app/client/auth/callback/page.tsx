'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// This page is the redirect target for Supabase invitation/recovery links.
// It handles both auth flows transparently:
//
//  • PKCE  — Supabase appends ?code=xxx as a query param.
//            We exchange it client-side via exchangeCodeForSession, which sets
//            the session in cookies. Then we navigate to /client/set-password.
//
//  • Implicit (legacy) — Supabase appends #access_token=...&type=recovery as a
//            hash fragment (invisible to the server). The Supabase JS library
//            detects the hash automatically and fires PASSWORD_RECOVERY via
//            onAuthStateChange. We listen for that event and navigate to
//            /client/set-password where the session is already established.

function CallbackHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // If Supabase redirected here with an error (e.g. OTP expired), bail immediately.
    const errorCode = searchParams.get('error_code') ?? searchParams.get('error')
    if (errorCode) {
      console.log('[auth/callback] Supabase error param:', errorCode)
      window.location.href = `/client/login?error=link_expired&reason=${encodeURIComponent(errorCode)}`
      return
    }

    const supabase = createClient()
    const code = searchParams.get('code')

    let settled = false

    function done(success: boolean, reason?: string) {
      if (settled) return
      settled = true
      if (success) {
        window.location.href = '/client/set-password'
      } else {
        const r = reason ? `&reason=${encodeURIComponent(reason)}` : ''
        window.location.href = `/client/login?error=link_expired${r}`
      }
    }

    // PKCE flow: exchange the authorization code for a session.
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('[auth/callback] exchangeCodeForSession error:', error.message)
        }
        done(!error, error ? 'code_exchange_failed' : undefined)
      })
      return
    }

    // Implicit flow: Supabase JS detects #access_token=...&type=recovery in the hash
    // and fires PASSWORD_RECOVERY (or SIGNED_IN for other types).
    //
    // Event order with implicit flow:
    //   1. INITIAL_SESSION — may already have the session if hash was processed,
    //      OR null if hash not yet processed
    //   2. PASSWORD_RECOVERY  (hash processed, session established)
    //
    // Do NOT error on INITIAL_SESSION without session when a recovery hash is present —
    // PASSWORD_RECOVERY is still incoming. Only error if there's genuinely nothing to wait for.
    const hasRecoveryHash =
      typeof window !== 'undefined' &&
      window.location.hash.includes('access_token=')

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth/callback] auth event:', event, 'session:', !!session)

      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        subscription.unsubscribe()
        done(true)
      } else if (event === 'INITIAL_SESSION' && session) {
        // Session already established (e.g. implicit flow processed synchronously).
        subscription.unsubscribe()
        done(true)
      } else if (event === 'INITIAL_SESSION' && !session && !hasRecoveryHash) {
        // No code, no hash token — nothing valid to wait for.
        subscription.unsubscribe()
        done(false, 'no_token')
      }
      // INITIAL_SESSION without session but WITH a recovery hash: keep waiting for PASSWORD_RECOVERY.
    })

    // Safety timeout: if neither PKCE nor hash token resolves within 8s, redirect to error.
    const timeout = setTimeout(() => done(false, 'timeout'), 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
