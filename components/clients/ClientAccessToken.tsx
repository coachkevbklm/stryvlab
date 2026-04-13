"use client";

import { useState } from "react";
import {
  UserCheck,
  UserX,
  Mail,
  Loader2,
  CheckCircle2,
  ShieldOff,
  RefreshCw,
} from "lucide-react";

interface Props {
  clientId: string;
  clientStatus: string;
  clientEmail: string | null;
}

export default function ClientAccessToken({ clientId, clientStatus, clientEmail }: Props) {
  const [status, setStatus] = useState(clientStatus);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendInvitation() {
    setInviting(true);
    setError(null);
    const res = await fetch(`/api/clients/${clientId}/invite`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? "Erreur lors de l'envoi.");
    } else {
      setInvited(true);
      setStatus("active");
      setTimeout(() => setInvited(false), 4000);
    }
    setInviting(false);
  }

  async function revokeAccess() {
    setRevoking(true);
    setError(null);
    const res = await fetch(`/api/clients/${clientId}/access`, { method: "DELETE" });
    if (res.ok) {
      setStatus("suspended");
    } else {
      const d = await res.json();
      setError(d.error ?? "Erreur lors de la révocation.");
    }
    setRevoking(false);
    setShowRevokeConfirm(false);
  }

  const isActive = status === "active";
  const isSuspended = status === "suspended";

  return (
    <>
      <div className="bg-[#181818] border-[0.3px] border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={15} className="text-[#1f8a65]" />
          <h3 className="font-semibold text-white text-sm">Accès client</h3>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isActive
              ? "bg-[#1f8a65]/15 text-[#1f8a65]"
              : isSuspended
              ? "bg-amber-500/15 text-amber-400"
              : "bg-white/[0.06] text-white/40"
          }`}>
            {isActive ? "Actif" : isSuspended ? "Suspendu" : "Inactif"}
          </span>
        </div>

        {!clientEmail ? (
          <p className="text-xs text-white/40">
            Ce client n&apos;a pas d&apos;adresse email. Ajoutez-en une pour l&apos;inviter.
          </p>
        ) : isActive ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/45">
              Le client a accès à son espace STRYV. Il peut se connecter avec son email et son mot de passe.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => void sendInvitation()}
                disabled={inviting}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 size={12} className="animate-spin" /> : invited ? <CheckCircle2 size={12} /> : <Mail size={12} />}
                {inviting ? "Envoi…" : invited ? "Invitation envoyée !" : "Renvoyer l'invitation"}
              </button>
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 rounded-lg transition-colors ml-auto"
              >
                <ShieldOff size={12} />
                Couper l&apos;accès
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/45">
              {isSuspended
                ? "L'accès de ce client a été suspendu. Vous pouvez le réactiver à tout moment."
                : "Ce client n'a pas encore accès à son espace. Envoyez-lui une invitation pour qu'il crée son mot de passe."}
            </p>
            <button
              onClick={() => void sendInvitation()}
              disabled={inviting}
              className="flex items-center gap-1.5 bg-[#1f8a65] hover:bg-[#217356] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors w-fit disabled:opacity-50"
            >
              {inviting
                ? <Loader2 size={12} className="animate-spin" />
                : invited
                ? <CheckCircle2 size={12} />
                : isSuspended
                ? <RefreshCw size={12} />
                : <Mail size={12} />}
              {inviting
                ? "Envoi…"
                : invited
                ? (isSuspended ? "Accès restauré !" : "Invitation envoyée !")
                : isSuspended
                ? "Restaurer l'accès"
                : "Inviter le client"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}
      </div>

      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] border-[0.3px] border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <UserX size={18} className="text-red-400" />
              <h3 className="font-bold text-white">Couper l&apos;accès client ?</h3>
            </div>
            <p className="text-sm text-white/50 mb-5">
              Le client sera déconnecté et ne pourra plus accéder à son espace. Vous pourrez le réactiver à tout moment.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.04] text-sm text-white/50 hover:text-white transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => void revokeAccess()}
                disabled={revoking}
                className="flex-1 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {revoking ? "Suspension…" : "Couper l'accès"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
