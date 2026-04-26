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
    <header className="fixed top-4 left-4 right-4 z-40 h-14 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl bg-white/[0.04]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
      <div className="relative z-10 flex items-center gap-3 h-full px-4 max-w-lg mx-auto">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/40 hover:bg-white/[0.10] hover:text-white/70 transition-colors shrink-0"
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
