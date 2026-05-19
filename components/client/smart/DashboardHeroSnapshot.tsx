'use client'

export type DashboardHeroSnapshotProps = {
  kcalRemaining: number | null
  sessionState: 'scheduled' | 'completed' | 'rest' | 'no_program'
  sessionName: string | null
  waterMl: number
  waterTargetMl: number
  streak: number
  date: string
}

export default function DashboardHeroSnapshot({
  kcalRemaining,
  sessionState,
  sessionName,
  waterMl,
  waterTargetMl,
  streak,
  date,
}: DashboardHeroSnapshotProps) {
  const kcalDisplay = kcalRemaining === null
    ? '—'
    : String(Math.abs(Math.round(kcalRemaining)))
  const kcalColor = kcalRemaining !== null && kcalRemaining < 0 ? '#ef4444' : 'white'
  const kcalLabel = kcalRemaining !== null && kcalRemaining < 0 ? 'kcal dépassées' : 'kcal rest.'

  const sessionDisplay = (() => {
    if (sessionState === 'completed') return `✓ ${sessionName ?? 'Séance'}`
    if (sessionState === 'scheduled') return sessionName ?? 'Séance'
    if (sessionState === 'rest') return 'Repos'
    return '—'
  })()

  const stats = [
    {
      value: kcalDisplay,
      label: kcalLabel,
      color: kcalColor,
    },
    {
      value: sessionDisplay,
      label: sessionState === 'completed' ? 'Complétée' : 'Séance',
      color: sessionState === 'completed' ? '#ffe01e' : 'white',
    },
    {
      value: `${(waterMl / 1000).toFixed(1)}L`,
      label: `/ ${(waterTargetMl / 1000).toFixed(1)}L`,
      color: 'white',
    },
    {
      value: streak > 0 ? `${streak}j` : '0j',
      label: 'streak',
      color: streak > 0 ? '#ffe01e' : 'rgba(255,255,255,0.35)',
    },
  ]

  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] px-5 py-4">
      <p className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-white/30 mb-3">
        {date}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span
              className="font-black font-mono leading-none text-[15px] tabular-nums truncate max-w-full text-center"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.08em] text-center leading-tight">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
