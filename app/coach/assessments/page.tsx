'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Star, Edit3, Trash2, Send, Copy, X, Search, Check } from 'lucide-react'
import { AssessmentTemplate } from '@/types/assessment'

interface Client {
  id: string
  first_name: string
  last_name: string
  email?: string
  status: string
}

export default function AssessmentsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  // Modal envoyer
  const [sendModal, setSendModal] = useState<AssessmentTemplate | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [sendEmail, setSendEmail] = useState(true)
  const [bilanDate, setBilanDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sending, setSending] = useState(false)
  const [sentUrl, setSentUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/assessments/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    setDeleteTarget(null)
    await fetch(`/api/assessments/templates/${deleteTarget.id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
    setDeleting(null)
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    const res = await fetch(`/api/assessments/templates/${id}`, { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      setTemplates(prev => [d.template, ...prev])
    }
    setDuplicating(null)
  }

  async function openSendModal(template: AssessmentTemplate) {
    setSendModal(template)
    setSentUrl(null)
    setSelectedClientId(null)
    setClientSearch('')
    setSendEmail(true)
    setBilanDate(new Date().toISOString().slice(0, 10))
    if (clients.length === 0) {
      setClientsLoading(true)
      const res = await fetch('/api/clients')
      const d = await res.json()
      setClients((d.clients ?? []).filter((c: Client) => c.status === 'active'))
      setClientsLoading(false)
    }
  }

  async function handleSend() {
    if (!sendModal || !selectedClientId) return
    setSending(true)
    const res = await fetch('/api/assessments/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClientId,
        template_id: sendModal.id,
        filled_by: 'client',
        send_email: sendEmail,
        bilan_date: bilanDate,
      }),
    })
    if (res.ok) {
      const d = await res.json()
      setSentUrl(d.bilan_url)
    }
    setSending(false)
  }

  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-surface font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-secondary font-medium uppercase tracking-widest">Espace Coach</p>
            <h1 className="text-xl font-bold text-primary tracking-tight">Bilans & Templates</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/coach/assessments/templates/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-btn font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus size={16} />
            Nouveau template
          </button>
        </div>
      </header>

      <div className="p-8 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-secondary">Chargement…</div>
        ) : templates.length === 0 ? (
          <div className="bg-surface rounded-card shadow-soft-out p-16 text-center">
            <FileText size={40} className="text-secondary/30 mx-auto mb-4" />
            <p className="font-bold text-primary mb-1">Aucun template créé</p>
            <p className="text-sm text-secondary opacity-60 mb-6">Créez votre premier modèle de bilan client</p>
            <button
              onClick={() => router.push('/coach/assessments/templates/new')}
              className="bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-btn hover:opacity-90 transition-opacity shadow-lg"
            >
              Créer un template
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map(t => (
              <div key={t.id} className="bg-surface rounded-card shadow-soft-out px-5 py-4 flex items-center gap-4">
                <FileText size={20} className="text-secondary/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-primary truncate">{t.name}</span>
                    {t.is_default && (
                      <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    <span className="text-xs bg-surface-light shadow-soft-in rounded-full px-2 py-0.5 text-secondary">{t.template_type}</span>
                  </div>
                  {t.description && (
                    <p className="text-sm text-secondary truncate mt-0.5">{t.description}</p>
                  )}
                  <p className="text-xs text-secondary/40 mt-0.5">{t.blocks?.length ?? 0} bloc(s)</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openSendModal(t)}
                    className="w-9 h-9 rounded-widget bg-surface-light shadow-soft-out flex items-center justify-center text-secondary hover:text-accent transition-colors"
                    title="Envoyer à un client"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(t.id)}
                    disabled={duplicating === t.id}
                    className="w-9 h-9 rounded-widget bg-surface-light shadow-soft-out flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-40"
                    title="Dupliquer"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => router.push(`/coach/assessments/templates/${t.id}/edit`)}
                    className="w-9 h-9 rounded-widget bg-surface-light shadow-soft-out flex items-center justify-center text-secondary hover:text-accent transition-colors"
                    title="Modifier"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                    disabled={deleting === t.id}
                    className="w-9 h-9 rounded-widget bg-surface-light shadow-soft-out flex items-center justify-center text-secondary hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal — Envoyer à un client */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-card shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/60 shrink-0">
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest font-bold">Envoyer le bilan</p>
                <p className="font-bold text-primary truncate">{sendModal.name}</p>
              </div>
              <button
                onClick={() => setSendModal(null)}
                className="w-8 h-8 rounded-btn flex items-center justify-center text-secondary hover:text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {sentUrl ? (
              /* État post-envoi */
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={22} className="text-green-600" />
                </div>
                <p className="font-bold text-primary">Bilan envoyé !</p>
                <p className="text-xs text-secondary">Lien de remplissage :</p>
                <div className="w-full bg-surface-light shadow-soft-in rounded-btn px-3 py-2 text-xs text-accent font-mono break-all select-all">
                  {sentUrl}
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(sentUrl)}
                    className="flex-1 text-sm font-bold bg-surface-light shadow-soft-out rounded-btn px-4 py-2 text-secondary hover:text-primary transition-colors"
                  >
                    Copier le lien
                  </button>
                  <button
                    onClick={() => setSendModal(null)}
                    className="flex-1 text-sm font-bold bg-accent text-white rounded-btn px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Recherche clients */}
                <div className="px-5 pt-4 pb-2 shrink-0">
                  <div className="flex items-center gap-2 bg-surface-light shadow-soft-in rounded-btn px-3 py-2">
                    <Search size={14} className="text-secondary/50 shrink-0" />
                    <input
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Rechercher un client…"
                      className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-secondary/40"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Liste clients */}
                <div className="flex-1 overflow-y-auto px-5 pb-2">
                  {clientsLoading ? (
                    <p className="text-sm text-secondary text-center py-8">Chargement…</p>
                  ) : filteredClients.length === 0 ? (
                    <p className="text-sm text-secondary text-center py-8 opacity-60">Aucun client actif trouvé</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 py-1">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedClientId(c.id === selectedClientId ? null : c.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-btn text-left transition-all ${
                            selectedClientId === c.id
                              ? 'bg-accent/10 border border-accent/40 shadow-none'
                              : 'bg-surface-light shadow-soft-out hover:shadow-none hover:bg-surface'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                            {c.first_name[0]}{c.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{c.first_name} {c.last_name}</p>
                            {c.email && <p className="text-xs text-secondary/60 truncate">{c.email}</p>}
                          </div>
                          {selectedClientId === c.id && (
                            <Check size={14} className="text-accent shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options + action */}
                <div className="px-5 py-4 border-t border-white/60 shrink-0 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-widest">Date du bilan</label>
                    <input
                      type="date"
                      value={bilanDate}
                      onChange={e => setBilanDate(e.target.value)}
                      className="bg-surface-light shadow-soft-in rounded-btn px-3 py-2 text-sm text-primary outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      className="accent-accent"
                    />
                    Envoyer un email au client
                  </label>
                  <button
                    onClick={handleSend}
                    disabled={!selectedClientId || sending}
                    className="w-full flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm px-4 py-2.5 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-40 shadow-lg"
                  >
                    <Send size={14} />
                    {sending ? 'Envoi…' : 'Envoyer le bilan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-primary mb-2">Supprimer ce template ?</h3>
            <p className="text-sm text-secondary mb-5">
              Le template <span className="font-medium text-primary">"{deleteTarget.name}"</span> sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-btn bg-surface-light shadow-soft-out text-sm text-secondary hover:text-primary transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="flex-1 py-2.5 rounded-btn bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
