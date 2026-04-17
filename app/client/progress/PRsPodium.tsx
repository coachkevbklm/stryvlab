'use client'

import { useState } from 'react'
import { Trophy, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import type { PREntry } from './page'
import { useClientT } from '@/components/client/ClientI18nProvider'

interface Props {
  prs: PREntry[]
}

const MEDALS = [
  { bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-400', icon: '🥇', rank: '1er' },
  { bg: 'bg-white/[0.04]', border: 'border-white/[0.08]', text: 'text-white/50', icon: '🥈', rank: '2e' },
  { bg: 'bg-amber-700/10', border: 'border-amber-700/20', text: 'text-amber-700', icon: '🥉', rank: '3e' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

function deltaPct(current: number, prev: number): number {
  if (!prev || prev === current) return 0
  return Math.round(((current - prev) / prev) * 100)
}

export default function PRsPodium({ prs }: Props) {
  const { t } = useClientT()
  const [showAll, setShowAll] = useState(false)

  const top3 = prs.slice(0, 3)
  const rest = prs.slice(3)

  return (
    <div className="flex flex-col gap-2">
      {/* Podium top 3 */}
      <div className="grid grid-cols-3 gap-2">
        {top3.map((pr, i) => {
          const medal = MEDALS[i]
          const delta = deltaPct(pr.maxWeight, pr.prevMaxWeight)
          return (
            <div
              key={pr.exercise}
              className={[
                'flex flex-col rounded-xl p-3 border',
                medal.bg, medal.border,
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px]">{medal.icon}</span>
                {delta > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#1f8a65] bg-[#1f8a65]/10 px-1.5 py-0.5 rounded-full">
                    <TrendingUp size={8} />+{delta}%
                  </span>
                )}
              </div>
              <p className="text-[1.15rem] font-black text-white font-mono leading-none">
                {pr.maxWeight}<span className="text-[0.65rem] font-medium text-white/40 ml-0.5">kg</span>
              </p>
              <p className="text-[10px] text-white/50 font-medium mt-1 leading-tight line-clamp-2">
                {pr.exercise}
              </p>
              {pr.achievedDate && (
                <p className="text-[9px] text-white/25 mt-1.5">{formatDate(pr.achievedDate)}</p>
              )}
            </div>
          )
        })}

        {/* Placeholder cards si moins de 3 PRs */}
        {top3.length < 3 && Array.from({ length: 3 - top3.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex flex-col rounded-xl p-3 border border-white/[0.04] bg-white/[0.01] items-center justify-center min-h-[110px]"
          >
            <Trophy size={18} className="text-white/10" />
            <p className="text-[9px] text-white/15 mt-1.5 text-center">Pas encore</p>
          </div>
        ))}
      </div>

      {/* Liste des autres PRs */}
      {rest.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-white/40 hover:text-white/60 transition-colors"
          >
            {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showAll ? 'Masquer' : `Voir ${rest.length} autres exercice${rest.length > 1 ? 's' : ''}`}
          </button>

          {showAll && (
            <div className="flex flex-col gap-1.5 mt-1">
              {rest.map((pr, i) => {
                const delta = deltaPct(pr.maxWeight, pr.prevMaxWeight)
                return (
                  <div
                    key={pr.exercise}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-bold text-white/20 font-mono w-5 shrink-0">
                        {i + 4}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white/70 truncate">{pr.exercise}</p>
                        {pr.achievedDate && (
                          <p className="text-[10px] text-white/25 mt-0.5">{formatDate(pr.achievedDate)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {delta > 0 && (
                        <span className="text-[9px] font-bold text-[#1f8a65]">+{delta}%</span>
                      )}
                      <span className="text-[13px] font-black text-white font-mono">
                        {pr.maxWeight}<span className="text-[10px] font-medium text-white/40">kg</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
