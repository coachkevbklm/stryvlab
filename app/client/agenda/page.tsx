'use client'

import { useState } from 'react'
import ClientTopBar from '@/components/client/ClientTopBar'
import AgendaDayView from '@/components/client/AgendaDayView'
import AgendaWeekView from '@/components/client/AgendaWeekView'

function dateIso(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function SmartAgendaPage() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const today = dateIso(new Date())

  return (
    <div className="min-h-screen bg-[#121212]">
      <ClientTopBar section="Suivi" title="Smart Agenda" />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-28 space-y-4">
        {/* View toggle */}
        <div className="flex gap-1 bg-white/[0.03] border-[0.3px] border-white/[0.06] rounded-xl p-1">
          <button
            onClick={() => setView('day')}
            className={`flex-1 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
              view === 'day' ? 'bg-[#1f8a65] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex-1 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
              view === 'week' ? 'bg-[#1f8a65] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Semaine
          </button>
        </div>

        {view === 'day' ? (
          <AgendaDayView initialDate={today} />
        ) : (
          <AgendaWeekView initialDate={today} />
        )}
      </main>
    </div>
  )
}
