'use client'

import { useState } from 'react'
import { Plus, X, Eye, Send, Save, Pencil, Check } from 'lucide-react'
import MacroBar from './MacroBar'
import CoherenceScore from './CoherenceScore'
import type { DayDraft } from '@/lib/nutrition/types'
import type { CarbCyclingResult } from '@/lib/formulas/carbCycling'

interface Props {
  protocolName: string
  onProtocolNameChange: (v: string) => void
  days: DayDraft[]
  activeDayIndex: number
  onActiveDayChange: (i: number) => void
  onUpdateDay: (index: number, patch: Partial<DayDraft>) => void
  onAddDay: (name?: string) => void
  onRemoveDay: (index: number) => void
  onInjectMacros: (i: number) => void
  onInjectCCHigh: (i: number) => void
  onInjectCCLow: (i: number) => void
  onInjectHydration: (i: number) => void
  onInjectAll: (i: number) => void
  hasMacroResult: boolean
  hasCcResult: boolean
  ccResult: CarbCyclingResult | null
  hasHydration: boolean
  coherenceScore: { score: number; checks: { label: string; ok: boolean; warning?: string }[] }
  clientName: string
  saving: boolean
  sharing: boolean
  onSave: () => void
  onShare: () => void
  onPreview: () => void
}

function NumberField({ label, value, onChange, unit }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-white/45">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          className="w-16 rounded-md bg-white/[0.04] border-[0.3px] border-white/[0.06] px-2 py-0.5 text-[11px] text-white text-right outline-none placeholder:text-white/20 focus:border-[#1f8a65]/40"
        />
        {unit && <span className="text-[9px] text-white/30 w-5">{unit}</span>}
      </div>
    </div>
  )
}

