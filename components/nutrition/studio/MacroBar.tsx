'use client'

interface MacroBarProps {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  height?: number
  showLabels?: boolean
}

export default function MacroBar({
  calories, protein_g, carbs_g, fat_g, height = 6, showLabels = false,
}: MacroBarProps) {
  const total = protein_g * 4 + fat_g * 9 + carbs_g * 4
  if (total === 0) return <div className="w-full rounded-full bg-white/[0.06]" style={{ height }} />

  const pct = {
    p: Math.round((protein_g * 4 / total) * 100),
    f: Math.round((fat_g * 9 / total) * 100),
    c: 0,
  }
  pct.c = 100 - pct.p - pct.f

  return (
    <div className="w-full space-y-1">
      <div className="flex w-full overflow-hidden rounded-full" style={{ height }}>
        <div style={{ width: `${pct.p}%` }} className="bg-blue-400 transition-all duration-300" />
        <div style={{ width: `${pct.f}%` }} className="bg-amber-400 transition-all duration-300" />
        <div style={{ width: `${pct.c}%` }} className="bg-[#1f8a65] transition-all duration-300" />
      </div>
      {showLabels && (
        <div className="flex justify-between text-[9px] text-white/40">
          <span className="text-blue-400">P {pct.p}%</span>
          <span className="text-amber-400">L {pct.f}%</span>
          <span className="text-[#1f8a65]">G {pct.c}%</span>
        </div>
      )}
    </div>
  )
}
