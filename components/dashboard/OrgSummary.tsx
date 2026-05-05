'use client'

import { useEffect, useState } from 'react'
import { Calendar, Kanban, BarChart2, Bell, CheckCircle2 } from 'lucide-react'
import { type KanbanBoard as KanbanBoardType, type KanbanTask } from '@/components/ui/KanbanBoard'
import { type AgendaEvent } from '@/components/ui/AgendaCalendar'

const NOTIFY_LABELS: Record<number, string> = {
  0: 'au moment',
  5: '5 min',
  10: '10 min',
  15: '15 min',
  30: '30 min',
  60: '1h',
  1440: '1 jour',
}

export default function OrgSummary() {
  const [boards, setBoards] = useState<KanbanBoardType[]>([])
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)

  const todayKey = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        // Fetch boards first, then tasks per board + events in parallel
        const boardsRes = await fetch('/api/organisation/boards')
        const fetchedBoards: KanbanBoardType[] = boardsRes.ok ? await boardsRes.json() : []
        setBoards(fetchedBoards)

        const [evRes, ...taskResults] = await Promise.all([
          fetch('/api/organisation/events'),
          ...fetchedBoards.map(b => fetch(`/api/organisation/tasks?boardId=${b.id}`)),
        ])

        if (evRes.ok) {
          const data = await evRes.json()
          setEvents(Array.isArray(data) ? data : [])
        }

        const allTasks: KanbanTask[] = []
        for (const res of taskResults) {
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) allTasks.push(...data)
          }
        }
        setTasks(allTasks)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const todayEvents = events
    .filter(e => e.event_date === todayKey)
    .sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? ''))

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.is_completed).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const now = new Date()
  const upcoming = events
    .filter(e => {
      if (!e.notify_minutes_before || e.is_completed) return false
      if (!e.event_time) return false
      const evDate = new Date(`${e.event_date}T${e.event_time}`)
      const diffMin = (evDate.getTime() - now.getTime()) / 60000
      return diffMin >= 0 && diffMin <= 1440
    })
    .sort((a, b) => `${a.event_date}T${a.event_time}`.localeCompare(`${b.event_date}T${b.event_time}`))

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-5 space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 — Today's events */}
      <div className="rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f8a65]/15">
            <Calendar size={13} className="text-[#1f8a65]" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">Aujourd&apos;hui</p>
            <p className="text-[12px] font-bold text-white leading-none">Événements du jour</p>
          </div>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-[12px] text-white/25 italic text-center py-4">Aucun événement aujourd&apos;hui</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map(ev => (
              <div key={ev.id} className={`rounded-xl p-3 transition-colors ${ev.is_completed ? 'bg-white/[0.015]' : 'bg-white/[0.04] hover:bg-white/[0.06]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {ev.is_completed && <CheckCircle2 size={12} className="text-[#1f8a65] flex-shrink-0" />}
                    <p className={`text-[12px] font-medium truncate ${ev.is_completed ? 'line-through text-white/30' : 'text-white'}`}>{ev.title}</p>
                  </div>
                  {ev.event_time && <span className="text-[10px] text-white/35 flex-shrink-0">{ev.event_time}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {ev.linked_column_title && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/40">
                      <Kanban size={8} />
                      {ev.linked_column_title}
                    </span>
                  )}
                  {ev.template_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30">{ev.template_type}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 2 — Task completion rate */}
      <div className="rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <BarChart2 size={13} className="text-white/60" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">Kanban</p>
            <p className="text-[12px] font-bold text-white leading-none">Taux de complétion</p>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-[32px] font-black text-white leading-none">{completionRate}<span className="text-[18px] text-white/40">%</span></span>
            <span className="text-[11px] text-white/35 mb-1">{completedTasks} / {totalTasks} tâches</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-[#1f8a65] transition-all duration-700" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        {boards.map(board => {
          const boardTasks = tasks.filter(t => t.board_id === board.id)
          const done = boardTasks.filter(t => t.is_completed).length
          const pct = boardTasks.length > 0 ? Math.round((done / boardTasks.length) * 100) : 0
          return (
            <div key={board.id} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/50 truncate">{board.title}</span>
                <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">{done}/{boardTasks.length}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-[#1f8a65]/60 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Card 3 — Upcoming notifications */}
      <div className="rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <Bell size={13} className="text-white/60" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">À venir</p>
            <p className="text-[12px] font-bold text-white leading-none">Rappels (24h)</p>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-white/25 italic text-center py-4">Aucun rappel dans les 24h</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(ev => {
              const evDt = new Date(`${ev.event_date}T${ev.event_time}`)
              const diffMin = Math.round((evDt.getTime() - now.getTime()) / 60000)
              const label = diffMin < 60 ? `dans ${diffMin} min` : diffMin < 1440 ? `dans ${Math.round(diffMin / 60)}h` : `dans ${Math.round(diffMin / 1440)}j`
              return (
                <div key={ev.id} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1f8a65]/15 flex-shrink-0 mt-0.5">
                    <Bell size={10} className="text-[#1f8a65]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#1f8a65]/80">{label}</span>
                      {ev.notify_minutes_before != null && (
                        <span className="text-[10px] text-white/25">rappel {NOTIFY_LABELS[ev.notify_minutes_before] ?? `${ev.notify_minutes_before}min`} avant</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
