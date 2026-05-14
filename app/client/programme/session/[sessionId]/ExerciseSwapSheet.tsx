'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import { scoreAlternatives } from '@/lib/programs/intelligence'
import type { BuilderExercise } from '@/lib/programs/intelligence'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string | null
  image_url: string | null
  is_unilateral: boolean
  primary_muscles?: string[]
  secondary_muscles?: string[]
}

interface Props {
  exercise: Exercise
  allExercises: Exercise[]
  equipmentArchetype?: string
  onSwap: (exerciseName: string) => void
  onClose: () => void
}

const QUALITY_LABEL: Record<number, string> = {
  0: 'Recommandé',
  1: 'Similaire',
  2: 'Alternative',
}

export default function ExerciseSwapSheet({
  exercise,
  allExercises,
  equipmentArchetype = 'commercial_gym',
  onSwap,
  onClose,
}: Props) {
  const builderExercise: BuilderExercise = {
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    rest_sec: exercise.rest_sec,
    rir: exercise.rir,
    notes: exercise.notes ?? '',
    movement_pattern: null,
    equipment_required: [],
    primary_muscles: exercise.primary_muscles ?? [],
    secondary_muscles: exercise.secondary_muscles ?? [],
  }

  const sessionBuilderExercises: BuilderExercise[] = allExercises.map(ex => ({
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    rest_sec: ex.rest_sec,
    rir: ex.rir,
    notes: ex.notes ?? '',
    movement_pattern: null,
    equipment_required: [],
    primary_muscles: [],
    secondary_muscles: [],
  }))

  const alternatives = useMemo(
    () =>
      scoreAlternatives(builderExercise, {
        equipmentArchetype,
        goal: 'hypertrophy',
        level: 'intermediate',
        sessionExercises: sessionBuilderExercises,
      }).slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.name],
  )

  function handleUse(name: string) {
    onSwap(name)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#181818] rounded-t-2xl">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Remplacer</p>
            <p className="text-[14px] font-bold text-white leading-tight">{exercise.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-white/30 px-4 pb-3">
          Remplacement temporaire — le programme original est restauré après la séance.
        </p>

        <div className="flex flex-col gap-2 px-4 pb-8">
          {alternatives.length === 0 && (
            <p className="text-[12px] text-white/30 py-4 text-center">
              Aucune alternative trouvée pour cet exercice.
            </p>
          )}
          {alternatives.map((alt, idx) => (
            <div
              key={alt.entry.slug}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-white truncate">{alt.entry.name}</p>
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1f8a65]/10 text-[#1f8a65]">
                    {QUALITY_LABEL[idx] ?? 'Alternative'}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">{alt.label}</p>
              </div>
              <button
                onClick={() => handleUse(alt.entry.name)}
                className="shrink-0 h-8 px-3 rounded-lg bg-[#1f8a65] text-[11px] font-bold text-white hover:bg-[#217356] transition-colors"
              >
                Utiliser
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
