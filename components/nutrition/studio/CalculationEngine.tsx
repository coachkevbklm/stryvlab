"use client";

import { useState } from "react";
import { Info, Droplets } from "lucide-react";
import TdeeWaterfall from "./TdeeWaterfall";
import CalorieAdjustmentDisplay from "./CalorieAdjustmentDisplay";
import MacroPercentageDisplay from "./MacroPercentageDisplay";
import InfoModal from "./InfoModal";
import { INJECTION_INFO_MODALS } from "@/lib/nutrition/infoModalDefinitions";
import type { MacroResult, MacroGoal } from "@/lib/formulas/macros";
import type {
  CarbCyclingResult,
  CarbCycleProtocol,
  CarbCycleGoal,
  CarbCycleIntensity,
  CarbCyclePhase,
  CarbCycleInsulin,
} from "@/lib/formulas/carbCycling";
import type { HydrationClimate } from "@/lib/formulas/hydration";
import type { CarbCyclingConfig } from "./useNutritionStudio";

interface Props {
  goal: MacroGoal;
  onGoalChange: (g: MacroGoal) => void;
  calorieAdjustPct: number;
  onCalorieAdjustChange: (v: number) => void;
  proteinOverride: number | null;
  onProteinOverrideChange: (v: number | null) => void;
  macroResult: MacroResult | null;
  goalCalories: number | null;
  carbCycling: CarbCyclingConfig;
  onCarbCyclingChange: (patch: Partial<CarbCyclingConfig>) => void;
  ccResult: CarbCyclingResult | null;
  hydrationClimate: HydrationClimate;
  onHydrationClimateChange: (c: HydrationClimate) => void;
  hydrationPhase: number;
  onHydrationPhaseChange: (v: number) => void;
  hydrationLiters: number | null;
  leanMass: number | null;
}

const GOAL_OPTIONS: { value: MacroGoal; label: string }[] = [
  { value: "deficit", label: "Déficit — Perte de gras" },
  { value: "maintenance", label: "Maintenance" },
  { value: "surplus", label: "Surplus — Prise de muscle" },
];

const CC_PROTOCOLS: { value: CarbCycleProtocol; label: string }[] = [
  { value: "2/1", label: "2 hauts / 1 bas" },
  { value: "3/1", label: "3 hauts / 1 bas" },
  { value: "4/1", label: "4 hauts / 1 bas" },
  { value: "5/2", label: "5 hauts / 2 bas" },
];

const CC_GOALS: { value: CarbCycleGoal; label: string }[] = [
  { value: "moderate", label: "Perte modérée" },
  { value: "recomp", label: "Recomposition" },
  { value: "bulk", label: "Prise de masse" },
  { value: "performance", label: "Performance" },
];

const CLIMATE_OPTIONS: { value: HydrationClimate; label: string }[] = [
  { value: "cold", label: "❄️ Froid" },
  { value: "temperate", label: "🌤 Tempéré" },
  { value: "hot", label: "☀️ Chaud" },
  { value: "veryHot", label: "🔥 Très chaud" },
];

// ─── Hydratation phase helpers ────────────────────────────────────────────────

const PHASE_MARKERS = [
  { value: 40, label: "Pré-compet." },
  { value: 80, label: "Sèche" },
  { value: 100, label: "Base" },
  { value: 130, label: "Sèche int." },
  { value: 160, label: "Water load" },
];

function getPhaseLabel(v: number): string {
  if (v < 60) return "Pré-compétition";
  if (v < 90) return "Phase de sèche";
  if (v < 115) return "Hors-saison";
  if (v < 145) return "Sèche intensive";
  return "Water loading";
}

function getPhaseDescription(v: number): string {
  if (v < 60)
    return "Réduction avant compétition — maintien minimal pour éviter la flatness musculaire.";
  if (v < 90)
    return "Sèche progressive — hydratation légèrement réduite pour minimiser la rétention extracellulaire.";
  if (v < 115)
    return "Baseline EFSA — hydratation optimale pour la performance et la récupération.";
  if (v < 145)
    return "Sèche intensive — volume accru pour soutenir le métabolisme sous déficit calorique fort.";
  return "Water loading (RP Strength) — signal osmotique pour purger la rétention sous-cutanée avant la peak week.";
}

