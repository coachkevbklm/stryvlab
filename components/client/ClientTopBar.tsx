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
    <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b-[0.3px] border-white/[0.06] px-4 h-14 flex items-center">
      <div className="flex items-center gap-3 w-full max-w-lg mx-auto">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          {section && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30 leading-none mb-0.5">
              {section}
            </p>
          )}
          <p className="text-[13px] font-semibold text-white leading-tight truncate">
            {title}
          </p>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  )
}
