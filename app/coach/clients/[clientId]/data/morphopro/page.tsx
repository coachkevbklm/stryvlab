'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useClient } from '@/lib/client-context'
import { useClientTopBar } from '@/components/clients/useClientTopBar'
import { MorphoGallery } from '@/components/morpho/MorphoGallery'
import { MorphoUploadModal } from '@/components/morpho/MorphoUploadModal'
import { MorphoCanvas } from '@/components/morpho/MorphoCanvas'
import { MorphoCompare } from '@/components/morpho/MorphoCompare'
import { MorphoAnalysisPanel } from '@/components/morpho/MorphoAnalysisPanel'
import type { MorphoPhoto, MorphoAnalysisResult } from '@/lib/morpho/types'

export default function MorphoProPage() {
  const { clientId } = useClient()
  const [showUpload, setShowUpload] = useState(false)
  const [canvasPhoto, setCanvasPhoto] = useState<MorphoPhoto | null>(null)
  const [comparePhotos, setComparePhotos] = useState<MorphoPhoto[] | null>(null)
  const [latestAnalysis, setLatestAnalysis] = useState<MorphoAnalysisResult | null>(null)
  const [latestStimulus, setLatestStimulus] = useState<Record<string, number> | null>(null)
  const [galleryRefresh, setGalleryRefresh] = useState(0)

  useClientTopBar(
    'MorphoPro',
    <button
      onClick={() => setShowUpload(true)}
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/[0.04] text-white/55 text-[10px] font-bold hover:bg-white/[0.08] hover:text-white/80 transition-all"
    >
      <Upload size={12} />
      Photo
    </button>
  )

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24 pt-4">
        {/* Dernière analyse (si disponible) */}
        {latestAnalysis && (
          <div className="mb-6 bg-white/[0.02] rounded-xl p-4 border-[0.3px] border-white/[0.06]">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/30 mb-3">Dernière analyse</p>
            <MorphoAnalysisPanel
              result={latestAnalysis}
              stimulusAdjustments={latestStimulus}
              clientId={clientId}
            />
          </div>
        )}

        {/* Galerie */}
        <MorphoGallery
          clientId={clientId}
          onOpenCanvas={setCanvasPhoto}
          onOpenCompare={setComparePhotos}
          onOpenUpload={() => setShowUpload(true)}
          onAnalysisComplete={(result, stimulus) => {
            setLatestAnalysis(result)
            setLatestStimulus(stimulus ?? null)
          }}
          refreshToken={galleryRefresh}
        />
      </div>

      {/* Modals */}
      {showUpload && (
        <MorphoUploadModal
          clientId={clientId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setGalleryRefresh(t => t + 1) }}
        />
      )}

      {canvasPhoto && (
        <MorphoCanvas
          photo={canvasPhoto}
          clientId={clientId}
          onClose={() => setCanvasPhoto(null)}
        />
      )}

      {comparePhotos && (
        <MorphoCompare
          initialPhotos={comparePhotos}
          onClose={() => setComparePhotos(null)}
        />
      )}
    </main>
  )
}
