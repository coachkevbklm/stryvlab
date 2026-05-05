'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useSetTopBar } from '@/components/layout/useSetTopBar'
import { Skeleton } from '@/components/ui/skeleton'

import WelcomeHeader from '@/components/dashboard/WelcomeHeader'
import SummaryPanel from '@/components/dashboard/SummaryPanel'
import DashboardSubNav, { type DashboardView } from '@/components/dashboard/DashboardSubNav'
import DashboardKanban from '@/components/dashboard/DashboardKanban'
import DashboardAgenda from '@/components/dashboard/DashboardAgenda'
import OrgSummary from '@/components/dashboard/OrgSummary'
import type { DashboardCoachData } from '@/components/dashboard/types'

const VIEW_STORAGE_KEY = 'dashboard_active_view'

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardCoachData | null>(null)
  const [onboarding, setOnboarding] = useState<{ hasClient: boolean; hasTemplate: boolean; hasFormula: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<DashboardView>('resume')

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY) as DashboardView | null
    if (stored && ['resume', 'kanban', 'agenda'].includes(stored)) {
      setView(stored)
    }
  }, [])

  const handleViewChange = (v: DashboardView) => {
    setView(v)
    localStorage.setItem(VIEW_STORAGE_KEY, v)
  }

  const loadData = () => {
    setError(false)
    setLoading(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      Promise.all([
        fetch('/api/dashboard/coach').then(r => r.json()),
        fetch('/api/dashboard/onboarding').then(r => r.json()),
      ])
        .then(([dashJson, onboardingJson]) => {
          if (dashJson.success && dashJson.data) setData(dashJson.data)
          else if (!dashJson.success) setError(true)
          setOnboarding(onboardingJson)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    })
  }

  useEffect(() => { loadData() }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  const topBarLeft = useMemo(() => (
    <div className="flex flex-col leading-tight">
      <p className="text-[9px] font-medium text-white/30 uppercase tracking-[0.14em]">Espace Coach</p>
      <p className="text-[13px] font-semibold text-white">Accueil</p>
    </div>
  ), [])

  useSetTopBar(topBarLeft)

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <main className="bg-[#121212] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[13px] text-white/40">Impossible de charger le dashboard.</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-white/[0.04] text-[12px] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
          >
            <RefreshCw size={13} />
            Réessayer
          </button>
        </div>
      </main>
    )
  }

  const hasCriticalAlerts = (data?.alerts ?? []).filter(a => a.severity === 'critical').length > 0

  return (
    <main className="bg-[#121212] min-h-screen">
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Welcome header onboarding — disparaît à 3/3 */}
        {onboarding && <WelcomeHeader state={onboarding} />}

        {/* Résumé collapsible — toujours visible */}
        {data && <SummaryPanel data={data} />}

        {/* Séparateur visuel */}
        <div className="h-px bg-white/[0.04] mb-4" />

        {/* Sub-nav vues */}
        <DashboardSubNav active={view} onChange={handleViewChange} />

        {/* Vue active */}
        {view === 'resume' && (
          hasCriticalAlerts
            ? <OrgSummary />
            : (
              <div className="space-y-4">
                <OrgSummary />
                <div className="rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] px-5 py-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1f8a65]" />
                  <p className="text-[12px] text-white/35">Tout est sous contrôle.</p>
                </div>
              </div>
            )
        )}
        {view === 'kanban' && <DashboardKanban />}
        {view === 'agenda' && <DashboardAgenda />}
      </div>
    </main>
  )
}
