// components/programs/studio/EditorPane.tsx
'use client'

import { Plus, Loader2, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import ExerciseCard, { type ExerciseData } from './ExerciseCard'
import LabModeSection from './LabModeSection'
import type { IntelligenceResult, IntelligenceAlert } from '@/lib/programs/intelligence'

const GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophie' },
  { value: 'strength', label: 'Force' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'fat_loss', label: 'Perte de gras' },
  { value: 'recomp', label: 'Recomposition' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'athletic', label: 'Athletic' },
]

const LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'elite', label: 'Élite' },
]

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const EQUIPMENT_ARCHETYPES = [
  { value: '', label: '— Non spécifié —' },
  { value: 'bodyweight', label: 'Poids du corps' },
  { value: 'home_dumbbells', label: 'Domicile — Haltères' },
  { value: 'home_full', label: 'Domicile — Complet' },
  { value: 'home_rack', label: 'Rack à domicile' },
  { value: 'functional_box', label: 'Box / Fonctionnel' },
  { value: 'commercial_gym', label: 'Salle de sport' },
]

export interface TemplateMeta {
  name: string
  description: string
  goal: string
  level: string
  frequency: number
  weeks: number
  notes: string
  equipment_archetype: string
  muscle_tags: string[]
}

export interface EditorSession {
  name: string
  day_of_week: number | null
  notes: string
  exercises: ExerciseData[]
  open: boolean
}

interface Props {
  meta: TemplateMeta
  sessions: EditorSession[]
  saving: boolean
  error: string
  uploadingKey: string | null
  highlightKey: string | null
  intelligenceResult: IntelligenceResult | null
  morphoConnected: boolean
  morphoDate?: string
  templateId?: string
  alertsFor: (si: number, ei: number) => IntelligenceAlert[]
  onMetaChange: (patch: Partial<TemplateMeta>) => void
  onUpdateSession: (si: number, patch: Partial<EditorSession>) => void
  onUpdateExercise: (si: number, ei: number, patch: Partial<ExerciseData>) => void
  onRemoveExercise: (si: number, ei: number) => void
  onAddExercise: (si: number) => void
  onRemoveSession: (si: number) => void
  onAddSession: () => void
  onImageUpload: (si: number, ei: number, file: File) => void
  onPickExercise: (si: number, ei: number) => void
  onOpenAlternatives: (si: number, ei: number) => void
  onSave: () => void
  exerciseRefSetter: (key: string) => (el: HTMLDivElement | null) => void
}

