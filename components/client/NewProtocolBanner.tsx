'use client'

import Link from 'next/link'
import { ChevronRight, Utensils } from 'lucide-react'

interface NewProtocolBannerProps {
  unviewedCount: number
  protocolName?: string
}

export default function NewProtocolBanner({
  unviewedCount,
  protocolName,
}: NewProtocolBannerProps) {
  if (unviewedCount === 0) return null

  const label = unviewedCount === 1
    ? `Votre coach a partagé un protocole: "${protocolName || "Protocole nutritionnel"}"`
    : `Votre coach a partagé ${unviewedCount} nouveaux protocoles`

  return (
    <Link href="/client/nutrition">
      <div className="bg-gradient-to-r from-[#1f8a65]/20 to-[#1f8a65]/10 border border-[#1f8a65]/30 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-gradient-to-r hover:from-[#1f8a65]/25 hover:to-[#1f8a65]/15 transition-colors duration-150">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#1f8a65]/30 flex items-center justify-center shrink-0">
            <Utensils size={18} className="text-[#1f8a65]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f8a65] mb-0.5">
              Nouveau
            </p>
            <p className="text-[13px] text-white/90 font-medium truncate">
              {label}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#1f8a65] shrink-0" />
      </div>
    </Link>
  )
}
