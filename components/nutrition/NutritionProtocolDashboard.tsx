'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Plus, Edit2, Trash2, Share2, EyeOff } from 'lucide-react'
import type { NutritionProtocol, NutritionProtocolDay } from '@/lib/nutrition/types'

function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total === 0) return null

  const proteinPct = (protein * 4) / total
  const carbsPct   = (carbs * 4) / total
  const fatPct     = (fat * 9) / total

  const r = 28, cx = 36, cy = 36
  const circ = 2 * Math.PI * r

  const proteinDash = `${proteinPct * circ} ${circ - proteinPct * circ}`
  const carbsDash   = `${carbsPct * circ} ${circ - carbsPct * circ}`
  const fatDash     = `${fatPct * circ} ${circ - fatPct * circ}`

  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f8a65" strokeWidth={8}
        strokeDasharray={proteinDash} strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth={8}
        strokeDasharray={carbsDash} strokeDashoffset={-(proteinPct * circ)}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={8}
        strokeDasharray={fatDash} strokeDashoffset={-((proteinPct + carbsPct) * circ)}
        transform={`rotate(-90 ${cx} ${cy})`} />
    </svg>
  )
}

interface Props {
  protocols: NutritionProtocol[]
  onRefresh: () => void
}

export default function NutritionProtocolDashboard({ protocols, onRefresh }: Props) {
  const params   = useParams()
  const router   = useRouter()
  const clientId = params.clientId as string
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const shared = protocols.find(p => p.status === 'shared')
  const drafts = protocols.filter(p => p.status !== 'shared')

  async function handleShare(protocolId: string) {
    setActionLoading(`share-${protocolId}`)
    await fetch(`/api/clients/${clientId}/nutrition-protocols/${protocolId}/share`, { method: 'POST' })
    setActionLoading(null)
    onRefresh()
  }

  async function handleUnshare(protocolId: string) {
    setActionLoading(`unshare-${protocolId}`)
    await fetch(`/api/clients/${clientId}/nutrition-protocols/${protocolId}/unshare`, { method: 'POST' })
    setActionLoading(null)
    onRefresh()
  }

  async function handleDelete(protocolId: string) {
    if (!confirm('Supprimer ce protocole ?')) return
    setActionLoading(`delete-${protocolId}`)
    await fetch(`/api/clients/${clientId}/nutrition-protocols/${protocolId}`, { method: 'DELETE' })
    setActionLoading(null)
    onRefresh()
  }

  function renderDay(day: NutritionProtocolDay) {
    return (
      <div key={day.id} className="flex items-center gap-3 py-2 border-b-[0.3px] border-white/[0.04] last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white truncate">{day.name}</p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {day.calories != null ? `${day.calories} kcal` : '—'}
            {day.protein_g != null ? ` · P ${day.protein_g}g` : ''}
            {day.carbs_g != null ? ` · G ${day.carbs_g}g` : ''}
            {day.fat_g != null ? ` · L ${day.fat_g}g` : ''}
          </p>
        </div>
        {day.calories != null && day.protein_g != null && day.carbs_g != null && day.fat_g != null && (
          <MacroDonut protein={day.protein_g} carbs={day.carbs_g} fat={day.fat_g} />
        )}
      </div>
    )
  }

  function renderProtocolCard(protocol: NutritionProtocol, isActive: boolean) {
    const days = protocol.days ?? []
    return (
      <div
        key={protocol.id}
        className={`bg-white/[0.02] border-[0.3px] rounded-2xl p-4 ${
          isActive ? 'border-[#1f8a65]/30' : 'border-white/[0.06]'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {isActive ? (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#1f8a65]">
                  <CheckCircle2 size={10} /> Actif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/30">
                  <Clock size={10} /> Brouillon
                </span>
              )}
            </div>
            <p className="text-[14px] font-semibold text-white truncate">{protocol.name}</p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {new Date(protocol.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{days.length} jour{days.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => router.push(`/coach/clients/${clientId}/protocoles/nutrition/${protocol.id}/edit`)}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <Edit2 size={12} />
            </button>
            {isActive ? (
              <button
                onClick={() => handleUnshare(protocol.id)}
                disabled={actionLoading === `unshare-${protocol.id}`}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-white/[0.04] text-[10px] font-semibold text-white/40 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-40"
              >
                <EyeOff size={11} /> Retirer
              </button>
            ) : (
              <button
                onClick={() => handleShare(protocol.id)}
                disabled={actionLoading === `share-${protocol.id}`}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#1f8a65]/10 text-[10px] font-semibold text-[#1f8a65] hover:bg-[#1f8a65]/20 transition-all disabled:opacity-40"
              >
                <Share2 size={11} /> Partager
              </button>
            )}
            {!isActive && (
              <button
                onClick={() => handleDelete(protocol.id)}
                disabled={actionLoading === `delete-${protocol.id}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-40"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {days.length > 0 && (
          <div className="mt-2">
            {days.slice(0, 3).map(renderDay)}
            {days.length > 3 && (
              <p className="text-[10px] text-white/30 mt-1.5">+{days.length - 3} jour{days.length - 3 !== 1 ? 's' : ''}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (protocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
          <Plus size={20} className="text-white/20" />
        </div>
        <p className="text-[14px] font-semibold text-white/60 mb-1">Aucun protocole nutritionnel</p>
        <p className="text-[12px] text-white/30 mb-6">Créez le premier protocole pour ce client</p>
        <Link
          href={`/coach/clients/${clientId}/protocoles/nutrition/new`}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#1f8a65] text-white text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-[#217356] transition-colors"
        >
          <Plus size={14} /> Créer un protocole
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {shared && renderProtocolCard(shared, true)}
      {drafts.map(p => renderProtocolCard(p, false))}
    </div>
  )
}
