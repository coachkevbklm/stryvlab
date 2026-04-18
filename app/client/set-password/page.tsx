'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

function SetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const [exchanging, setExchanging] = useState(true)
  const [exchangeError, setExchangeError] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // If the callback route flagged a link error via query param, show error immediately.
    if (new URLSearchParams(window.location.search).get('error') === 'link_expired') {
      setExchangeError(true)
      setExchanging(false)
      return
    }

    // The callback route exchanges the PKCE code server-side and sets session cookies
    // before redirecting here. The Supabase browser client reads those cookies and
    // fires INITIAL_SESSION with the established session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[set-password] auth event:', event, 'session:', !!session)

      if (event === 'INITIAL_SESSION') {
        // INITIAL_SESSION fires on page load with whatever session is in storage.
        if (session) {
          setExchanging(false) // Session established — show the form
        } else {
          // No session yet. If there's a recovery token in the hash (implicit flow),
          // wait for the PASSWORD_RECOVERY event instead of erroring immediately.
          const hasRecoveryToken =
            typeof window !== 'undefined' &&
            window.location.hash.includes('type=recovery') &&
            window.location.hash.includes('access_token=')
          if (!hasRecoveryToken) {
            setExchangeError(true)
            setExchanging(false)
          }
          // Otherwise: keep waiting — PASSWORD_RECOVERY will fire next.
        }
      } else if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setExchanging(false)
      } else if (event === 'SIGNED_OUT') {
        if (!done) {
          setExchangeError(true)
          setExchanging(false)
        }
      }
    })

    // Safety timeout: if Supabase fires no event within 6s, something went wrong.
    const timeout = setTimeout(() => {
      setExchanging(prev => {
        if (prev) {
          setExchangeError(true)
          return false
        }
        return prev
      })
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      console.error('[set-password] updateUser error:', updateError.message)
      setError('Impossible de définir le mot de passe. Le lien a peut-être expiré.')
      setLoading(false)
      return
    }
    // Envoyer l'email de bienvenue (non-bloquant)
    fetch('/api/client/welcome', { method: 'POST' }).catch(() => {})
    setDone(true)
    setTimeout(() => router.push('/client'), 2000)
  }

  if (exchanging) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  if (exchangeError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-surface rounded-card shadow-soft-out p-8 max-w-sm w-full text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Lien invalide ou expiré</h2>
          <p className="text-sm text-secondary mb-6">
            Ce lien n&apos;est plus valable. Demande à ton coach de t&apos;envoyer une nouvelle invitation.
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-surface rounded-card shadow-soft-out p-8 max-w-sm w-full text-center">
          <CheckCircle2 size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Mot de passe créé !</h2>
          <p className="text-sm text-secondary">Redirection vers ton espace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/images/logo.png" alt="STRYV" width={48} height={48} className="w-12 h-12 object-contain" />
        <span className="font-unbounded font-semibold text-base text-primary tracking-tight leading-none">
          STRYV<span className="font-light text-secondary"> lab</span>
        </span>
      </div>

      <div className="bg-surface rounded-card shadow-soft-out p-6 w-full max-w-sm">
        <h2 className="text-base font-bold text-primary mb-1">Crée ton mot de passe</h2>
        <p className="text-xs text-secondary mb-5">Tu utiliseras ce mot de passe pour te connecter à ton espace.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                required
                minLength={8}
                className="w-full px-3 py-2.5 pr-10 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary placeholder-secondary/50 outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
              Confirmer
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répète ton mot de passe"
              required
              className="w-full px-3 py-2.5 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary placeholder-secondary/50 outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-btn px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg text-sm"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Créer mon mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  )
}
