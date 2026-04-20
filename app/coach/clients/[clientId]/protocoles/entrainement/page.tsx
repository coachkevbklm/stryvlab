"use client";

import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import ProgramEditor from "@/components/programs/ProgramEditor";

export default function EntrainementPage() {
  const { client, clientId } = useClient();

  const topBarLeft = useMemo(
    () => (
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">Lab · Protocoles</p>
        <p className="text-[13px] font-semibold text-white leading-none">
          {client.first_name} {client.last_name} — Entraînement
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
        <ProgramEditor clientId={clientId} />
      </div>
    </main>
  );
}
