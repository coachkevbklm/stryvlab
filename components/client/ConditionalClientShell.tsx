'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

// Routes that are NOT part of the authenticated client shell
// (login, set-password, auth callbacks, error pages).
// These render without BottomNav and without the pb-20 bottom offset.
const AUTH_PATHS = [
  '/client/login',
  '/client/set-password',
  '/client/auth',
  '/client/access',
  '/client/acces-suspendu',
]

interface Props {
  children: React.ReactNode
}

export default function ConditionalClientShell({ children }: Props) {
  const pathname = usePathname()
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (isAuthPath) {
    // Auth pages manage their own layout — no shell, no bottom nav.
    return <>{children}</>
  }

  return (
    <>
      <div className="pb-20">{children}</div>
      <BottomNav />
    </>
  )
}
