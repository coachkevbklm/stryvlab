"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  clientId: string;
}

export default function ClientAccessToken({ clientId }: Props) {
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/access-token`)
      .then((r) => r.json())
      .then((d) => {
        setAccessUrl(d.access_url ?? null);
        setExpiresAt(d.expires_at ?? null);
        setRevoked(d.revoked ?? false);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  async function generate(sendEmail = false) {
    setGenerating(true);
    const res = await fetch(`/api/clients/${clientId}/access-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_email: sendEmail }),
    });
    const d = await res.json();
    if (d.access_url) {
      setAccessUrl(d.access_url);
      setRevoked(false);
      setExpiresAt(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      );
    }
    setGenerating(false);
  }

  async function sendByEmail() {
    setSending(true);
    const res = await fetch(`/api/clients/${clientId}/access-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_email: true }),
    });
    const d = await res.json();
    if (d.access_url) {
      setAccessUrl(d.access_url);
      setRevoked(false);
      setExpiresAt(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      );
    }
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setSending(false);
  }

  async function revoke() {
    setRevoking(true);
    await fetch(`/api/clients/${clientId}/access-token`, { method: "DELETE" });
    setAccessUrl(null);
    setRevoked(true);
    setRevoking(false);
    setShowRevokeConfirm(false);
  }

  function copy() {
    if (!accessUrl) return;
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div className="bg-[#181818] border-subtle rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={15} className="text-accent" />
          <h3 className="font-semibold text-white text-sm">
            Lien d'accès client
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ) : accessUrl && !revoked ? (
          <div className="flex flex-col gap-3">
            {/* URL display */}
            <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2.5">
              <span className="flex-1 text-xs text-white/45 font-mono truncate">
                {accessUrl}
              </span>
            </div>

            {expiryLabel && (
              <p className="text-[11px] text-white/45">
                Expire le{" "}
                <span className="font-medium text-white">{expiryLabel}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 bg-[#1f8a65] hover:bg-[#217356] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copied ? "Copié !" : "Copier le lien"}
              </button>
              <button
                onClick={sendByEmail}
                disabled={sending}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : sent ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <Mail size={12} />
                )}
                {sending ? "Envoi…" : sent ? "Envoyé !" : "Envoyer par email"}
              </button>
              <a
                href={accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white px-3 py-2 rounded-lg bg-white/[0.04] transition-colors"
              >
                <ExternalLink size={12} />
                Tester
              </a>
              <button
                onClick={() => void generate(false)}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white px-3 py-2 rounded-lg bg-white/[0.04] transition-colors disabled:opacity-50"
                title="Renouveler le lien"
              >
                {generating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Renouveler
              </button>
              <button
                onClick={() => setShowRevokeConfirm(true)}
                disabled={revoking}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-3 py-2 rounded-lg bg-white/[0.04] transition-colors disabled:opacity-50 ml-auto"
                title="Révoquer"
              >
                {revoking ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Révoquer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/45">
              {revoked
                ? "Le lien d'accès a été révoqué. Générez-en un nouveau pour permettre au client de se connecter."
                : "Aucun lien actif. Générez un lien pour permettre à votre client de se connecter en un clic."}
            </p>
            <button
              onClick={() => void generate(false)}
              disabled={generating}
              className="flex items-center gap-1.5 bg-[#1f8a65] hover:bg-[#217356] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors w-fit disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Link2 size={12} />
              )}
              {generating ? "Génération…" : "Générer le lien d'accès"}
            </button>
          </div>
        )}
      </div>

      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] border-modal rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">
              Révoquer le lien d'accès ?
            </h3>
            <p className="text-sm text-white/45 mb-5">
              Le client ne pourra plus utiliser ce lien pour se connecter. Vous
              pourrez en générer un nouveau à tout moment.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.04] text-sm text-white/45 hover:text-white transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={revoke}
                disabled={revoking}
                className="flex-1 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {revoking ? "Révocation…" : "Révoquer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
