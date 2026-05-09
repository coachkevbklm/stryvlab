"use client";

import { AlertCircle } from "lucide-react";
import type { NutritionClientData } from "@/lib/nutrition/types";

type MissingDataKey = "bmr" | "weight" | "height" | "bf" | "steps" | "lean_mass" | "muscle_mass";

interface Props {
  clientData: NutritionClientData | null;
  macroResult: {
    breakdown: { bmr: number };
  } | null;
  dataSource?: Record<string, 'selected' | 'fallback'>;
  onDataClick?: (key: MissingDataKey) => void;
}

// Volatile fields = change between bilans, need alert if fallback
const VOLATILE_FIELDS: MissingDataKey[] = ["bmr", "weight", "bf", "steps", "lean_mass", "muscle_mass"];

// Stable fields = don't change, silent fallback OK
const STABLE_FIELDS: MissingDataKey[] = ["height"];

export default function MissingDataAlerts({
  clientData,
  macroResult,
  dataSource = {},
  onDataClick,
}: Props) {
  if (!clientData) return null;

  const missing: { label: string; metric: MissingDataKey; reason: string }[] = [];

  // Check VOLATILE fields — alert if missing OR from fallback
  if (!clientData.bmr_kcal_measured && !macroResult?.breakdown.bmr) {
    missing.push({ label: "BMR", metric: "bmr", reason: "absent bilan sélectionné" });
  } else if (dataSource["bmr_kcal_measured"] === "fallback") {
    missing.push({ label: "BMR", metric: "bmr", reason: "du bilan antérieur (à vérifier)" });
  }

  if (!clientData.weight_kg) {
    missing.push({ label: "Poids", metric: "weight", reason: "absent bilan sélectionné" });
  } else if (dataSource["weight_kg"] === "fallback") {
    missing.push({ label: "Poids", metric: "weight", reason: "du bilan antérieur (à vérifier)" });
  }

  if (!clientData.body_fat_pct) {
    missing.push({ label: "% Masse grasse", metric: "bf", reason: "absent bilan sélectionné" });
  } else if (dataSource["body_fat_pct"] === "fallback") {
    missing.push({ label: "% Masse grasse", metric: "bf", reason: "du bilan antérieur (à vérifier)" });
  }

  if (!clientData.daily_steps) {
    missing.push({ label: "Pas quotidiens", metric: "steps", reason: "absent bilan sélectionné" });
  } else if (dataSource["daily_steps"] === "fallback") {
    missing.push({ label: "Pas quotidiens", metric: "steps", reason: "du bilan antérieur (à vérifier)" });
  }

  if (!clientData.lean_mass_kg && dataSource["lean_mass_kg"] === "fallback") {
    missing.push({ label: "Masse maigre", metric: "lean_mass", reason: "du bilan antérieur (à vérifier)" });
  }

  if (!clientData.muscle_mass_kg && dataSource["muscle_mass_kg"] === "fallback") {
    missing.push({ label: "Masse musculaire", metric: "muscle_mass", reason: "du bilan antérieur (à vérifier)" });
  }

  // STABLE fields — only alert if NEVER entered (not from fallback)
  if (!clientData.height_cm && !dataSource["height_cm"]) {
    missing.push({ label: "Taille", metric: "height", reason: "jamais ajoutée" });
  }

  if (missing.length === 0) return null;

  return (
    <div className="space-y-2 pb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-400/70">
        Données à vérifier
      </p>
      {missing.map((item) => (
        <button
          key={item.metric}
          onClick={() => onDataClick?.(item.metric)}
          className="w-full flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border-[0.3px] border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 transition-all text-left cursor-pointer active:scale-[0.98]"
        >
          <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-amber-300/80 font-medium">{item.label}</p>
            <p className="text-[9px] text-amber-300/60">{item.reason}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

