'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Minus, Plus, Upload, Edit2, Trash2,
  ChevronDown, ChevronUp, CheckCircle2, X, Loader2, AlertCircle,
  BarChart2, Table2, PenLine
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts'
import CsvImportButton from './CsvImportButton'

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  unit: string
  color: string
  category: 'composition' | 'measurements' | 'wellness'
  step: number
}

const FIELDS: FieldDef[] = [
  // Composition
  { key: 'weight_kg',      label: 'Poids',              unit: 'kg',   color: '#1A1A1A', category: 'composition',  step: 0.1 },
  { key: 'body_fat_pct',   label: '% Masse grasse',     unit: '%',    color: '#FCF76E', category: 'composition',  step: 0.1 },
  { key: 'fat_mass_kg',    label: 'Masse grasse',        unit: 'kg',   color: '#FCF76E', category: 'composition',  step: 0.1 },
  { key: 'muscle_mass_kg', label: 'Masse musc.',         unit: 'kg',   color: '#1A1A1A', category: 'composition',  step: 0.1 },
  { key: 'muscle_pct',     label: '% Musculaire',        unit: '%',    color: '#FCF76E', category: 'composition',  step: 0.1 },
  { key: 'body_water_pct', label: '% Hydrique',          unit: '%',    color: '#1A1A1A', category: 'composition',  step: 0.1 },
  { key: 'bone_mass_kg',   label: 'Masse osseuse',       unit: 'kg',   color: '#FCF76E', category: 'composition',  step: 0.01 },
  { key: 'visceral_fat',   label: 'Graisse viscérale',   unit: '',     color: '#1A1A1A', category: 'composition',  step: 1 },
  { key: 'bmi',            label: 'IMC',                 unit: '',     color: '#FCF76E', category: 'composition',  step: 0.1 },
  { key: 'bmr_kcal',       label: 'Métabolisme de base', unit: 'kcal', color: '#1A1A1A', category: 'composition',  step: 1 },
  // Measurements
  { key: 'waist_cm',       label: 'Taille',              unit: 'cm',   color: '#1A1A1A', category: 'measurements', step: 0.5 },
  { key: 'hips_cm',        label: 'Hanches',             unit: 'cm',   color: '#FCF76E', category: 'measurements', step: 0.5 },
  { key: 'chest_cm',       label: 'Poitrine',            unit: 'cm',   color: '#1A1A1A', category: 'measurements', step: 0.5 },
  { key: 'arm_cm',         label: 'Bras',                unit: 'cm',   color: '#FCF76E', category: 'measurements', step: 0.5 },
  { key: 'thigh_cm',       label: 'Cuisse',              unit: 'cm',   color: '#1A1A1A', category: 'measurements', step: 0.5 },
  { key: 'calf_cm',        label: 'Mollet',              unit: 'cm',   color: '#FCF76E', category: 'measurements', step: 0.5 },
  { key: 'neck_cm',        label: 'Cou',                 unit: 'cm',   color: '#1A1A1A', category: 'measurements', step: 0.5 },
  // Wellness
  { key: 'sleep_hours',    label: 'Sommeil',             unit: 'h',    color: '#1A1A1A', category: 'wellness',     step: 0.25 },
  { key: 'energy_level',   label: 'Énergie',             unit: '/10',  color: '#FCF76E', category: 'wellness',     step: 1 },
  { key: 'stress_level',   label: 'Stress',              unit: '/10',  color: '#1A1A1A', category: 'wellness',     step: 1 },
]

const FIELD_MAP = Object.fromEntries(FIELDS.map(f => [f.key, f]))

const KPI_FIELDS = ['weight_kg', 'body_fat_pct', 'muscle_mass_kg', 'bmi']

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricRow {
  submissionId: string
  date: string
  values: Record<string, number>
}

