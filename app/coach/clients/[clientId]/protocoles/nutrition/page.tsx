'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useClientTopBar } from '@/components/clients/useClientTopBar'
import { Skeleton } from '@/components/ui/skeleton'
import NutritionProtocolDashboard from '@/components/nutrition/NutritionProtocolDashboard'
import type { NutritionProtocol } from '@/lib/nutrition/types'

export default function NutritionPage() {
  const params   = useParams()
  const clientId = params.clientId as string

  const [protocols, setProtocols] = useState<NutritionProtocol[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useClientTopBar('Nutrition')

  const fetchProtocols = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${clientId}/nutrition-protocols`)
      if (!res.ok) { setError('Erreur serveur'); return }
      const data = await res.json()
      setProtocols(data.protocols ?? [])
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchProtocols() }, [fetchProtocols])

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            Protocoles nutritionnels
          </p>
          <Link
            href={`/coach/clients/${clientId}/protocoles/nutrition/new`}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1f8a65] text-white text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-[#217356] transition-colors active:scale-[0.97]"
          >
            <Plus size={13} /> Nouveau
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-[13px] text-red-400/70">{error}</p>
        )}

        {!loading && !error && (
          <NutritionProtocolDashboard protocols={protocols} onRefresh={fetchProtocols} />
        )}
      </div>
    </main>
  )
}
