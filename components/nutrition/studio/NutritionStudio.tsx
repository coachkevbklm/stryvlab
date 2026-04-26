'use client'

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

  useClientTopBar('Nutrition Studio')

  const handleSave = async () => {
    await studio.save()
  }

  const handleShare = async () => {
    await studio.share()
    router.push(`/coach/clients/${clientId}/protocoles/nutrition`)
  }

  const clientName = studio.clientData?.name ?? 'Client'
  const leanMass = studio.clientData?.lean_mass_kg ?? studio.macroResult?.leanMass ?? null

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
            clientName={clientName}
            saving={studio.saving}
            sharing={studio.sharing}
            onSave={handleSave}
            onShare={handleShare}
            onPreview={() => studio.setShowPreview(true)}
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
