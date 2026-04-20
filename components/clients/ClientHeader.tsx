"use client";

import { useClient } from "@/lib/client-context";
import { useDock } from "@/components/layout/DockContext";
import { useEffect } from "react";

const TRAINING_GOALS: Record<string, string> = {
  hypertrophy: "Hypertrophie",
  strength: "Force",
  fat_loss: "Perte de gras",
  endurance: "Endurance",
  recomp: "Recomposition",
  maintenance: "Maintenance",
  athletic: "Athletic",
};

const FITNESS_LEVELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  elite: "Élite",
};

export default function ClientHeader() {
  const { client } = useClient();
  const { openClient } = useDock();

  // Enregistre ce client comme ouvert dans le dock (tab Chrome)
  useEffect(() => {
    openClient({
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
    });
  }, [client.id, client.first_name, client.last_name, openClient]);

  const initials = `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
  const goal = client.training_goal ? TRAINING_GOALS[client.training_goal] : null;
  const level = client.fitness_level ? FITNESS_LEVELS[client.fitness_level] : null;

  return (
    <div className="flex items-center gap-4 px-6 pt-6 pb-4">
      <div className="w-12 h-12 rounded-2xl bg-[#1f8a65]/10 border-[0.3px] border-[#1f8a65]/20 flex items-center justify-center shrink-0">
        <span className="text-[15px] font-bold text-[#1f8a65]">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-[16px] font-bold text-white leading-tight">
          {client.first_name} {client.last_name}
        </h1>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {goal && (
            <span className="text-[11px] text-white/50 font-medium">{goal}</span>
          )}
          {goal && level && <span className="text-white/20">·</span>}
          {level && (
            <span className="text-[11px] text-white/50 font-medium">{level}</span>
          )}
          {client.status && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              client.status === "active"
                ? "bg-[#1f8a65]/10 text-[#1f8a65]"
                : "bg-white/[0.06] text-white/40"
            }`}>
              {client.status === "active" ? "Actif" : client.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
