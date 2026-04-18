'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

interface Alternative {
  id: string
  name: string
  notes: string | null
  position: number
}

interface Props {
  templateId: string
  exerciseId: string
}

export default function ExerciseClientAlternatives({ templateId, exerciseId }: Props) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const url = `/api/program-templates/${templateId}/exercises/${exerciseId}/alternatives`

  useEffect(() => {
    fetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAlternatives(data)
    }).catch(() => {})
  }, [url])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erreur')
    } else {
      setAlternatives(prev => [...prev, data])
      setNewName('')
      setAdding(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`${url}?id=${id}`, { method: 'DELETE' })
    if (res.ok) setAlternatives(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="mt-1 border-t border-white/[0.06] pt-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 mb-1.5">
        Alternatives client ({alternatives.length}/3)
      </p>

      {alternatives.length > 0 && (
        <div className="flex flex-col gap-1 mb-1.5">
          {alternatives.map(alt => (
            <div
              key={alt.id}
              className="flex items-center justify-between gap-2 bg-white/[0.03] rounded-lg px-2 py-1.5"
            >
              <span className="text-[11px] text-white/60 truncate">{alt.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(alt.id)}
                className="shrink-0 text-white/25 hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex gap-1.5">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder="Nom de l'alternative…"
            autoFocus
            className="flex-1 bg-[#0a0a0a] rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/20 outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="shrink-0 px-2 py-1.5 bg-[#1f8a65]/80 text-white text-[10px] font-bold rounded-lg disabled:opacity-40 hover:bg-[#1f8a65] transition-colors"
          >
            {saving ? '…' : 'OK'}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); setError('') }}
            className="shrink-0 px-2 py-1.5 bg-white/[0.04] text-white/40 text-[10px] rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            ✕
          </button>
        </div>
      ) : alternatives.length < 3 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          <Plus size={10} />
          Ajouter une alternative
        </button>
      ) : null}

      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}
