'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { clientLogin } from './actions'

export default function ClientLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [hashError, setHashError] = useState<string | null>(null)

  // Si Supabase redirige ici avec une erreur dans le hash (lien expiré, invalide),
  // on l'affiche directement pour guider le client.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const errorCode = params.get('error_code')
    if (!errorCode) return
    if (errorCode === 'otp_expired') {
      setHashError('Ce lien d\'invitation a expiré. Demande à ton coach de t\'en envoyer un nouveau.')
    } else {
      setHashError('Ce lien est invalide ou a déjà été utilisé. Demande à ton coach de t\'envoyer une nouvelle invitation.')
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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/images/logo.png" alt="STRYV" width={48} height={48} className="w-12 h-12 object-contain" />
        <span className="font-unbounded font-semibold text-base text-primary tracking-tight leading-none">
          STRYV<span className="font-light text-secondary"> lab</span>
        </span>
        <p className="text-xs text-secondary text-center">Ton espace client</p>
      </div>

      {hashError && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-red-400 leading-relaxed">{hashError}</p>
        </div>
      )}

      <div className="bg-surface rounded-card shadow-soft-out p-6 w-full max-w-sm">
        <h2 className="text-base font-bold text-primary mb-1">Connexion</h2>
        <p className="text-xs text-secondary mb-5">
          Utilise l'email et le mot de passe créés lors de ton invitation.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="toi@exemple.com"
              required
              className="w-full px-3 py-2.5 bg-surface-light shadow-soft-in rounded-btn text-sm text-primary placeholder-secondary/50 outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
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

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-btn px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg text-sm"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            Se connecter
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-secondary text-center">
        Accès réservé aux clients invités par leur coach.
      </p>
    </div>
  )
}
