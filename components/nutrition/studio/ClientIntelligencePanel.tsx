"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Settings, Calculator } from "lucide-react";
import type { NutritionClientData } from "@/lib/nutrition/types";
import type { BMRSource } from "@/lib/nutrition/calculators";
import { calculateBMRMifflin } from "@/lib/nutrition/calculators";
import type {
  TrainingConfig,
  LifestyleConfig,
  BiometricsConfig,
} from "./useNutritionStudio";
import ParameterAdjustmentPanel from "./ParameterAdjustmentPanel";
import MissingDataAlerts from "./MissingDataAlerts";
import MissingDataPanel from "./MissingDataPanel";

type MissingDataKey = "bmr" | "weight" | "height" | "bf" | "steps" | "lean_mass" | "muscle_mass";

interface Props {
  clientData: NutritionClientData | null;
  clientId?: string;
  loading: boolean;
  trainingConfig: TrainingConfig;
  lifestyleConfig: LifestyleConfig;
  biometricsConfig: BiometricsConfig;
  onTrainingChange: (patch: Partial<TrainingConfig>) => void;
  onLifestyleChange: (patch: Partial<LifestyleConfig>) => void;
  onBiometricsChange: (patch: Partial<BiometricsConfig>) => void;
  macroResult: {
    leanMass: number;
    estimatedBF: number;
    breakdown: { bmr: number; tdee: number };
  } | null;
  submissions?: Array<{ id: string; date: string; status: string }>;
  selectedSubmissionId?: string | null;
  onSubmissionChange?: (submissionId: string) => void;
  dataSource?: Record<string, 'selected' | 'fallback'>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">
      {children}
    </p>
  );
}

function DataRow({
  label,
  value,
  unit,
  source,
  warning,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  source?: string;
  warning?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-white/50">{label}</span>
      <div className="flex items-center gap-1.5">
        {warning && <AlertTriangle size={10} className="text-amber-400" />}
        <span
          className={`text-[12px] font-medium ${warning ? "text-amber-400" : "text-white/85"}`}
        >
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
        {source && <span className="text-[9px] text-white/25">{source}</span>}
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max = 999,
}: {
  label: string;
  value: number | null;
  unit?: string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-white/50">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-0.5 text-[12px] text-white text-right outline-none focus:border-[#1f8a65]/40"
        />
        {unit && <span className="text-[10px] text-white/35 w-6">{unit}</span>}
      </div>
    </div>
  );
}

