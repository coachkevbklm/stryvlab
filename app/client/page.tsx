import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { ClipboardList, User, ChevronRight, Dumbbell } from 'lucide-react'

export default async function ClientHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch client — d'abord par user_id, sinon par email (premier login magic link)
  let { data: client } = await service
    .from('coach_clients')
    .select('id, first_name, last_name, email')
    .eq('user_id', user!.id)
    .single()

  // Liaison automatique user_id au premier accès via magic link
  if (!client && user!.email) {
    const { data: byEmail } = await service
      .from('coach_clients')
      .select('id, first_name, last_name, email')
      .eq('email', user!.email)
      .is('user_id', null)
      .single()

    if (byEmail) {
      await service
        .from('coach_clients')
        .update({ user_id: user!.id })
        .eq('id', byEmail.id)
      client = byEmail
    }
  }

  const firstName = client?.first_name ?? user?.email?.split('@')[0] ?? 'toi'

  // Count pending bilans
  const { data: clientRecord } = await service
    .from('coach_clients')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { count: pendingCount } = clientRecord
    ? await service
        .from('assessment_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientRecord.id)
        .in('status', ['pending', 'in_progress'])
    : { count: 0 }

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Image src="/images/logo.png" alt="STRYV" width={32} height={32} className="w-8 h-8 object-contain" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Bonjour {firstName} 👋</h1>
        <p className="text-sm text-secondary mb-8">Voici ton espace personnel</p>

        <div className="flex flex-col gap-3">
          {/* Bilans */}
          <Link href="/client/bilans" className="bg-surface rounded-card shadow-soft-out p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary text-sm">Mes bilans</p>
              <p className="text-xs text-secondary">
                {pendingCount && pendingCount > 0
                  ? `${pendingCount} bilan${pendingCount > 1 ? 's' : ''} en attente`
                  : 'Voir mes bilans'}
              </p>
            </div>
            {pendingCount && pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
            <ChevronRight size={16} className="text-secondary" />
          </Link>

          {/* Programme */}
          <Link href="/client/programme" className="bg-surface rounded-card shadow-soft-out p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Dumbbell size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary text-sm">Mon programme</p>
              <p className="text-xs text-secondary">Voir les séances de la semaine</p>
            </div>
            <ChevronRight size={16} className="text-secondary" />
          </Link>

          {/* Profil */}
          <Link href="/client/profil" className="bg-surface rounded-card shadow-soft-out p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <User size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary text-sm">Mon profil</p>
              <p className="text-xs text-secondary">Infos & déconnexion</p>
            </div>
            <ChevronRight size={16} className="text-secondary" />
          </Link>
        </div>
      </main>
    </div>
  )
}
