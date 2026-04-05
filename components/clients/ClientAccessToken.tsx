'use client'

import { useState, useEffect } from 'react'
import { Link2, Copy, RefreshCw, Trash2, CheckCircle2, Loader2, ExternalLink, Mail } from 'lucide-react'

interface Props {
  clientId: string
}

export default function ClientAccessToken({ clientId }: Props) {
  const [accessUrl, setAccessUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [revoked, setRevoked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/access-token`)
      .then(r => r.json())
      .then(d => {
        setAccessUrl(d.access_url ?? null)
        setExpiresAt(d.expires_at ?? null)
        setRevoked(d.revoked ?? false)
      })
      .finally(() => setLoading(false))
  }, [clientId])

  async function generate(sendEmail = false) {
    setGenerating(true)
    const res = await fetch(`/api/clients/${clientId}/access-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ send_email: sendEmail }),
    })
    const d = await res.json()
    if (d.access_url) {
      setAccessUrl(d.access_url)
      setRevoked(false)
      setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    }
    setGenerating(false)
  }

  async function sendByEmail() {
    setSending(true)
    const res = await fetch(`/api/clients/${clientId}/access-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ send_email: true }),
    })
    const d = await res.json()
    if (d.access_url) {
      setAccessUrl(d.access_url)
      setRevoked(false)
      setExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    }
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setSending(false)
  }

  async function revoke() {
    setRevoking(true)
    await fetch(`/api/clients/${clientId}/access-token`, { method: 'DELETE' })
    setAccessUrl(null)
    setRevoked(true)
    setRevoking(false)
    setShowRevokeConfirm(false)
  }

  function copy() {
    if (!accessUrl) return
    navigator.clipboard.writeText(accessUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
    <div className="bg-surface rounded-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={15} className="text-accent" />
        <h3 className="font-semibold text-primary text-sm">Lien d'accès client</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-secondary text-xs py-2">
          <Loader2 size={13} className="animate-spin" />
          Chargement…
        </div>
      ) : accessUrl && !revoked ? (
        <div className="flex flex-col gap-3">
          {/* URL display */}
          <div className="flex items-center gap-2 bg-surface-light rounded-btn px-3 py-2.5">
            <span className="flex-1 text-xs text-secondary font-mono truncate">{accessUrl}</span>
          </div>

          {expiryLabel && (
            <p className="text-[11px] text-secondary">
              Expire le <span className="font-medium text-primary">{expiryLabel}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-4 py-2 rounded-btn hover:opacity-90 transition-opacity shadow-lg"
            >
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={sendByEmail}
              disabled={sending}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 hover:bg-accent/10 px-4 py-2 rounded-btn transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : sent ? <CheckCircle2 size={12} /> : <Mail size={12} />}
              {sending ? 'Envoi…' : sent ? 'Envoyé !' : 'Envoyer par email'}
            </button>
            <a
              href={accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary px-3 py-2 rounded-btn bg-surface-light transition-colors"
            >
              <ExternalLink size={12} />
              Tester
            </a>
            <button
              onClick={() => void generate(false)}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary px-3 py-2 rounded-btn bg-surface-light transition-colors disabled:opacity-50"
              title="Renouveler le lien"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Renouveler
            </button>
            <button
              onClick={() => setShowRevokeConfirm(true)}
              disabled={revoking}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-3 py-2 rounded-btn bg-surface-light transition-colors disabled:opacity-50 ml-auto"
              title="Révoquer"
            >
              {revoking ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Révoquer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-secondary">
            {revoked
              ? 'Le lien d\'accès a été révoqué. Générez-en un nouveau pour permettre au client de se connecter.'
              : 'Aucun lien actif. Générez un lien pour permettre à votre client de se connecter en un clic.'}
          </p>
          <button
            onClick={() => void generate(false)}
            disabled={generating}
            className="flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-4 py-2 rounded-btn hover:opacity-90 transition-opacity shadow-lg w-fit disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
            {generating ? 'Génération…' : 'Générer le lien d\'accès'}
          </button>
        </div>
      )}
    </div>

    {showRevokeConfirm && (

      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
          <h3 className="font-bold text-primary mb-2">Révoquer le lien d'accès ?</h3>
          <p className="text-sm text-secondary mb-5">
            Le client ne pourra plus utiliser ce lien pour se connecter. Vous pourrez en générer un nouveau à tout moment.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRevokeConfirm(false)}
              className="flex-1 py-2.5 rounded-btn bg-surface-light text-sm text-secondary hover:text-primary transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={revoke}
              disabled={revoking}
              className="flex-1 py-2.5 rounded-btn bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
            >
              {revoking ? 'Révocation…' : 'Révoquer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
