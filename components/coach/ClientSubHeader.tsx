'use client'

import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientSubHeaderProps {
  firstName: string
  lastName: string
  email?: string
  onBack?: () => void
}

export default function ClientSubHeader({
  firstName,
  lastName,
  email,
  onBack,
}: ClientSubHeaderProps) {
  const router = useRouter()

  return (
    <div className="h-auto bg-[#F0EFE7] px-6 py-4 border-b border-[#BCBCB8] shrink-0">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[#D8D7CE] overflow-hidden shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
            {firstName[0]}
            {lastName[0]}
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
            {firstName} {lastName}
          </h1>
          {email && <p className="text-xs text-[#8A8A8A] mt-0.5">{email}</p>}
        </div>

        {/* Actions droite */}
        <button
          onClick={onBack || (() => router.push('/coach/clients'))}
          className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-[#D8D7CE] border border-[#BCBCB8] text-xs font-medium text-[#1A1A1A] hover:bg-[#E2E1D9] transition-colors shrink-0"
        >
          <ChevronLeft size={13} />
          Retour
        </button>
      </div>
    </div>
  )
}
