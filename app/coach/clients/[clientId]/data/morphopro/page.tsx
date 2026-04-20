"use client";

import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import { MorphoAnalysisSection } from "@/components/clients/MorphoAnalysisSection";

export default function MorphoProPage() {
  const { client, clientId } = useClient();

  const topBarLeft = useMemo(
    () => (
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">Lab · Data</p>
        <p className="text-[13px] font-semibold text-white leading-none">
          {client.first_name} {client.last_name} — MorphoPro
        </p>
      </div>
    ),
    [client.first_name, client.last_name],
  );
  useSetTopBar(topBarLeft);

  return (
    <main className="min-h-screen bg-[#121212]">
      <ClientHeader />
      <div className="px-6 pb-24">
        <MorphoAnalysisSection clientId={clientId} />
      </div>
    </main>
  );
}
