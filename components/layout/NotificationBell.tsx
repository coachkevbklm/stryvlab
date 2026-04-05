'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  client_id: string | null
}

const TYPE_ICONS: Record<string, string> = {
  assessment_completed: '📋',
  assessment_sent:      '📤',
  program_updated:      '💪',
  program_assigned:     '💪',
  session_reminder:     '🏋️',
  bilan_received:       '📋',
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

interface Props {
  /** When true, the dropdown opens to the right (for sidebar use) */
  sidebarMode?: boolean
}

export default function NotificationBell({ sidebarMode = false }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read)

  async function fetchNotifications() {
    const res = await fetch('/api/assessments/notify')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    }
  }

  useEffect(() => {
    fetchNotifications()
    const iv = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(iv)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    const ids = unread.map((n) => n.id)
    if (!ids.length) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch('/api/assessments/notify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await fetch('/api/assessments/notify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  if (sidebarMode) {
    return (
      <div className="relative w-full" ref={containerRef}>
        {/* Sidebar bell button — full width row */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 group ${
            open
              ? 'bg-surface-light text-primary'
              : 'text-secondary hover:bg-surface-light hover:text-primary hover:shadow-soft-out'
          }`}
        >
          <div className="relative shrink-0">
            <Bell size={15} strokeWidth={1.8} />
            {unread.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold flex-1">Notifications</span>
          {unread.length > 0 && (
            <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
              {unread.length}
            </span>
          )}
        </button>

        {/* Dropdown — opens to the right of the sidebar, fixed to avoid overflow clipping */}
        {open && (
          <div
            className="fixed w-80 bg-surface rounded-card shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/60 z-[200] overflow-hidden"
            style={{ left: '232px', bottom: '60px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/40">
              <span className="text-xs font-bold text-primary">
                Notifications
                {unread.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {unread.length}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[10px] text-accent font-medium hover:underline"
                  >
                    <CheckCheck size={11} />
                    Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-secondary hover:text-primary">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="text-secondary/30 mx-auto mb-2" />
                  <p className="text-xs text-secondary">Aucune notification</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/30 last:border-0 flex items-start gap-3 transition-colors ${
                      n.read ? 'opacity-50' : 'hover:bg-accent/5'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${n.read ? 'text-secondary' : 'text-primary font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-secondary/60 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default mode — dropdown below, right-aligned (for page headers)
  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-secondary hover:text-primary hover:bg-surface-light transition-all"
      >
        <Bell size={16} strokeWidth={1.8} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-card shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40">
            <span className="text-xs font-bold text-primary">
              Notifications
              {unread.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                  {unread.length}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-accent font-medium hover:underline"
                >
                  <CheckCheck size={11} />
                  Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-secondary hover:text-primary">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={20} className="text-secondary/30 mx-auto mb-2" />
                <p className="text-xs text-secondary">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/30 last:border-0 flex items-start gap-3 transition-colors ${
                    n.read ? 'opacity-50' : 'hover:bg-accent/5'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.read ? 'text-secondary' : 'text-primary font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-secondary/60 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
