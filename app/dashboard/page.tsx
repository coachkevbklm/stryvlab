'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Users, Calculator, Loader2,
  ChevronRight, BarChart3, Settings,
  TrendingUp, UserPlus, ClipboardList
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [clientCount, setClientCount] = useState<number | null>(null)
  const [submissionCount, setSubmissionCount] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      setLoading(false)

      Promise.all([
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/assessments/submissions').then(r => r.json()),
      ]).then(([clientsData, subsData]) => {
        setClientCount(clientsData.clients?.length ?? 0)
        setSubmissionCount(subsData.submissions?.length ?? 0)
      }).catch(() => {})
    })
  }, [router])

  const meta = user?.user_metadata || {}
  const firstName = meta.first_name || ''
  const coachName = meta.coach_name || meta.first_name || user?.email?.split('@')[0] || 'Coach'
  const initials = (meta.first_name?.[0] || '') + (meta.last_name?.[0] || '') || user?.email?.[0]?.toUpperCase() || 'C'
  const activeClients = meta.active_clients || ''
  const profileClientRange =
    activeClients === '30_plus' ? '30+' :
    activeClients === '15_30'   ? '15–30' :
    activeClients === '5_15'    ? '5–15' :
    activeClients === '0_5'     ? '0–5' : '—'

  const hasClients = clientCount === null || clientCount > 0

  const MODULES = [
    {
      id: 'clients',
      icon: Users,
      title: 'Suivi des Clients',
      description: 'Gérez les profils, envoyez des bilans et suivez la progression de vos clients.',
      badge: 'Disponible',
      badgeColor: 'text-accent',
      href: '/coach/clients',
      cta: 'Accéder aux clients',
      available: true,
    },
    {
      id: 'bilans',
      icon: ClipboardList,
      title: 'Bilans & Templates',
      description: 'Créez des modèles de bilans personnalisés et envoyez-les à vos clients via un lien.',
      badge: 'Disponible',
      badgeColor: 'text-accent',
      href: '/coach/assessments',
      cta: 'Gérer les templates',
      available: true,
    },
    {
      id: 'calculator',
      icon: Calculator,
      title: 'Super Calculatrice',
      description: 'Calcule les macros, besoins caloriques, composition corporelle et bien plus.',
      badge: 'Disponible',
      badgeColor: 'text-accent',
      href: '/outils?from=dashboard',
      cta: 'Ouvrir les outils',
      available: true,
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Rapports & Analyses',
      description: 'Visualise l\'évolution de tes clients sur la durée avec des graphiques clairs.',
      badge: 'Bientôt',
      badgeColor: 'text-secondary',
      href: '#',
      cta: 'Voir les rapports',
      available: false,
    },
  ]

  const QUICK_ACTIONS = [
    { icon: UserPlus,     label: 'Nouveau client',  desc: 'Ajouter un profil',    href: '/coach/clients',      color: 'bg-accent/15 text-accent'         },
    { icon: ClipboardList,label: 'Envoyer un bilan',desc: 'Choisir un template',  href: '/coach/assessments',  color: 'bg-white/10 text-primary'        },
    { icon: Calculator,   label: 'Calculer',        desc: 'Ouvrir un outil',      href: '/outils?from=dashboard', color: 'bg-white/5 text-secondary'    },
    { icon: Settings,     label: 'Mon profil',      desc: 'Paramètres coach',     href: '#',                   color: 'bg-white/5 text-secondary'       },
  ]

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-accent animate-spin" size={32} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background font-sans">

        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-subtle px-8 py-4 flex items-center justify-between">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <p className="text-[11px] text-secondary font-semibold uppercase tracking-wider">Dashboard</p>
            <h1 className="text-xl font-bold text-primary tracking-tight">
              Bonjour, {firstName || coachName} 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-bold text-sm border border-white/10">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1300px] mx-auto">

          {!hasClients && (
            <div className={`mb-8 rounded-xl border border-subtle bg-surface p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div>
                <p className="text-[11px] text-secondary font-semibold uppercase tracking-wider mb-1">Bienvenue dans l&apos;Espace Coach</p>
                <h3 className="text-white text-xl font-bold tracking-tight">Tu viens d&apos;entrer dans la <span className="text-accent">nouvelle ère</span> du coaching.</h3>
                <p className="text-secondary text-sm mt-1">Commence par créer ton premier client pour démarrer le suivi.</p>
              </div>
              <button
                onClick={() => router.push('/coach/clients')}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-xl font-bold text-sm border border-white/10 hover:bg-gray-200 transition-all duration-200"
              >
                <UserPlus size={16} />
                Créer un client
              </button>
            </div>
          )}

          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[
              {
                label: 'Clients actifs',
                value: clientCount !== null ? String(clientCount) : profileClientRange,
                icon: Users,
                color: 'text-accent',
                href: '/coach/clients',
              },
              {
                label: 'Bilans envoyés',
                value: submissionCount !== null ? String(submissionCount) : '—',
                icon: ClipboardList,
                color: 'text-primary',
                href: '/coach/assessments',
              },
              {
                label: 'Outils disponibles',
                value: '12+',
                icon: Calculator,
                color: 'text-secondary',
                href: '/outils?from=dashboard',
              },
              {
                label: 'Progression globale',
                value: '—',
                icon: TrendingUp,
                color: 'text-secondary',
                href: '#',
              },
            ].map(({ label, value, icon: Icon, color, href }) => (
              <div
                key={label}
                onClick={() => href !== '#' && router.push(href)}
                className={`bg-surface rounded-xl p-5 border border-subtle ${href !== '#' ? 'cursor-pointer hover:border-white/15 transition-colors duration-200' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">{label}</p>
                  <div className="w-8 h-8 rounded-lg bg-surface-alt border border-subtle flex items-center justify-center">
                    <Icon size={16} className={color} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-primary tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className={`mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-4">Tes Outils</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.map(({ id, icon: Icon, title, description, badge, badgeColor, href, cta, available }) => (
                <div
                  key={id}
                  onClick={() => available && router.push(href)}
                  className={`bg-surface rounded-xl p-6 border border-subtle group transition-all duration-300 ${
                    available
                      ? 'cursor-pointer hover:border-white/15'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-alt border border-subtle flex items-center justify-center">
                      <Icon size={22} className={available ? 'text-primary' : 'text-secondary'} strokeWidth={1.5} />
                    </div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${badgeColor}`}>{badge}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">{title}</h3>
                  <p className="text-sm text-secondary leading-relaxed mb-4">{description}</p>
                  <div className={`flex items-center gap-2 text-sm font-bold transition-all ${available ? 'text-primary group-hover:text-accent' : 'text-secondary'}`}>
                    {cta}
                    <ChevronRight size={16} className={`transition-transform ${available ? 'group-hover:translate-x-1' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-4">Actions Rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, color }) => (
                <button
                  key={label}
                  onClick={() => href !== '#' && router.push(href)}
                  disabled={href === '#'}
                  className="bg-surface rounded-xl p-5 border border-subtle text-left group hover:border-white/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-subtle"
                >
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-sm font-bold text-primary">{label}</p>
                  <p className="text-xs text-secondary mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
    </main>
  )
}
