'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, Save, Undo2, Redo2, ZoomIn, ZoomOut, Download, Dna,
  MousePointer2, Minus, Pencil, Square, Circle, Type, Eraser,
  Palette, SlidersHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MorphoPhoto, MorphoAnalysisResult } from '@/lib/morpho/types'
import { MorphoAnalysisPanel } from './MorphoAnalysisPanel'

type Tool = 'select' | 'line' | 'freepath' | 'rect' | 'circle' | 'text' | 'eraser'

interface Props {
  photo: MorphoPhoto
  clientId: string
  onClose: () => void
}

const TOOL_CURSOR: Record<Tool, string> = {
  select: 'default',
  line: 'crosshair',
  freepath: 'crosshair',
  rect: 'crosshair',
  circle: 'crosshair',
  text: 'text',
  eraser: 'cell',
}

const TOOLS: Array<{ id: Tool; Icon: LucideIcon; label: string; hint: string }> = [
  { id: 'select',   Icon: MousePointer2, label: 'Sélection',  hint: 'Sélectionner et déplacer des éléments' },
  { id: 'line',     Icon: Minus,         label: 'Ligne',      hint: 'Tracer une ligne droite' },
  { id: 'freepath', Icon: Pencil,        label: 'Crayon',     hint: 'Dessin libre à main levée' },
  { id: 'rect',     Icon: Square,        label: 'Rectangle',  hint: 'Tracer un rectangle' },
  { id: 'circle',   Icon: Circle,        label: 'Cercle',     hint: 'Tracer un cercle' },
  { id: 'text',     Icon: Type,          label: 'Texte',      hint: 'Ajouter une annotation texte' },
  { id: 'eraser',   Icon: Eraser,        label: 'Gomme',      hint: 'Effacer des éléments (cliquer pour supprimer)' },
]

const DOT_SPACING = 24
const DOT_COLOR = 'rgba(255,255,255,0.12)'
const DOT_RADIUS = 1

