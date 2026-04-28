'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MorphoPhotoCard } from './MorphoPhotoCard'
import { MorphoFloatingBar } from './MorphoFloatingBar'
import { POSITION_LABELS, type MorphoPhoto, type MorphoPhotoPosition, type MorphoAnalysisResult } from '@/lib/morpho/types'

interface Props {
  clientId: string
  onOpenCanvas: (photo: MorphoPhoto) => void
  onOpenCompare: (photos: MorphoPhoto[]) => void
  onOpenUpload: () => void
  onAnalysisComplete: (result: MorphoAnalysisResult) => void
  refreshToken: number
}

const POSITIONS: Array<{ value: MorphoPhotoPosition | 'all'; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'front', label: 'Face' },
  { value: 'back', label: 'Dos' },
  { value: 'left', label: 'Profil G' },
  { value: 'right', label: 'Profil D' },
  { value: 'three_quarter_front_left', label: '¾ G' },
  { value: 'three_quarter_front_right', label: '¾ D' },
]

// Suppress unused import warning — POSITION_LABELS used in MorphoPhotoCard
void POSITION_LABELS

export function MorphoGallery({ clientId, onOpenCanvas, onOpenCompare, onOpenUpload, onAnalysisComplete, refreshToken }: Props) {
  const [photos, setPhotos] = useState<MorphoPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [positionFilter, setPositionFilter] = useState<MorphoPhotoPosition | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'assessment' | 'coach_upload'>('all')
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clientId })
      if (positionFilter !== 'all') params.set('position', positionFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      const res = await fetch(`/api/morpho/photos?${params}`)
      const data = await res.json()
      setPhotos(data.photos ?? [])
    } catch {
      setErrorMsg('Erreur chargement photos')
    } finally {
      setLoading(false)
    }
  }, [clientId, positionFilter, sourceFilter])

  useEffect(() => {
    async function syncAndFetch() {
      setSyncing(true)
      try {
        await fetch('/api/morpho/photos/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        })
      } finally {
        setSyncing(false)
        fetchPhotos()
      }
    }
    syncAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  useEffect(() => {
    fetchPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionFilter, sourceFilter, refreshToken])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAnalyze() {
    const photoIds = Array.from(selected)
    setAnalyzing(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/morpho/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds, clientId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur analyse')
      } else {
        setSelected(new Set())
        onAnalysisComplete(data.analysis_result)
      }
    } catch {
      setErrorMsg('Erreur réseau')
    } finally {
      setAnalyzing(false)
    }
  }

  const selectedPhotos = photos.filter(p => selected.has(p.id))

  if (loading || syncing) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-7 w-16 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="bg-red-500/[0.08] rounded-xl px-4 py-3 border-[0.3px] border-red-500/20">
          <p className="text-[11px] text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {POSITIONS.map(p => (
          <button
            key={p.value}
            onClick={() => setPositionFilter(p.value as MorphoPhotoPosition | 'all')}
            className={`px-2.5 h-7 rounded-lg text-[10px] font-semibold transition-all ${
              positionFilter === p.value
                ? 'bg-[#1f8a65]/10 text-[#1f8a65]'
                : 'bg-white/[0.03] text-white/40 hover:text-white/60'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px h-4 bg-white/[0.06]" />
        {(['all', 'assessment', 'coach_upload'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`px-2.5 h-7 rounded-lg text-[10px] font-semibold transition-all ${
              sourceFilter === s
                ? 'bg-white/[0.08] text-white/80'
                : 'bg-white/[0.03] text-white/40 hover:text-white/60'
            }`}
          >
            {s === 'all' ? 'Toutes sources' : s === 'assessment' ? 'Bilans' : 'Uploads'}
          </button>
        ))}
        <button
          onClick={fetchPhotos}
          className="ml-auto p-1.5 text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Grille */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-[13px] text-white/30">Aucune photo morphologique</p>
          <p className="text-[11px] text-white/20">Ajoutez des photos via un bilan ou uploadez directement</p>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[11px] font-bold hover:bg-[#1f8a65]/20 transition-all mt-2"
          >
            <Upload size={12} />
            Ajouter une photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(photo => (
            <MorphoPhotoCard
              key={photo.id}
              photo={photo}
              selected={selected.has(photo.id)}
              onToggle={toggleSelect}
              onAnnotate={onOpenCanvas}
            />
          ))}
        </div>
      )}

      <MorphoFloatingBar
        count={selected.size}
        onCompare={() => onOpenCompare(selectedPhotos)}
        onAnnotate={() => selectedPhotos[0] && onOpenCanvas(selectedPhotos[0])}
        onAnalyze={handleAnalyze}
        onClear={() => setSelected(new Set())}
        analyzing={analyzing}
      />
    </div>
  )
}
