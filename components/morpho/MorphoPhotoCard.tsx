'use client'

import Image from 'next/image'
import { CheckCircle2, Pencil } from 'lucide-react'
import { POSITION_LABELS, type MorphoPhoto } from '@/lib/morpho/types'

interface Props {
  photo: MorphoPhoto
  selected: boolean
  onToggle: (id: string) => void
  onAnnotate: (photo: MorphoPhoto) => void
}

export function MorphoPhotoCard({ photo, selected, onToggle, onAnnotate }: Props) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer border-[0.3px] transition-all ${
        selected
          ? 'border-[#1f8a65] ring-1 ring-[#1f8a65]/40'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
      onClick={() => onToggle(photo.id)}
    >
      <div className="aspect-[3/4] bg-white/[0.03] relative">
        {photo.signed_url ? (
          <Image
            src={photo.signed_url}
            alt={POSITION_LABELS[photo.position]}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-[10px]">Photo</span>
          </div>
        )}

        {selected && (
          <div className="absolute inset-0 bg-[#1f8a65]/10 flex items-start justify-end p-2">
            <CheckCircle2 size={16} className="text-[#1f8a65]" />
          </div>
        )}

        {photo.has_annotation && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#181818]/90 rounded-md px-1.5 py-0.5">
            <Pencil size={9} className="text-white/50" />
            <span className="text-[9px] text-white/50">Annoté</span>
          </div>
        )}
      </div>

      <div className="p-2 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/80">{POSITION_LABELS[photo.position]}</p>
        <p className="text-[9px] text-white/40">
          {new Date(photo.taken_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onAnnotate(photo) }}
          className="text-[9px] text-[#1f8a65]/70 hover:text-[#1f8a65] transition-colors mt-0.5"
        >
          Annoter →
        </button>
      </div>
    </div>
  )
}
