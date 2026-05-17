type Group = { group: string; label: string; actual: number; mev: number; mav: number; mrv: number }

export default function VolumeCoverageWidget({
  weekStart,
  sessionsCount,
  groups,
}: {
  weekStart: string
  sessionsCount: number
  groups: Group[]
}) {
  if (groups.length === 0) return null

  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white">Volume hebdo</span>
        <span className="text-[10px] text-white/40 tabular-nums">{sessionsCount} séances</span>
      </div>
      <div className="space-y-2.5">
        {groups.filter(g => g.actual > 0 || g.mev > 0).slice(0, 12).map(g => {
          const span = (g.mrv || g.mev) * 1.2
          let color = 'rgba(255,255,255,0.08)'
          if (g.actual > (g.mrv || Infinity)) color = '#ef4444'
          else if (g.actual > (g.mav || Infinity)) color = '#f59e0b'
          else if (g.actual >= g.mev) color = '#22c55e'
          const w = span > 0 ? Math.min(100, (g.actual / span) * 100) : 0
          const mevPct = span > 0 ? (g.mev / span) * 100 : 0
          const mavPct = span > 0 ? (g.mav / span) * 100 : 0
          return (
            <div key={g.group}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-white/55">{g.label}</span>
                <span className="text-white tabular-nums">
                  {g.actual} <span className="text-white/40">/ MEV {g.mev}</span>
                </span>
              </div>
              <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-visible">
                <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
                {mevPct > 0 && mevPct < 100 && (
                  <div className="absolute top-[-2px] bottom-[-2px] w-px bg-white/40" style={{ left: `${mevPct}%` }} />
                )}
                {mavPct > 0 && mavPct < 100 && (
                  <div className="absolute top-[-2px] bottom-[-2px] w-px bg-white/25" style={{ left: `${mavPct}%` }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
