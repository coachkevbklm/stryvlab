import type { Metadata, Viewport } from 'next'
import ConditionalClientShell from '@/components/client/ConditionalClientShell'
import ServiceWorkerRegistrar from '@/components/client/ServiceWorkerRegistrar'
import { ClientI18nProvider } from '@/components/client/ClientI18nProvider'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'STRYVR',
  },
}

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// NOTE: Auth protection for client routes is handled entirely by the middleware
// (utils/supabase/middleware.ts → isClientProtected check).
//
// Do NOT add an auth redirect here. This layout applies to ALL routes under
// /client/, including /client/login and /client/set-password. Adding a
// redirect would cause an infinite redirect loop for unauthenticated users
// trying to access those pages.
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientI18nProvider>
      <div className="min-h-screen bg-[#121212]">
        <ServiceWorkerRegistrar />
        <ConditionalClientShell>{children}</ConditionalClientShell>
      </div>
    </ClientI18nProvider>
  )
}