interface MetricSeries {
  [fieldKey: string]: { date: string; value: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateInput(d: string) {
  // Convert any date string to YYYY-MM-DD for input[type=date]
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toISOString().split('T')[0]
}

function getDelta(series: { date: string; value: number }[]) {
  if (series.length < 2) return null
  const prev = series[series.length - 2].value
  const curr = series[series.length - 1].value
  return curr - prev
}

function fmtVal(v: number, unit: string) {
  const s = Number.isInteger(v) ? String(v) : v.toFixed(v < 10 ? 2 : 1)
  return unit ? `${s} ${unit}` : s
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const NEG_GOOD_FIELDS = ['body_fat_pct', 'fat_mass_kg', 'visceral_fat', 'bmi', 'stress_level']

function KpiCard({ fieldKey, series, index }: { fieldKey: string; series: MetricSeries; index: number }) {
  const field = FIELD_MAP[fieldKey]
  const data = series[fieldKey] ?? []
  const last = data[data.length - 1]
  const delta = getDelta(data)

  const isDark = index % 2 === 1
  const isNegGood = NEG_GOOD_FIELDS.includes(fieldKey)

  const deltaIsGood = delta === null ? null : delta === 0 ? null : isNegGood ? delta < 0 : delta > 0

  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-2 min-w-0 ${
      isDark ? 'bg-[#343434]' : 'bg-[#FEFEFE]'
    }`} style={{ boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${
        isDark ? 'text-white/40' : 'text-[#8A8A8A]'
      }`}>{field?.label}</p>

      {last ? (
        <>
          <div className="flex items-end gap-1.5 leading-none">
            <span className={`text-4xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {last.value % 1 === 0 ? last.value : last.value.toFixed(1)}
            </span>
            {field?.unit && (
              <span className={`text-sm font-medium mb-1 ${isDark ? 'text-white/40' : 'text-[#8A8A8A]'}`}>
                {field.unit}
              </span>
            )}
          </div>

          {delta !== null && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCF76E] text-[#1A1A1A] text-[10px] font-bold">
                {delta === 0
                  ? <><Minus size={9} />Stable</>
                  : delta > 0
                    ? <><TrendingUp size={9} />+{delta.toFixed(1)} {field?.unit}</>
                    : <><TrendingDown size={9} />{delta.toFixed(1)} {field?.unit}</>
                }
              </span>
              {deltaIsGood !== null && (
                <span className={`text-[9px] font-medium ${deltaIsGood ? 'text-green-500' : 'text-red-400'}`}>
                  {deltaIsGood ? '↑ bon' : '↓ attention'}
                </span>
              )}
            </div>
          )}

          <p className={`text-[9px] ${isDark ? 'text-white/20' : 'text-[#8A8A8A]/50'}`}>
            {data.length} mesure{data.length > 1 ? 's' : ''}
          </p>
        </>
      ) : (
        <p className={`text-sm mt-1 ${isDark ? 'text-white/20' : 'text-[#8A8A8A]/40'}`}>—</p>
      )}
    </div>
  )
}

// ─── Mini sparkline for table ─────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width={64} height={24}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="value" stroke="#1A1A1A" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Pill bar shape for bar charts ────────────────────────────────────────────

interface PillBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

function PillBar(props: PillBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill } = props
  const r = Math.min(width / 2, 6)
  if (height <= 0) return null
  return (
    <rect x={x} y={y} width={width} height={height} rx={r} ry={r} fill={fill} />
  )
}

// ─── Full metric chart ────────────────────────────────────────────────────────

function FullChart({ fieldKey, data }: { fieldKey: string; data: { date: string; value: number }[] }) {
  const field = FIELD_MAP[fieldKey]
  if (!field || data.length === 0) return null

  const delta = getDelta(data)
  const isNegGood = NEG_GOOD_FIELDS.includes(fieldKey)
  const isGood = delta === null || delta === 0 ? null : isNegGood ? delta < 0 : delta > 0

  // Alternate chart colors: odd index = chartreuse bars, even = dark bars
  const fieldIndex = FIELDS.findIndex(f => f.key === fieldKey)
  const barColor = fieldIndex % 2 === 0 ? '#1A1A1A' : '#FCF76E'
  const barTextColor = fieldIndex % 2 === 0 ? '#1A1A1A' : '#FCF76E'

  return (
    <div className="bg-[#FEFEFE] rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-widest">{field.label}</p>
          <p className="text-2xl font-bold text-[#1A1A1A] leading-tight mt-0.5">
            {fmtVal(data[data.length - 1].value, field.unit)}
          </p>
        </div>
        {delta !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FCF76E] text-[#1A1A1A] text-[10px] font-bold">
            {delta === 0
              ? <><Minus size={9} />Stable</>
              : delta > 0
                ? <><TrendingUp size={9} />+{delta.toFixed(1)} {field.unit}</>
                : <><TrendingDown size={9} />{delta.toFixed(1)} {field.unit}</>
            }
          </span>
        )}
      </div>

      {/* Legend dots */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: barColor }} />
          <span className="text-[9px] font-medium text-[#8A8A8A]">{field.label}</span>
        </div>
        {data[0] && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-[#ccc]" />
            <span className="text-[9px] font-medium text-[#8A8A8A]">Baseline</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke="#F0F0F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              fontSize: 11,
              padding: '8px 12px',
            }}
            formatter={(v: unknown) => [`${v} ${field.unit}`, field.label]}
            labelFormatter={d => new Date(d).toLocaleDateString('fr-FR')}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <ReferenceLine y={data[0].value} stroke="#E0E0E0" strokeDasharray="4 4" />
          <Bar dataKey="value" shape={<PillBar />} maxBarSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {isGood !== null && (
        <p className={`text-[9px] font-medium mt-2 ${isGood ? 'text-green-500' : 'text-red-400'}`}>
          {isGood ? '↑ Progression favorable' : '↓ À surveiller'}
        </p>
      )}
    </div>
  )
}

// ─── Edit row modal ───────────────────────────────────────────────────────────

interface EditRowModalProps {
  row: MetricRow
  clientId: string
  onClose: () => void
  onSaved: () => void
}

function EditRowModal({ row, clientId, onClose, onSaved }: EditRowModalProps) {
  const [date, setDate] = useState(formatDateInput(row.date))
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(row.values).map(([k, v]) => [k, String(v)]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allFields = FIELDS

  async function handleSave() {
    setSaving(true)
    setError(null)
    const numericValues: Record<string, number | null> = {}
    for (const f of allFields) {
      const raw = values[f.key]
      if (raw === '' || raw === undefined) {
        // If was present before, delete it
        if (row.values[f.key] !== undefined) numericValues[f.key] = null
      } else {
        const n = parseFloat(raw.replace(',', '.'))
        if (!isNaN(n)) numericValues[f.key] = n
      }
    }

    const res = await fetch(`/api/clients/${clientId}/metrics/${row.submissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, values: numericValues }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de la sauvegarde')
      setSaving(false)
      return
    }

    onSaved()
  }

  // Group fields by category for the form
  const categories: { key: string; label: string; fields: FieldDef[] }[] = [
    { key: 'composition',  label: 'Composition corporelle', fields: FIELDS.filter(f => f.category === 'composition') },
    { key: 'measurements', label: 'Mensurations',            fields: FIELDS.filter(f => f.category === 'measurements') },
    { key: 'wellness',     label: 'Bien-être',               fields: FIELDS.filter(f => f.category === 'wellness') },
  ]

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#FEFEFE] rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Modifier la mesure</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">Laissez vide pour supprimer une valeur</p>
          </div>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Date */}
        <div className="px-5 py-4 border-b border-white/40">
          <label className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#E2E1D9] shadow-soft-in rounded-btn text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FCF76E]/40"
          />
        </div>

        {/* Fields by category */}
        <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">{cat.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {cat.fields.map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] text-[#8A8A8A] block mb-0.5">
                      {f.label}{f.unit ? ` (${f.unit})` : ''}
                    </label>
                    <input
                      type="number"
                      step={f.step}
                      value={values[f.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="—"
                      className="w-full px-2.5 py-1.5 bg-[#E2E1D9] shadow-soft-in rounded-btn text-xs font-mono text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FCF76E]/40 placeholder:text-[#8A8A8A]/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={13} />{error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/40">
          <button onClick={onClose} className="text-xs text-[#8A8A8A] hover:text-[#1A1A1A] font-medium transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-btn bg-[#FCF76E] text-[#1A1A1A] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow"
          >
            {saving ? <><Loader2 size={12} className="animate-spin" />Sauvegarde…</> : <><CheckCircle2 size={12} />Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Manual entry form ────────────────────────────────────────────────────────

interface ManualEntryProps {
  clientId: string
  onSaved: () => void
  onClose: () => void
}

function ManualEntryForm({ clientId, onSaved, onClose }: ManualEntryProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { key: 'composition',  label: 'Composition corporelle', fields: FIELDS.filter(f => f.category === 'composition') },
    { key: 'measurements', label: 'Mensurations',            fields: FIELDS.filter(f => f.category === 'measurements') },
    { key: 'wellness',     label: 'Bien-être',               fields: FIELDS.filter(f => f.category === 'wellness') },
  ]

  const filledCount = Object.values(values).filter(v => v.trim() !== '').length

  async function handleSave() {
    setSaving(true)
    setError(null)
    const numericValues: Record<string, number> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v.trim() === '') continue
      const n = parseFloat(v.replace(',', '.'))
      if (!isNaN(n)) numericValues[k] = n
    }
    if (Object.keys(numericValues).length === 0) {
      setError('Saisissez au moins une valeur')
      setSaving(false)
      return
    }

    const res = await fetch(`/api/clients/${clientId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, values: numericValues }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de la sauvegarde')
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#FEFEFE] rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Saisie manuelle</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">Ajoutez une mesure pour une date donnée</p>
          </div>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/40">
          <label className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#E2E1D9] shadow-soft-in rounded-btn text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FCF76E]/40"
          />
        </div>

        <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-2">{cat.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {cat.fields.map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] text-[#8A8A8A] block mb-0.5">
                      {f.label}{f.unit ? ` (${f.unit})` : ''}
                    </label>
                    <input
                      type="number"
                      step={f.step}
                      value={values[f.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="—"
                      className="w-full px-2.5 py-1.5 bg-[#E2E1D9] shadow-soft-in rounded-btn text-xs font-mono text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FCF76E]/40 placeholder:text-[#8A8A8A]/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={13} />{error}
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/40">
          <button onClick={onClose} className="text-xs text-[#8A8A8A] hover:text-[#1A1A1A] font-medium transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-btn bg-[#FCF76E] text-[#1A1A1A] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow"
          >
            {saving
              ? <><Loader2 size={12} className="animate-spin" />Sauvegarde…</>
              : <><CheckCircle2 size={12} />Enregistrer{filledCount > 0 ? ` (${filledCount} champ${filledCount > 1 ? 's' : ''})` : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type ViewMode = 'table' | 'charts'
type ChartCategory = 'composition' | 'measurements' | 'wellness'

interface Props {
  clientId: string
}

export default function MetricsSection({ clientId }: Props) {
  const [rows, setRows] = useState<MetricRow[]>([])
  const [series, setSeries] = useState<MetricSeries>({})
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [chartCategory, setChartCategory] = useState<ChartCategory>('composition')
  const [editingRow, setEditingRow] = useState<MetricRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MetricRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  // Columns visible in the table (the most important ones)
  const TABLE_COLS = FIELDS.filter(f =>
    ['weight_kg', 'body_fat_pct', 'muscle_mass_kg', 'waist_cm', 'energy_level'].includes(f.key)
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/metrics`)
      const d = await res.json()
      setRows(d.rows ?? [])
      setSeries(d.series ?? {})
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/clients/${clientId}/metrics/${deleteTarget.submissionId}`, {
      method: 'DELETE',
    })
    setDeleting(false)
    setDeleteTarget(null)
    if (res.ok) {
      showToast('Mesure supprimée')
      load()
    } else {
      showToast('Erreur lors de la suppression')
    }
  }

  function toggleRow(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasData = rows.length > 0

  // Fields that have at least one value
  const fieldsWithData = FIELDS.filter(f => (series[f.key]?.length ?? 0) > 0)
  const chartsInCategory = fieldsWithData.filter(f => f.category === chartCategory)

  return (
    <div className="flex flex-col gap-5 bg-[#F0EFE7] rounded-2xl p-5">

      {/* ── KPI strip ── */}
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPI_FIELDS.map((k, i) => (
            <KpiCard key={k} fieldKey={k} series={series} index={i} />
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[#FEFEFE] rounded-full p-1" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-[#343434] text-[#FEFEFE]'
                : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
            }`}
          >
            <Table2 size={12} />Tableau
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'charts'
                ? 'bg-[#343434] text-[#FEFEFE]'
                : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
            }`}
          >
            <BarChart2 size={12} />Graphiques
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FEFEFE] text-xs font-bold text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <PenLine size={12} />Saisie manuelle
          </button>
          <CsvImportButton
            clientId={clientId}
            compact
            onImported={() => { showToast('Import CSV réussi'); load() }}
          />
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && !hasData && (
        <div className="bg-[#FEFEFE] rounded-2xl p-10 flex flex-col items-center gap-3 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-12 h-12 rounded-full bg-[#343434] flex items-center justify-center">
            <BarChart2 size={20} className="text-[#FCF76E]" />
          </div>
          <p className="font-bold text-[#1A1A1A]">Aucune donnée</p>
          <p className="text-xs text-[#8A8A8A] max-w-xs">
            Importez un fichier CSV depuis votre balance connectée, ou saisissez les mesures manuellement.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#343434] text-[#FCF76E] text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <PenLine size={13} />Saisie manuelle
            </button>
            <CsvImportButton clientId={clientId} compact onImported={() => { showToast('Import CSV réussi'); load() }} />
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="bg-[#FEFEFE] rounded-2xl p-8 flex items-center justify-center gap-2 text-[#8A8A8A] text-sm" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Loader2 size={16} className="animate-spin" />Chargement…
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {!loading && hasData && viewMode === 'table' && (
        <div className="bg-[#FEFEFE] rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  <th className="px-3 py-3 text-left font-bold text-[#8A8A8A] w-8"></th>
                  <th className="px-3 py-3 text-left font-bold text-[#8A8A8A] whitespace-nowrap">Date</th>
                  {TABLE_COLS.map(f => (
                    <th key={f.key} className="px-3 py-3 text-right font-bold text-[#8A8A8A] whitespace-nowrap">
                      {f.label}
                      {f.unit ? <span className="font-normal opacity-60 ml-0.5">({f.unit})</span> : null}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-bold text-[#8A8A8A] whitespace-nowrap">Tendance</th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isExpanded = expandedRows.has(row.submissionId)
                  const allFieldsInRow = FIELDS.filter(f => row.values[f.key] !== undefined)
                  const hiddenFields = allFieldsInRow.filter(
                    f => !TABLE_COLS.some(c => c.key === f.key)
                  )
                  return (
                    <>
                      <tr
                        key={row.submissionId}
                        className={`border-b border-[#F5F5F5] transition-colors ${idx % 2 === 0 ? '' : 'bg-[#FAFAFA]'} hover:bg-[#F8F8F8]`}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-2.5">
                          {hiddenFields.length > 0 && (
                            <button
                              onClick={() => toggleRow(row.submissionId)}
                              className="text-[#CCCCCC] hover:text-[#8A8A8A] transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-3 py-2.5 font-mono text-[#8A8A8A] whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        {/* Main columns */}
                        {TABLE_COLS.map(f => (
                          <td key={f.key} className="px-3 py-2.5 text-right font-mono text-[#1A1A1A] tabular-nums">
                            {row.values[f.key] !== undefined
                              ? <span className="font-bold">{row.values[f.key]}</span>
                              : <span className="text-[#CCCCCC]">—</span>
                            }
                          </td>
                        ))}
                        {/* Sparkline for weight */}
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end">
                            <Sparkline data={(series['weight_kg'] ?? []).slice(0, idx + 1)} />
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRow(row)}
                              className="p-1.5 rounded-lg text-[#CCCCCC] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 rounded-lg text-[#CCCCCC] hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row — hidden fields */}
                      {isExpanded && hiddenFields.length > 0 && (
                        <tr key={`${row.submissionId}-exp`} className="bg-[#F8F8F8] border-b border-[#F0F0F0]">
                          <td colSpan={TABLE_COLS.length + 4} className="px-6 py-3">
                            <div className="flex flex-wrap gap-4">
                              {hiddenFields.map(f => (
                                <div key={f.key} className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-[#8A8A8A]">{f.label} :</span>
                                  <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                                    {row.values[f.key]}{f.unit ? ` ${f.unit}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[#F0F0F0] flex items-center justify-between">
            <p className="text-[10px] text-[#8A8A8A]">{rows.length} mesure{rows.length > 1 ? 's' : ''} au total</p>
            <p className="text-[10px] text-[#CCCCCC]">↕ Cliquez sur la flèche pour voir toutes les valeurs d&apos;une ligne</p>
          </div>
        </div>
      )}

      {/* ── CHARTS VIEW ── */}
      {!loading && hasData && viewMode === 'charts' && (
        <div className="flex flex-col gap-4">
          {/* Category tabs */}
          <div className="flex items-center gap-1 bg-[#FEFEFE] rounded-full p-1 w-fit" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {([
              { key: 'composition',  label: 'Composition' },
              { key: 'measurements', label: 'Mensurations' },
              { key: 'wellness',     label: 'Bien-être' },
            ] as const).map(cat => (
              <button
                key={cat.key}
                onClick={() => setChartCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  chartCategory === cat.key
                    ? 'bg-[#343434] text-[#FEFEFE]'
                    : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
                }`}
              >
                {cat.label}
                {fieldsWithData.filter(f => f.category === cat.key).length > 0 && (
                  <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded-full ${chartCategory === cat.key ? 'bg-white/20' : 'bg-[#1A1A1A]/10'}`}>
                    {fieldsWithData.filter(f => f.category === cat.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {chartsInCategory.length === 0 ? (
            <div className="bg-[#FEFEFE] rounded-2xl p-8 text-center text-[#8A8A8A] text-sm" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              Aucune donnée pour cette catégorie
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chartsInCategory.map(f => (
                <FullChart key={f.key} fieldKey={f.key} data={series[f.key] ?? []} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {editingRow && (
        <EditRowModal
          row={editingRow}
          clientId={clientId}
          onClose={() => setEditingRow(null)}
          onSaved={() => { setEditingRow(null); showToast('Mesure modifiée'); load() }}
        />
      )}

      {showManualEntry && (
        <ManualEntryForm
          clientId={clientId}
          onClose={() => setShowManualEntry(false)}
          onSaved={() => { setShowManualEntry(false); showToast('Mesure enregistrée'); load() }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FEFEFE] rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-[#1A1A1A] mb-2">Supprimer cette mesure ?</h3>
            <p className="text-sm text-[#8A8A8A] mb-5">
              La mesure du <span className="font-medium text-[#1A1A1A]">{formatDate(deleteTarget.date)}</span> sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-btn bg-[#D8D7CE] shadow-soft-out text-sm text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-btn bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-[#FEFEFE] text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 size={13} />{toast}
        </div>
      )}
    </div>
  )
}
