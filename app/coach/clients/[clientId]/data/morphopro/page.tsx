"use client";

import { useClient } from "@/lib/client-context";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import { MorphoAnalysisSection } from "@/components/clients/MorphoAnalysisSection";

export default function MorphoProPage() {
  const { clientId } = useClient();
  useClientTopBar("MorphoPro");

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24">
        <MorphoAnalysisSection clientId={clientId} />
      </div>
    </main>
  );
}
