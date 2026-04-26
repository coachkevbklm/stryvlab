'use client'

interface CalorieAdjustmentDisplayProps {
  value: number // -30 to +30
  tdee: number | null // current TDEE in kcal
  onChange: (v: number) => void
}

function getAdjustmentBadge(pct: number): { label: string; color: string } {
  if (pct < -15) return { label: 'Déficit important', color: 'text-red-400' }
  if (pct < 0) return { label: 'Déficit modéré', color: 'text-amber-400' }
  if (pct === 0) return { label: 'Maintenance', color: 'text-white/60' }
  if (pct <= 15) return { label: 'Surplus léger', color: 'text-[#1f8a65]' }
  return { label: 'Surplus important', color: 'text-[#0f7d4a]' }
}

export default function CalorieAdjustmentDisplay({
  value,
  tdee,
  onChange,
}: CalorieAdjustmentDisplayProps) {
  const badge = getAdjustmentBadge(value)
  const deltaCal = tdee ? Math.round(tdee * (value / 100)) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">Ajustement calorique</span>
        <span className={`text-[12px] font-bold ${badge.color}`}>{badge.label}</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="-30"
        max="30"
        step="1"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg bg-gradient-to-r from-red-500/20 via-white/10 to-green-500/20 outline-none accent-[#1f8a65]"
        style={{
          background: `linear-gradient(to right,
            rgb(239, 68, 68, 0.2) 0%,
            rgb(251, 146, 60, 0.2) 25%,
            rgb(255, 255, 255, 0.1) 50%,
            rgb(16, 185, 129, 0.2) 75%,
            rgb(16, 185, 129, 0.2) 100%)`,
        }}
      />

      {/* Display: %, kcal delta */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-[16px] font-bold ${badge.color}`}>{value > 0 ? '+' : ''}{value}%</span>
          <span className="text-[11px] text-white/40">de l'apport</span>
        </div>
        {deltaCal !== 0 && (
          <div className="flex items-baseline gap-1">
            <span className={`text-[14px] font-semibold ${badge.color}`}>
              {deltaCal > 0 ? '+' : ''}{deltaCal}
            </span>
            <span className="text-[11px] text-white/40">kcal</span>
          </div>
        )}
      </div>
    </div>
  )
}
