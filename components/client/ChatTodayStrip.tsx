"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Barbell, ForkKnife, Drop, CheckCircle, Circle } from "@phosphor-icons/react"

interface TodayStrip {
  sessions: { id: string; name: string }[]
  calories: { logged: number; target: number }
  water: { logged: number; target: number }
  checkin: { morning: boolean; evening: boolean }
}

export default function ChatTodayStrip() {
  const router = useRouter()
  const [data, setData] = useState<TodayStrip | null>(null)

  useEffect(() => {
    fetch("/api/client/chat/today-strip")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return <div className="h-[44px] shrink-0 bg-[#0d0d0d] border-b border-white/[0.06]" />

  const pills: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }[] = [
    {
      label: data.checkin.morning ? "Check-in ✓" : "Check-in",
      icon: data.checkin.morning
        ? <CheckCircle size={13} weight="fill" className="text-[#ffe01e]" />
        : <Circle size={13} className="text-white/40" />,
      active: data.checkin.morning,
      onClick: () => {},
    },
    ...data.sessions.map(s => ({
      label: s.name,
      icon: <Barbell size={13} className="text-white/60" />,
      onClick: () => router.push("/client/programme"),
    })),
    {
      label: `${data.calories.logged} / ${data.calories.target} kcal`,
      icon: <ForkKnife size={13} className="text-white/60" />,
      onClick: () => router.push("/client/nutrition"),
    },
    {
      label: `${(data.water.logged / 1000).toFixed(1)}L / ${data.water.target / 1000}L`,
      icon: <Drop size={13} className="text-white/60" />,
      onClick: () => router.push("/client/nutrition"),
    },
  ]

  return (
    <div className="shrink-0 border-b border-white/[0.06] bg-[#0d0d0d]">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        {pills.map((pill, i) => (
          <button
            key={i}
            onClick={pill.onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shrink-0 active:opacity-70 transition-opacity ${
              pill.active
                ? "bg-[#ffe01e]/10 border-[#ffe01e]/20"
                : "bg-white/[0.04] border-white/[0.06]"
            }`}
          >
            {pill.icon}
            <span className={`text-[11px] font-barlow font-medium whitespace-nowrap ${pill.active ? "text-[#ffe01e]" : "text-white/60"}`}>
              {pill.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