export default function ProtocolCanvas({
  protocolName, onProtocolNameChange,
  days, activeDayIndex, onActiveDayChange,
  onUpdateDay, onAddDay, onRemoveDay,
  onInjectMacros, onInjectCCHigh, onInjectCCLow, onInjectHydration, onInjectAll,
  hasMacroResult, hasCcResult, hasHydration,
  coherenceScore, clientName,
  saving, sharing, onSave, onShare, onPreview,
}: Props) {
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(protocolName)
  const activeDay = days[activeDayIndex]

  return (
    <div className="h-full flex flex-col">
      {/* Protocol name */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onProtocolNameChange(tempName); setEditingName(false) }
                if (e.key === 'Escape') { setTempName(protocolName); setEditingName(false) }
              }}
              className="flex-1 rounded-lg bg-white/[0.04] border-[0.3px] border-[#1f8a65]/40 px-3 py-1 text-[13px] font-semibold text-white outline-none"
            />
            <button onClick={() => { onProtocolNameChange(tempName); setEditingName(false) }}>
              <Check size={14} className="text-[#1f8a65]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setTempName(protocolName); setEditingName(true) }}
            className="flex items-center gap-2 group"
          >
            <span className="text-[13px] font-semibold text-white">{protocolName}</span>
            <Pencil size={11} className="text-white/25 group-hover:text-[#1f8a65] transition-colors" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 p-4">

        {/* Coherence Score */}
        <CoherenceScore score={coherenceScore.score} checks={coherenceScore.checks} />

        {/* Day cards overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Jours du protocole
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {days.map((day, i) => {
              const cal = Number(day.calories) || 0
              const p = Number(day.protein_g) || 0
              const f = Number(day.fat_g) || 0
              const c = Number(day.carbs_g) || 0
              const isActive = i === activeDayIndex
              return (
                <button
                  key={day.localId}
                  onClick={() => onActiveDayChange(i)}
                  className={`relative rounded-xl p-3 border-[0.3px] text-left transition-all ${
                    isActive
                      ? 'bg-[#1f8a65]/[0.08] border-[#1f8a65]/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={e => { e.stopPropagation(); onRemoveDay(i) }}
                    className="absolute top-1.5 right-1.5 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                  <p className="text-[10px] font-medium text-white/80 leading-tight pr-3">{day.name}</p>
                  {cal > 0 ? (
                    <>
                      <p className="text-[12px] font-bold text-white mt-1">{cal} <span className="text-[9px] font-normal text-white/40">kcal</span></p>
                      <p className="text-[9px] text-white/40 mt-0.5">P{p}·L{f}·G{c}</p>
                      <div className="mt-2">
                        <MacroBar calories={cal} protein_g={p} carbs_g={c} fat_g={f} height={3} />
                      </div>
                      {day.carb_cycle_type && (
                        <span className={`inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
                          day.carb_cycle_type === 'high' ? 'bg-[#1f8a65]/20 text-[#1f8a65]' :
                          day.carb_cycle_type === 'low'  ? 'bg-blue-500/20 text-blue-400' :
                                                           'bg-amber-500/20 text-amber-400'
                        }`}>
                          {day.carb_cycle_type.toUpperCase()} CC
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-[9px] text-white/25 mt-1">Non configuré</p>
                  )}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => onAddDay()}
            className="w-full py-2 rounded-xl bg-white/[0.02] border-[0.3px] border-dashed border-white/[0.08] text-[10px] text-white/35 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-1"
          >
            <Plus size={11} /> Ajouter un jour
          </button>
        </div>

        {/* Active day editor */}
        {activeDay && (
          <div className="rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white">{activeDay.name}</p>
              <button
                onClick={() => {
                  const name = window.prompt('Renommer le jour', activeDay.name)
                  if (name) onUpdateDay(activeDayIndex, { name })
                }}
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <Pencil size={10} />
              </button>
            </div>

            {/* Injection buttons */}
            <div>
              <p className="text-[9px] text-white/30 mb-1.5">Injection rapide</p>
              <div className="flex flex-wrap gap-1.5">
                {hasMacroResult && (
                  <button
                    onClick={() => onInjectMacros(activeDayIndex)}
                    title="Injecter les macros calculées (calories, protéines, lipides, glucides)"
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[10px] text-white/60 hover:text-white/85 hover:bg-white/[0.07] transition-all cursor-help"
                  >
                    ← Base
                  </button>
                )}
                {hasCcResult && (
                  <>
                    <button
                      onClick={() => onInjectCCHigh(activeDayIndex)}
                      title="Injecter les macros d'un jour haut en carbs (pour l'entraînement)"
                      className="px-2.5 py-1 rounded-lg bg-[#1f8a65]/10 border-[0.3px] border-[#1f8a65]/25 text-[10px] text-[#1f8a65] hover:bg-[#1f8a65]/15 transition-all cursor-help"
                    >
                      ← Jour haut
                    </button>
                    <button
                      onClick={() => onInjectCCLow(activeDayIndex)}
                      title="Injecter les macros d'un jour bas en carbs (pour la récupération)"
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 border-[0.3px] border-blue-500/25 text-[10px] text-blue-400 hover:bg-blue-500/15 transition-all cursor-help"
                    >
                      ← Jour bas
                    </button>
                  </>
                )}
                {hasHydration && (
                  <button
                    onClick={() => onInjectHydration(activeDayIndex)}
                    title="Injecter l'hydratation recommandée"
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[10px] text-blue-400/70 hover:text-blue-400 transition-all cursor-help"
                  >
                    ← Hydratation
                  </button>
                )}
                {(hasMacroResult || hasHydration) && (
                  <button
                    onClick={() => onInjectAll(activeDayIndex)}
                    title="Injecter toutes les données calculées (macros + hydratation)"
                    className="px-2.5 py-1 rounded-lg bg-[#1f8a65]/15 border-[0.3px] border-[#1f8a65]/30 text-[10px] text-[#1f8a65] font-semibold hover:bg-[#1f8a65]/20 transition-all cursor-help"
                  >
                    ← Tous les calculs
                  </button>
                )}
              </div>
            </div>

            {/* Manual fine-tune */}
            <div>
              <p className="text-[9px] text-white/30 mb-1">Ajustement manuel</p>
              <div className="space-y-0.5">
                <NumberField label="Calories" value={activeDay.calories} unit="kcal"
                  onChange={v => onUpdateDay(activeDayIndex, { calories: v })} />
                <NumberField label="Protéines" value={activeDay.protein_g} unit="g"
                  onChange={v => onUpdateDay(activeDayIndex, { protein_g: v })} />
                <NumberField label="Lipides" value={activeDay.fat_g} unit="g"
                  onChange={v => onUpdateDay(activeDayIndex, { fat_g: v })} />
                <NumberField label="Glucides" value={activeDay.carbs_g} unit="g"
                  onChange={v => onUpdateDay(activeDayIndex, { carbs_g: v })} />
                <NumberField label="Hydratation" value={activeDay.hydration_ml} unit="ml"
                  onChange={v => onUpdateDay(activeDayIndex, { hydration_ml: v })} />
              </div>
            </div>

            {/* Live macro bar for active day */}
            {activeDay.calories && (
              <MacroBar
                calories={Number(activeDay.calories)}
                protein_g={Number(activeDay.protein_g) || 0}
                carbs_g={Number(activeDay.carbs_g) || 0}
                fat_g={Number(activeDay.fat_g) || 0}
                height={5}
                showLabels
              />
            )}

            {/* Recommendations */}
            <div>
              <p className="text-[9px] text-white/30 mb-1">Notes / recommandations</p>
              <textarea
                value={activeDay.recommendations}
                onChange={e => onUpdateDay(activeDayIndex, { recommendations: e.target.value })}
                placeholder="Conseils pour ce jour..."
                rows={2}
                className="w-full rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] px-3 py-2 text-[11px] text-white/70 placeholder:text-white/20 outline-none resize-none focus:border-[#1f8a65]/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
        <button
          onClick={onPreview}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[11px] text-white/50 hover:text-white/75 hover:bg-white/[0.06] transition-all"
        >
          <Eye size={12} />
          Aperçu client
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[11px] font-medium text-white/60 hover:text-white/80 disabled:opacity-40 transition-all"
          >
            <Save size={12} />
            {saving ? 'Sauvegarde...' : 'Brouillon'}
          </button>
          <button
            onClick={onShare}
            disabled={sharing}
            className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1f8a65] text-[11px] font-bold text-white hover:bg-[#217356] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            <Send size={12} />
            {sharing ? 'Partage...' : `Partager ▶ ${clientName.split(' ')[0]}`}
          </button>
        </div>
      </div>
    </div>
  )
}
