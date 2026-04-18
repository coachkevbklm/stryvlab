// components/programs/studio/NavigatorPane.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, GripVertical, Dumbbell } from 'lucide-react'

export interface NavSession {
  name: string
  exercises: { name: string }[]
}

interface Props {
  sessions: NavSession[]
  activeSessionIndex: number | null
  activeExerciseKey: string | null // format "si-ei"
  onSelectSession: (si: number) => void
  onSelectExercise: (si: number, ei: number) => void
  onAddSession: () => void
}

export default function NavigatorPane({
  sessions,
  activeSessionIndex,
  activeExerciseKey,
  onSelectSession,
  onSelectExercise,
  onAddSession,
}: Props) {
  const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>(
    Object.fromEntries(sessions.map((_, i) => [i, true]))
  )

  function toggleSession(i: number) {
    setExpandedSessions(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="flex flex-col h-full bg-[#121212] border-r-[0.3px] border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b-[0.3px] border-white/[0.06] shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Séances
        </span>
        <button
          onClick={onAddSession}
          className="flex items-center gap-1 h-6 px-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 transition-colors"
        >
          <Plus size={11} />
          <span className="text-[10px] font-medium">Séance</span>
        </button>
      </div>

      {/* Session tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length === 0 && (
          <p className="text-[11px] text-white/25 text-center py-6 px-3">
            Aucune séance
          </p>
        )}
        {sessions.map((session, si) => {
          const isExpanded = expandedSessions[si] ?? true
          const isActive = activeSessionIndex === si

          return (
            <div key={si} className="mb-0.5">
              {/* Session row */}
              <button
                onClick={() => { onSelectSession(si); toggleSession(si) }}
                className={[
                  'w-full flex items-center gap-1.5 px-3 py-2 text-left transition-colors group',
                  isActive
                    ? 'bg-[#1f8a65]/10 text-[#1f8a65]'
                    : 'text-white/70 hover:bg-white/[0.03] hover:text-white/90',
                ].join(' ')}
              >
                <GripVertical size={10} className="text-white/20 shrink-0" />
                {isExpanded
                  ? <ChevronDown size={11} className="shrink-0 opacity-50" />
                  : <ChevronRight size={11} className="shrink-0 opacity-50" />
                }
                <span className="text-[11px] font-medium truncate flex-1">
                  {session.name || `Séance ${si + 1}`}
                </span>
                <span className="text-[9px] text-white/25 shrink-0">
                  {session.exercises.length}
                </span>
              </button>

              {/* Exercises */}
              {isExpanded && session.exercises.map((ex, ei) => {
                const key = `${si}-${ei}`
                const isActiveEx = activeExerciseKey === key
                return (
                  <button
                    key={ei}
                    onClick={() => onSelectExercise(si, ei)}
                    className={[
                      'w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left transition-colors',
                      isActiveEx
                        ? 'bg-[#1f8a65]/5 text-[#1f8a65]/80'
                        : 'text-white/40 hover:bg-white/[0.02] hover:text-white/60',
                    ].join(' ')}
                  >
                    <Dumbbell size={9} className="shrink-0 opacity-60" />
                    <span className="text-[10px] truncate">
                      {ex.name || `Exercice ${ei + 1}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
