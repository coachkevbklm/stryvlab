'use client'

import { useMemo } from 'react'
import { Eye, Save, Send, Loader2 } from 'lucide-react'
import { useNutritionStudio } from './useNutritionStudio'
import ClientIntelligencePanel from './ClientIntelligencePanel'
import CalculationEngine from './CalculationEngine'
import ProtocolCanvas from './ProtocolCanvas'
import ClientPreviewModal from './ClientPreviewModal'
import { useClientTopBar } from '@/components/clients/useClientTopBar'
import type { NutritionProtocol } from '@/lib/nutrition/types'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  existingProtocol?: NutritionProtocol
}

export default function NutritionStudio({ clientId, existingProtocol }: Props) {
  const router = useRouter()
  const studio = useNutritionStudio(clientId, existingProtocol)

  const handleSave = async () => {
    await studio.save()
  }

  const handleShare = async () => {
    await studio.share()
    router.push(`/coach/clients/${clientId}/protocoles/nutrition`)
  }

  const clientName = studio.clientData?.name ?? 'Client'
  const leanMass = studio.clientData?.lean_mass_kg ?? studio.macroResult?.leanMass ?? null

  const rightContent = useMemo(() => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => studio.setShowPreview(true)}
        className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all flex items-center gap-1.5"
      >
        <Eye size={14} />
        Aperçu
      </button>
      <button
        onClick={handleSave}
        disabled={studio.saving}
        className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-50 transition-all flex items-center gap-1.5"
      >
        {studio.saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {studio.saving ? 'Sauvegarde' : 'Brouillon'}
      </button>
      <button
        onClick={handleShare}
        disabled={studio.sharing}
        className="h-8 px-4 rounded-lg bg-[#1f8a65] text-[12px] font-bold text-white hover:bg-[#217356] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1.5"
      >
        {studio.sharing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {studio.sharing ? 'Partage' : 'Partager'}
      </button>
    </div>
  ), [studio.saving, studio.sharing, studio.setShowPreview])

  useClientTopBar('Nutrition Studio', rightContent)

  return (
    <main className="h-screen bg-[#121212] flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0">

        {/* Col 1 — Client Intelligence (300px fixed) */}
        <div className="w-[300px] shrink-0 border-r border-white/[0.04] overflow-hidden">
          <ClientIntelligencePanel
            clientData={studio.clientData}
            loading={studio.clientLoading}
            trainingConfig={studio.trainingConfig}
            lifestyleConfig={studio.lifestyleConfig}
            onTrainingChange={patch => studio.setTrainingConfig(prev => ({ ...prev, ...patch }))}
            onLifestyleChange={patch => studio.setLifestyleConfig(prev => ({ ...prev, ...patch }))}
            macroResult={studio.macroResult}
          />
        </div>

        {/* Col 2 — Calculation Engine (flex) */}
        <div className="flex-1 border-r border-white/[0.04] overflow-hidden min-w-0">
          <CalculationEngine
            goal={studio.goal}
            onGoalChange={studio.setGoal}
            calorieAdjustPct={studio.calorieAdjustPct}
            onCalorieAdjustChange={studio.setCalorieAdjustPct}
            proteinOverride={studio.proteinOverride}
            onProteinOverrideChange={studio.setProteinOverride}
            macroResult={studio.macroResult}
            carbCycling={studio.carbCycling}
            onCarbCyclingChange={patch => studio.setCarbCycling(prev => ({ ...prev, ...patch }))}
            ccResult={studio.ccResult}
            hydrationClimate={studio.hydrationClimate}
            onHydrationClimateChange={studio.setHydrationClimate}
            hydrationLiters={studio.hydrationLiters}
            leanMass={leanMass}
          />
        </div>

        {/* Col 3 — Protocol Canvas (480px fixed — expanded from 380px) */}
        <div className="w-[480px] shrink-0 overflow-hidden">
          <ProtocolCanvas
            protocolName={studio.protocolName}
            onProtocolNameChange={studio.setProtocolName}
            days={studio.days}
            activeDayIndex={studio.activeDayIndex}
            onActiveDayChange={studio.setActiveDayIndex}
            onUpdateDay={studio.updateDay}
            onAddDay={studio.addDay}
            onRemoveDay={studio.removeDay}
            onInjectMacros={studio.injectMacrosToDay}
            onInjectCCHigh={studio.injectCCHighToDay}
            onInjectCCLow={studio.injectCCLowToDay}
            onInjectHydration={studio.injectHydrationToDay}
            onInjectAll={studio.injectAllToDay}
            hasMacroResult={studio.macroResult !== null}
            hasCcResult={studio.ccResult !== null}
            ccResult={studio.ccResult}
            hasHydration={studio.hydrationLiters !== null}
            coherenceScore={studio.coherenceScore}
          />
        </div>
      </div>

      {/* Client preview modal */}
      {studio.showPreview && (
        <ClientPreviewModal
          clientName={clientName}
          protocolName={studio.protocolName}
          days={studio.days}
          onClose={() => studio.setShowPreview(false)}
        />
      )}
    </main>
  )
}
