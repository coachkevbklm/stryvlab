'use client'

import { useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useClientT } from '@/components/client/ClientI18nProvider'
import type { ClientDictKey } from '@/lib/i18n/clientTranslations'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

interface NotifPrefs {
  notif_session_reminder: boolean
  notif_bilan_received:   boolean
  notif_program_updated:  boolean
}

interface Props {
  notifications: Notification[]
  preferences:   NotifPrefs
}

const TYPE_KEY_MAP: Record<string, ClientDictKey> = {
  assessment_completed:  'notif.type.assessment_completed',
  assessment_sent:       'notif.type.assessment_sent',
  program_updated:       'notif.type.program_updated',
  program_assigned:      'notif.type.program_assigned',
  session_reminder:      'notif.type.session_reminder',
  bilan_received:        'notif.type.bilan_received',
}

export default function NotificationsPanel({ notifications: initial, preferences: initialPrefs }: Props) {
  const { t } = useClientT()
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs)
  const [markingAll, setMarkingAll] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const unread = notifications.filter((n) => !n.read)

  function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)  return t('notif.time.now')
    if (diff < 3600) return t('notif.time.min', { n: Math.floor(diff / 60) })
    if (diff < 86400) return t('notif.time.hour', { n: Math.floor(diff / 3600) })
    return t('notif.time.day', { n: Math.floor(diff / 86400) })
  }

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await fetch(`/api/client/notifications/${id}/read`, { method: 'PATCH' })
  }

  async function markAllRead() {
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch('/api/client/notifications/all/read', { method: 'POST' })
    setMarkingAll(false)
  }

  async function togglePref(key: keyof NotifPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSavingPrefs(true)
    await fetch('/api/client/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: next[key] }),
    })
    setSavingPrefs(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="text-center py-6">
          <Bell size={24} className="text-secondary mx-auto mb-2 opacity-40" />
          <p className="text-xs text-secondary">{t('notif.empty')}</p>
        </div>
      ) : (
        <div>
          {unread.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs text-accent font-medium hover:underline disabled:opacity-50"
              >
                {markingAll ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                {t('notif.markAllRead')}
              </button>
            </div>
          )}
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors flex items-start gap-3 ${
                  n.read
                    ? 'bg-transparent'
                    : 'bg-accent/5 hover:bg-accent/10'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${n.read ? 'text-secondary' : 'text-primary font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-secondary mt-0.5">
                    {TYPE_KEY_MAP[n.type] ? t(TYPE_KEY_MAP[n.type]) : n.type} · {timeAgo(n.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notification preferences */}
      <div className="border-t border-white/40 pt-4">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-3">
          {t('notif.prefsTitle')}
          {savingPrefs && <Loader2 size={10} className="inline ml-1.5 animate-spin" />}
        </p>
        <div className="flex flex-col gap-2">
          <PrefToggle
            label={t('notif.sessionReminder')}
            value={prefs.notif_session_reminder}
            onChange={() => togglePref('notif_session_reminder')}
          />
          <PrefToggle
            label={t('notif.bilanReceived')}
            value={prefs.notif_bilan_received}
            onChange={() => togglePref('notif_bilan_received')}
          />
          <PrefToggle
            label={t('notif.programUpdated')}
            value={prefs.notif_program_updated}
            onChange={() => togglePref('notif_program_updated')}
          />
        </div>
      </div>
    </div>
  )
}

function PrefToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-primary">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-surface-light'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
            value ? 'left-5' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
