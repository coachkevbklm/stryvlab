'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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

  const topBarRight = useMemo(() => (
    <Link
      href={`/coach/clients/${clientId}/protocoles/nutrition/new`}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1f8a65] text-white text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-[#217356] transition-all active:scale-[0.98]"
    >
      <Plus size={12} />
      Nouveau protocole
    </Link>
  ), [clientId])

  useClientTopBar('Nutrition', topBarRight)

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
        <div className="pt-5 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
            Protocoles nutritionnels
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
                {/* Badge statut + titre */}
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                {/* Jours */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between py-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
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
