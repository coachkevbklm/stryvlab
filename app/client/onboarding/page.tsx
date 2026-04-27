'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, Smartphone, Zap, BarChart3, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Step = 'exchanging' | 'password' | 'welcome' | 'error'

function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('exchanging')
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)

  // Prevent double-resolution from onAuthStateChange firing multiple events
  const resolved = useRef(false)

  function fail(msg: string) {
    if (resolved.current) return
    resolved.current = true
    setErrorMsg(msg)
    setStep('error')
  }

  function succeed() {
    if (resolved.current) return
    resolved.current = true
    setStep('password')
  }

  useEffect(() => {
    const supabase = createClient()

    // Check for explicit errors in query params
    const urlError = searchParams.get('error_code') ?? searchParams.get('error') ?? searchParams.get('error_description')
    if (urlError) {
      fail('Le lien a expiré ou est invalide. Demande à ton coach de t\'envoyer un nouveau lien d\'invitation.')
      return
    }

    // Check for errors in hash (Supabase puts them there too)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''

    // DEBUG: affiche l'URL complète dans le titre de la page pour diagnostic mobile
    if (typeof document !== 'undefined') {
      document.title = hash ? 'HASH:' + hash.slice(0, 40) : 'NO-HASH url=' + window.location.href.slice(-60)
    }

    if (hash.includes('error=') || hash.includes('error_code=')) {
      fail('Le lien a expiré ou a déjà été utilisé. Demande à ton coach un nouveau lien d\'invitation.')
      return
    }

    let pollInterval: ReturnType<typeof setInterval> | null = null

    function startPolling() {
      // Poll getSession() every 300ms for up to 10s.
      // On mobile Safari the SDK processes the hash asynchronously and
      // SIGNED_IN may never fire — polling is the reliable fallback.
      let attempts = 0
      pollInterval = setInterval(async () => {
        attempts++
        const { data: { session } } = await supabase.auth.getSession()
        if (session && !resolved.current) {
          clearInterval(pollInterval!)
          succeed()
          return
        }
        if (attempts >= 33) { // ~10s
          clearInterval(pollInterval!)
          if (!resolved.current) {
            fail('Lien invalide ou expiré. Demande à ton coach un nouveau lien d\'invitation.')
          }
        }
      }, 300)
    }

    // Primary path: listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        subscription.unsubscribe()
        if (pollInterval) clearInterval(pollInterval)
        succeed()
        return
      }

      // INITIAL_SESSION with no session on mobile Safari = hash not yet processed.
      // Fall back to polling.
      if (event === 'INITIAL_SESSION' && !session) {
        startPolling()
      }

      if (event === 'INITIAL_SESSION' && session) {
        subscription.unsubscribe()
        if (pollInterval) clearInterval(pollInterval)
        succeed()
      }
    })

    // Also check immediately in case session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !resolved.current) {
        subscription.unsubscribe()
        if (pollInterval) clearInterval(pollInterval)
        succeed()
      }
    })

    return () => {
      subscription.unsubscribe()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')

    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordError('Impossible de définir le mot de passe. Réessaye ou demande un nouveau lien.')
      setLoading(false)
      return
    }

    fetch('/api/client/welcome', { method: 'POST' }).catch(() => {})
    setStep('welcome')
  }

  // ─── Exchanging ───────────────────────────────────────────────────────────
  if (step === 'exchanging') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#1f8a65] mx-auto mb-4" />
          <p className="text-base font-semibold text-white mb-1">Vérification en cours…</p>
          <p className="text-sm text-white/50">On établit ton accès, ça prend quelques secondes.</p>
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 max-w-sm w-full text-center">
          <XCircle size={44} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-base font-bold text-white mb-2">Lien invalide ou expiré</h2>
          <p className="text-sm text-white/55 mb-6 leading-relaxed">{errorMsg}</p>
          <a
            href="/client/login"
            className="block w-full py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Aller à la connexion
          </a>
        </div>
      </div>
    )
  }

  // ─── Password ──────────────────────────────────────────────────────────────
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/images/logo.png" alt="STRYV" width={48} height={48} className="w-12 h-12 object-contain" />
          <span className="font-unbounded font-semibold text-base text-white tracking-tight leading-none">
            STRYV<span className="font-light text-white/60"> lab</span>
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
          <h2 className="text-base font-bold text-white mb-1">Crée ton mot de passe</h2>
          <p className="text-xs text-white/55 mb-5">Tu utiliseras ce mot de passe pour te connecter.</p>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/55 block mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  required
                  minLength={8}
                  autoFocus
                  className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-[#1f8a65]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/55 block mb-1.5">
                Confirmer
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répète ton mot de passe"
                required
                className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-[#1f8a65]/40 transition-colors"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 flex items-center justify-center gap-2 bg-[#1f8a65] hover:bg-[#217356] active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Création…' : 'Créer mon mot de passe'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── Welcome ───────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    const features = [
      { icon: Smartphone, title: 'Séances rapides', desc: '5 min max — log tes résultats en temps réel.' },
      { icon: BarChart3,   title: 'Suivi progressif', desc: 'Poids, force et morpho au fil du temps.' },
      { icon: Zap,         title: 'Programmes intelligents', desc: 'Conçus par ton coach, adaptés à toi.' },
      { icon: Settings,    title: 'Ton profil', desc: 'Préférences et limitations physiques.' },
    ]

    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/images/logo.png" alt="STRYV" width={48} height={48} className="w-12 h-12 object-contain" />
          <span className="font-unbounded font-semibold text-base text-white tracking-tight leading-none">
            STRYV<span className="font-light text-white/60"> lab</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <CheckCircle2 size={44} className="text-[#1f8a65] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Compte créé !</h2>
            <p className="text-sm text-white/55">Voici ce qui t'attend dans ton espace.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <Icon size={18} className="text-[#1f8a65] mb-2" />
                <p className="text-[12px] font-semibold text-white mb-1">{title}</p>
                <p className="text-[11px] text-white/45 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/client')}
            className="w-full h-11 flex items-center justify-center gap-2 bg-[#1f8a65] hover:bg-[#217356] active:scale-[0.98] text-white font-bold rounded-xl transition-all"
          >
            Accéder à mon espace
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#1f8a65]" />
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  )
}
