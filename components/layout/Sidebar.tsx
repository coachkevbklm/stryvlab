'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import NotificationBell from '@/components/layout/NotificationBell'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calculator,
  Dumbbell,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
  CreditCard,
  Euro,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        href: '/dashboard',
        match: (p: string) => p === '/dashboard',
      },
      {
        icon: Users,
        label: 'Clients',
        href: '/coach/clients',
        match: (p: string) => p.startsWith('/coach/clients'),
      },
      {
        icon: ClipboardList,
        label: 'Bilans',
        href: '/coach/assessments',
        match: (p: string) => p.startsWith('/coach/assessments'),
      },
      {
        icon: Dumbbell,
        label: 'Programmes',
        href: '/coach/programs/templates',
        match: (p: string) => p.startsWith('/coach/programs'),
      },
      {
        icon: CreditCard,
        label: 'Formules',
        href: '/coach/formules',
        match: (p: string) => p.startsWith('/coach/formules'),
      },
      {
        icon: Euro,
        label: 'Comptabilité',
        href: '/coach/comptabilite',
        match: (p: string) => p.startsWith('/coach/comptabilite'),
      },
    ],
  },
  {
    label: 'Outils',
    items: [
      {
        icon: Calculator,
        label: 'Tous les outils',
        href: '/outils',
        match: (p: string) => p === '/outils',
      },
      {
        icon: Dumbbell,
        label: 'Macros & Calories',
        href: '/outils/macros',
        match: (p: string) => p.startsWith('/outils/macros'),
      },
      {
        icon: Activity,
        label: '1RM & Force',
        href: '/outils/1rm',
        match: (p: string) => p.startsWith('/outils/1rm'),
      },
      {
        icon: FileText,
        label: '% Masse grasse',
        href: '/outils/body-fat',
        match: (p: string) => p.startsWith('/outils/body-fat'),
      },
      {
        icon: Activity,
        label: 'Zones cardio',
        href: '/outils/hr-zones',
        match: (p: string) => p.startsWith('/outils/hr-zones'),
      },
    ],
  },
  {
    label: 'Compte',
    items: [
      {
        icon: Settings,
        label: 'Paramètres',
        href: '#',
        match: (p: string) => p === '/settings',
      },
    ],
  },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed top-4 left-4 h-[calc(100vh-32px)] w-56 bg-surface border border-subtle rounded-card shadow-elevated flex flex-col z-50">

      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-subtle cursor-pointer shrink-0"
        onClick={() => router.push('/dashboard')}
      >
        <Image src="/images/logo.png" alt="STRYV" width={32} height={32} className="w-8 h-8 object-contain" />
        <span className="font-unbounded font-semibold text-primary tracking-tight text-xs leading-none">
          STRYV <span className="font-light text-secondary">lab</span><br />
          <span className="font-normal text-secondary" style={{ fontSize: '10px' }}>Coach</span>
        </span>
      </div>

      {/* Nav sections — scroll only here, not the whole sidebar */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest px-2 mb-1.5">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ icon: Icon, label, href, match }) => {
                const active = match(pathname)
                const disabled = href === '#'
                return (
                  <button
                    key={label}
                    onClick={() => !disabled && router.push(href)}
                    disabled={disabled}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left w-full transition-all duration-150 group ${
                      active
                        ? 'bg-accent text-[#1A1A1A] shadow-md font-semibold'
                        : disabled
                        ? 'text-secondary/30 cursor-not-allowed'
                        : 'text-secondary hover:bg-surface-light hover:text-primary hover:shadow-elevated'
                    }`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={active ? 2.5 : 1.8}
                      className="shrink-0"
                    />
                    <span className="text-xs font-semibold truncate flex-1">{label}</span>
                    {active && (
                      <ChevronRight size={12} className="shrink-0 opacity-60" />
                    )}
                    {disabled && (
                      <span className="text-[9px] font-bold text-secondary/40 shrink-0">Bientôt</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — outside overflow container so dropdowns render correctly */}
      <div className="px-3 py-3 border-t border-subtle shrink-0 flex flex-col gap-0.5">
        <NotificationBell sidebarMode />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-secondary hover:text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut size={15} strokeWidth={1.8} className="shrink-0" />
          <span className="text-xs font-semibold">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
