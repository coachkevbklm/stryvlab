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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-[480px] px-4">
        <div className="flex items-center gap-1 rounded-2xl border-[0.3px] border-white/[0.06] bg-[#121212] px-3 h-14">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl h-9 transition-all duration-150 active:scale-95 ${
                  active
                    ? 'bg-[#1f8a65]/10 text-[#1f8a65]'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.75} />
                <span className="text-[8px] font-medium leading-none">{t(labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
