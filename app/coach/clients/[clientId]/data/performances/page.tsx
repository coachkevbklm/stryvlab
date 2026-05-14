"use client";

import { useClient } from "@/lib/client-context";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import SessionHistory from "@/components/clients/SessionHistory";
import PerformanceDashboard from "@/components/clients/PerformanceDashboard";
import ProgressionHistory from "@/components/clients/ProgressionHistory";
import PerformanceFeedbackPanel from "@/components/clients/PerformanceFeedbackPanel";

export default function PerformancesPage() {
  const { clientId } = useClient();
  useClientTopBar("Performance");

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24 space-y-6">
        <PerformanceFeedbackPanel clientId={clientId} />
        <PerformanceDashboard clientId={clientId} />
        <SessionHistory clientId={clientId} />
        <ProgressionHistory clientId={clientId} />
      </div>
    </main>
  );
}
