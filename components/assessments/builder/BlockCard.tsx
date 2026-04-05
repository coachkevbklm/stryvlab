'use client'

import { useState } from 'react'
import { GripVertical, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Star } from 'lucide-react'
import { BlockConfig, FieldConfig } from '@/types/assessment'

interface Props {
  block: BlockConfig
  index: number
  total: number
  onDelete: () => void
  onUpdate: (block: BlockConfig) => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
}

export default function BlockCard({
  block, index, total, onDelete, onUpdate, onDragStart, onDragOver, onDrop,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(block.label)

  function commitLabel() {
    setEditingLabel(false)
    if (labelDraft.trim()) onUpdate({ ...block, label: labelDraft.trim() })
    else setLabelDraft(block.label)
  }

  function toggleVisible(fieldKey: string) {
    const fields = block.fields.map((f: FieldConfig) =>
      f.key === fieldKey ? { ...f, visible: !f.visible } : f
    )
    onUpdate({ ...block, fields })
  }

  function toggleRequired(fieldKey: string) {
    const fields = block.fields.map((f: FieldConfig) =>
      f.key === fieldKey
        ? { ...f, required: !f.required, visible: !f.required ? true : f.visible }
        : f
    )
    onUpdate({ ...block, fields })
  }

  function showAll() {
    onUpdate({ ...block, fields: block.fields.map(f => ({ ...f, visible: true })) })
  }

  function hideAll() {
    onUpdate({ ...block, fields: block.fields.map(f => ({ ...f, visible: false, required: false })) })
  }

  const visibleCount = block.fields.filter(f => f.visible).length
  const requiredCount = block.fields.filter(f => f.required).length

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index) }}
      onDrop={onDrop}
      className="bg-surface rounded-card shadow-soft-out overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/60">
        <GripVertical size={15} className="text-secondary/30 cursor-grab shrink-0" />

        {editingLabel ? (
          <input
            autoFocus
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => e.key === 'Enter' && commitLabel()}
            className="flex-1 text-sm font-bold text-primary bg-surface-light shadow-soft-in rounded-btn px-2 py-0.5 outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingLabel(true)}
            className="flex-1 text-sm font-bold text-primary text-left hover:text-accent transition-colors"
          >
            {block.label}
          </button>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
          <span className="text-accent">{visibleCount} affiché{visibleCount > 1 ? 's' : ''}</span>
          {requiredCount > 0 && (
            <span className="text-secondary">{requiredCount} requis</span>
          )}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="w-7 h-7 rounded-btn flex items-center justify-center hover:bg-surface-light text-secondary transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-btn flex items-center justify-center hover:bg-surface-light text-secondary hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Toolbar rapide */}
      {expanded && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/40 bg-surface-light/50">
          <span className="text-[10px] text-secondary uppercase tracking-widest font-bold mr-auto">Champs</span>
          <button
            onClick={showAll}
            className="text-[10px] font-bold text-secondary hover:text-accent transition-colors"
          >
            Tout afficher
          </button>
          <span className="text-secondary/30">·</span>
          <button
            onClick={hideAll}
            className="text-[10px] font-bold text-secondary hover:text-primary transition-colors"
          >
            Tout masquer
          </button>
        </div>
      )}

      {/* Fields */}
      {expanded && (
        <div className="divide-y divide-white/40">
          {block.fields.map((field: FieldConfig) => (
            <div
              key={field.key}
              className={`flex items-center gap-2 px-4 py-2.5 transition-colors ${
                !field.visible ? 'opacity-40' : ''
              }`}
            >
              {/* Visible toggle */}
              <button
                onClick={() => toggleVisible(field.key)}
                title={field.visible ? 'Masquer ce champ' : 'Afficher ce champ'}
                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                  field.visible
                    ? 'text-accent hover:text-secondary'
                    : 'text-secondary/40 hover:text-accent'
                }`}
              >
                {field.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Label + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm text-primary truncate">{field.label}</p>
                  {field.show_if && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0"
                      title={`Affiché si "${field.show_if.field_key}" ${field.show_if.operator}${field.show_if.value ? ` "${field.show_if.value}"` : ''}`}
                    >
                      conditionnel
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-secondary/50">
                  {field.input_type}
                  {field.unit ? ` · ${field.unit}` : ''}
                </p>
              </div>

              {/* Required toggle — uniquement si visible */}
              {field.visible && (
                <button
                  onClick={() => toggleRequired(field.key)}
                  title={field.required ? 'Rendre optionnel' : 'Rendre obligatoire'}
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                    field.required
                      ? 'text-accent'
                      : 'text-secondary/30 hover:text-secondary'
                  }`}
                >
                  <Star size={12} fill={field.required ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Légende */}
      {expanded && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/40 bg-surface-light/30">
          <div className="flex items-center gap-1.5 text-[10px] text-secondary/60">
            <Eye size={10} className="text-accent" />
            <span>= affiché dans le bilan</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-secondary/60">
            <Star size={10} className="text-accent" fill="currentColor" />
            <span>= obligatoire</span>
          </div>
        </div>
      )}
    </div>
  )
}
