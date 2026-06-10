"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { detectCurrentPhase } from "@/lib/nutrition/engine/cycleSync";
import { Eye, Save, Send } from "lucide-react";
import { useNutritionStudio } from "./useNutritionStudio";
import ClientIntelligencePanel from "./ClientIntelligencePanel";
import CalculationEngine from "./CalculationEngine";
import NutritionStudioRightPanel, {
  type NutritionStudioRightTab,
} from "./NutritionStudioRightPanel";
import ClientPreviewModal from "./ClientPreviewModal";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import type { NutritionProtocol } from "@/lib/nutrition/types";
import { useNutritionReality } from "./useNutritionReality";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  existingProtocol?: NutritionProtocol;
}

export default function NutritionStudio({ clientId, existingProtocol }: Props) {
  const router = useRouter();
  const studio = useNutritionStudio(clientId, existingProtocol);
  const [rightTab, setRightTab] =
    useState<NutritionStudioRightTab>("smartnutrition");
  const [analysisWindow, setAnalysisWindow] = useState<3 | 7>(7);
  const nutritionReality = useNutritionReality(clientId, analysisWindow);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ─── Resizable columns ────────────────────────────────────────────────────
  const [col1Width, setCol1Width] = useState(22); // % of total
  const [col3Width, setCol3Width] = useState(28); // % of total
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | "right" | null>(null);
  const startXRef = useRef(0);
  const startCol1Ref = useRef(22);
  const startCol3Ref = useRef(28);

  const onMouseDownLeft = useCallback((e: React.MouseEvent) => {
    draggingRef.current = "left";
    startXRef.current = e.clientX;
    startCol1Ref.current = col1Width;
    e.preventDefault();
  }, [col1Width]);

  const onMouseDownRight = useCallback((e: React.MouseEvent) => {
    draggingRef.current = "right";
    startXRef.current = e.clientX;
    startCol3Ref.current = col3Width;
    e.preventDefault();
  }, [col3Width]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const totalW = containerRef.current.offsetWidth;
      const dx = e.clientX - startXRef.current;
      const dPct = (dx / totalW) * 100;
      if (draggingRef.current === "left") {
        setCol1Width(Math.min(Math.max(startCol1Ref.current + dPct, 16), 32));
      } else {
        setCol3Width(Math.min(Math.max(startCol3Ref.current - dPct, 20), 38));
      }
    }
    function onMouseUp() { draggingRef.current = null; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const isFemale = studio.clientData?.gender === "female";
  const leanMass =
    studio.clientData?.lean_mass_kg ?? studio.macroResult?.leanMass ?? null;

  // Compute current cycle day from menstrual_cycle field (ISO date or numeric)
  const currentCycleDay = useMemo(() => {
    if (!isFemale) return null
    const raw = studio.clientData?.menstrual_cycle ?? null
    if (!raw) return null
    const num = Number(raw)
    if (!isNaN(num) && num >= 1) return num
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const lastPeriod = new Date(raw)
      const diffMs = Date.now() - lastPeriod.getTime()
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
      return diffDays >= 0 ? (diffDays % 28) + 1 : null
    }
    return null
  }, [isFemale, studio.clientData?.menstrual_cycle])

  // Build NutritionMacros shape for CycleSyncPhaseGrid base display
  const baseMacrosForCycleSync = useMemo(() => {
    if (!studio.macroResult) return null
    return {
      kcal:      studio.macroResult.calories,
      protein_g: studio.macroResult.macros.p,
      carbs_g:   studio.macroResult.macros.c,
      fat_g:     studio.macroResult.macros.f,
      water_ml:  0,
    }
  }, [studio.macroResult])
  const clientIntelligenceMacroResult = studio.macroResult
    ? {
        leanMass: studio.macroResult.leanMass,
        estimatedBF: studio.macroResult.estimatedBF,
        breakdown: {
          bmr: studio.macroResult.breakdown.bmr,
          tdee: studio.macroResult.tdee,
        },
      }
    : null;

  // Refs so TopBar closures always call the latest save/share even after memoization
  const saveRef = useRef(studio.save);
  const shareRef = useRef(studio.share);
  const showPreviewRef = useRef(studio.setShowPreview);
  saveRef.current = studio.save;
  shareRef.current = studio.share;
  showPreviewRef.current = studio.setShowPreview;

  const rightContent = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => showPreviewRef.current(true)}
          className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all flex items-center gap-1.5"
        >
          <Eye size={14} />
          Aperçu
        </button>
        <button
          onClick={() => saveRef.current()}
          className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all flex items-center gap-1.5"
        >
          <Save size={14} />
          Brouillon
        </button>
        <button
          onClick={async () => {
            await shareRef.current();
            router.push(`/coach/clients/${clientId}/protocoles/nutrition`);
          }}
          className="h-8 px-4 rounded-lg bg-[#1f8a65] text-[12px] font-bold text-white hover:bg-[#217356] active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <Send size={14} />
          Partager
        </button>
      </div>
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ),
    [],
  );

  useClientTopBar("Nutrition Studio", rightContent);

  const col2Width = 100 - col1Width - col3Width;

  return (
    <main className="h-[calc(100vh-88px)] bg-[#121212] flex flex-col overflow-hidden">
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Col 1 — Client Intelligence */}
        <div style={{ flexGrow: col1Width, flexShrink: 1, flexBasis: 0, minWidth: 200, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <ClientIntelligencePanel
            clientId={clientId}
            clientData={studio.clientData}
            onClientDataChange={studio.setClientData}
            loading={studio.clientLoading}
            trainingConfig={studio.trainingConfig}
            lifestyleConfig={studio.lifestyleConfig}
            biometricsConfig={studio.biometricsConfig}
            onTrainingChange={(patch) =>
              studio.setTrainingConfig((prev) => ({ ...prev, ...patch }))
            }
            onLifestyleChange={(patch) =>
              studio.setLifestyleConfig((prev) => ({ ...prev, ...patch }))
            }
            onBiometricsChange={(patch) =>
              studio.setBiometricsConfig((prev) => ({ ...prev, ...patch }))
            }
            macroResult={clientIntelligenceMacroResult}
            submissions={studio.allSubmissions}
            selectedSubmissionId={studio.resolvedSubmissionId ?? studio.selectedSubmissionId}
            onSubmissionChange={studio.setSelectedSubmissionId}
            dataSource={studio.dataSource}
          />
        </div>

        {/* Resize handle left */}
        <div
          onMouseDown={onMouseDownLeft}
          className="w-1 flex-none bg-white/[0.06] hover:bg-[#1f8a65]/50 cursor-col-resize transition-colors active:bg-[#1f8a65]"
        />

        {/* Col 2 — Calculation Engine */}
        <div style={{ flexGrow: col2Width, flexShrink: 1, flexBasis: 0, minWidth: 0, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CalculationEngine
            goal={studio.goal}
            onGoalChange={studio.setGoalWithPreset}
            calorieAdjustPct={studio.calorieAdjustPct}
            onCalorieAdjustChange={studio.setCalorieAdjustPct}
            proteinOverride={studio.proteinOverride}
            onProteinOverrideChange={studio.setProteinOverride}
            macroOverrides={studio.macroOverrides}
            onMacroOverridesChange={studio.setMacroOverrides}
            macroResult={studio.macroResult}
            goalCalories={studio.goalCalories}
            hydrationClimate={studio.hydrationClimate}
            onHydrationClimateChange={studio.setHydrationClimate}
            hydrationPhase={studio.hydrationPhase}
            onHydrationPhaseChange={studio.setHydrationPhase}
            hydrationLiters={studio.hydrationLiters}
            leanMass={leanMass}
            bodyWeight={studio.clientData?.weight_kg ?? null}
            tdeeAdaptive={studio.tdeeAdaptive}
            tdeeAdaptiveAt={studio.tdeeAdaptiveAt}
            tdeeDataSource={studio.tdeeDataSource}
            tdeeHistory={studio.tdeeHistory}
            applyAdaptiveTdee={studio.applyAdaptiveTdee}
            applyingAdaptive={studio.applyingAdaptive}
            isFemale={isFemale}
            currentCycleDay={currentCycleDay}
            baseMacrosForCycleSync={baseMacrosForCycleSync}
            cycleState={studio.cycleState}
            cycleSyncEnabled={studio.cycleSyncEnabled}
            onCycleSyncEnabledChange={studio.setCycleSyncEnabled}
          />
        </div>

        {/* Resize handle right */}
        <div
          onMouseDown={onMouseDownRight}
          className="w-1 flex-none bg-white/[0.06] hover:bg-[#1f8a65]/50 cursor-col-resize transition-colors active:bg-[#1f8a65]"
        />

        {/* Col 3 — Smart Nutrition / Analyse */}
        <div style={{ flexGrow: col3Width, flexShrink: 1, flexBasis: 0, minWidth: 240, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <NutritionStudioRightPanel
            activeTab={rightTab}
            onTabChange={setRightTab}
            analysis={{
              loading: nutritionReality.loading,
              error: nutritionReality.error,
              activeWindow: analysisWindow,
              onWindowChange: setAnalysisWindow,
              onOpenHub: () =>
                router.push(`/coach/clients/${clientId}/data/nutrition`),
              view: nutritionReality.view,
            }}
            protocol={{
              loading: studio.clientLoading,
              protocolName: studio.protocolName,
              onProtocolNameChange: studio.setProtocolName,
              days: studio.days,
              activeDayIndex: studio.activeDayIndex,
              onActiveDayChange: studio.setActiveDayIndex,
              onUpdateDay: studio.updateDay,
              onAddDay: studio.addDay,
              onRemoveDay: studio.removeDay,
              onInjectMacros: studio.injectMacrosToDay,
              onInjectHydration: studio.injectHydrationToDay,
              onInjectAll: studio.injectAllToDay,
              hasMacroResult: studio.macroResult !== null,
              hasHydration: studio.hydrationLiters !== null,
              coherenceScore: studio.coherenceScore,
              trainingWeekSchedule: studio.trainingWeekSchedule,
              selectedScheduleDow: studio.selectedScheduleDow,
              onSelectScheduleDow: studio.setSelectedScheduleDow,
              scheduleSlots: studio.scheduleSlots,
              onScheduleSlotsChange: studio.setScheduleSlots,
            }}
          />
        </div>
      </div>

      {/* Client preview modal */}
      {studio.showPreview && (
        <ClientPreviewModal
          clientName={studio.clientData?.name ?? "Client"}
          protocolName={studio.protocolName}
          days={studio.days}
          onClose={() => studio.setShowPreview(false)}
        />
      )}
    </main>
  );
}
