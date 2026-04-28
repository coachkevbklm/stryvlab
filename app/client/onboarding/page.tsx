'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, XCircle, ArrowRight, Dumbbell, Activity, TrendingUp, LayoutDashboard, ChevronRight, Target, Timer, CheckSquare, BarChart2, MessageSquare, LineChart, Utensils, Camera, ClipboardList, Bell, UserCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Step = 'exchanging' | 'password' | 'welcome' | 'error'

function FeatureRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#1f8a65]/10 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-[#1f8a65]" strokeWidth={1.75} />
      </div>
      <p className="text-[13px] text-white/70 leading-snug">{text}</p>
    </div>
  )
}

const WELCOME_SCREENS = [
  {
    icon: null,
    title: (firstName: string) => `Bienvenue, ${firstName}.`,
    subtitle: 'Ton coach a préparé ton espace. Voici comment en tirer le meilleur.',
    rows: null,
  },
  {
    icon: Dumbbell,
    title: () => 'Ton programme d\'entraînement',
    subtitle: 'Ton coach a conçu un programme sur mesure, basé sur ton profil et tes objectifs. Chaque séance est structurée — exercices, séries et niveau d\'effort adapté à toi.',
    rows: [
      { icon: Target, text: 'Séances organisées jour par jour' },
      { icon: Activity, text: 'Exercices et effort calibrés par ton coach (RIR)' },
      { icon: UserCircle, text: 'Adapté à tes restrictions et ton profil' },
    ],
  },
  {
    icon: CheckSquare,
    title: () => 'Pendant ta séance',
    subtitle: 'Quand tu démarres une séance, l\'app t\'accompagne en temps réel. Tu valides chaque série, tu notes ton effort ressenti — et ta progression se construit automatiquement.',
    rows: [
      { icon: CheckSquare, text: 'Valide tes séries au fur et à mesure' },
      { icon: BarChart2, text: 'Ton historique se construit à chaque séance' },
      { icon: MessageSquare, text: 'Ajoute tes ressentis pour ton coach' },
    ],
  },
  {
    icon: TrendingUp,
    title: () => 'Ta progression et ta nutrition',
    subtitle: 'Ton évolution est visible dans le temps — performances, morpho, métriques. Ton coach te prépare aussi un protocole nutritionnel personnalisé, directement accessible depuis l\'app.',
    rows: [
      { icon: LineChart, text: 'Tes métriques et performances dans le temps' },
      { icon: Utensils, text: 'Ton protocole nutritionnel préparé par ton coach' },
      { icon: Camera, text: 'Ton suivi morphologique au fil des mois' },
    ],
  },
  {
    icon: LayoutDashboard,
    title: () => 'Ton espace, ton hub',
    subtitle: 'Ton dashboard centralise tout. Ton coach t\'envoie des bilans à compléter régulièrement. Pense aussi à compléter ton profil pour que tout soit parfaitement calibré.',
    rows: [
      { icon: ClipboardList, text: 'Bilans envoyés par ton coach à compléter' },
      { icon: Bell, text: 'Actions à faire visibles directement sur ton dashboard' },
      { icon: UserCircle, text: 'Ton profil à compléter pour un suivi optimal' },
    ],
  },
]

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
  const [welcomeIndex, setWelcomeIndex] = useState(0)
  const [firstName, setFirstName] = useState('')

  // Prevent double-resolution from onAuthStateChange firing multiple events
  const resolved = useRef(false)

  function fail(msg: string) {
    if (resolved.current) return
    resolved.current = true
    setErrorMsg(msg)
    setStep('error')
  }

  async function succeed() {
    if (resolved.current) return
    resolved.current = true
    // Fetch first name from session user metadata
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const name = user?.user_metadata?.first_name ?? user?.email?.split('@')[0] ?? ''
    setFirstName(name)
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

    const hash = typeof window !== 'undefined' ? window.location.hash : ''

    if (hash.includes('error=') || hash.includes('error_code=')) {
      fail('Le lien a expiré ou a déjà été utilisé. Demande à ton coach un nouveau lien d\'invitation.')
      return
    }

    // @supabase/ssr does NOT process the hash automatically unlike the browser SDK.
    // We must extract access_token + refresh_token from the hash and call setSession() manually.
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (error || !data.session) {
              fail('Impossible d\'établir la session. Demande à ton coach un nouveau lien.')
            } else {
              succeed()
            }
          })
        return
      }
    }

    // Fallback: no hash — check for existing session (user revisiting the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        succeed()
      } else {
        fail('Lien invalide ou expiré. Demande à ton coach un nouveau lien d\'invitation.')
      }
    })
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

  // ─── Welcome (5-screen swipable tour) ─────────────────────────────────────
  if (step === 'welcome') {
    const screen = WELCOME_SCREENS[welcomeIndex]
    const isLast = welcomeIndex === WELCOME_SCREENS.length - 1
    const isFirst = welcomeIndex === 0
    const IconComponent = screen.icon

    const goNext = () => {
      if (isLast) {
        localStorage.setItem('onboarding_tour_done', 'false') // tour will run on dashboard
        router.push('/client')
      } else {
        setWelcomeIndex((i) => i + 1)
      }
    }

    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center pt-12 pb-6">
          <Image src="/images/logo.png" alt="STRYV" width={32} height={32} className="w-8 h-8 object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-6 max-w-sm mx-auto w-full">
          {/* Icon (screens 2-5) */}
          {IconComponent && (
            <div className="w-14 h-14 rounded-2xl bg-[#1f8a65]/10 flex items-center justify-center mb-6">
              <IconComponent size={26} className="text-[#1f8a65]" strokeWidth={1.75} />
            </div>
          )}

          {/* Title */}
          <h1 className={`font-black text-white mb-3 leading-tight ${isFirst ? 'text-[28px]' : 'text-[22px]'}`}>
            {screen.title(firstName)}
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] text-white/55 leading-relaxed mb-8">
            {screen.subtitle}
          </p>

          {/* Feature rows (screens 2-5) */}
          {screen.rows && (
            <div className="flex flex-col gap-4 mb-8">
              {screen.rows.map((row, i) => (
                <FeatureRow key={i} icon={row.icon} text={row.text} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="px-6 pb-10 max-w-sm mx-auto w-full">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {WELCOME_SCREENS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === welcomeIndex
                    ? 'w-5 h-1.5 bg-[#1f8a65]'
                    : 'w-1.5 h-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={goNext}
            className="group w-full h-12 flex items-center justify-between bg-[#1f8a65] hover:bg-[#217356] active:scale-[0.98] rounded-xl transition-all pl-5 pr-1.5"
          >
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
              {isLast ? 'Accéder à mon espace' : 'Suivant'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.12]">
              <ArrowRight size={16} className="text-white" />
            </div>
          </button>

          {/* Skip on non-last screens */}
          {!isLast && !isFirst && (
            <button
              onClick={() => {
                localStorage.setItem('onboarding_tour_done', 'false')
                router.push('/client')
              }}
              className="w-full mt-3 py-2 text-[11px] text-white/25 hover:text-white/45 transition-colors text-center"
            >
              Passer l'introduction
            </button>
          )}
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
