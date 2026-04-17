'use client'

import { useState, useMemo } from 'react'
import { X, ArrowLeftRight, Zap, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { scoreAlternatives } from '@/lib/programs/intelligence'
import type { BuilderExercise, TemplateMeta } from '@/lib/programs/intelligence'
import type { AlternativeScore } from '@/lib/programs/intelligence'

interface Props {
  exercise: BuilderExercise
  sessionExercises: BuilderExercise[]
  meta: TemplateMeta
  onReplace: (name: string, gifUrl: string, movementPattern: string | null, equipment: string[]) => void
  onClose: () => void
}

const FILTER_LABELS: Record<string, string> = {
  all: 'Toutes',
  same_equipment: 'Même équipement',
  different_equipment: 'Autre équipement',
  easier: 'Plus simple',
  harder: 'Plus difficile',
}

export default function ExerciseAlternativesDrawer({ exercise, sessionExercises, meta, onReplace, onClose }: Props) {
  const [filter, setFilter] = useState<string>('all')

  const alternatives = useMemo(() => {
    return scoreAlternatives(exercise, {
      equipmentArchetype: meta.equipment_archetype,
      goal: meta.goal,
      level: meta.level,
      sessionExercises,
    })
  }, [exercise, sessionExercises, meta])

  const filtered = useMemo((): AlternativeScore[] => {
    const origEquip = exercise.equipment_required
    switch (filter) {
      case 'same_equipment':
        return alternatives.filter(a => a.entry.equipment.some(e => origEquip.includes(e)))
      case 'different_equipment':
        return alternatives.filter(a => !a.entry.equipment.some(e => origEquip.includes(e)))
      case 'easier':
        return alternatives.filter(a => a.entry.stimulus_coefficient < 0.65)
      case 'harder':
        return alternatives.filter(a => a.entry.stimulus_coefficient > 0.80)
      default:
        return alternatives
    }
  }, [alternatives, filter, exercise.equipment_required])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-[420px] h-full bg-[#181818] border-l border-white/[0.06] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Alternatives à</p>
            <p className="text-[13px] font-bold text-white mt-0.5 truncate max-w-[300px]">{exercise.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/50 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 px-4 py-3 border-b border-white/[0.06] overflow-x-auto">
          {Object.entries(FILTER_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-colors ${
                filter === key
                  ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <ArrowLeftRight size={20} className="text-white/20" />
              <p className="text-[12px] text-white/40">Aucune alternative pour ce filtre</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {filtered.map(alt => (
                <div key={alt.entry.id} className="flex gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                  {/* GIF thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/[0.04] shrink-0 relative">
                    <Image
                      src={alt.entry.gifUrl}
                      alt={alt.entry.name}
                      fill
                      className="object-cover"
                      unoptimized={alt.entry.gifUrl.endsWith('.gif')}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{alt.entry.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1f8a65]/10 text-[#1f8a65]/80">
                        {alt.label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-white/40">
                        <Zap size={8} className="text-amber-400/60" />
                        {Math.round(alt.entry.stimulus_coefficient * 100)}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5 truncate">
                      {alt.entry.muscles.slice(0, 3).join(', ')}
                    </p>
                  </div>

                  {/* Replace button */}
                  <button
                    type="button"
                    onClick={() => {
                      onReplace(
                        alt.entry.name,
                        alt.entry.gifUrl,
                        alt.entry.movementPattern,
                        alt.entry.equipment,
                      )
                      onClose()
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[10px] font-bold shrink-0 hover:bg-[#1f8a65]/20 transition-colors self-center"
                  >
                    Remplacer
                    <ChevronRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