export default function EditorPane({
  meta,
  sessions,
  saving,
  error,
  uploadingKey,
  highlightKey,
  intelligenceResult,
  morphoConnected,
  morphoDate,
  templateId,
  alertsFor,
  onMetaChange,
  onUpdateSession,
  onUpdateExercise,
  onRemoveExercise,
  onAddExercise,
  onRemoveSession,
  onAddSession,
  onImageUpload,
  onPickExercise,
  onOpenAlternatives,
  onSave,
  exerciseRefSetter,
}: Props) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#121212]">
      {/* Sticky sub-header: template meta + save button */}
      <div className="shrink-0 border-b-[0.3px] border-white/[0.06] px-6 py-3 space-y-3">
        {/* Name + Save */}
        <div className="flex items-center gap-3">
          <input
            value={meta.name}
            onChange={e => onMetaChange({ name: e.target.value })}
            placeholder="Nom du template..."
            className="flex-1 bg-transparent text-[15px] font-semibold text-white placeholder:text-white/20 outline-none"
          />
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#1f8a65] text-white text-[12px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-colors active:scale-[0.97]"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={meta.goal}
            onChange={e => onMetaChange({ goal: e.target.value })}
            className="h-7 rounded-lg bg-[#0a0a0a] border-[0.3px] border-white/[0.06] text-[11px] text-white/70 px-2 outline-none"
          >
            {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <select
            value={meta.level}
            onChange={e => onMetaChange({ level: e.target.value })}
            className="h-7 rounded-lg bg-[#0a0a0a] border-[0.3px] border-white/[0.06] text-[11px] text-white/70 px-2 outline-none"
          >
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select
            value={meta.equipment_archetype}
            onChange={e => onMetaChange({ equipment_archetype: e.target.value })}
            className="h-7 rounded-lg bg-[#0a0a0a] border-[0.3px] border-white/[0.06] text-[11px] text-white/70 px-2 outline-none"
          >
            {EQUIPMENT_ARCHETYPES.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={meta.frequency}
              onChange={e => onMetaChange({ frequency: Number(e.target.value) || 1 })}
              min={1} max={7}
              className="w-10 h-7 bg-[#0a0a0a] rounded-lg border-[0.3px] border-white/[0.06] text-[11px] text-white/70 px-2 outline-none font-mono text-center"
            />
            <span className="text-[10px] text-white/30">j/sem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={meta.weeks}
              onChange={e => onMetaChange({ weeks: Number(e.target.value) || 1 })}
              min={1} max={52}
              className="w-10 h-7 bg-[#0a0a0a] rounded-lg border-[0.3px] border-white/[0.06] text-[11px] text-white/70 px-2 outline-none font-mono text-center"
            />
            <span className="text-[10px] text-white/30">semaines</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border-[0.3px] border-red-500/20 px-3 py-2">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <p className="text-[12px] text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Sessions + exercises scroll area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {sessions.map((session, si) => (
          <div
            key={si}
            className="rounded-xl border-[0.3px] border-white/[0.06] bg-white/[0.01] overflow-hidden"
          >
            {/* Session header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b-[0.3px] border-white/[0.06]">
              <button
                onClick={() => onUpdateSession(si, { open: !session.open })}
                className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
              >
                {session.open
                  ? <ChevronUp size={14} />
                  : <ChevronDown size={14} />
                }
              </button>
              <input
                value={session.name}
                onChange={e => onUpdateSession(si, { name: e.target.value })}
                placeholder={`Séance ${si + 1}`}
                className="flex-1 bg-transparent text-[13px] font-semibold text-white placeholder:text-white/30 outline-none"
              />
              {/* Day of week */}
              <div className="flex items-center gap-1">
                {DAYS.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => onUpdateSession(si, { day_of_week: session.day_of_week === idx + 1 ? null : idx + 1 })}
                    className={[
                      'w-7 h-7 rounded-md text-[9px] font-medium transition-colors',
                      session.day_of_week === idx + 1
                        ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onRemoveSession(si)}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors text-[11px]"
              >
                ×
              </button>
            </div>

            {/* Exercises */}
            {session.open && (
              <div className="p-4 space-y-3">
                {session.exercises.map((ex, ei) => (
                  <ExerciseCard
                    key={ei}
                    exercise={ex}
                    si={si}
                    ei={ei}
                    isHighlighted={highlightKey === `${si}-${ei}`}
                    isUploading={uploadingKey === `${si}-${ei}`}
                    alerts={alertsFor(si, ei)}
                    templateId={templateId}
                    onUpdate={patch => onUpdateExercise(si, ei, patch)}
                    onRemove={() => onRemoveExercise(si, ei)}
                    onImageUpload={file => onImageUpload(si, ei, file)}
                    onPickExercise={() => onPickExercise(si, ei)}
                    onOpenAlternatives={() => onOpenAlternatives(si, ei)}
                    exerciseRef={exerciseRefSetter(`${si}-${ei}`)}
                  />
                ))}
                <button
                  onClick={() => onAddExercise(si)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-[0.3px] border-dashed border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/[0.15] transition-colors text-[11px]"
                >
                  <Plus size={12} />
                  Ajouter un exercice
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add session */}
        <button
          onClick={onAddSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[0.3px] border-dashed border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-colors text-[12px]"
        >
          <Plus size={13} />
          Ajouter une séance
        </button>

        {/* Lab Mode */}
        <LabModeSection
          result={intelligenceResult}
          morphoConnected={morphoConnected}
          morphoDate={morphoDate}
        />
      </div>
    </div>
  )
}
