'use client'

import { useState } from 'react'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import MacroWeekGrid from '@/components/client/smart/MacroWeekGrid'
import ProtocolRationale from '@/components/client/smart/ProtocolRationale'
import NutritionMealsList from '@/components/client/smart/NutritionMealsList'
import NutritionStreakCard from '@/components/client/smart/NutritionStreakCard'
import TdeeChart from '@/components/client/smart/TdeeChart'
import VoiceEntryFab from '@/components/client/smart/VoiceEntryFab'
import { ct, type ClientLang, type ClientDictKey } from '@/lib/i18n/clientTranslations'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'
import CycleSyncBanner from '@/components/client/nutrition/CycleSyncBanner'
import type { CyclePhase, CycleSyncAdjustment } from '@/lib/nutrition/engine/cycleSync'
import type { CycleState } from '@/lib/cycle/cycleEngine'
import dynamic from 'next/dynamic'

const CyclePhasePill = dynamic(() => import('@/components/client/cycle/CyclePhasePill'), { ssr: false })

type DayPoint = {
  date: string
  consumed: number
  protein_g: number
  carbs_g: number
  fat_g: number
  target: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

type Tab = 'aujourd_hui' | 'tendances' | 'protocole'

interface Props {
  date: string
  target: NutritionMacros
  consumed: NutritionMacros
  meals: NutritionMeal[]
  alerts: GenericAlert[]
  trend: DayPoint[]
  loggedDates: Set<string>
  tdeeAdaptive: number | null
  tdeeDataSource: string | null
  bodyWeightKg: number | null
  protocolDay: { name?: string; [key: string]: unknown } | null
  lang: ClientLang
  dayTypeBadge: React.ReactNode
  cycleSyncPhase?: CyclePhase | null
  cycleSyncAdjustment?: CycleSyncAdjustment | null
  cycleDay?: number | null
  cycleState?: CycleState | null
}

const TABS: { id: Tab; labelKey: ClientDictKey }[] = [
  { id: 'aujourd_hui', labelKey: 'nutrition.tab.aujourd_hui' },
  { id: 'tendances',   labelKey: 'nutrition.tab.tendances'   },
  { id: 'protocole',   labelKey: 'nutrition.tab.protocole'   },
]

export default function NutritionClientPage({
  date, target, consumed, meals, alerts, trend,
  loggedDates, tdeeAdaptive, tdeeDataSource, bodyWeightKg,
  protocolDay, lang, dayTypeBadge,
  cycleSyncPhase, cycleSyncAdjustment, cycleDay,
  cycleState,
}: Props) {
  const [tab, setTab] = useState<Tab>('aujourd_hui')

  const topBarRight = (
    <div className="flex flex-col items-end gap-0.5">
      {dayTypeBadge}
      {cycleState?.currentPhase && cycleState.currentCycleDay && (
        <CyclePhasePill
          phase={cycleState.currentPhase}
          cycleDay={cycleState.currentCycleDay}
          confidence={cycleState.confidence}
          size="sm"
        />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] font-sans pb-32">
      <ClientTopBar section={ct(lang, 'nutrition.section')} title={date} right={topBarRight} />

      <main className="max-w-[480px] mx-auto px-4 pt-[88px] flex flex-col gap-3">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          {TABS.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-[#f2f2f2] text-[#080808] shadow-sm font-barlow-condensed font-bold uppercase tracking-wide'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {ct(lang, labelKey)}
            </button>
          ))}
        </div>

        {/* ══ AUJOURD'HUI ══ */}
        {tab === 'aujourd_hui' && (
          <>
            <SmartAlertsFeed alerts={alerts} />
            {cycleSyncPhase && cycleSyncAdjustment && (
              <CycleSyncBanner
                phase={cycleSyncPhase}
                adjustment={cycleSyncAdjustment}
                cycleDay={cycleDay ?? undefined}
              />
            )}
            <SmartNutritionHero date={date} consumed={consumed} target={target} />
            <RemainingBreakdown consumed={consumed} target={target} />
            <NutritionMealsList initialMeals={meals} date={date} target={target} />
            <VoiceEntryFab lang={lang} />
          </>
        )}

        {/* ══ TENDANCES ══ */}
        {tab === 'tendances' && (
          <>
            <MacroWeekGrid trend={trend} />
            <TdeeChart />
            <NutritionStreakCard loggedDates={loggedDates} today={date} />
          </>
        )}

        {/* ══ PROTOCOLE ══ */}
        {tab === 'protocole' && (
          <ProtocolRationale
            tdee={tdeeAdaptive}
            tdeeSource={tdeeDataSource}
            target={target}
            bodyWeightKg={bodyWeightKg}
            dayName={protocolDay?.name ?? null}
          />
        )}

      </main>
    </div>
  )
}