export default function ClientIntelligencePanel({
  clientData,
  clientId,
  loading,
  trainingConfig,
  lifestyleConfig,
  biometricsConfig,
  onTrainingChange,
  onLifestyleChange,
  onBiometricsChange,
  macroResult,
  submissions,
  selectedSubmissionId,
  onSubmissionChange,
  dataSource = {},
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [showBilanDropdown, setShowBilanDropdown] = useState(false);
  const [selectedMissingData, setSelectedMissingData] = useState<MissingDataKey | null>(null);
  const [completing, setCompleting] = useState(false);

  const handleMissingDataSave = useCallback(
    async (fieldValue: Record<string, unknown>) => {
      if (!clientId) return;
      setCompleting(true);
      try {
        const res = await fetch(`/api/clients/${clientId}/nutrition-data`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldValue),
        });
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

        // Refetch updated client data
        const url = new URL(
          `/api/clients/${clientId}/nutrition-data`,
          typeof window !== "undefined" ? window.location.origin : "",
        );
        if (selectedSubmissionId) {
          url.searchParams.set("submissionId", selectedSubmissionId);
        }
        const refetchRes = await fetch(url.toString());
        const refetchData = await refetchRes.json();

        onBiometricsChange({
          weight_kg: refetchData.client.weight_kg,
          height_cm: refetchData.client.height_cm,
          body_fat_pct: refetchData.client.body_fat_pct,
          lean_mass_kg: refetchData.client.lean_mass_kg,
          muscle_mass_kg: refetchData.client.muscle_mass_kg,
          visceral_fat_level: refetchData.client.visceral_fat_level,
          bmr_kcal_measured: refetchData.client.bmr_kcal_measured,
        } as Partial<BiometricsConfig>);

        setSelectedMissingData(null);
      } catch (err) {
        console.error("Failed to save missing data:", err);
      } finally {
        setCompleting(false);
      }
    },
    [clientId, selectedSubmissionId, onBiometricsChange]
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        {/* Client header */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
          <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
        </div>
        {/* Section label + rows */}
        <div className="space-y-2">
          <div className="h-2 w-16 rounded bg-white/[0.04]" />
          <div className="h-3 w-full rounded bg-white/[0.05]" />
          <div className="h-3 w-full rounded bg-white/[0.05]" />
          {/* BF% bar */}
          <div className="py-1 space-y-1.5">
            <div className="flex justify-between">
              <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
              <div className="h-2.5 w-8 rounded bg-white/[0.04]" />
            </div>
            <div className="h-[3px] w-full rounded-full bg-white/[0.06]" />
          </div>
          <div className="h-3 w-full rounded bg-white/[0.05]" />
          <div className="h-3 w-full rounded bg-white/[0.05]" />
        </div>
        {/* Métabolisme */}
        <div className="space-y-2">
          <div className="h-2 w-20 rounded bg-white/[0.04]" />
          <div className="h-3 w-full rounded bg-white/[0.05]" />
          <div className="h-3 w-3/4 rounded bg-white/[0.05]" />
        </div>
        {/* Button */}
        <div className="h-8 w-full rounded-lg bg-white/[0.04]" />
        {/* TDEE card */}
        <div className="rounded-xl bg-white/[0.03] border-[0.3px] border-white/[0.06] p-4 flex flex-col items-center gap-2">
          <div className="h-2 w-16 rounded bg-white/[0.04]" />
          <div className="h-8 w-20 rounded bg-white/[0.06]" />
          <div className="h-2 w-12 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!clientData) return null;

  const cd = clientData;
  const bfPct = cd.body_fat_pct ?? macroResult?.estimatedBF;
  const lbm = cd.lean_mass_kg ?? macroResult?.leanMass;
  const bmr = cd.bmr_kcal_measured ?? macroResult?.breakdown.bmr;
  const bmrSource = cd.bmr_kcal_measured ? "● balance" : "◐ estimé";
  const tdee = macroResult?.breakdown.tdee;

  return (
    <>
      <div className="overflow-y-auto scrollbar-hide p-4 space-y-4">
        {/* Client header */}
        <div>
          <p className="text-[13px] font-semibold text-white leading-tight">
            {cd.name}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {cd.gender === "female" ? "Femme" : "Homme"} · {cd.age} ans
          </p>
        </div>

        {/* Bilan sélectionné */}
        {submissions && submissions.length > 0 && (
          <div className="relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                Bilan sélectionné
              </span>
              <button
                onClick={() => setShowBilanDropdown(!showBilanDropdown)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[10px] text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
              >
                {submissions[0]?.date}
              </button>
            </div>

            {showBilanDropdown && (
              <div className="absolute top-full right-0 mt-1.5 bg-[#181818] border-[0.3px] border-white/[0.06] rounded-lg shadow-lg z-10 min-w-[180px]">
                {submissions.map((sub, idx) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onSubmissionChange?.(sub.id);
                      setShowBilanDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] transition-colors ${
                      idx > 0 ? "border-t-[0.3px] border-white/[0.06]" : ""
                    } ${
                      selectedSubmissionId === sub.id
                        ? "bg-[#1f8a65]/10 text-[#1f8a65]"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{sub.date}</span>
                      {selectedSubmissionId === sub.id && <span>✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Missing data alerts */}
        <MissingDataAlerts
          clientData={clientData}
          macroResult={macroResult}
          dataSource={dataSource}
          onDataClick={setSelectedMissingData}
        />

        {/* Composition */}
        <div>
          <SectionLabel>Composition</SectionLabel>
          <DataRow label="Poids" value={cd.weight_kg} unit="kg" />
          <DataRow label="Taille" value={cd.height_cm} unit="cm" />
          {bfPct != null && (
            <div className="py-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/50">Masse grasse</span>
                <span className="text-[12px] font-medium text-white/85">
                  {bfPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex w-full h-[3px] rounded-full overflow-hidden bg-white/[0.06]">
                <div
                  className="bg-amber-400/60 transition-all duration-500"
                  style={{ width: `${(Math.min(bfPct, 40) / 40) * 100}%` }}
                />
                <div className="bg-[#1f8a65]/60 flex-1" />
              </div>
            </div>
          )}
          <DataRow
            label="LBM"
            value={lbm != null ? lbm.toFixed(1) : null}
            unit="kg"
          />
          {cd.muscle_mass_kg && (
            <DataRow label="Masse musc." value={cd.muscle_mass_kg} unit="kg" />
          )}
        </div>

        {/* Métabolisme */}
        <div>
          <SectionLabel>Métabolisme</SectionLabel>
          {bmr && (
            <DataRow
              label="BMR"
              value={Math.round(bmr)}
              unit="kcal"
              source={bmrSource}
            />
          )}
          {cd.visceral_fat_level != null && (
            <DataRow
              label="Graisse viscérale"
              value={cd.visceral_fat_level}
              warning={cd.visceral_fat_level >= 10}
            />
          )}
        </div>

        {/* Parameters button */}
        <button
          onClick={() => setPanelOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[11px] font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all"
        >
          <Settings size={12} />
          Ajuster les paramètres
        </button>

        {/* Large TDEE display */}
        {tdee && (
          <div className="rounded-xl bg-[#1f8a65]/10 border-[0.3px] border-[#1f8a65]/25 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1f8a65]/60 mb-1">
              TDEE estimé
            </p>
            <p className="text-[28px] font-black text-[#1f8a65] leading-none">
              {Math.round(tdee)}
            </p>
            <p className="text-[10px] text-[#1f8a65]/50 mt-1">kcal/jour</p>
          </div>
        )}
      </div>

      {/* Slide-in panel */}
      <ParameterAdjustmentPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        clientData={clientData}
        onUpdateTraining={(field, value) => {
          const numValue = value === "" ? null : Number(value);
          const fieldMap: Record<string, keyof TrainingConfig> = {
            weekly_frequency: "weeklyFrequency",
            session_duration_min: "sessionDurationMin",
            training_calories_weekly: "trainingCaloriesWeekly",
            cardio_frequency: "cardioFrequency",
            cardio_duration_min: "cardioDurationMin",
            daily_steps: "dailySteps",
          };
          const key = fieldMap[field];
          if (key)
            onTrainingChange({ [key]: numValue } as Partial<TrainingConfig>);
        }}
        onUpdateLifestyle={(field, value) => {
          const numValue = value === "" ? null : Number(value);
          const fieldMap: Record<string, keyof LifestyleConfig> = {
            sleep_duration_h: "sleepDurationH",
            sleep_quality: "sleepQuality",
            stress_level: "stressLevel",
            work_hours_per_week: "workHoursPerWeek",
            caffeine_daily_mg: "caffeineDailyMg",
            alcohol_weekly: "alcoholWeekly",
          };
          const key = fieldMap[field];
          if (key)
            onLifestyleChange({ [key]: numValue } as Partial<LifestyleConfig>);
        }}
        onUpdateBiometrics={(field, value) => {
          if (field === "bmr_source") {
            onBiometricsChange({ bmr_source: value as BMRSource });
          } else {
            const numValue = value === "" ? null : Number(value);
            onBiometricsChange({
              [field]: numValue,
            } as Partial<BiometricsConfig>);
          }
        }}
        trainingConfig={trainingConfig}
        lifestyleConfig={lifestyleConfig}
        biometricsConfig={biometricsConfig}
      />

      {/* Missing data panel (inline) */}
      {selectedMissingData && clientData && (
        <MissingDataPanel
          missingKey={selectedMissingData}
          clientData={clientData}
          biometricsConfig={biometricsConfig}
          onSave={handleMissingDataSave}
          onClose={() => setSelectedMissingData(null)}
          saving={completing}
        />
      )}
    </>
  );
}
