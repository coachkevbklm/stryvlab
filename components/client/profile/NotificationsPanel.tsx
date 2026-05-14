'use client'

import { useState } from 'react'
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react'

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

const TYPE_LABELS: Record<string, string> = {
  assessment_completed:  'Bilan complété',
  assessment_sent:       'Bilan envoyé',
  program_updated:       'Programme mis à jour',
  program_assigned:      'Programme assigné',
  session_reminder:      'Rappel séance',
  bilan_received:        'Bilan reçu',
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)  return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

export default function NotificationsPanel({ notifications: initial, preferences: initialPrefs }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs)
  const [markingAll, setMarkingAll] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const unread = notifications.filter((n) => !n.read)

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
          <p className="text-xs text-secondary">Aucune notification</p>
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
                Tout marquer comme lu
              </button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-start gap-3 ${
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
                    {TYPE_LABELS[n.type] ?? n.type} · {timeAgo(n.created_at)}
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
          Recevoir des notifications pour
          {savingPrefs && <Loader2 size={10} className="inline ml-1.5 animate-spin" />}
        </p>
        <div className="flex flex-col gap-2">
          <PrefToggle
            label="Rappels de séance"
            value={prefs.notif_session_reminder}
            onChange={() => togglePref('notif_session_reminder')}
          />
          <PrefToggle
            label="Bilans reçus du coach"
            value={prefs.notif_bilan_received}
            onChange={() => togglePref('notif_bilan_received')}
          />
          <PrefToggle
            label="Mise à jour du programme"
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
