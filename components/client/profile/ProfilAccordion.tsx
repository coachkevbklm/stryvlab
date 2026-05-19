'use client'

import { useState } from 'react'
import AccordionSection from './AccordionSection'
import ProfilePhotoUpload from './ProfilePhotoUpload'
import ProfileForm from './ProfileForm'
import PreferencesForm from './PreferencesForm'
import NotificationsPanel from './NotificationsPanel'
import PasswordResetButton from './PasswordResetButton'
import PortionScalingForm from './PortionScalingForm'
import BodyDataSection from './BodyDataSection'
import ClientRestrictionsSection from '@/components/client/ClientRestrictionsSection'
import ClientLogoutButton from '@/app/client/profil/LogoutButton'
import Link from 'next/link'
import { useClientT } from '@/components/client/ClientI18nProvider'

type SectionId =
  | 'info'
  | 'body'
  | 'restrictions'
  | 'portions'
  | 'progress'
  | 'notif'
  | 'prefs'
  | 'security'

interface Props {
  clientId: string
  profilePhotoUrl: string | null
  initials: string
  fullName: string
  email: string
  status: string | null
  memberSince: string
  profileInitial: {
    first_name: string
    last_name: string
    phone: string
    goal: string
    date_of_birth: string
    gender: string
    training_goal: string
    fitness_level: string
    sport_practice: string
    weekly_frequency: number | null
  }
  prefsInitial: {
    weight_unit: 'kg' | 'lbs'
    height_unit: 'cm' | 'ft'
    language: 'fr' | 'en' | 'es'
  }
  notifications: {
    id: string
    type: string
    message: string
    read: boolean
    created_at: string
  }[]
  notifPrefs: {
    notif_session_reminder: boolean
    notif_bilan_received: boolean
    notif_program_updated: boolean
  }
  unreadCount: number
  streak: {
    current_streak: number
    longest_streak: number
    total_points: number
    level: string
  } | null
}

const LEVEL_COLORS: Record<string, string> = {
  bronze:   'text-amber-400',
  silver:   'text-white/60',
  gold:     'text-yellow-400',
  platinum: 'text-cyan-400',
}

export default function ProfilAccordion({
  clientId,
  profilePhotoUrl,
  initials,
  fullName,
  email,
  status,
  memberSince,
  profileInitial,
  prefsInitial,
  notifications,
  notifPrefs,
  unreadCount,
  streak,
}: Props) {
  const { t } = useClientT()
  const [openSection, setOpenSection] = useState<SectionId | null>(null)

  function toggle(id: string) {
    setOpenSection(prev => prev === id ? null : id as SectionId)
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Hero compact ── */}
      <div className="bg-[#161616] rounded-2xl border-[0.3px] border-white/[0.08] p-4 flex items-center gap-4">
        <ProfilePhotoUpload
          currentUrl={profilePhotoUrl}
          initials={initials}
          compact
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white truncate">{fullName}</p>
          <p className="text-[11px] text-white/40 truncate">{email}</p>
          {status && (
            <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
              status === 'active'
                ? 'bg-[#ffe01e]/15 text-[#ffe01e]'
                : 'bg-white/[0.06] text-white/40'
            }`}>
              {status === 'active' ? t('profil.status.active') : status}
            </span>
          )}
        </div>
        {streak && (
          <div className="text-right shrink-0">
            <p className="text-[22px] font-black text-[#ffe01e] leading-none">{streak.current_streak}</p>
            <p className="text-[9px] text-white/30 mt-0.5">streak</p>
          </div>
        )}
      </div>

      {/* ── Section 1 : Infos personnelles ── */}
      <AccordionSection
        id="info"
        title={t('profil.section.info')}
        icon="👤"
        isOpen={openSection === 'info'}
        onToggle={toggle}
      >
        <ProfileForm clientId={clientId} initial={profileInitial} />
      </AccordionSection>

      {/* ── Section 2 : Données corporelles ── */}
      <AccordionSection
        id="body"
        title={t('profil.section.bodyData')}
        icon="💪"
        isOpen={openSection === 'body'}
        onToggle={toggle}
      >
        <BodyDataSection />
      </AccordionSection>

      {/* ── Section 3 : Restrictions physiques ── */}
      <AccordionSection
        id="restrictions"
        title={t('profil.section.restrictions')}
        icon="🚫"
        isOpen={openSection === 'restrictions'}
        onToggle={toggle}
      >
        <ClientRestrictionsSection />
      </AccordionSection>

      {/* ── Section 4 : Portions visuelles ── */}
      <AccordionSection
        id="portions"
        title={t('profil.section.portions')}
        icon="🤚"
        isOpen={openSection === 'portions'}
        onToggle={toggle}
      >
        <PortionScalingForm />
      </AccordionSection>

      {/* ── Section 5 : Ma progression ── */}
      {streak && (
        <AccordionSection
          id="progress"
          title={t('profil.section.progress')}
          icon="🏆"
          isOpen={openSection === 'progress'}
          onToggle={toggle}
        >
          <ProgressionContent streak={streak} />
        </AccordionSection>
      )}

      {/* ── Section 6 : Notifications ── */}
      <AccordionSection
        id="notif"
        title={t('profil.section.notif')}
        icon="🔔"
        badge={unreadCount}
        isOpen={openSection === 'notif'}
        onToggle={toggle}
      >
        <NotificationsPanel notifications={notifications} preferences={notifPrefs} />
        <Link
          href="/client/checkin/schedule"
          className="mt-3 flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
        >
          <p className="text-[12px] text-white/60">{t('profil.configReminders')}</p>
          <p className="text-[10px] text-white/30">→</p>
        </Link>
      </AccordionSection>

      {/* ── Section 7 : Préférences ── */}
      <AccordionSection
        id="prefs"
        title={t('profil.section.prefs')}
        icon="⚙️"
        isOpen={openSection === 'prefs'}
        onToggle={toggle}
      >
        <PreferencesForm initial={prefsInitial} />
      </AccordionSection>

      {/* ── Section 8 : Sécurité ── */}
      <AccordionSection
        id="security"
        title={t('profil.section.security')}
        icon="🔒"
        isOpen={openSection === 'security'}
        onToggle={toggle}
      >
        <PasswordResetButton email={email} />
      </AccordionSection>

      {/* ── Déconnexion + mention ── */}
      <div className="pt-2 flex flex-col gap-3">
        <ClientLogoutButton />
        <p className="text-center text-[10px] text-white/20 pb-2">
          {t('profil.memberSince')} {memberSince}
        </p>
      </div>

    </div>
  )
}

function ProgressionContent({
  streak,
}: {
  streak: { current_streak: number; longest_streak: number; total_points: number; level: string }
}) {
  const { t } = useClientT()
  const levelColor = LEVEL_COLORS[streak.level] ?? LEVEL_COLORS.bronze
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[20px] font-black text-[#ffe01e] leading-none mb-1">{streak.current_streak}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('profil.streakCurrent')}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[20px] font-black text-white leading-none mb-1">{streak.total_points}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('profil.pointsTotal')}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className={`text-[13px] font-black leading-none mb-1 ${levelColor}`}>{streak.level}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('home.level')}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-white/40">{t('profil.recordStreak')}</p>
        <p className="text-[12px] font-bold text-white">{streak.longest_streak} {t('profil.days.plural')}</p>
      </div>
    </div>
  )
}
