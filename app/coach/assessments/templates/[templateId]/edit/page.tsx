'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TemplateBuilder from '@/components/assessments/builder/TemplateBuilder'
import { AssessmentTemplate } from '@/types/assessment'

export default function EditTemplatePage() {
  const params = useParams()
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/assessments/templates/${params.templateId}`)
      .then(r => r.json())
      .then(d => {
        if (d.template) setTemplate(d.template)
        else setError('Template introuvable')
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false))
  }, [params.templateId])

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-secondary">Chargement…</div>
  if (error) return <div className="min-h-screen bg-surface flex items-center justify-center text-red-500">{error}</div>
  if (!template) return null

  return <TemplateBuilder initialTemplate={template} />
}
