'use client'

import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'
import BodyMap from '../BodyMap'
import type { MuscleGroup } from '@/lib/client/muscleDetection'

export type SmartWorkoutWidgetProps = {
  state: 'scheduled' | 'rest' | 'no_program'
  session?: {
    id: string
    sessionLogHref: string
    name: string
    exerciseCount: number
    estimatedMinutes: number
    primaryMuscles: MuscleGroup[]
    secondaryMuscles: MuscleGroup[]
    musclePills: string[]
  }
  /** compact=true: cache BodyMap, textes réduits — pour grille 2 colonnes home */
  compact?: boolean
}

export default function SmartWorkoutWidget({ state, session, compact = false }: SmartWorkoutWidgetProps) {
  if (state === 'rest') {
    return (
      <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[14px] h-full">
        <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-2">Séance du jour</div>
        <p className="text-[12px] text-white/55">Repos 💤</p>
        <Link href="/client" className="inline-block mt-2 text-[10px] text-[#ffe01e] uppercase tracking-[0.1em] font-bold">+ Activité →</Link>
      </div>
    )
  }

  if (state === 'no_program' || !session) {
    return (
      <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[14px] h-full">
        <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-2">Séance du jour</div>
        <p className="text-[12px] text-white/55">Pas de programme.</p>
        <p className="text-[10px] text-white/40 mt-1">Contacte ton coach.</p>
      </div>
    )
  }

  return (
    <Link
      href="/client/programme"
      className="block bg-[#161616] rounded-2xl border border-white/[0.08] p-[14px] active:scale-[0.99] transition-transform h-full"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white">Séance</span>
        <ChevronRight size={14} className="text-white/40" />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-black tracking-[-0.02em] text-white ${compact ? 'text-[14px]' : 'text-[18px]'}`}>{session.name}</div>
          <div className="text-[10px] text-white/50 mt-1">{session.exerciseCount} ex · ~{session.estimatedMinutes}min</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {session.musclePills.slice(0, compact ? 2 : 3).map(p => (
              <span key={p} className="bg-[#ffe01e]/10 text-[#ffe01e] text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md">{p}</span>
            ))}
          </div>
          <div
            className="mt-3 flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-[#ffe01e] text-[#0d0d0d] text-[10px] font-black uppercase tracking-[0.1em]"
          >
            <Dumbbell size={12} strokeWidth={2.5} /> Démarrer →
          </div>
        </div>
        {!compact && (
          <div className="w-20 shrink-0 flex items-center justify-center">
            <BodyMap
              primaryGroups={new Set(session.primaryMuscles)}
              secondaryGroups={new Set(session.secondaryMuscles)}
              className="w-20 h-[120px]"
            />
          </div>
        )}
      </div>
    </Link>
  )
}
