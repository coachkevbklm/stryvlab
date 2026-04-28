'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  section?: string
  title: string
  backHref?: string
  right?: React.ReactNode
}

export default function ClientTopBar({ section, title, backHref, right }: Props) {
  return (
    <header className="fixed top-4 left-4 right-4 z-40 h-14 rounded-2xl border-[0.3px] border-white/[0.06] bg-[#121212] px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Link>
        )}
        <div className="min-w-0">
          {section && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30 leading-none mb-0.5">
              {section}
            </p>
          )}
          <p className="text-[13px] font-semibold text-white leading-tight truncate">
            {title}
          </p>
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
