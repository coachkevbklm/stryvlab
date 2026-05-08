"use client";

import { AlertCircle } from "lucide-react";
import type { NutritionClientData } from "@/lib/nutrition/types";

interface Props {
  clientData: NutritionClientData | null;
  macroResult: {
    breakdown: { bmr: number };
  } | null;
}

export default function MissingDataAlerts({
  clientData,
  macroResult,
}: Props) {
  if (!clientData) return null;

  const missing: { label: string; metric: string }[] = [];

  // BMR check
  if (!clientData.bmr_kcal_measured && !macroResult?.breakdown.bmr) {
    missing.push({ label: "BMR absent", metric: "bmr" });
  }

  // Poids check
  if (!clientData.weight_kg) {
    missing.push({ label: "Poids manquant", metric: "weight" });
  }

  // Body fat check
  if (!clientData.body_fat_pct) {
    missing.push({ label: "MG% absent", metric: "bf" });
  }

  // Daily steps check
  if (!clientData.daily_steps) {
    missing.push({ label: "Pas quotidiens inconnus", metric: "steps" });
  }

  if (missing.length === 0) return null;

  return (
    <div className="space-y-2 pb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-400/70">
        Données manquantes
      </p>
      {missing.map((item) => (
        <div
          key={item.metric}
          className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border-[0.3px] border-amber-500/20"
        >
          <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
          <span className="text-[10px] text-amber-300/80">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
