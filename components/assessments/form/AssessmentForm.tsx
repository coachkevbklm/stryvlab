'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { BlockConfig, ResponseMap } from '@/types/assessment'
import { evaluateCondition } from '@/lib/assessments/condition'
import MetricField from './MetricField'

interface Props {
  submissionId: string
  blocks: BlockConfig[]
  token: string
  clientName: string
  isCoach?: boolean
}

export default function AssessmentForm({ submissionId, blocks, token, clientName, isCoach }: Props) {
  const [responses, setResponses] = useState<ResponseMap>({})
  const [currentBlock, setCurrentBlock] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const block = blocks[currentBlock]
  const isLast = currentBlock === blocks.length - 1

  function setValue(blockId: string, fieldKey: string, value: string | number | string[] | boolean) {
    setResponses(prev => ({
      ...prev,
      [blockId]: { ...(prev[blockId] ?? {}), [fieldKey]: value }
    }))
  }

  const buildPayload = useCallback((submit = false) => {
    const responseList: object[] = []
    for (const blk of blocks) {
      const blkResponses = responses[blk.id] ?? {}
      for (const field of blk.fields) {
        if (!field.visible) continue
        if (!evaluateCondition(field.show_if, responses)) continue
        const val = blkResponses[field.key]
        if (val === undefined || val === '') continue
        const row: Record<string, unknown> = { block_id: blk.id, field_key: field.key }
        if (field.input_type === 'number' || field.input_type === 'scale_1_10') {
          row.value_number = val
        } else if (field.input_type === 'multiple_choice') {
          row.value_json = val
        } else if (field.input_type === 'boolean') {
          row.value_text = val ? 'true' : 'false'
        } else if (field.input_type === 'photo_upload') {
          row.storage_path = val  // storage_path Supabase, déjà uploadé par le widget
        } else {
          row.value_text = val
        }
        responseList.push(row)
      }
    }
    return { responses: responseList, submit }
  }, [blocks, responses])

  const autoSave = useCallback(async () => {
    if (Object.keys(responses).length === 0) return
    setSaving(true)
    try {
      const endpoint = isCoach
        ? `/api/assessments/submissions/${submissionId}/responses`
        : `/api/assessments/public/${token}/responses`
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      })
    } catch { /* ignore autosave errors */ }
    setSaving(false)
  }, [responses, submissionId, token, isCoach, buildPayload])

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(autoSave, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [responses, autoSave])

  async function handleSubmit() {
    setError('')
    // Validation required — ignorer les champs masqués par condition
    for (const blk of blocks) {
      for (const field of blk.fields) {
        if (!field.required || !field.visible) continue
        if (!evaluateCondition(field.show_if, responses)) continue
        const val = responses[blk.id]?.[field.key]
        if (val === undefined || val === '') {
          setError(`Champ requis manquant : "${field.label}" dans ${blk.label}`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const endpoint = isCoach
        ? `/api/assessments/submissions/${submissionId}/responses`
        : `/api/assessments/public/${token}/responses`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur lors de la soumission')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface font-sans flex items-center justify-center p-6">
        <div className="bg-surface rounded-card shadow-soft-out p-10 text-center max-w-sm w-full">
          <CheckCircle2 size={56} className="text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Bilan soumis !</h2>
          <p className="text-sm text-secondary">Merci {clientName}. Votre coach a été notifié.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="STRYV" width={24} height={24} className="w-6 h-6 object-contain" />
              <h1 className="font-bold text-primary">{clientName}</h1>
            </div>
            <div className="flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin text-secondary" />}
              <span className="text-xs text-secondary font-medium">
                {currentBlock + 1} / {blocks.length}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-light shadow-soft-in rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${((currentBlock + 1) / blocks.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Block */}
      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="bg-surface rounded-card shadow-soft-out p-6">
          <h2 className="text-lg font-bold text-primary mb-6">{block.label}</h2>
          <div className="flex flex-col gap-6">
            {block.fields
              .filter(f => f.visible && evaluateCondition(f.show_if, responses))
              .map(field => (
                <MetricField
                  key={field.key}
                  field={field}
                  value={responses[block.id]?.[field.key]}
                  onChange={val => setValue(block.id, field.key, val)}
                  submissionToken={isCoach ? undefined : token}
                  submissionId={isCoach ? submissionId : undefined}
                  blockId={block.id}
                />
              ))}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-btn px-4 py-3 font-medium">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentBlock(v => Math.max(0, v - 1))}
            disabled={currentBlock === 0}
            className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
            Précédent
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-accent text-white text-sm font-bold px-6 py-2.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {submitting ? 'Envoi…' : 'Soumettre le bilan'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentBlock(v => Math.min(blocks.length - 1, v + 1))}
              className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-btn hover:opacity-90 transition-opacity shadow-lg"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
