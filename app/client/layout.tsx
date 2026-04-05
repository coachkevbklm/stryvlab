import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BottomNav from '@/components/client/BottomNav'
import ServiceWorkerRegistrar from '@/components/client/ServiceWorkerRegistrar'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/client/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <ServiceWorkerRegistrar />
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  )
}
