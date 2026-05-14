'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface ProfileData {
  first_name:       string
  last_name:        string
  phone:            string
  goal:             string
  date_of_birth:    string
  gender:           string
  training_goal:    string
  fitness_level:    string
  sport_practice:   string
  weekly_frequency: number | null
}

interface Props {
  clientId: string
  initial: ProfileData
}

const TRAINING_GOALS = [
  { value: 'hypertrophy',  label: 'Hypertrophie' },
  { value: 'strength',     label: 'Force' },
  { value: 'fat_loss',     label: 'Perte de graisse' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'recomp',       label: 'Recomposition' },
  { value: 'maintenance',  label: 'Maintien' },
  { value: 'athletic',     label: 'Performance athlétique' },
]

const FITNESS_LEVELS = [
  { value: 'beginner',     label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced',     label: 'Avancé' },
  { value: 'elite',        label: 'Elite' },
]

const SPORT_PRACTICES = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light',     label: 'Légèrement actif' },
  { value: 'moderate',  label: 'Modérément actif' },
  { value: 'active',    label: 'Actif' },
  { value: 'athlete',   label: 'Athlète' },
]

const GENDERS = [
  { value: 'male',              label: 'Homme' },
  { value: 'female',            label: 'Femme' },
  { value: 'other',             label: 'Autre' },
  { value: 'prefer_not_to_say', label: 'Préfère ne pas préciser' },
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfileForm({ clientId, initial }: Props) {
  const [form, setForm] = useState<ProfileData>(initial)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update(field: keyof ProfileData, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (saveState === 'saved' || saveState === 'error') setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    setErrorMsg(null)

    const res = await fetch('/api/client/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name:       form.first_name || undefined,
        last_name:        form.last_name || undefined,
        phone:            form.phone || null,
        goal:             form.goal || null,
        date_of_birth:    form.date_of_birth || null,
        gender:           form.gender || null,
        training_goal:    form.training_goal || null,
        fitness_level:    form.fitness_level || null,
        sport_practice:   form.sport_practice || null,
        weekly_frequency: form.weekly_frequency,
      }),
    })

    if (res.ok) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } else {
      const d = await res.json().catch(() => ({}))
      setErrorMsg(d.error ?? 'Erreur de sauvegarde')
      setSaveState('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Nom */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom">
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => update('first_name', e.target.value)}
            className={inputCls}
            placeholder="Prénom"
          />
        </Field>
        <Field label="Nom">
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => update('last_name', e.target.value)}
            className={inputCls}
            placeholder="Nom"
          />
        </Field>
      </div>

      {/* Téléphone */}
      <Field label="Téléphone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className={inputCls}
          placeholder="+32 XXX XX XX XX"
        />
      </Field>

      {/* Date de naissance */}
      <Field label="Date de naissance">
        <input
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update('date_of_birth', e.target.value)}
          className={inputCls}
        />
      </Field>

      {/* Genre */}
      <Field label="Genre">
        <select
          value={form.gender}
          onChange={(e) => update('gender', e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionner…</option>
          {GENDERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Objectif texte libre */}
      <Field label="Objectif personnel">
        <textarea
          value={form.goal}
          onChange={(e) => update('goal', e.target.value)}
          className={`${inputCls} resize-none h-16`}
          placeholder="Décris ton objectif en quelques mots…"
        />
      </Field>

      {/* Objectif entraînement */}
      <Field label="Type d'entraînement">
        <select
          value={form.training_goal}
          onChange={(e) => update('training_goal', e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionner…</option>
          {TRAINING_GOALS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Niveau */}
      <Field label="Niveau">
        <select
          value={form.fitness_level}
          onChange={(e) => update('fitness_level', e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionner…</option>
          {FITNESS_LEVELS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Activité */}
      <Field label="Niveau d'activité">
        <select
          value={form.sport_practice}
          onChange={(e) => update('sport_practice', e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionner…</option>
          {SPORT_PRACTICES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Fréquence */}
      <Field label="Séances par semaine">
        <div className="flex gap-2">
          {[1,2,3,4,5,6,7].map((n) => (
            <button
              key={n}
              onClick={() => update('weekly_frequency', form.weekly_frequency === n ? null : n)}
              className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${
                form.weekly_frequency === n
                  ? 'bg-[#1f8a65] text-white'
                  : 'bg-[#0a0a0a] border-[0.3px] border-white/[0.06] text-white/40 hover:text-white/70'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {/* Error */}
      {saveState === 'error' && errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saveState === 'saving'}
        className={`w-full h-11 rounded-xl text-[12px] font-bold uppercase tracking-[0.10em] transition-all flex items-center justify-center gap-2 ${
          saveState === 'saved'
            ? 'bg-[#1f8a65] text-white'
            : 'bg-[#1f8a65] text-white hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50'
        }`}
      >
        {saveState === 'saving' && <Loader2 size={14} className="animate-spin" />}
        {saveState === 'saved'  && <Check size={14} />}
        {saveState === 'saved' ? 'Sauvegardé' : saveState === 'saving' ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.14em] block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-[#0a0a0a] border-[0.3px] border-white/[0.06] rounded-xl px-3 h-11 text-[13px] text-white outline-none placeholder:text-white/20 transition-all'