function drawDotGrid(canvas: HTMLCanvasElement, panX: number, panY: number, zoom: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(0, 0, w, h)

  const spacing = DOT_SPACING * zoom
  // offset so dots stay fixed as we pan
  const offsetX = ((panX % spacing) + spacing) % spacing
  const offsetY = ((panY % spacing) + spacing) % spacing

  ctx.fillStyle = DOT_COLOR
  for (let x = offsetX; x < w; x += spacing) {
    for (let y = offsetY; y < h; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, DOT_RADIUS * Math.min(zoom, 1.5), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function MorphoCanvas({ photo, clientId, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photoObjRef = useRef<any>(null)

  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [color, setColor] = useState('#1f8a65')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MorphoAnalysisResult | null>(null)
  const [stimulusAdjustments, setStimulusAdjustments] = useState<Record<string, number> | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef = useRef<any[]>([])
  const historyIndexRef = useRef(-1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawingShapeRef = useRef<any>(null)
  const isDrawingShapeRef = useRef(false)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)

  // Pan state for background grid
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)

  // Keep refs in sync so Fabric event handlers always see current values
  const activeToolRef = useRef<Tool>('select')
  const colorRef = useRef(color)
  const strokeWidthRef = useRef(strokeWidth)
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { strokeWidthRef.current = strokeWidth }, [strokeWidth])

  const redrawBg = useCallback(() => {
    if (!bgCanvasRef.current) return
    drawDotGrid(bgCanvasRef.current, panRef.current.x, panRef.current.y, zoomRef.current)
  }, [])

  // Init background canvas size
  useEffect(() => {
    const container = containerRef.current
    const bg = bgCanvasRef.current
    if (!container || !bg) return
    const resize = () => {
      bg.width = container.clientWidth
      bg.height = container.clientHeight
      redrawBg()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [redrawBg])

  // Init Fabric canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !(photo.full_url ?? photo.signed_url)) return
    const container = containerRef.current
    if (!container) return

    let destroyed = false

    import('fabric').then(({ Canvas, FabricImage, Line, Rect, Circle: FabricCircle }) => {
      if (destroyed || !fabricCanvasRef.current) return

      const w = container.clientWidth
      const h = container.clientHeight

      const fc = new Canvas(fabricCanvasRef.current, {
        backgroundColor: 'transparent',
        width: w,
        height: h,
        selection: false,
      })
      fabricRef.current = fc

      FabricImage.fromURL((photo.full_url ?? photo.signed_url)!, { crossOrigin: 'anonymous' }).then((img) => {
        if (destroyed) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fabricImg = img as any
        const scaleX = (w * 0.7) / fabricImg.width
        const scaleY = (h * 0.85) / fabricImg.height
        const scale = Math.min(scaleX, scaleY)
        const left = (w - fabricImg.width * scale) / 2
        const top = (h - fabricImg.height * scale) / 2
        fabricImg.set({
          scaleX: scale, scaleY: scale,
          left, top,
          selectable: false,
          evented: false,        // never receives pointer events
          lockMovementX: true,
          lockMovementY: true,
          hasControls: false,
          hasBorders: false,
        })
        fabricImg.isBackground = true
        photoObjRef.current = fabricImg
        fc.add(fabricImg)
        fc.renderAll()
        saveHistorySnapshot()
      })

      // Sync pan/zoom from Fabric to bg grid
      fc.on('after:render', () => {
        const vpt = fc.viewportTransform
        if (vpt) {
          panRef.current = { x: vpt[4], y: vpt[5] }
          zoomRef.current = fc.getZoom()
          redrawBg()
        }
      })

      // --- Shape drawing ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on('mouse:down', (opt: any) => {
        const tool = activeToolRef.current
        if (tool === 'select' || tool === 'freepath' || tool === 'text') return

        if (tool === 'eraser') {
          const target = fc.findTarget(opt.e)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (target && !(target as any).isBackground) {
            fc.remove(target)
            fc.renderAll()
            saveHistorySnapshot()
          }
          return
        }

        const pointer = fc.getPointer(opt.e)
        startPointRef.current = { x: pointer.x, y: pointer.y }
        isDrawingShapeRef.current = true

        if (tool === 'line') {
          const shape = new Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            { stroke: colorRef.current, strokeWidth: strokeWidthRef.current, selectable: false, evented: false }
          )
          drawingShapeRef.current = shape
          fc.add(shape)
        } else if (tool === 'rect') {
          const shape = new Rect({
            left: pointer.x, top: pointer.y,
            width: 0, height: 0,
            fill: 'transparent',
            stroke: colorRef.current,
            strokeWidth: strokeWidthRef.current,
            selectable: false, evented: false,
          })
          drawingShapeRef.current = shape
          fc.add(shape)
        } else if (tool === 'circle') {
          const shape = new FabricCircle({
            left: pointer.x, top: pointer.y,
            radius: 1,
            fill: 'transparent',
            stroke: colorRef.current,
            strokeWidth: strokeWidthRef.current,
            selectable: false, evented: false,
          })
          drawingShapeRef.current = shape
          fc.add(shape)
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on('mouse:move', (opt: any) => {
        if (!isDrawingShapeRef.current || !startPointRef.current || !drawingShapeRef.current) return
        const pointer = fc.getPointer(opt.e)
        const { x: sx, y: sy } = startPointRef.current
        const tool = activeToolRef.current

        if (tool === 'line') {
          drawingShapeRef.current.set({ x2: pointer.x, y2: pointer.y })
        } else if (tool === 'rect') {
          drawingShapeRef.current.set({
            left: Math.min(pointer.x, sx),
            top: Math.min(pointer.y, sy),
            width: Math.abs(pointer.x - sx),
            height: Math.abs(pointer.y - sy),
          })
        } else if (tool === 'circle') {
          const radius = Math.max(1, Math.sqrt(Math.pow(pointer.x - sx, 2) + Math.pow(pointer.y - sy, 2)) / 2)
          drawingShapeRef.current.set({
            left: Math.min(pointer.x, sx),
            top: Math.min(pointer.y, sy),
            radius,
          })
        }
        fc.renderAll()
      })

      fc.on('mouse:up', () => {
        if (!isDrawingShapeRef.current || !drawingShapeRef.current) return
        isDrawingShapeRef.current = false
        drawingShapeRef.current.set({ selectable: true, evented: true })
        drawingShapeRef.current = null
        startPointRef.current = null
        fc.renderAll()
        saveHistorySnapshot()
      })

      // Zoom with wheel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on('mouse:wheel', (opt: any) => {
        const delta = opt.e.deltaY
        let zoom = fc.getZoom()
        zoom *= 0.999 ** delta
        zoom = Math.min(Math.max(zoom, 0.2), 5)
        fc.zoomToPoint(new (fc.constructor as any).Point(opt.e.offsetX, opt.e.offsetY), zoom)
        opt.e.preventDefault()
        opt.e.stopPropagation()
      })

      // Pan with middle mouse or space+drag
      let isPanning = false
      let lastPan = { x: 0, y: 0 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on('mouse:down', (opt: any) => {
        if (opt.e.button === 1 || opt.e.spaceKey) {
          isPanning = true
          lastPan = { x: opt.e.clientX, y: opt.e.clientY }
          fc.defaultCursor = 'grabbing'
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fc.on('mouse:move', (opt: any) => {
        if (!isPanning) return
        const dx = opt.e.clientX - lastPan.x
        const dy = opt.e.clientY - lastPan.y
        lastPan = { x: opt.e.clientX, y: opt.e.clientY }
        const vpt = fc.viewportTransform!
        vpt[4] += dx
        vpt[5] += dy
        fc.requestRenderAll()
      })
      fc.on('mouse:up', () => {
        if (isPanning) {
          isPanning = false
          fc.defaultCursor = TOOL_CURSOR[activeToolRef.current]
        }
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
  }, [photo.full_url ?? photo.signed_url])

  // Sync tool mode into Fabric
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return
    const isDrawTool = activeTool !== 'select'
    fc.isDrawingMode = activeTool === 'freepath'
    if (fc.freeDrawingBrush) {
      fc.freeDrawingBrush.color = color
      fc.freeDrawingBrush.width = strokeWidth
    }
    // In any drawing tool: disable selection so Fabric doesn't try to drag objects
    fc.selection = !isDrawTool
    fc.defaultCursor = TOOL_CURSOR[activeTool]
    // Make all existing annotations non-interactive while a draw tool is active
    fc.getObjects().forEach((obj: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!obj.isBackground) {
        obj.selectable = !isDrawTool
        obj.evented = !isDrawTool
      }
    })
    fc.renderAll()
  }, [activeTool, color, strokeWidth])

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

  const addText = useCallback(() => {
    import('fabric').then(({ IText }) => {
      const fc = fabricRef.current
      if (!fc) return
      const cx = (fc.width ?? 400) / 2
      const cy = (fc.height ?? 300) / 2
      const text = new IText('Annotation', {
        left: cx - 50, top: cy - 10,
        fill: colorRef.current,
        fontSize: 18,
        fontFamily: 'sans-serif',
      })
      fc.add(text)
      fc.setActiveObject(text)
      setActiveTool('select')
    })
  }, [])

  useEffect(() => {
    if (activeTool === 'text') addText()
  }, [activeTool, addText])

  function handleZoom(factor: number) {
    const fc = fabricRef.current
    if (!fc) return
    const zoom = Math.min(Math.max(fc.getZoom() * factor, 0.2), 5)
    const cx = (fc.width ?? 0) / 2
    const cy = (fc.height ?? 0) / 2
    fc.zoomToPoint({ x: cx, y: cy }, zoom)
  }

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

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: '#0d0d0d' }}>
      {/* Toolbar gauche */}
      <div className="w-14 bg-[#181818] border-r-[0.3px] border-white/[0.06] flex flex-col items-center py-3 gap-0.5 shrink-0 z-10">
        <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-white/20 mb-1.5">Outils</p>
        {TOOLS.map(({ id, Icon, label, hint }) => (
          <div key={id} className="relative">
            <button
              onClick={() => setActiveTool(id)}
              onMouseEnter={() => setTooltip(id)}
              onMouseLeave={() => setTooltip(null)}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTool === id
                  ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
              }`}
            >
              <Icon size={14} />
              <span className="text-[7px] font-medium leading-none">{label.slice(0, 4)}</span>
            </button>
            {tooltip === id && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="bg-[#0f0f0f] border-[0.3px] border-white/[0.06] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                  <p className="text-[11px] font-semibold text-white/80">{label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 max-w-[160px] leading-relaxed whitespace-normal">{hint}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="w-7 h-px bg-white/[0.06] my-2" />

        {/* Couleur */}
        <div className="relative">
          <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 text-white/40 hover:text-white/70 cursor-pointer">
            <Palette size={14} />
            <span className="text-[7px] font-medium leading-none">Couleur</span>
          </div>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div
            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-white/20 pointer-events-none"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Épaisseur */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <SlidersHorizontal size={12} className="text-white/30" />
          <span className="text-[7px] font-medium text-white/30">Épais.</span>
          <div className="flex flex-col items-center gap-0.5">
            {[1, 2, 4, 7, 10].map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                title={`${w}px`}
                className={`w-7 flex items-center justify-center py-0.5 rounded transition-all ${
                  strokeWidth === w ? 'bg-[#1f8a65]/20' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(w * 3, 24),
                    height: Math.max(1, w * 0.7),
                    backgroundColor: strokeWidth === w ? '#1f8a65' : 'rgba(255,255,255,0.25)',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas zone */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 bg-[#181818] border-b-[0.3px] border-white/[0.06] flex items-center px-4 gap-3 shrink-0 z-10">
          <button onClick={undo} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Annuler">
            <Undo2 size={14} />
          </button>
          <button onClick={redo} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Rétablir">
            <Redo2 size={14} />
          </button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button onClick={() => handleZoom(1.25)} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Zoom avant (scroll)">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1.5 text-white/40 hover:text-white/70 transition-colors" title="Zoom arrière (scroll)">
            <ZoomOut size={14} />
          </button>
          <span className="text-[9px] text-white/20 font-mono">scroll = zoom · clic molette = pan</span>
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
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white/70 ml-2 transition-colors" title="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* Canvas area — bg grid + Fabric layered */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: TOOL_CURSOR[activeTool] }}>
          {/* Dot grid background */}
          <canvas
            ref={bgCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
          {/* Fabric canvas (transparent bg, on top) */}
          <canvas ref={fabricCanvasRef} className="absolute inset-0" />
        </div>
      </div>

      {/* Panel IA latéral */}
      {showAnalysis && analysisResult && (
        <div className="w-72 bg-[#181818] border-l-[0.3px] border-white/[0.06] overflow-y-auto p-4 shrink-0 z-10">
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
