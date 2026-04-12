// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useSetTopBar } from '@/components/layout/useSetTopBar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus } from 'lucide-react';

import HeroSummary from '@/components/dashboard/HeroSummary';
import AlertsFeed from '@/components/dashboard/AlertsFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import ClientsSection from '@/components/dashboard/ClientsSection';
import FinancialStrip from '@/components/dashboard/FinancialStrip';
import type { DashboardCoachData } from '@/components/dashboard/types';

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-6">
      {/* Hero */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-80" />
        <div className="flex gap-6">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-16" />)}
        </div>
      </div>
      {/* Alertes */}
      <div className="space-y-1.5">
        {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
      </div>
      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
      {/* Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      {/* Financier */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardCoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noClients, setNoClients] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return; }

      fetch('/api/dashboard/coach')
        .then(r => r.json())
        .then(json => {
          if (json.success && json.data) {
            setData(json.data);
            setNoClients(json.data.hero.activeClients === 0);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [router]);

  const topBarLeft = useMemo(
    () => (
      <div className="flex flex-col leading-tight">
        <p className="text-[11px] font-medium text-white/35 uppercase tracking-[0.14em]">
          Espace Coach
        </p>
        <p className="text-[13px] font-semibold text-white/80">
          Dashboard
        </p>
      </div>
    ),
    [],
  );

  useSetTopBar(topBarLeft);

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="bg-[#121212] min-h-screen">
      <div className="p-6 max-w-[900px] mx-auto">

        {/* Onboarding banner — si aucun client */}
        {noClients && (
          <div className="mb-8 rounded-2xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1.5">
                Bienvenue dans l&apos;Espace Coach
              </p>
              <h3 className="text-white text-xl font-bold tracking-tight">
                Tu viens d&apos;entrer dans la{' '}
                <span className="text-[#1f8a65]">nouvelle ère</span> du coaching.
              </h3>
              <p className="text-white/45 text-[13px] mt-1 leading-relaxed">
                Commence par créer ton premier client pour démarrer le suivi.
              </p>
            </div>
            <button
              onClick={() => router.push('/coach/clients')}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[#1f8a65] text-white rounded-xl font-bold text-[13px] hover:bg-[#217356] transition-colors active:scale-[0.98]"
            >
              <UserPlus size={15} />
              Créer un client
            </button>
          </div>
        )}

        {data && (
          <>
            <HeroSummary hero={data.hero} />
            <AlertsFeed alerts={data.alerts} />
            <QuickActions alerts={data.alerts} />
            <ClientsSection clients={data.clients} />
            <FinancialStrip financial={data.financial} />
          </>
        )}
      </div>
    </main>
  );
}
