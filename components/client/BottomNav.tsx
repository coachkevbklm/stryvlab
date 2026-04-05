'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User, Dumbbell, TrendingUp } from 'lucide-react'

const NAV = [
  { href: '/client',            label: 'Accueil',    icon: Home },
  { href: '/client/programme',  label: 'Programme',  icon: Dumbbell },
  { href: '/client/progress',   label: 'Progrès',    icon: TrendingUp },
  { href: '/client/bilans',     label: 'Bilans',     icon: ClipboardList },
  { href: '/client/profil',     label: 'Profil',     icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-white/60 pb-safe">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/client' ? pathname === '/client' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-accent' : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
