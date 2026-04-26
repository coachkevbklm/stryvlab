'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import NutritionStudio from '@/components/nutrition/studio/NutritionStudio'
import type { NutritionProtocol } from '@/lib/nutrition/types'

export default function EditNutritionProtocolPage() {
  const params     = useParams()
  const clientId   = params.clientId as string
  const protocolId = params.protocolId as string

  const [protocol, setProtocol] = useState<NutritionProtocol | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    fetch(`/api/clients/${clientId}/nutrition-protocols/${protocolId}`)
      .then(r => r.json())
      .then(d => {
        if (d.protocol) setProtocol(d.protocol)
        else setError('Protocole introuvable')
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false))
  }, [clientId, protocolId])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212]">
        <div className="px-6 pb-24 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  if (error || !protocol) {
    return (
      <main className="min-h-screen bg-[#121212]">
        <div className="px-6 pt-10 text-center">
          <p className="text-[14px] text-white/50">{error || 'Protocole introuvable'}</p>
        </div>
      </main>
    )
  }

  return <NutritionStudio clientId={clientId} existingProtocol={protocol} />
}
