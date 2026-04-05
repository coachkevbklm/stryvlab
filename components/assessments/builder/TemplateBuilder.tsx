'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ChevronLeft } from 'lucide-react'
import { BlockConfig, AssessmentTemplate, TemplateType } from '@/types/assessment'
import { AssessmentModule } from '@/types/assessment'
import { createDefaultBlock } from '@/lib/assessments/modules'
import BlockPalette from './BlockPalette'
import BlockCard from './BlockCard'

interface Props {
  initialTemplate?: AssessmentTemplate
}

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: 'intake',  label: 'Bilan d\'entrée' },
  { value: 'weekly',  label: 'Check-in hebdomadaire' },
  { value: 'monthly', label: 'Bilan mensuel' },
  { value: 'custom',  label: 'Personnalisé' },
]

export default function TemplateBuilder({ initialTemplate }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialTemplate?.name ?? '')
  const [description, setDescription] = useState(initialTemplate?.description ?? '')
  const [templateType, setTemplateType] = useState<TemplateType>(initialTemplate?.template_type ?? 'intake')
  const [isDefault, setIsDefault] = useState(initialTemplate?.is_default ?? false)
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialTemplate?.blocks ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dragFrom = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const usedModules = blocks.map(b => b.module as AssessmentModule)

  function addBlock(module: AssessmentModule) {
    const block = createDefaultBlock(module, blocks.length)
    setBlocks(prev => [...prev, block])
  }

  function deleteBlock(index: number) {
    setBlocks(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i })))
  }

  function updateBlock(index: number, block: BlockConfig) {
    setBlocks(prev => prev.map((b, i) => i === index ? block : b))
  }

  function handleDrop() {
    if (dragFrom.current === null || dragOver.current === null) return
    const from = dragFrom.current
    const to = dragOver.current
    if (from === to) return

    setBlocks(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((b, i) => ({ ...b, order: i }))
    })
    dragFrom.current = null
    dragOver.current = null
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Le nom du template est obligatoire'); return }
    if (blocks.length === 0) { setError('Ajoutez au moins un bloc'); return }

    setSaving(true)
    try {
      const url = initialTemplate
        ? `/api/assessments/templates/${initialTemplate.id}`
        : '/api/assessments/templates'
      const method = initialTemplate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, template_type: templateType, blocks, is_default: isDefault }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur lors de la sauvegarde')
        return
      }

      router.push('/coach/assessments')
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/coach/assessments')}
          className="w-10 h-10 rounded-widget bg-surface-light shadow-soft-out flex items-center justify-center text-secondary hover:text-primary transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nom du template…"
          className="flex-1 text-xl font-bold text-primary bg-transparent outline-none placeholder:text-secondary/40"
        />

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
        >
          <Save size={15} />
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </header>

      {/* Toolbar */}
      <div className="bg-surface/60 border-b border-white/60 px-6 py-3 flex items-center gap-4 flex-wrap">
        <select
          value={templateType}
          onChange={e => setTemplateType(e.target.value as TemplateType)}
          className="text-sm bg-surface shadow-soft-in rounded-btn px-3 py-1.5 text-primary outline-none"
        >
          {TEMPLATE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optionnelle)…"
          className="flex-1 min-w-[200px] text-sm bg-surface shadow-soft-in rounded-btn px-3 py-1.5 text-primary outline-none placeholder:text-secondary/40"
        />

        <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
            className="accent-accent"
          />
          Template par défaut
        </label>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        <BlockPalette usedModules={usedModules} onAdd={addBlock} />

        <div className="flex-1 flex flex-col gap-3">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/80 rounded-card text-secondary text-sm">
              <p className="font-bold mb-1">Aucun bloc ajouté</p>
              <p className="text-xs opacity-60">Cliquez sur un module à gauche pour l'ajouter</p>
            </div>
          ) : (
            blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                index={i}
                total={blocks.length}
                onDelete={() => deleteBlock(i)}
                onUpdate={b => updateBlock(i, b)}
                onDragStart={idx => { dragFrom.current = idx }}
                onDragOver={idx => { dragOver.current = idx }}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
