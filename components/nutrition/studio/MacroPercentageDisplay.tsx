'use client'

interface MacroPercentageDisplayProps {
  proteinG: number
  fatG: number
  carbsG: number
  totalCalories: number
}

export default function MacroPercentageDisplay({
  proteinG,
  fatG,
  carbsG,
  totalCalories,
}: MacroPercentageDisplayProps) {
  if (!totalCalories) return null

  const proteinCal = proteinG * 4
  const fatCal = fatG * 9
  const carbsCal = carbsG * 4

  const proteinPct = Math.round((proteinCal / totalCalories) * 100)
  const fatPct = Math.round((fatCal / totalCalories) * 100)
  const carbsPct = Math.round((carbsCal / totalCalories) * 100)

  return (
    <div className="space-y-2">
      {/* Protéines */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">Protéines</span>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-white">{proteinG}g</span>
          <span className="text-[11px] text-white/50 w-12 text-right">{proteinPct}% kcal</span>
        </div>
      </div>

      {/* Lipides */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">Lipides</span>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-white">{fatG}g</span>
          <span className="text-[11px] text-white/50 w-12 text-right">{fatPct}% kcal</span>
        </div>
      </div>

      {/* Glucides */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">Glucides</span>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-white">{carbsG}g</span>
          <span className="text-[11px] text-white/50 w-12 text-right">{carbsPct}% kcal</span>
        </div>
      </div>
    </div>
  )
}
