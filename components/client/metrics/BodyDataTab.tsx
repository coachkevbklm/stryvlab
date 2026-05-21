'use client'

import MetricCard from './MetricCard'
import type { BodyDataResponse } from '@/app/api/client/body-data/route'

interface Props {
  data: BodyDataResponse
}

function formatDelta(series: { value: number }[], unit: string): { delta: string; deltaGood: boolean } | undefined {
  if (series.length < 2) return undefined
  const diff = series[series.length - 1].value - series[0].value
  const sign = diff > 0 ? '+' : ''
  return { delta: `${sign}${diff.toFixed(1)}${unit}`, deltaGood: diff <= 0 }
}

function formatLeanDelta(series: { value: number }[]): { delta: string; deltaGood: boolean } | undefined {
  if (series.length < 2) return undefined
  const diff = series[series.length - 1].value - series[0].value
  const sign = diff >= 0 ? '+' : ''
  return { delta: `${sign}${diff.toFixed(1)} kg`, deltaGood: diff >= 0 }
}

export default function BodyDataTab({ data }: Props) {
  const hasAny = data.weightSeries.length > 0 || data.bodyFatSeries.length > 0 || data.leanMassSeries.length > 0

  if (!hasAny) {
    return (
      <p className="text-[12px] text-[#5a5a5a] leading-relaxed py-4 text-center">
        Aucune donnée corporelle enregistrée.{'\n'}Votre coach doit compléter un bilan.
      </p>
    )
  }

  const weightDelta = formatDelta(data.weightSeries, ' kg')
  const fatDelta    = formatDelta(data.bodyFatSeries, '%')
  const leanDelta   = formatLeanDelta(data.leanMassSeries)

  const latest     = data.weightSeries.length > 0 ? data.weightSeries[data.weightSeries.length - 1] : null
  const latestFat  = data.bodyFatSeries.length > 0 ? data.bodyFatSeries[data.bodyFatSeries.length - 1] : null
  const latestLean = data.leanMassSeries.length > 0 ? data.leanMassSeries[data.leanMassSeries.length - 1] : null

  return (
    <div className="space-y-3">
      {latest && (
        <MetricCard
          label="Poids"
          value={`${latest.value} kg`}
          series={data.weightSeries}
          unit=" kg"
          annotations={data.annotations}
          {...(weightDelta ?? {})}
        />
      )}
      {latestFat && (
        <MetricCard
          label="Masse grasse"
          value={`${latestFat.value.toFixed(1)}%`}
          series={data.bodyFatSeries}
          unit="%"
          annotations={data.annotations}
          {...(fatDelta ?? {})}
        />
      )}
      {latestLean && (
        <MetricCard
          label="Masse maigre"
          value={`${latestLean.value.toFixed(1)} kg`}
          series={data.leanMassSeries}
          unit=" kg"
          annotations={data.annotations}
          {...(leanDelta ?? {})}
        />
      )}
    </div>
  )
}
