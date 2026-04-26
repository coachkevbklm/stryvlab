"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Dumbbell,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Library,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Program {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  status: "active" | "archived";
  is_client_visible: boolean;
  created_at: string;
}

interface Props {
  clientId: string;
  onSelectProgram: (program: Program) => void;
}

export default function ClientProgramsList({ clientId, onSelectProgram }: Props) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingEmpty, setCreatingEmpty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Program | null>(null);

  const fetchPrograms = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/programs?client_id=${clientId}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setPrograms(d.programs ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  async function toggleVisibility(program: Program) {
    setTogglingId(program.id);
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_client_visible: !program.is_client_visible }),
      });
      if (res.ok) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === program.id
              ? { ...p, is_client_visible: !p.is_client_visible }
              : p
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return;
    const program = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(program.id);
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: "DELETE" });
      if (res.ok) {
        setPrograms((prev) => prev.filter((p) => p.id !== program.id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function createEmptyProgram() {
    setCreatingEmpty(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, name: "Nouveau programme", weeks: 4 }),
      });
      const d = await res.json();
      if (res.ok && d.program) {
        const newProgram: Program = {
          ...d.program,
          is_client_visible: d.program.is_client_visible ?? false,
        };
        setPrograms((prev) => [newProgram, ...prev]);
        onSelectProgram(newProgram);
      }
    } finally {
      setCreatingEmpty(false);
    }
  }

  const activePrograms = programs.filter((p) => p.status === "active");
  const archivedPrograms = programs.filter((p) => p.status === "archived");

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/[0.02] rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-6 text-center">
        <p className="text-sm text-white/50">{error}</p>
        <button
          onClick={fetchPrograms}
          className="mt-3 text-xs text-[#1f8a65] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
    {/* Modal confirmation suppression */}
    {confirmDelete && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <h3 className="font-bold text-white text-[15px]">Supprimer le programme ?</h3>
          </div>
          <p className="text-[13px] text-white/55 mb-5 leading-relaxed">
            <span className="text-white font-medium">&ldquo;{confirmDelete.name}&rdquo;</span> sera définitivement supprimé. Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={confirmAndDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-500/80 text-white text-[13px] font-bold hover:bg-red-500 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={createEmptyProgram}
          disabled={creatingEmpty}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1f8a65] text-white text-[12px] font-bold hover:bg-[#217356] transition-colors disabled:opacity-50"
        >
          {creatingEmpty ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Nouveau programme
        </button>
        <button
          onClick={() => router.push("/coach/programs/templates")}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] text-white/60 text-[12px] font-bold hover:bg-white/[0.08] hover:text-white/80 transition-colors"
        >
          <Library size={12} />
          Assigner un template
        </button>
      </div>

      {/* Liste programmes actifs */}
      {activePrograms.length === 0 ? (
        <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-8 text-center">
          <Dumbbell size={28} className="text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-1">Aucun programme assigné</p>
          <p className="text-[11px] text-white/30">
            Créez un programme vide ou assignez un template existant.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activePrograms.map((program) => (
            <ProgramRow
              key={program.id}
              program={program}
              togglingId={togglingId}
              deletingId={deletingId}
              onSelect={() => onSelectProgram(program)}
              onToggle={() => toggleVisibility(program)}
              onDelete={() => setConfirmDelete(program)}
            />
          ))}
        </div>
      )}

      {/* Programmes archivés */}
      {archivedPrograms.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2">
            Archivés
          </p>
          <div className="space-y-2 opacity-60">
            {archivedPrograms.map((program) => (
              <ProgramRow
                key={program.id}
                program={program}
                togglingId={togglingId}
                deletingId={deletingId}
                onSelect={() => onSelectProgram(program)}
                onToggle={() => toggleVisibility(program)}
                onDelete={() => setConfirmDelete(program)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function ProgramRow({
  program,
  togglingId,
  deletingId,
  onSelect,
  onToggle,
  onDelete,
}: {
  program: Program;
  togglingId: string | null;
  deletingId: string | null;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isToggling = togglingId === program.id;
  const isDeleting = deletingId === program.id;

  return (
    <div className="flex items-center gap-2 bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.04] transition-colors group">
      {/* Icone */}
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        <Dumbbell size={15} className="text-white/40" />
      </div>

      {/* Infos — cliquable pour ouvrir l'éditeur */}
      <button
        onClick={onSelect}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-[13px] font-semibold text-white truncate">{program.name}</p>
        <p className="text-[11px] text-white/40">
          {program.weeks} sem.
          {program.description ? ` · ${program.description}` : ""}
        </p>
      </button>

      {/* Badge visibilité client */}
      <button
        onClick={onToggle}
        disabled={isToggling}
        title={program.is_client_visible ? "Visible sur l'app client — cliquer pour masquer" : "Masqué sur l'app client — cliquer pour activer"}
        className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
          program.is_client_visible
            ? "bg-[#1f8a65]/10 text-[#1f8a65] hover:bg-[#1f8a65]/20"
            : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50"
        }`}
      >
        {isToggling ? (
          <Loader2 size={10} className="animate-spin" />
        ) : program.is_client_visible ? (
          <Eye size={10} />
        ) : (
          <EyeOff size={10} />
        )}
        <span>{program.is_client_visible ? "Actif" : "Inactif"}</span>
      </button>

      {/* Bouton éditer */}
      <button
        onClick={onSelect}
        className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:bg-white/[0.08] hover:text-white/60 transition-colors shrink-0"
        title="Ouvrir l'éditeur"
      >
        <ChevronRight size={13} />
      </button>

      {/* Bouton supprimer */}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        title="Supprimer le programme"
      >
        {isDeleting ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <Trash2 size={11} />
        )}
      </button>
    </div>
  );
}
