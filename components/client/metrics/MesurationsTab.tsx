'use client'

import { useState } from 'react'
import BodySilhouette from './BodySilhouette'
import MetricCard from './MetricCard'
import type { BodyDataResponse } from '@/app/api/client/body-data/route'

interface Props {
  data: BodyDataResponse
  onSaved?: () => Promise<void> | void
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

export default function MesurationsTab({ data, onSaved }: Props) {
  const [weightKg, setWeightKg] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [hipsCm, setHipsCm] = useState('')
  const [armCm, setArmCm] = useState('')
  const [chestCm, setChestCm] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveEntry() {
    const values: Record<string, number> = {}
    const w = Number(weightKg)
    const waist = Number(waistCm)
    const hips = Number(hipsCm)
    const arm = Number(armCm)
    const chest = Number(chestCm)
    if (Number.isFinite(w) && w > 0) values.weight_kg = w
    if (Number.isFinite(waist) && waist > 0) values.waist_cm = waist
    if (Number.isFinite(hips) && hips > 0) values.hips_cm = hips
    if (Number.isFinite(arm) && arm > 0) values.arm_cm = arm
    if (Number.isFinite(chest) && chest > 0) values.chest_cm = chest
    if (Object.keys(values).length === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/client/body-data/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      if (res.ok) {
        setWeightKg('')
        setWaistCm('')
        setHipsCm('')
        setArmCm('')
        setChestCm('')
        await onSaved?.()
      }
    } finally {
      setSaving(false)
    }
  }

  const hasSilhouette = data.measuresByBilan.length > 0
  const hasCards = MEASURE_CONFIG.some(
    c => buildMeasureSeries(data.measuresByBilan, c.key).length > 0
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#111111] p-3 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-bold">Saisie rapide</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="decimal" placeholder="Poids (kg)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none" />
          <input value={waistCm} onChange={(e) => setWaistCm(e.target.value)} inputMode="decimal" placeholder="Taille (cm)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none" />
          <input value={hipsCm} onChange={(e) => setHipsCm(e.target.value)} inputMode="decimal" placeholder="Hanches (cm)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none" />
          <input value={armCm} onChange={(e) => setArmCm(e.target.value)} inputMode="decimal" placeholder="Bras (cm)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none" />
          <input value={chestCm} onChange={(e) => setChestCm(e.target.value)} inputMode="decimal" placeholder="Poitrine (cm)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none col-span-2" />
        </div>
        <button onClick={saveEntry} disabled={saving} className="h-9 px-4 rounded-xl bg-[#f2f2f2] text-[#080808] text-[11px] font-bold uppercase tracking-[0.12em] disabled:opacity-50">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {!hasSilhouette && !hasCards && (
        <p className="text-[12px] text-[#5a5a5a] leading-relaxed py-1 text-center">
          Aucune mensuration enregistrée pour le moment.
        </p>
      )}

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
