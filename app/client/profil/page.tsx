import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Image from 'next/image'
import ProfilePhotoUpload from '@/components/client/profile/ProfilePhotoUpload'
import ProfileForm from '@/components/client/profile/ProfileForm'
import PreferencesForm from '@/components/client/profile/PreferencesForm'
import NotificationsPanel from '@/components/client/profile/NotificationsPanel'
import PasswordResetButton from '@/components/client/profile/PasswordResetButton'
import ClientLogoutButton from './LogoutButton'

export const metadata = { title: 'Mon profil' }

export default async function ClientProfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/client/login')

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(
    user.id,
    user.email,
    service,
    'id, first_name, last_name, email, phone, goal, training_goal, fitness_level, sport_practice, weekly_frequency, status, profile_photo_url, created_at'
  )

  const [{ data: prefs }, { data: notifData }] = await Promise.all([
    client
      ? service.from('client_preferences').select('*').eq('client_id', (client as any).id).single()
      : Promise.resolve({ data: null }),
    service
      .from('client_notifications')
      .select('id, type, message, read, created_at')
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const firstName = client?.first_name ?? ''
  const lastName  = client?.last_name ?? ''
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?'
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || (user.email ?? 'Client')

  const preferences = prefs ?? {
    weight_unit: 'kg',
    height_unit: 'cm',
    language: 'fr',
    notif_session_reminder: true,
    notif_bilan_received: true,
    notif_program_updated: true,
  }

  const notifications = notifData ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Image src="/images/logo.png" alt="STRYV" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-sm font-semibold text-primary">Mon profil</span>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 flex flex-col gap-6">

        {/* ── Photo + identité ── */}
        <section className="bg-surface rounded-card shadow-soft-out p-6 flex flex-col items-center gap-4">
          <ProfilePhotoUpload
            currentUrl={client?.profile_photo_url ?? null}
            initials={initials}
          />
          <div className="text-center">
            <p className="font-bold text-primary text-lg">{fullName}</p>
            <p className="text-xs text-secondary">{user.email}</p>
            {client?.status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${
                client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {client.status === 'active' ? 'Actif' : client.status}
              </span>
            )}
          </div>
        </section>

        {/* ── Informations personnelles ── */}
        <Section title="Informations personnelles">
          <ProfileForm
            clientId={client?.id ?? ''}
            initial={{
              first_name:       client?.first_name ?? '',
              last_name:        client?.last_name ?? '',
              phone:            client?.phone ?? '',
              goal:             client?.goal ?? '',
              training_goal:    client?.training_goal ?? '',
              fitness_level:    client?.fitness_level ?? '',
              sport_practice:   client?.sport_practice ?? '',
              weekly_frequency: client?.weekly_frequency ?? null,
            }}
          />
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" badge={unreadCount > 0 ? unreadCount : undefined}>
          <NotificationsPanel
            notifications={notifications}
            preferences={{
              notif_session_reminder: preferences.notif_session_reminder,
              notif_bilan_received:   preferences.notif_bilan_received,
              notif_program_updated:  preferences.notif_program_updated,
            }}
          />
        </Section>

        {/* ── Préférences d'affichage ── */}
        <Section title="Préférences d'affichage">
          <PreferencesForm
            initial={{
              weight_unit: preferences.weight_unit as 'kg' | 'lbs',
              height_unit: preferences.height_unit as 'cm' | 'ft',
              language:    preferences.language as 'fr' | 'en' | 'es',
            }}
          />
        </Section>

        {/* ── Sécurité ── */}
        <Section title="Sécurité">
          <div className="flex flex-col gap-3">
            <PasswordResetButton email={user.email ?? ''} />
          </div>
        </Section>

        {/* ── Déconnexion ── */}
        <ClientLogoutButton />

        <p className="text-center text-[10px] text-secondary pb-2">
          Membre depuis {new Date(client?.created_at ?? Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </main>
    </div>
  )
}

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: number
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface rounded-card shadow-soft-out p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs font-bold text-secondary uppercase tracking-wide">{title}</h2>
        {badge !== undefined && (
          <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
