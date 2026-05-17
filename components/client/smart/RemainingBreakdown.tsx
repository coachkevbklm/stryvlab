import Link from 'next/link'
import type { NutritionMacros } from './SmartNutritionWidget'

type Suggestion = { label: string; macros: string }

function suggest(remaining: NutritionMacros): Suggestion[] {
  const out: Suggestion[] = []
  if (remaining.protein_g > 30 && remaining.carbs_g < 30) {
    out.push({ label: 'Yaourt grec + amandes', macros: '~250 kcal · 25P 10G 12L' })
  }
  if (remaining.carbs_g > 50 && remaining.fat_g < 15) {
    out.push({ label: 'Bol de riz + poulet', macros: '~450 kcal · 35P 55G 8L' })
  }
  if (remaining.kcal > 500) {
    out.push({ label: 'Repas complet équilibré', macros: '~500 kcal · 30P 50G 18L' })
  }
  return out.slice(0, 3)
}

export default function RemainingBreakdown({ consumed, target }: { consumed: NutritionMacros; target: NutritionMacros }) {
  const remaining: NutritionMacros = {
    kcal:      Math.max(0, target.kcal      - consumed.kcal),
    protein_g: Math.max(0, target.protein_g - consumed.protein_g),
    carbs_g:   Math.max(0, target.carbs_g   - consumed.carbs_g),
    fat_g:     Math.max(0, target.fat_g     - consumed.fat_g),
    water_ml:  Math.max(0, target.water_ml  - consumed.water_ml),
  }
  const suggestions = suggest(remaining)

  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-4">
      <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-2">
        Reste à consommer
      </div>
      <p className="text-[12px] text-white/70 tabular-nums">
        {Math.round(remaining.kcal)} kcal · {Math.round(remaining.protein_g)}g P · {Math.round(remaining.carbs_g)}g G · {Math.round(remaining.fat_g)}g L · {(remaining.water_ml / 1000).toFixed(1)}L
      </p>
      {suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          {suggestions.map(s => (
            <Link
              key={s.label}
              href="/client/nutrition/log"
              className="block bg-white/[0.02] rounded-xl p-3 active:scale-[0.99] transition-transform"
            >
              <div className="text-[12px] font-semibold text-white">{s.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{s.macros}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
