'use client'

import BodySilhouette from './BodySilhouette'
import MetricCard from './MetricCard'
import type { BodyDataResponse } from '@/app/api/client/body-data/route'

interface Props {
  data: BodyDataResponse
}

const MEASURE_CONFIG = [
  { key: 'waist_cm' as const, label: 'Tour de taille', unit: ' cm' },
  { key: 'hips_cm'  as const, label: 'Hanches',        unit: ' cm' },
  { key: 'arm_cm'   as const, label: 'Bras',           unit: ' cm' },
  { key: 'chest_cm' as const, label: 'Poitrine',       unit: ' cm' },
]

type MeasureKey = 'waist_cm' | 'hips_cm' | 'arm_cm' | 'chest_cm'

function buildMeasureSeries(
  measuresByBilan: BodyDataResponse['measuresByBilan'],
  key: MeasureKey,
) {
  return measuresByBilan
    .filter(b => b[key] != null)
    .map(b => ({ date: b.date, value: b[key] as number, bilanIndex: b.bilanIndex }))
}

function measureDelta(series: { value: number }[]): { delta: string; deltaGood: boolean } | undefined {
  if (series.length < 2) return undefined
  const diff = series[series.length - 1].value - series[0].value
  const sign = diff > 0 ? '+' : ''
  return { delta: `${sign}${diff} cm`, deltaGood: diff <= 0 }
}

export default function MesurationsTab({ data }: Props) {
  const hasSilhouette = data.measuresByBilan.length > 0
  const hasCards = MEASURE_CONFIG.some(
    c => buildMeasureSeries(data.measuresByBilan, c.key).length > 0
  )

  if (!hasSilhouette && !hasCards) {
    return (
      <p className="text-[12px] text-[#5a5a5a] leading-relaxed py-4 text-center">
        Aucune mensuration enregistrée. Votre coach doit compléter un bilan.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {hasSilhouette && (
        <div>
          <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-[#5a5a5a] mb-3">
            Silhouette
          </p>
          <BodySilhouette bilanList={data.measuresByBilan} />
        </div>
      )}

      {hasCards && (
        <div className="space-y-3">
          <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-[#5a5a5a]">
            Évolution
          </p>
          {MEASURE_CONFIG.map(({ key, label, unit }) => {
            const series = buildMeasureSeries(data.measuresByBilan, key)
            if (series.length === 0) return null
            const latest = series[series.length - 1]
            const d = measureDelta(series)
            return (
              <MetricCard
                key={key}
                label={label}
                value={`${latest.value}${unit}`}
                series={series}
                unit={unit}
                {...(d ?? {})}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
