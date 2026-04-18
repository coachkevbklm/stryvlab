// components/programs/studio/ExerciseCard.tsx
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  Trash2, ImagePlus, Upload, Tag, Dumbbell,
} from 'lucide-react'
import IntelligenceAlertBadge from '@/components/programs/IntelligenceAlertBadge'
import ExerciseClientAlternatives from '@/components/programs/ExerciseClientAlternatives'
import type { IntelligenceAlert } from '@/lib/programs/intelligence'

const MOVEMENT_PATTERNS = [
  { value: '', label: '— Pattern —' },
  { value: 'horizontal_push', label: 'Poussée horiz.' },
  { value: 'vertical_push', label: 'Poussée vert.' },
  { value: 'horizontal_pull', label: 'Tirage horiz.' },
  { value: 'vertical_pull', label: 'Tirage vert.' },
  { value: 'squat_pattern', label: 'Squat' },
  { value: 'hip_hinge', label: 'Charnière hanche' },
  { value: 'knee_flexion', label: 'Flex. genou' },
  { value: 'knee_extension', label: 'Ext. genou' },
  { value: 'calf_raise', label: 'Mollets' },
  { value: 'elbow_flexion', label: 'Biceps' },
  { value: 'elbow_extension', label: 'Triceps' },
  { value: 'lateral_raise', label: 'Élév. lat.' },
  { value: 'carry', label: 'Carry' },
  { value: 'scapular_elevation', label: 'Shrug' },
  { value: 'core_anti_flex', label: 'Gainage' },
  { value: 'core_flex', label: 'Core flex.' },
  { value: 'core_rotation', label: 'Rotation' },
]

const EQUIPMENT_ITEMS = [
  { value: 'bodyweight', label: 'BW' },
  { value: 'band', label: 'Élas.' },
  { value: 'dumbbell', label: 'Halt.' },
  { value: 'barbell', label: 'Barre' },
  { value: 'kettlebell', label: 'KB' },
  { value: 'machine', label: 'Mach.' },
  { value: 'cable', label: 'Poulie' },
  { value: 'smith', label: 'Smith' },
  { value: 'trx', label: 'TRX' },
  { value: 'ez_bar', label: 'EZ' },
  { value: 'trap_bar', label: 'Trap' },
]

const MUSCLE_GROUPS = [
  { slug: 'chest', label: 'Pecto.' },
  { slug: 'shoulders', label: 'Épaules' },
  { slug: 'biceps', label: 'Biceps' },
  { slug: 'triceps', label: 'Triceps' },
  { slug: 'abs', label: 'Abdos' },
  { slug: 'back_upper', label: 'Dos (H)' },
  { slug: 'back_lower', label: 'Lombaires' },
  { slug: 'traps', label: 'Trapèzes' },
  { slug: 'quads', label: 'Quads' },
  { slug: 'hamstrings', label: 'Ischio.' },
  { slug: 'glutes', label: 'Fessiers' },
  { slug: 'calves', label: 'Mollets' },
]

export interface ExerciseData {
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string
  image_url: string | null
  movement_pattern: string | null
  equipment_required: string[]
  primary_muscles: string[]
  secondary_muscles: string[]
  is_compound: boolean | undefined
  group_id?: string
  dbId?: string
}

interface Props {
  exercise: ExerciseData
  si: number
  ei: number
  isHighlighted: boolean
  isUploading: boolean
  alerts: IntelligenceAlert[]
  templateId?: string
  onUpdate: (patch: Partial<ExerciseData>) => void
  onRemove: () => void
  onImageUpload: (file: File) => void
  onPickExercise: () => void
  onOpenAlternatives: () => void
  exerciseRef: (el: HTMLDivElement | null) => void
}

