'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag, Plus, X, Check, Edit2, Save, Loader2,
  MapPin, AlertTriangle, User2, Calendar,
  StickyNote, PhoneCall
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type TagObj = { id: string; name: string; color: string }

type CrmFields = {
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  internal_notes?: string | null
  acquisition_source?: string | null
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Homme', female: 'Femme', other: 'Autre', prefer_not_to_say: 'Non précisé',
}
const SOURCE_LABELS: Record<string, string> = {
  referral: 'Parrainage', social_media: 'Réseaux sociaux', website: 'Site web',
  word_of_mouth: 'Bouche à oreille', other: 'Autre',
}

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6b7280',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientCrmTab({ clientId, initialCrm }: { clientId: string; initialCrm?: CrmFields }) {

  const [crm, setCrm] = useState<CrmFields>(initialCrm ?? {})
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CrmFields>({})
  const [saving, setSaving] = useState(false)

  // Tags
  const [clientTags, setClientTags] = useState<TagObj[]>([])
  const [allTags, setAllTags] = useState<TagObj[]>([])
  const [tagLoading, setTagLoading] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creatingTag, setCreatingTag] = useState(false)

  // ── Load tags ──────────────────────────────────────────────────────────────

  const loadTags = useCallback(async () => {
    setTagLoading(true)
    const [clientRes, allRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/tags`),
      fetch('/api/tags'),
    ])
    if (clientRes.ok) setClientTags((await clientRes.json()).tags ?? [])
    if (allRes.ok) setAllTags((await allRes.json()).tags ?? [])
    setTagLoading(false)
  }, [clientId])

  useEffect(() => { loadTags() }, [loadTags])

  // ── CRM save ───────────────────────────────────────────────────────────────

  function openEdit() {
    setDraft({ ...crm })
    setEditing(true)
  }

  async function saveCrm() {
    setSaving(true)
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: draft.date_of_birth || null,
        gender: draft.gender || null,
        address: draft.address || null,
        city: draft.city || null,
        emergency_contact_name: draft.emergency_contact_name || null,
        emergency_contact_phone: draft.emergency_contact_phone || null,
        internal_notes: draft.internal_notes || null,
        acquisition_source: draft.acquisition_source || null,
      }),
    })
    if (res.ok) {
      setCrm({ ...draft })
      setEditing(false)
    }
    setSaving(false)
  }

  // ── Tag actions ────────────────────────────────────────────────────────────

  async function addTag(tagId: string) {
    const res = await fetch(`/api/clients/${clientId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    })
    if (res.ok) {
      const tag = allTags.find(t => t.id === tagId)
      if (tag) setClientTags(prev => [...prev, tag])
    }
  }

  async function removeTag(tagId: string) {
    const res = await fetch(`/api/clients/${clientId}/tags?tag_id=${tagId}`, { method: 'DELETE' })
    if (res.ok) setClientTags(prev => prev.filter(t => t.id !== tagId))
  }

  async function createTag() {
    if (!newTagName.trim()) return
    setCreatingTag(true)
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    })
    if (res.ok) {
      const { tag } = await res.json()
      setAllTags(prev => [...prev, tag])
      await addTag(tag.id)
      setNewTagName('')
      setNewTagColor(TAG_COLORS[0])
    }
    setCreatingTag(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const unassignedTags = allTags.filter(t => !clientTags.some(ct => ct.id === t.id))

  return (
    <div className="space-y-6">

      {/* ── Tags ────────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl p-5 border border-white/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-secondary/60" />
            <h3 className="text-sm font-bold text-primary">Tags</h3>
          </div>
          <button
            onClick={() => setShowTagPicker(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-primary transition-colors"
          >
            <Plus size={13} />
            Gérer les tags
          </button>
        </div>

        {/* Current tags */}
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {tagLoading ? (
            <Loader2 size={14} className="animate-spin text-secondary/40" />
          ) : clientTags.length === 0 ? (
            <p className="text-xs text-secondary/40 italic">Aucun tag assigné</p>
          ) : (
            clientTags.map(tag => (
              <span key={tag.id} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: tag.color }}>
                {tag.name}
                <button onClick={() => removeTag(tag.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Tag picker */}
        {showTagPicker && (
          <div className="mt-4 pt-4 border-t border-white/60 space-y-3">
            {/* Existing tags to add */}
            {unassignedTags.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-2">Ajouter un tag existant</p>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedTags.map(tag => (
                    <button key={tag.id}
                      onClick={() => addTag(tag.id)}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: tag.color }}>
                      <Plus size={9} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create new tag */}
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-2">Créer un nouveau tag</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nom du tag..."
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createTag()}
                  className="flex-1 h-9 px-3 bg-surface-light rounded-xl border border-white/60 text-xs text-primary outline-none focus:border-accent/30"
                />
                {/* Color picker */}
                <div className="flex gap-1">
                  {TAG_COLORS.slice(0, 5).map(c => (
                    <button key={c} onClick={() => setNewTagColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${newTagColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button
                  onClick={createTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="h-9 px-3 bg-accent text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1"
                >
                  {creatingTag ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Informations CRM ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl p-5 border border-white/60">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User2 size={15} className="text-secondary/60" />
            <h3 className="text-sm font-bold text-primary">Informations complémentaires</h3>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg bg-surface-light">
                Annuler
              </button>
              <button onClick={saveCrm} disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Enregistrer
              </button>
            </div>
          ) : (
            <button onClick={openEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-primary transition-colors">
              <Edit2 size={13} />
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date de naissance">
              <input type="date" value={draft.date_of_birth ?? ''} onChange={e => setDraft(d => ({ ...d, date_of_birth: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none" />
            </Field>
            <Field label="Genre">
              <select value={draft.gender ?? ''} onChange={e => setDraft(d => ({ ...d, gender: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none">
                <option value="">— Non renseigné</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
                <option value="prefer_not_to_say">Préfère ne pas dire</option>
              </select>
            </Field>
            <Field label="Adresse">
              <input type="text" placeholder="Rue, numéro..." value={draft.address ?? ''} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none" />
            </Field>
            <Field label="Ville">
              <input type="text" placeholder="Paris" value={draft.city ?? ''} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none" />
            </Field>
            <Field label="Contact urgence — Nom">
              <input type="text" placeholder="Marie Dupont" value={draft.emergency_contact_name ?? ''} onChange={e => setDraft(d => ({ ...d, emergency_contact_name: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none" />
            </Field>
            <Field label="Contact urgence — Tél.">
              <input type="tel" placeholder="+33 6 ..." value={draft.emergency_contact_phone ?? ''} onChange={e => setDraft(d => ({ ...d, emergency_contact_phone: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none" />
            </Field>
            <Field label="Source d'acquisition">
              <select value={draft.acquisition_source ?? ''} onChange={e => setDraft(d => ({ ...d, acquisition_source: e.target.value }))}
                className="w-full h-10 px-3 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none">
                <option value="">— Non renseigné</option>
                <option value="referral">Parrainage</option>
                <option value="social_media">Réseaux sociaux</option>
                <option value="website">Site web</option>
                <option value="word_of_mouth">Bouche à oreille</option>
                <option value="other">Autre</option>
              </select>
            </Field>
            <Field label="Notes internes coach (privées)" className="md:col-span-2">
              <textarea value={draft.internal_notes ?? ''} onChange={e => setDraft(d => ({ ...d, internal_notes: e.target.value }))}
                rows={3} placeholder="Notes visibles uniquement par vous..."
                className="w-full px-3 py-2 bg-surface-light rounded-xl border border-white/60 text-sm text-primary outline-none resize-none" />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={Calendar} label="Date de naissance"
              value={crm.date_of_birth ? new Date(crm.date_of_birth).toLocaleDateString('fr-FR') : null} />
            <InfoRow icon={User2} label="Genre"
              value={crm.gender ? GENDER_LABELS[crm.gender] : null} />
            <InfoRow icon={MapPin} label="Adresse"
              value={[crm.address, crm.city].filter(Boolean).join(', ') || null} />
            <InfoRow icon={PhoneCall} label="Contact urgence"
              value={crm.emergency_contact_name
                ? `${crm.emergency_contact_name}${crm.emergency_contact_phone ? ` — ${crm.emergency_contact_phone}` : ''}`
                : null} />
            <InfoRow icon={Tag} label="Acquisition"
              value={crm.acquisition_source ? SOURCE_LABELS[crm.acquisition_source] : null} />
            {crm.internal_notes && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-1.5 flex items-center gap-1.5">
                  <StickyNote size={11} /> Notes internes
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{crm.internal_notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} className="text-secondary/50" />
      </div>
      <div>
        <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50">{label}</p>
        <p className="text-sm text-primary font-medium">{value ?? <span className="text-secondary/30 italic">Non renseigné</span>}</p>
      </div>
    </div>
  )
}
