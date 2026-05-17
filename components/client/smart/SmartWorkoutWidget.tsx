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
}

export default function SmartWorkoutWidget({ state, session }: SmartWorkoutWidgetProps) {
  if (state === 'rest') {
    return (
      <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px]">
        <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-3">Séance du jour</div>
        <p className="text-[12px] text-white/55">Jour de repos — pas de séance prévue.</p>
        <Link href="/client" className="inline-block mt-2 text-[10px] text-[#ffe01e] uppercase tracking-[0.1em] font-bold">+ Logger activité libre →</Link>
      </div>
    )
  }

  if (state === 'no_program' || !session) {
    return (
      <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px]">
        <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-3">Séance du jour</div>
        <p className="text-[12px] text-white/55">Pas de programme assigné.</p>
        <p className="text-[10px] text-white/40 mt-1">Contacte ton coach pour démarrer.</p>
      </div>
    )
  }

  return (
    <Link
      href="/client/programme"
      className="block bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px] active:scale-[0.99] transition-transform"
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white">Séance du jour</span>
        <ChevronRight size={14} className="text-white/40" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-black tracking-[-0.02em] text-white">{session.name}</div>
          <div className="text-[11px] text-white/50 mt-1">{session.exerciseCount} exercices · ~{session.estimatedMinutes} min</div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {session.musclePills.map(p => (
              <span key={p} className="bg-[#ffe01e]/10 text-[#ffe01e] text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md">{p}</span>
            ))}
          </div>
          <Link
            href={session.sessionLogHref}
            className="mt-3 inline-flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#ffe01e] text-[#0d0d0d] text-[11px] font-black uppercase tracking-[0.1em] active:scale-[0.98]"
            onClick={(e) => e.stopPropagation()}
          >
            <Dumbbell size={14} strokeWidth={2.5} /> Démarrer →
          </Link>
        </div>
        <div className="w-20 shrink-0 flex items-center justify-center">
          <BodyMap
            primaryGroups={new Set(session.primaryMuscles)}
            secondaryGroups={new Set(session.secondaryMuscles)}
            className="w-20 h-[120px]"
          />
        </div>
      </div>
    </Link>
  )
}
