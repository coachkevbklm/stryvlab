"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useClient } from "@/lib/client-context";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import ClientProgramsList from "@/components/programs/ClientProgramsList";
import ProgramTemplateBuilder from "@/components/programs/ProgramTemplateBuilder";

interface Program {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  status: "active" | "archived";
  is_client_visible: boolean;
  created_at: string;
  // full builder fields (populated after fetch)
  goal?: string;
  level?: string;
  frequency?: number;
  muscle_tags?: string[];
  equipment_archetype?: string;
  session_mode?: string;
  program_sessions?: any[];
}

export default function EntrainementPage() {
  const { client, clientId } = useClient();
  useClientTopBar("Entraînement");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className={selectedProgram ? "" : "px-6 pb-24"}>
        {selectedProgram ? (
          <ProgramTemplateBuilder
            initial={selectedProgram}
            programId={selectedProgram.id}
            clientId={clientId}
            onSaved={(saved) => {
              setSelectedProgram((prev) =>
                prev ? { ...prev, name: saved?.name ?? prev.name } : prev
              );
            }}
            onCancel={() => setSelectedProgram(null)}
          />
        ) : (
          <>
            <div className="pt-5 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                Programmes d&apos;entraînement
              </p>
            </div>
            <ClientProgramsList
              clientId={clientId}
              onSelectProgram={(p) => setSelectedProgram(p as Program)}
            />
          </>
        )}
      </div>
    </main>
  );
}
