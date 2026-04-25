'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User, Dumbbell, TrendingUp, Utensils } from 'lucide-react'
import { useClientT } from './ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useClientT()

  const NAV: { href: string; labelKey: ClientDictKey; icon: React.ElementType }[] = [
    { href: '/client',             labelKey: 'nav.home',      icon: Home },
    { href: '/client/programme',   labelKey: 'nav.programme', icon: Dumbbell },
    { href: '/client/progress',    labelKey: 'nav.progress',  icon: TrendingUp },
    { href: '/client/nutrition',   labelKey: 'nav.nutrition', icon: Utensils },
    { href: '/client/bilans',      labelKey: 'nav.bilans',    icon: ClipboardList },
    { href: '/client/profil',      labelKey: 'nav.profil',    icon: User },
  ]

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="relative flex items-center gap-1 rounded-2xl px-3 h-14">
        {/* Glassmorphism background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
        </div>

        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 h-9 transition-all duration-200 hover:scale-105 active:scale-95 ${
                active
                  ? 'border-[#1f8a65]/30 bg-[#1f8a65]/20 text-[#1f8a65]'
                  : 'border-white/[0.06] bg-white/[0.06] text-white/40 hover:bg-white/[0.09] hover:text-white/70'
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[8px] font-medium leading-none">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
