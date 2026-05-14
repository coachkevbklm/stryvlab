'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AgendaDayView from './AgendaDayView'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function getMondayOf(dateIso: string): Date {
  const d = new Date(`${dateIso}T12:00:00Z`)
  const day = d.getDay()
  const dow = day === 0 ? 7 : day
  d.setDate(d.getDate() - (dow - 1))
  return d
}

function dateIso(d: Date) {
  return d.toISOString().split('T')[0]
}

function getDaysOfWeek(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return dateIso(d)
  })
}

type DensityMap = Record<string, { total: number; meal?: number; session?: number; checkin?: number; assessment?: number }>

export default function AgendaWeekView({ initialDate }: { initialDate: string }) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [monday, setMonday] = useState(() => getMondayOf(initialDate))
  const [density, setDensity] = useState<DensityMap>({})

  const days = getDaysOfWeek(monday)
  const today = dateIso(new Date())

  useEffect(() => {
    fetch(`/api/client/agenda/week?start=${dateIso(monday)}`)
      .then(r => r.json())
      .then(d => setDensity(d.density ?? {}))
  }, [monday])

  function prevWeek() {
    const m = new Date(monday)
    m.setDate(m.getDate() - 7)
    setMonday(m)
    setSelectedDate(dateIso(m))
  }

  function nextWeek() {
    const m = new Date(monday)
    m.setDate(m.getDate() + 7)
    setMonday(m)
    setSelectedDate(dateIso(m))
  }

  const monthLabel = new Date(`${days[0]}T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevWeek}
          className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors active:scale-[0.95]"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-[12px] font-medium text-white/50 capitalize">{monthLabel}</p>
        <button
          onClick={nextWeek}
          className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors active:scale-[0.95]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day pills */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isSelected = d === selectedDate
          const isToday = d === today
          const dayNum = new Date(`${d}T12:00:00Z`).getDate()
          const dayDensity = density[d]?.total ?? 0

          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                isSelected ? 'bg-[#1f8a65]/10' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span className={`text-[9px] font-semibold uppercase tracking-wide ${
                isSelected ? 'text-[#1f8a65]' : 'text-white/30'
              }`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-[14px] font-bold leading-none ${
                isToday ? 'text-[#1f8a65]' : isSelected ? 'text-white' : 'text-white/50'
              }`}>
                {dayNum}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(dayDensity, 4) }, (_, j) => (
                  <div key={j} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-[#1f8a65]' : 'bg-white/20'}`} />
                ))}
                {dayDensity === 0 && <div className="h-1 w-1" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Day content for selected date */}
      <AgendaDayView initialDate={selectedDate} />
    </div>
  )
}
