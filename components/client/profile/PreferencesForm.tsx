'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Prefs {
  weight_unit: 'kg' | 'lbs'
  height_unit: 'cm' | 'ft'
  language:    'fr' | 'en' | 'es'
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function PreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  function update<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
    if (saveState !== 'idle') setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    const res = await fetch('/api/client/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })
    if (res.ok) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } else {
      setSaveState('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        label="Unité de poids"
        options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
        value={prefs.weight_unit}
        onChange={(v) => update('weight_unit', v as 'kg' | 'lbs')}
      />
      <ToggleGroup
        label="Unité de taille"
        options={[{ value: 'cm', label: 'cm' }, { value: 'ft', label: 'ft / in' }]}
        value={prefs.height_unit}
        onChange={(v) => update('height_unit', v as 'cm' | 'ft')}
      />
      <ToggleGroup
        label="Langue"
        options={[
          { value: 'fr', label: '🇫🇷 Français' },
          { value: 'en', label: '🇬🇧 English' },
          { value: 'es', label: '🇪🇸 Español' },
        ]}
        value={prefs.language}
        onChange={(v) => update('language', v as 'fr' | 'en' | 'es')}
      />

      <button
        onClick={handleSave}
        disabled={saveState === 'saving'}
        className={`w-full py-2.5 rounded-btn text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          saveState === 'saved'
            ? 'bg-green-500 text-white'
            : 'bg-accent text-white hover:opacity-90 disabled:opacity-50'
        }`}
      >
        {saveState === 'saving' && <Loader2 size={14} className="animate-spin" />}
        {saveState === 'saved'  && <Check size={14} />}
        {saveState === 'saved' ? 'Sauvegardé' : saveState === 'saving' ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>
    </div>
  )
}

function ToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              value === o.value
                ? 'bg-accent text-white shadow-md'
                : 'bg-surface-light shadow-soft-out text-secondary hover:text-primary'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
