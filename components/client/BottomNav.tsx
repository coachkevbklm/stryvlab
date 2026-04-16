'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User, Dumbbell, TrendingUp } from 'lucide-react'
import { useClientT } from './ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useClientT()

  const NAV: { href: string; labelKey: ClientDictKey; icon: React.ElementType }[] = [
    { href: '/client',           labelKey: 'nav.home',      icon: Home },
    { href: '/client/programme', labelKey: 'nav.programme', icon: Dumbbell },
    { href: '/client/progress',  labelKey: 'nav.progress',  icon: TrendingUp },
    { href: '/client/bilans',    labelKey: 'nav.bilans',    icon: ClipboardList },
    { href: '/client/profil',    labelKey: 'nav.profil',    icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-xl border-t-[0.3px] border-white/[0.06] pb-safe">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-[#1f8a65]' : 'text-white/35 hover:text-white/60'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