export default function ExerciseCard({
  exercise,
  si,
  ei,
  isHighlighted,
  isUploading,
  alerts,
  templateId,
  onUpdate,
  onRemove,
  onImageUpload,
  onPickExercise,
  onOpenAlternatives,
  exerciseRef,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div
      ref={exerciseRef}
      className={[
        'rounded-xl border-[0.3px] bg-white/[0.02] p-3 transition-all duration-200',
        isHighlighted
          ? 'border-[#1f8a65]/60 ring-1 ring-[#1f8a65]/30'
          : 'border-white/[0.06]',
      ].join(' ')}
    >
      <div className="grid grid-cols-[140px_1fr] gap-4">
        {/* Left column: image + pattern + equipment */}
        <div className="flex flex-col gap-2">
          {/* Image */}
          <div
            className="relative w-[140px] h-[140px] rounded-lg overflow-hidden bg-white/[0.03] border-[0.3px] border-white/[0.06] cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {exercise.image_url ? (
              <Image
                src={exercise.image_url}
                alt={exercise.name}
                fill
                className="object-cover"
                unoptimized={exercise.image_url.endsWith('.gif')}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <ImagePlus size={18} className="text-white/20" />
                <span className="text-[9px] text-white/20">Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[#1f8a65] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onImageUpload(f)
              e.target.value = ''
            }}
          />

          {/* Movement pattern */}
          <select
            value={exercise.movement_pattern ?? ''}
            onChange={e => onUpdate({ movement_pattern: e.target.value || null })}
            className="w-full rounded-lg bg-[#0a0a0a] border-[0.3px] border-white/[0.06] text-[10px] text-white/60 px-2 py-1.5 outline-none"
          >
            {MOVEMENT_PATTERNS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Equipment pills */}
          <div className="flex flex-wrap gap-1">
            {EQUIPMENT_ITEMS.map(eq => {
              const active = exercise.equipment_required.includes(eq.value)
              return (
                <button
                  key={eq.value}
                  onClick={() => onUpdate({
                    equipment_required: active
                      ? exercise.equipment_required.filter(v => v !== eq.value)
                      : [...exercise.equipment_required, eq.value],
                  })}
                  className={[
                    'rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                    active
                      ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                      : 'bg-white/[0.03] text-white/30 hover:text-white/50',
                  ].join(' ')}
                >
                  {eq.label}
                </button>
              )
            })}
          </div>

          {/* Polyarticulaire toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={exercise.is_compound === true}
              onChange={e => onUpdate({ is_compound: e.target.checked ? true : undefined })}
              className="w-3 h-3 rounded accent-[#1f8a65]"
            />
            <span className="text-[9px] text-white/40">Polyart.</span>
          </label>
        </div>

        {/* Right column: name, sets/reps, muscles, notes */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Name + delete + pick */}
          <div className="flex items-center gap-2">
            <input
              value={exercise.name}
              onChange={e => onUpdate({ name: e.target.value })}
              placeholder={`Exercice ${ei + 1}`}
              className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder:text-white/20 outline-none"
            />
            <button
              onClick={onPickExercise}
              title="Choisir depuis le catalogue"
              className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            >
              <Tag size={13} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Sets / Reps / Rest / RIR */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Séries', value: String(exercise.sets), key: 'sets', type: 'number' },
              { label: 'Reps', value: exercise.reps, key: 'reps', type: 'text' },
              { label: 'Repos (s)', value: exercise.rest_sec != null ? String(exercise.rest_sec) : '', key: 'rest_sec', type: 'number' },
              { label: 'RIR', value: exercise.rir != null ? String(exercise.rir) : '', key: 'rir', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[9px] text-white/30 mb-0.5">{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => {
                    const v = e.target.value
                    if (f.key === 'sets') onUpdate({ sets: Number(v) || 1 })
                    else if (f.key === 'reps') onUpdate({ reps: v })
                    else if (f.key === 'rest_sec') onUpdate({ rest_sec: v ? Number(v) : null })
                    else if (f.key === 'rir') onUpdate({ rir: v ? Number(v) : null })
                  }}
                  className="w-full bg-[#0a0a0a] rounded-md border-[0.3px] border-white/[0.06] text-[11px] text-white/80 px-2 py-1 outline-none font-mono"
                />
              </div>
            ))}
          </div>

          {/* Primary muscles */}
          <div>
            <label className="block text-[9px] text-white/30 mb-1">Muscles primaires</label>
            <div className="flex flex-wrap gap-1">
              {MUSCLE_GROUPS.map(m => {
                const active = exercise.primary_muscles.includes(m.slug)
                return (
                  <button
                    key={m.slug}
                    onClick={() => onUpdate({
                      primary_muscles: active
                        ? exercise.primary_muscles.filter(s => s !== m.slug)
                        : [...exercise.primary_muscles, m.slug],
                    })}
                    className={[
                      'rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                      active
                        ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                        : 'bg-white/[0.03] text-white/25 hover:text-white/50',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={exercise.notes}
            onChange={e => onUpdate({ notes: e.target.value })}
            placeholder="Notes coach..."
            rows={2}
            className="w-full bg-[#0a0a0a] rounded-lg border-[0.3px] border-white/[0.06] text-[11px] text-white/60 placeholder:text-white/20 px-2 py-1.5 outline-none resize-none"
          />

          {/* Intelligence alerts + alternatives */}
          {alerts.length > 0 && (
            <IntelligenceAlertBadge
              alerts={alerts}
              onOpenAlternatives={onOpenAlternatives}
            />
          )}

          {/* Client alternatives (edit mode) */}
          {templateId && exercise.dbId && (
            <ExerciseClientAlternatives
              templateId={templateId}
              exerciseId={exercise.dbId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
