'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  left?: React.ReactNode
  section?: string
  title?: string
  backHref?: string
  right?: React.ReactNode
  hideCoachButton?: boolean
}

export default function ClientTopBar({ left, section, title, backHref, right, hideCoachButton }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#ffe01e] px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {left ?? (
          <>
            {backHref && (
              <Link
                href={backHref}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.10] text-[#0d0d0d] hover:bg-black/[0.18] transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </Link>
            )}
            <div className="min-w-0">
              {section && (
                <p className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] text-[#0d0d0d]/50 leading-none mb-0.5">
                  {section}
                </p>
              )}
              {title && (
                <p className="text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-[#0d0d0d] leading-tight truncate">
                  {title}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {right && <>{right}</>}
      </div>
    </header>
  )
}
