'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, Utensils, User } from 'lucide-react'
import { useClientT } from './ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

const NAV: { href: string; labelKey: ClientDictKey; icon: React.ElementType }[] = [
  { href: '/client',           labelKey: 'nav.home',      icon: Home },
  { href: '/client/programme', labelKey: 'nav.programme', icon: Dumbbell },
  { href: '/client/nutrition', labelKey: 'nav.nutrition', icon: Utensils },
  { href: '/client/profil',    labelKey: 'nav.profil',    icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useClientT()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-[480px] px-4">
        <div className="flex items-center justify-around rounded-2xl border-[0.3px] border-white/[0.06] bg-[#181818] shadow-[0_-1px_0_rgba(255,255,255,0.04),0_-8px_32px_rgba(0,0,0,0.4)] px-2 h-16">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-150 active:scale-95 ${
                  active
                    ? 'text-[#1f8a65]'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-[#1f8a65]/10" />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.5}
                  className="relative z-10"
                />
                {active && (
                  <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[#1f8a65]" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
