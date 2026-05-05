'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Barbell, ForkKnife, UserCircle } from '@phosphor-icons/react'
import { useClientT } from './ClientI18nProvider'
import { useTour } from './TourContext'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

const NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: '/client',           labelKey: 'nav.home',      Icon: House },
  { href: '/client/programme', labelKey: 'nav.programme', Icon: Barbell },
  { href: '/client/nutrition', labelKey: 'nav.nutrition', Icon: ForkKnife },
  { href: '/client/profil',    labelKey: 'nav.profil',    Icon: UserCircle },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useClientT()
  const { highlightedNavIndex } = useTour()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-[480px] px-4">
        <div className="flex items-center justify-around rounded-2xl border-[0.3px] border-white/[0.06] bg-[#181818] backdrop-blur-md shadow-[0_-1px_0_rgba(255,255,255,0.03),0_-12px_40px_rgba(0,0,0,0.5)] px-2 h-[62px]">
          {NAV.map(({ href, labelKey, Icon }, idx) => {
            const routeActive = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
            const active = routeActive || highlightedNavIndex === idx
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-full transition-all duration-200 active:scale-[0.92] ${
                  active ? 'text-[#1f8a65]' : 'text-white/35 hover:text-white/60'
                }`}
              >
                {/* Active pill background */}
                {active && (
                  <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#1f8a65]/[0.12]" />
                )}

                <Icon
                  size={24}
                  weight={active ? 'fill' : 'regular'}
                  className="relative z-10"
                />

                <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${
                  active ? 'text-[#1f8a65]' : 'text-white/30'
                }`}>
                  {t(labelKey)}
                </span>

              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
