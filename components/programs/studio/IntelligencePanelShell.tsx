'use client'

import { useState } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { Minus, Maximize2, Move, PanelRight, Zap } from 'lucide-react'
import ProgramIntelligencePanel from '@/components/programs/ProgramIntelligencePanel'
import StudioPerformancePanel from '@/components/programs/studio/StudioPerformancePanel'
import type { IntelligenceResult, SRAHeatmapWeek, TemplateMeta } from '@/lib/programs/intelligence'

type PanelMode = 'docked' | 'floating' | 'minimized'
type PanelTab = 'smart-fit' | 'performance'

interface Props {
  result: IntelligenceResult
  meta: TemplateMeta
  clientId?: string
  programId?: string
  onAlertClick: (si: number, ei: number) => void
  morphoConnected?: boolean
  morphoDate?: string
  sraHeatmap?: SRAHeatmapWeek[]
  labOverrides?: Record<string, number>
  presentPatterns?: string[]
  onOverrideChange?: (pattern: string, value: number) => void
  onOverrideReset?: () => void
}

export default function IntelligencePanelShell({
  result, meta, clientId, programId, onAlertClick,
  morphoConnected, morphoDate, sraHeatmap, labOverrides, presentPatterns,
  onOverrideChange, onOverrideReset,
}: Props) {
  const [mode, setMode] = useState<PanelMode>('docked')
  const [activeTab, setActiveTab] = useState<PanelTab>('smart-fit')
  const dragControls = useDragControls()

  const tabs = (
    <div className="flex items-center gap-1 rounded-lg border-[0.3px] border-white/[0.06] bg-white/[0.03] p-1">
      <button
        onClick={() => setActiveTab('smart-fit')}
        className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
          activeTab === 'smart-fit'
            ? 'bg-white/[0.08] text-white'
            : 'text-white/45 hover:text-white/70'
        }`}
      >
        Smart Fit
      </button>
      <button
        onClick={() => setActiveTab('performance')}
        className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
          activeTab === 'performance'
            ? 'bg-white/[0.08] text-white'
            : 'text-white/45 hover:text-white/70'
        }`}
      >
        Performance
      </button>
    </div>
  )

  const panelContent =
    activeTab === 'smart-fit' ? (
      <ProgramIntelligencePanel
        result={result}
        meta={meta}
        onAlertClick={onAlertClick}
        morphoConnected={morphoConnected}
        morphoDate={morphoDate}
        sraHeatmap={sraHeatmap}
        labOverrides={labOverrides}
        presentPatterns={presentPatterns}
        onOverrideChange={onOverrideChange}
        onOverrideReset={onOverrideReset}
      />
    ) : clientId && programId ? (
      <StudioPerformancePanel clientId={clientId} programId={programId} />
    ) : (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[12px] text-white/45">
          Performance disponible uniquement dans le contexte client programme.
        </p>
      </div>
    )

  // Minimized: compact score bar
  if (mode === 'minimized') {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.08] px-4 py-2.5">
        <Zap size={13} className="text-[#1f8a65]" />
        <span
          className="text-[15px] font-bold font-mono"
          style={{
            color: result.globalScore >= 75 ? '#1f8a65' : result.globalScore >= 50 ? '#f59e0b' : '#ef4444',
          }}
        >
          {Math.round(result.globalScore)}
        </span>
        <span className="text-[10px] text-white/40">/100</span>
        <div className="w-px h-4 bg-white/[0.08] mx-1" />
        <button
          onClick={() => setMode('docked')}
          title="Ancrer le panneau"
          className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
        >
          <PanelRight size={13} />
        </button>
        <button
          onClick={() => setMode('floating')}
          title="Fenêtre flottante"
          className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    )
  }

  // Floating: draggable window
  if (mode === 'floating') {
    return (
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-40 w-[360px] max-h-[80vh] rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.08] overflow-hidden flex flex-col"
        style={{ right: 24, top: 80 }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={e => dragControls.start(e)}
          className="flex items-center justify-between px-4 py-2.5 border-b-[0.3px] border-white/[0.06] cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Move size={12} className="text-white/25" />
              <span className="text-[11px] font-semibold text-white/60">STUDIO</span>
            </div>
            {tabs}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('minimized')}
              className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => setMode('docked')}
              className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
            >
              <PanelRight size={12} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {panelContent}
        </div>
      </motion.div>
    )
  }

  // Docked: standard panel (rendered inside PanelGroup by parent)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-[0.3px] border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-[#1f8a65]" />
            <span className="text-[11px] font-semibold text-white/70">STUDIO</span>
          </div>
          {tabs}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('minimized')}
            title="Minimiser"
            className="p-1 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={() => setMode('floating')}
            title="Détacher"
            className="p-1 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {panelContent}
      </div>
    </div>
  )
}
