'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { clientLogin } from './actions'

export default function ClientLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [hashError, setHashError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If an invite/magiclink token lands here (misconfigured redirect URL),
    // forward to the correct onboarding page instead of staying on login.
    const hash = window.location.hash
    if (hash && hash.includes('access_token=')) {
      window.location.replace('/client/onboarding' + hash)
      return
    }

    const queryParams = new URLSearchParams(window.location.search)
    if (queryParams.get('error') === 'link_expired') {
      setHashError("Ce lien d'invitation a expiré ou est invalide. Demande à ton coach de t'en envoyer un nouveau.")
      return
    }

    const hashParams = new URLSearchParams((hash ?? '').replace(/^#/, ''))
    const errorCode = hashParams.get('error_code')
    if (!errorCode) return
    if (errorCode === 'otp_expired') {
      setHashError("Ce lien d'invitation a expiré. Demande à ton coach de t'en envoyer un nouveau.")
    } else {
      setHashError("Ce lien est invalide ou a déjà été utilisé. Demande à ton coach de t'envoyer une nouvelle invitation.")
    }
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await clientLogin(formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/client')
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border-[0.3px] border-white/[0.06] flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="STRYVR"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="text-center">
          <p className="font-unbounded font-semibold text-[15px] text-white tracking-tight leading-none">
            STRYVR<span className="font-light text-white/30"> lab</span>
          </p>
          <p className="text-[11px] text-white/30 mt-1.5">Ton espace client</p>
        </div>
      </div>

      {/* Erreur lien */}
      {hashError && (
        <div className="w-full max-w-sm mb-4 bg-red-500/[0.08] border-[0.3px] border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-[12px] text-red-400 leading-relaxed">{hashError}</p>
        </div>
      )}

      {/* Card connexion */}
      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
        <div className="mb-5">
          <h2 className="text-[15px] font-bold text-white">Connexion</h2>
          <p className="text-[12px] text-white/40 mt-1">
            Utilise l'email et le mot de passe créés lors de ton invitation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="toi@exemple.com"
              required
              className="w-full h-[48px] rounded-xl bg-[#0a0a0a] px-4 text-[14px] font-medium text-white placeholder:text-white/20 outline-none border-[0.3px] border-white/[0.06] focus:border-[#1f8a65]/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="w-full h-[48px] rounded-xl bg-[#0a0a0a] px-4 pr-11 text-[14px] font-medium text-white placeholder:text-white/20 outline-none border-[0.3px] border-white/[0.06] focus:border-[#1f8a65]/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/[0.08] border-[0.3px] border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-[12px] text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 flex h-[48px] items-center justify-between rounded-xl bg-[#1f8a65] pl-5 pr-2 transition-all hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50"
          >
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
              {isPending ? 'Connexion…' : 'Se connecter'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.12]">
              {isPending
                ? <Loader2 size={15} className="animate-spin text-white" />
                : <ArrowRight size={15} className="text-white" />
              }
            </div>
          </button>
        </form>
      </div>

      <p className="mt-6 text-[11px] text-white/20 text-center">
        Accès réservé aux clients invités par leur coach.
      </p>
    </div>
  )
}
