'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Save, Undo2, Redo2, ZoomIn, ZoomOut, Download, Dna } from 'lucide-react'
import type { MorphoPhoto, MorphoAnalysisResult } from '@/lib/morpho/types'
import { MorphoAnalysisPanel } from './MorphoAnalysisPanel'

type Tool = 'select' | 'line' | 'freepath' | 'rect' | 'circle' | 'text' | 'eraser'

interface Props {
  photo: MorphoPhoto
  clientId: string
  onClose: () => void
}

export function MorphoCanvas({ photo, clientId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [color, setColor] = useState('#1f8a65')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MorphoAnalysisResult | null>(null)
  const [stimulusAdjustments, setStimulusAdjustments] = useState<Record<string, number> | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef = useRef<any[]>([])
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    if (!canvasRef.current || !photo.signed_url) return

    let destroyed = false

    import('fabric').then(({ Canvas, FabricImage }) => {
      if (destroyed || !canvasRef.current) return

      const fc = new Canvas(canvasRef.current, {
        backgroundColor: '#0a0a0a',
        width: canvasRef.current.parentElement?.clientWidth ?? 800,
        height: canvasRef.current.parentElement?.clientHeight ?? 600,
      })
      fabricRef.current = fc

      FabricImage.fromURL(photo.signed_url!, { crossOrigin: 'anonymous' }).then((img) => {
        if (destroyed) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fabricImg = img as any
        const scaleX = fc.width / fabricImg.width
        const scaleY = fc.height / fabricImg.height
        const scale = Math.min(scaleX, scaleY)
        fabricImg.set({ scaleX: scale, scaleY: scale, selectable: false, evented: false })
        fc.add(fabricImg)
        fc.renderAll()
        saveHistorySnapshot()
      })

      fc.on('object:added', saveHistorySnapshot)
      fc.on('object:modified', saveHistorySnapshot)
      fc.on('object:removed', saveHistorySnapshot)
    })

    return () => {
      destroyed = true
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.signed_url])

  function saveHistorySnapshot() {
    const fc = fabricRef.current
    if (!fc) return
    const json = fc.toJSON()
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(json)
    historyIndexRef.current = historyRef.current.length - 1
  }

  function undo() {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricRef.current?.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => (fabricRef.current as any)?.renderAll())
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricRef.current?.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => (fabricRef.current as any)?.renderAll())
  }

  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return
    fc.isDrawingMode = activeTool === 'freepath'
    if (fc.freeDrawingBrush) {
      fc.freeDrawingBrush.color = color
      fc.freeDrawingBrush.width = strokeWidth
    }
    fc.selection = activeTool === 'select'
  }, [activeTool, color, strokeWidth])

  const addText = useCallback(() => {
    import('fabric').then(({ IText }) => {
      const text = new IText('Texte', {
        left: 100, top: 100,
        fill: color,
        fontSize: 16,
        fontFamily: 'sans-serif',
      })
      fabricRef.current?.add(text)
      fabricRef.current?.setActiveObject(text)
    })
  }, [color])

  useEffect(() => {
    if (activeTool === 'text') addText()
  }, [activeTool, addText])

  async function handleSave() {
    const fc = fabricRef.current
    if (!fc) return
    setSaving(true)
    setError(null)
    try {
      const canvasData = fc.toJSON()
      const thumbnailBase64 = fc.toDataURL({ format: 'png', multiplier: 0.3 })
      const res = await fetch('/api/morpho/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, canvasData, thumbnailBase64 }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erreur sauvegarde')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/morpho/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: [photo.id], clientId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur analyse')
      } else {
        setAnalysisResult(data.analysis_result)
        setStimulusAdjustments(data.stimulus_adjustments)
        setShowAnalysis(true)
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleExportPNG() {
    const fc = fabricRef.current
    if (!fc) return
    const url = fc.toDataURL({ format: 'png', multiplier: 1 })
    const a = document.createElement('a')
    a.href = url
    a.download = `morpho-${photo.position}-${photo.taken_at}.png`
    a.click()
  }

  const TOOLS: Array<{ id: Tool; label: string }> = [
    { id: 'select', label: 'Sélection' },
    { id: 'line', label: 'Ligne' },
    { id: 'freepath', label: 'Stylo' },
    { id: 'rect', label: 'Rectangle' },
    { id: 'circle', label: 'Cercle' },
    { id: 'text', label: 'Texte' },
    { id: 'eraser', label: 'Gomme' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0a0a0a]">
      {/* Toolbar gauche */}
      <div className="w-14 bg-[#181818] border-r-[0.3px] border-white/[0.06] flex flex-col items-center py-4 gap-1 shrink-0">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
            className={`w-9 h-9 rounded-lg text-[9px] font-bold transition-all ${
              activeTool === t.id
                ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
            }`}
          >
            {t.label.slice(0, 3)}
          </button>
        ))}
        <div className="flex-1" />
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0.5"
          title="Couleur"
        />
        <input
          type="range"
          min={1} max={10}
          value={strokeWidth}
          onChange={e => setStrokeWidth(Number(e.target.value))}
          className="w-9 mt-1"
          title="Épaisseur"
          style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 60 }}
        />
      </div>

      {/* Canvas zone */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 bg-[#181818] border-b-[0.3px] border-white/[0.06] flex items-center px-4 gap-3">
          <button onClick={undo} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Annuler">
            <Undo2 size={14} />
          </button>
          <button onClick={redo} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Rétablir">
            <Redo2 size={14} />
          </button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button
            onClick={() => { const z = fabricRef.current?.getZoom() ?? 1; fabricRef.current?.setZoom(z * 1.2) }}
            className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => { const z = fabricRef.current?.getZoom() ?? 1; fabricRef.current?.setZoom(z / 1.2) }}
            className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <div className="flex-1" />
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[10px] font-bold hover:bg-[#1f8a65]/20 disabled:opacity-50 transition-all"
          >
            <Dna size={11} className={analyzing ? 'animate-pulse' : ''} />
            {analyzing ? 'Analyse…' : 'Analyser IA'}
          </button>
          <button onClick={handleExportPNG} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Exporter PNG">
            <Download size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#1f8a65] text-white text-[10px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-all"
          >
            <Save size={11} />
            {saving ? '…' : 'Sauvegarder'}
          </button>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white/70 ml-2 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Zone canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Panel IA latéral */}
      {showAnalysis && analysisResult && (
        <div className="w-72 bg-[#181818] border-l-[0.3px] border-white/[0.06] overflow-y-auto p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Analyse IA</p>
            <button onClick={() => setShowAnalysis(false)} className="text-white/30 hover:text-white/60">
              <X size={13} />
            </button>
          </div>
          <MorphoAnalysisPanel
            result={analysisResult}
            stimulusAdjustments={stimulusAdjustments}
            clientId={clientId}
          />
        </div>
      )}
    </div>
  )
}