function getPhaseColor(v: number): string {
  if (v < 60) return "#f59e0b"; // amber — attention pré-compet
  if (v < 90) return "#3b82f6"; // bleu — sèche
  if (v < 115) return "#1f8a65"; // vert — baseline optimal
  if (v < 145) return "#3b82f6"; // bleu — sèche intensive
  return "#8b5cf6"; // violet — water loading
}

const PRIORITY_ICON = {
  critical: <AlertTriangle size={11} className="text-red-400 shrink-0" />,
  high: <AlertTriangle size={11} className="text-amber-400 shrink-0" />,
  medium: <Info size={11} className="text-blue-400 shrink-0" />,
  low: <CheckCircle2 size={11} className="text-white/30 shrink-0" />,
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function SelectInput<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-1 text-[11px] text-white/80 outline-none focus:border-[#1f8a65]/40 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#181818]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function CalculationEngine({
  goal,
  onGoalChange,
  calorieAdjustPct,
  onCalorieAdjustChange,
  proteinOverride,
  onProteinOverrideChange,
  macroResult,
  goalCalories,
  carbCycling,
  onCarbCyclingChange,
  ccResult,
  hydrationClimate,
  onHydrationClimateChange,
  hydrationPhase,
  onHydrationPhaseChange,
  hydrationLiters,
  leanMass,
}: Props) {
  const [openInfoModal, setOpenInfoModal] = useState<string | null>(null);

  const actionableSuggestions = (macroResult?.smartProtocol ?? [])
    .filter((s) => ["critical", "high"].includes(s.priority))
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      {/* ── TITRE COLONNE — aligné avec Col 1 et Col 3 ───────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
        <p className="text-[13px] font-semibold text-white">
          Calcul nutritionnel
        </p>
      </div>

      {/* ── CONTENU SCROLLABLE ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-5 p-4 pb-8">
        {/* ── DÉPENSE ÉNERGÉTIQUE ───────────────────────────────────────── */}
        <div>
          <SectionDivider label="Dépense énergétique" />
          {macroResult ? (
            <TdeeWaterfall result={macroResult} />
          ) : (
            <div className="space-y-3 animate-pulse">
              {/* Stacked bar */}
              <div className="h-[8px] w-full rounded-full bg-white/[0.06]" />
              {/* 4-segment grid */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2 w-10 rounded bg-white/[0.05]" />
                    <div className="h-4 w-12 rounded bg-white/[0.07]" />
                    <div className="h-2 w-8 rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
              {/* TDEE total row */}
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
                <div className="h-4 w-20 rounded bg-white/[0.06]" />
              </div>
            </div>
          )}
        </div>

        {/* ── OBJECTIF ─────────────────────────────────────────────────── */}
        <div>
          <SectionDivider label="Objectif" />
          <div className="flex gap-1.5 flex-wrap">
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onGoalChange(o.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  goal === o.value
                    ? "bg-[#1f8a65]/15 text-[#1f8a65] border-[0.3px] border-[#1f8a65]/30"
                    : "bg-white/[0.04] text-white/50 border-[0.3px] border-white/[0.06] hover:text-white/70"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {macroResult && (
            <div className="mt-3">
              <CalorieAdjustmentDisplay
                value={calorieAdjustPct}
                baseCalories={goalCalories}
                targetCalories={macroResult.calories}
                onChange={onCalorieAdjustChange}
              />
            </div>
          )}
        </div>

        {/* ── MACROS ───────────────────────────────────────────────────── */}
        <div>
          <SectionDivider label="Macronutriments" />
          {macroResult ? (
            <MacroPercentageDisplay
              proteinG={macroResult.macros.p}
              fatG={macroResult.macros.f}
              carbsG={macroResult.macros.c}
              totalCalories={macroResult.calories}
              proteinOverride={proteinOverride}
              onProteinOverrideChange={onProteinOverrideChange}
            />
          ) : (
            <div className="space-y-2.5 animate-pulse">
              {/* 3 macro rows: label + bar + grams + % */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white/[0.08] shrink-0" />
                  <div className="w-16 h-2.5 rounded bg-white/[0.05]" />
                  <div className="flex-1 h-[3px] rounded-full bg-white/[0.06]" />
                  <div className="w-8 h-2.5 rounded bg-white/[0.05]" />
                  <div className="w-10 h-2.5 rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CARB CYCLING ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 py-1 mb-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">
              Carb Cycling
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <button
              onClick={() => setOpenInfoModal("carbCyclingToggle")}
              className="flex h-5 w-5 items-center justify-center rounded text-white/40 hover:text-white/80 transition-colors shrink-0"
            >
              <Info size={13} />
            </button>
          </div>

          {/* ON / OFF toggle — same style as goal buttons */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button
              onClick={() => onCarbCyclingChange({ enabled: false })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                !carbCycling.enabled
                  ? "bg-[#1f8a65]/15 text-[#1f8a65] border-[0.3px] border-[#1f8a65]/30"
                  : "bg-white/[0.04] text-white/50 border-[0.3px] border-white/[0.06] hover:text-white/70"
              }`}
            >
              Désactivé
            </button>
            <button
              onClick={() => onCarbCyclingChange({ enabled: true })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                carbCycling.enabled
                  ? "bg-[#1f8a65]/15 text-[#1f8a65] border-[0.3px] border-[#1f8a65]/30"
                  : "bg-white/[0.04] text-white/50 border-[0.3px] border-white/[0.06] hover:text-white/70"
              }`}
            >
              Activé — Haut / Bas
            </button>
          </div>

          {carbCycling.enabled && (
            <div className="space-y-3">
              {/* Protocol + Goal selects */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-white/35 mb-1">Protocole</p>
                  <SelectInput<CarbCycleProtocol>
                    value={carbCycling.protocol}
                    options={CC_PROTOCOLS}
                    onChange={(v) => onCarbCyclingChange({ protocol: v })}
                    className="w-full"
                  />
                </div>
                <div>
                  <p className="text-[9px] text-white/35 mb-1">Objectif</p>
                  <SelectInput<CarbCycleGoal>
                    value={carbCycling.goal}
                    options={CC_GOALS}
                    onChange={(v) => onCarbCyclingChange({ goal: v })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* High / Low day preview cards */}
              {ccResult && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#1f8a65]/[0.08] border-[0.3px] border-[#1f8a65]/20 p-3">
                    <p className="text-[9px] text-[#1f8a65] font-semibold mb-1.5">
                      🔥 JOUR HAUT
                    </p>
                    <p className="text-[13px] font-bold text-white">
                      {ccResult.high.kcal}{" "}
                      <span className="text-[10px] font-normal text-white/40">
                        kcal
                      </span>
                    </p>
                    <p className="text-[9px] text-white/50 mt-1">
                      P{ccResult.high.p} · L{ccResult.high.f} · G
                      {ccResult.high.c}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-500/[0.08] border-[0.3px] border-blue-500/20 p-3">
                    <p className="text-[9px] text-blue-400 font-semibold mb-1.5">
                      🧊 JOUR BAS
                    </p>
                    <p className="text-[13px] font-bold text-white">
                      {ccResult.low.kcal}{" "}
                      <span className="text-[10px] font-normal text-white/40">
                        kcal
                      </span>
                    </p>
                    <p className="text-[9px] text-white/50 mt-1">
                      P{ccResult.low.p} · L{ccResult.low.f} · G{ccResult.low.c}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── HYDRATATION ──────────────────────────────────────────────── */}
        <div>
          <SectionDivider label="Hydratation" />

          {/* Climat */}
          <div className="flex items-center gap-2 mb-4">
            <SelectInput<HydrationClimate>
              value={hydrationClimate}
              options={CLIMATE_OPTIONS}
              onChange={onHydrationClimateChange}
            />
          </div>

          {/* Phase d'hydratation — slider continu */}
          <div className="space-y-3">
            {/* Label phase + valeur résultante */}
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold"
                style={{ color: getPhaseColor(hydrationPhase) }}
              >
                {getPhaseLabel(hydrationPhase)}
              </span>
              {hydrationLiters && (
                <div className="flex items-center gap-1.5">
                  <Droplets size={12} className="text-blue-400 shrink-0" />
                  <span className="text-[15px] font-bold text-white">
                    {hydrationLiters.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-white/40">L</span>
                  <span className="text-[10px] text-white/30 ml-1">
                    · {Math.round(hydrationLiters * 4)} verres
                  </span>
                </div>
              )}
            </div>

            {/* Description courte de la phase */}
            <p className="text-[10px] text-white/40 leading-relaxed">
              {getPhaseDescription(hydrationPhase)}
            </p>

            {/* Slider continu 0–200 */}
            <div className="relative">
              <style>{`
              .hydration-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--thumb-color);
                cursor: pointer;
                border: 2px solid rgba(255,255,255,0.15);
                box-shadow: 0 0 0 3px rgba(0,0,0,0.3);
                transition: transform 0.1s ease;
              }
              .hydration-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--thumb-color);
                cursor: pointer;
                border: 2px solid rgba(255,255,255,0.15);
                box-shadow: 0 0 0 3px rgba(0,0,0,0.3);
              }
              .hydration-slider:active::-webkit-slider-thumb {
                transform: scale(1.2);
              }
            `}</style>
              <input
                type="range"
                min={40}
                max={200}
                step={1}
                value={hydrationPhase}
                onChange={(e) => onHydrationPhaseChange(Number(e.target.value))}
                className="hydration-slider w-full h-1.5 rounded-full outline-none appearance-none cursor-pointer"
                style={
                  {
                    "--thumb-color": getPhaseColor(hydrationPhase),
                    background: `linear-gradient(to right, ${getPhaseColor(hydrationPhase)} 0%, ${getPhaseColor(hydrationPhase)} ${((hydrationPhase - 40) / 160) * 100}%, rgba(255,255,255,0.06) ${((hydrationPhase - 40) / 160) * 100}%, rgba(255,255,255,0.06) 100%)`,
                  } as React.CSSProperties
                }
              />
              {/* Marqueurs indicatifs non-magnétiques */}
              <div className="relative mt-2 h-4">
                {PHASE_MARKERS.map((m, i) => {
                  const pct = ((m.value - 40) / 160) * 100;
                  const isFirst = i === 0;
                  const isLast = i === PHASE_MARKERS.length - 1;
                  const transform = isFirst
                    ? "translateX(0%)"
                    : isLast
                      ? "translateX(-100%)"
                      : "translateX(-50%)";
                  const align = isFirst
                    ? "items-start"
                    : isLast
                      ? "items-end"
                      : "items-center";
                  return (
                    <div
                      key={m.value}
                      className={`absolute flex flex-col ${align}`}
                      style={{ left: `${pct}%`, transform }}
                    >
                      <div className="w-px h-1.5 bg-white/[0.15]" />
                      <span className="text-[8px] text-white/30 whitespace-nowrap mt-0.5">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indicateur % baseline */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/25">
                Base EFSA × {(hydrationPhase / 100).toFixed(2)}
              </span>
              <span
                className={`font-semibold ${hydrationPhase < 80 ? "text-amber-400" : hydrationPhase > 150 ? "text-blue-400" : "text-white/50"}`}
              >
                {hydrationPhase < 100 ? "" : "+"}
                {hydrationPhase - 100}%
              </span>
            </div>
          </div>
        </div>

        {/* ── SMART ALERTS ─────────────────────────────────────────────── */}
        {actionableSuggestions.length > 0 && (
          <div>
            <SectionDivider label="Smart Alerts" />
            <div className="space-y-2">
              {actionableSuggestions.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl p-3 border-[0.3px] ${
                    s.priority === "critical"
                      ? "bg-red-500/[0.08] border-red-500/20"
                      : "bg-amber-500/[0.08] border-amber-500/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {PRIORITY_ICON[s.priority as keyof typeof PRIORITY_ICON]}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/85 leading-snug">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">
                        {s.rationale}
                      </p>
                      {s.source && (
                        <p className="text-[9px] text-white/25 mt-0.5 italic">
                          {s.source}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info modals */}
        {openInfoModal &&
          INJECTION_INFO_MODALS[
            openInfoModal as keyof typeof INJECTION_INFO_MODALS
          ] && (
            <InfoModal
              isOpen={true}
              title={
                INJECTION_INFO_MODALS[
                  openInfoModal as keyof typeof INJECTION_INFO_MODALS
                ].title
              }
              description={
                INJECTION_INFO_MODALS[
                  openInfoModal as keyof typeof INJECTION_INFO_MODALS
                ].description
              }
              example={
                INJECTION_INFO_MODALS[
                  openInfoModal as keyof typeof INJECTION_INFO_MODALS
                ].example
              }
              whenToUse={
                INJECTION_INFO_MODALS[
                  openInfoModal as keyof typeof INJECTION_INFO_MODALS
                ].whenToUse
              }
              onClose={() => setOpenInfoModal(null)}
            />
          )}
      </div>
      {/* end scrollable */}
    </div>
  );
}
