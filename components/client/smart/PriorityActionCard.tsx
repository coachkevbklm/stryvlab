'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type PriorityActionType = 'checkin' | 'session' | 'meal' | 'water' | 'protein'

export type PriorityActionCardProps = {
  type: PriorityActionType
  title: string
  subtitle: string
  href: string
  ctaLabel: string
}

const TYPE_COLOR: Record<PriorityActionType, string> = {
  checkin: '#3b82f6',
  session: '#ffe01e',
  meal:    '#4ade80',
  water:   '#22d3ee',
  protein: '#f59e0b',
}

export function computePriorityAction(params: {
  hour: number
  morningCheckinDone: boolean
  sessionScheduledToday: boolean
  sessionCompletedToday: boolean
  sessionName: string | null
  mealsLoggedToday: number
  waterMl: number
  waterTargetMl: number
  protein_g: number
  proteinTargetG: number
}): PriorityActionCardProps | null {
  const {
    hour, morningCheckinDone, sessionScheduledToday, sessionCompletedToday,
    sessionName, mealsLoggedToday, waterMl, waterTargetMl, protein_g, proteinTargetG,
  } = params

  if (hour < 12 && !morningCheckinDone) {
    return {
      type: 'checkin',
      title: 'Démarre ta journée',
      subtitle: 'Check-in matin non réalisé',
      href: '/client/checkin/morning',
      ctaLabel: 'Check-in',
    }
  }

  if (sessionScheduledToday && !sessionCompletedToday) {
    return {
      type: 'session',
      title: sessionName ? `Séance — ${sessionName}` : 'Séance prévue',
      subtitle: "Ton programme t'attend",
      href: '/client/programme',
      ctaLabel: 'Démarrer',
    }
  }

  if (hour > 12 && mealsLoggedToday < 2) {
    const mealLabel = hour < 14 ? 'déjeuner' : hour < 19 ? 'repas' : 'dîner'
    return {
      type: 'meal',
      title: `Tu n'as pas loggé ton ${mealLabel}`,
      subtitle: `${mealsLoggedToday} repas loggé${mealsLoggedToday > 1 ? 's' : ''} aujourd'hui`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  if (hour > 15 && waterTargetMl > 0 && waterMl < waterTargetMl * 0.5) {
    return {
      type: 'water',
      title: 'Hydratation insuffisante',
      subtitle: `${(waterMl / 1000).toFixed(1)}L / ${(waterTargetMl / 1000).toFixed(1)}L`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  if (hour > 14 && proteinTargetG > 0 && protein_g < proteinTargetG * 0.5) {
    return {
      type: 'protein',
      title: 'Protéines en retard',
      subtitle: `${Math.round(protein_g)}g / ${proteinTargetG}g`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  return null
}

export default function PriorityActionCard({ type, title, subtitle, href, ctaLabel }: PriorityActionCardProps) {
  const color = TYPE_COLOR[type]
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-4 active:scale-[0.99] transition-transform"
      style={{
        background: '#161616',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white leading-tight truncate">{title}</p>
        <p className="text-[11px] text-white/50 mt-0.5">{subtitle}</p>
      </div>
      <div
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ background: `${color}18`, color }}
      >
        {ctaLabel}
        <ChevronRight size={11} />
      </div>
    </Link>
  )
}
