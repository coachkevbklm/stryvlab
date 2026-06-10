"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dumbbell,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  BookmarkPlus,
  AlertTriangle,
  Copy,
  BarChart3,
  Clock3,
  Layers3,
} from "lucide-react";
import SaveAsTemplateModal from "@/components/programs/SaveAsTemplateModal";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgramStats {
  session_count: number;
  exercise_count: number;
  planned_set_count: number;
  completed_session_count: number;
  avg_duration_min: number | null;
  total_volume_kg: number;
  total_reps: number;
  latest_completed_at: string | null;
  volume_series: { date: string; value: number }[];
  recent_session_dates: string[];
}

interface ProgramSession {
  id: string;
  name: string;
  day_of_week?: number | null;
  days_of_week?: number[] | null;
  position?: number | null;
  notes?: string | null;
  program_exercises?: Array<{ id: string; name: string; sets?: number | null }>;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  status: "active" | "archived";
  is_client_visible: boolean;
  created_at: string;
  goal?: string;
  level?: string;
  frequency?: number;
  muscle_tags?: string[];
  equipment_archetype?: string;
  session_mode?: string;
  program_sessions?: ProgramSession[];
  program_stats?: ProgramStats;
}

interface Props {
  clientId: string;
  onSelectProgram: (program: Program) => void;
  onProgramDuplicated?: (program: Program) => void;
  onCreateProgram?: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "Hypertrophie",
  strength: "Force",
  endurance: "Endurance",
  fat_loss: "Perte de gras",
  recomp: "Recomposition",
  maintenance: "Maintenance",
  athletic: "Athletic",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  elite: "Élite",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatVolume(value: number | null | undefined) {
  const amount = Number(value) || 0;
  if (amount <= 0) return "—";
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)} t`;
  return `${Math.round(amount)} kg`;
}

function formatSignedPercent(value: number | null) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function normalizeDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildRecentHeatmap(dates: string[] | null | undefined, days = 30) {
  const counts = new Map<string, number>();

  for (const value of dates ?? []) {
    const key = normalizeDayKey(value);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: Array<{ key: string; count: number; label: string }> = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - index);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    cells.push({
      key,
      count: counts.get(key) ?? 0,
      label: current.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    });
  }

  return cells;
}

function buildProgramType(program: Program) {
  const goal = program.goal ? GOAL_LABELS[program.goal] ?? program.goal : null;
  const level = program.level ? LEVEL_LABELS[program.level] ?? program.level : null;
  return [goal, level].filter(Boolean).join(" · ") || "Programme personnalisé";
}

function buildStructure(program: Program) {
  const sessions = (program.program_sessions ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const firstLabel = sessions.find((session) => session.name?.trim())?.name?.trim();
  if (!firstLabel) return "Structure à définir";
  return sessions.length > 1 ? `${firstLabel} +${sessions.length - 1}` : firstLabel;
}

function Sparkline({
  points,
  color,
}: {
  points: number[];
  color: string;
}) {
  if (points.length === 0) {
    return <div className="h-16 w-[168px] rounded-2xl bg-white/[0.025]" />;
  }

  const width = 168;
  const height = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coordinates = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : 10 + (index / (points.length - 1)) * (width - 20);
      const y = height - ((point - min) / range) * (height - 24) - 12;
      return { x, y };
    });
  const path = coordinates
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L${coordinates[coordinates.length - 1].x.toFixed(2)},${(height - 6).toFixed(2)} L${coordinates[0].x.toFixed(2)},${(height - 6).toFixed(2)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-[168px]">
      <defs>
        <linearGradient id="volume-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#volume-area)" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coordinates.map(({ x, y }, index) => (
        <circle
          key={`${x}-${y}-${index}`}
          cx={x}
          cy={y}
          r={index === coordinates.length - 1 ? 3 : 2}
          fill={color}
          fillOpacity={index === coordinates.length - 1 ? 1 : 0.65}
        />
      ))}
    </svg>
  );
}

function ActivityHeatmap({ dates }: { dates: string[] | null | undefined }) {
  const cells = buildRecentHeatmap(dates);
  const activeDays = cells.filter((cell) => cell.count > 0).length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1.5">
        {cells.map((cell) => {
          const tone =
            cell.count >= 3
              ? "bg-[#1f8a65]"
              : cell.count === 2
                ? "bg-[#1f8a65]/80"
                : cell.count === 1
                  ? "bg-[#1f8a65]/45"
                  : "bg-white/[0.08]";

          return (
            <div
              key={cell.key}
              title={`${cell.label}${cell.count > 0 ? ` · ${cell.count} séance${cell.count > 1 ? "s" : ""}` : " · aucune séance"}`}
              className={`h-5 rounded-[6px] border border-white/[0.04] ${tone}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/35">
        <span>30 derniers jours</span>
        <span>{activeDays} jour{activeDays > 1 ? "s" : ""} actif{activeDays > 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

export default function ClientProgramsList({ clientId, onSelectProgram, onProgramDuplicated }: Props) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Program | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState<Program | null>(null);
  const [saveAsTemplateTarget, setSaveAsTemplateTarget] = useState<Program | null>(null);

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

  async function confirmAndDuplicate() {
    if (!confirmDuplicate) return;
    const program = confirmDuplicate;
    setConfirmDuplicate(null);
    setDuplicatingId(program.id);
    try {
      const res = await fetch(`/api/programs/${program.id}/duplicate`, { method: "POST" });
      const d = await res.json();
      if (!res.ok || !d.program) {
        throw new Error(d.error ?? "Erreur de duplication");
      }
      setPrograms((prev) => [d.program, ...prev]);
      onProgramDuplicated?.(d.program);
    } catch (e: any) {
      setError(e.message ?? "Erreur de duplication");
    } finally {
      setDuplicatingId(null);
    }
  }

  const activePrograms = programs.filter((p) => p.status === "active");
  const archivedPrograms = programs.filter((p) => p.status === "archived");

  if (loading) {
    return (
      <div className="grid max-w-[1480px] gap-5 2xl:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] border-[0.3px] border-white/[0.06] bg-white/[0.02] p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-3 h-8 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
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
      {saveAsTemplateTarget && (
        <SaveAsTemplateModal
          programId={saveAsTemplateTarget.id}
          programName={saveAsTemplateTarget.name}
          onClose={() => setSaveAsTemplateTarget(null)}
        />
      )}
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
      {confirmDuplicate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm border-[0.3px] border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                <Copy size={16} className="text-sky-300" />
              </div>
              <h3 className="font-bold text-white text-[15px]">Dupliquer le programme ?</h3>
            </div>
            <p className="text-[13px] text-white/55 mb-5 leading-relaxed">
              Une copie complète de <span className="text-white font-medium">&ldquo;{confirmDuplicate.name}&rdquo;</span> sera créée
              sous le nom <span className="text-white font-medium">&ldquo;{confirmDuplicate.name} copy&rdquo;</span>, prête à être modifiée sans
              impacter l&apos;original.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDuplicate(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmAndDuplicate}
                className="flex-1 py-2.5 rounded-xl bg-sky-500/80 text-white text-[13px] font-bold hover:bg-sky-500 transition-colors"
              >
                Dupliquer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {activePrograms.length === 0 ? (
          <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-8 text-center">
            <Dumbbell size={28} className="text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50 mb-1">Aucun programme assigné</p>
            <p className="text-[11px] text-white/30">
              Créez un programme vide ou assignez un template existant.
            </p>
          </div>
        ) : (
          <div className="grid max-w-[1480px] gap-5 2xl:grid-cols-2">
            {activePrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                togglingId={togglingId}
                deletingId={deletingId}
                duplicatingId={duplicatingId}
                onSelect={() => onSelectProgram(program)}
                onToggle={() => toggleVisibility(program)}
                onDuplicate={() => setConfirmDuplicate(program)}
                onDelete={() => setConfirmDelete(program)}
                onSaveAsTemplate={() => setSaveAsTemplateTarget(program)}
              />
            ))}
          </div>
        )}

        {archivedPrograms.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
              Archivés
            </p>
            <div className="grid max-w-[1480px] gap-5 2xl:grid-cols-2 opacity-60">
              {archivedPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  togglingId={togglingId}
                  deletingId={deletingId}
                  duplicatingId={duplicatingId}
                  onSelect={() => onSelectProgram(program)}
                  onToggle={() => toggleVisibility(program)}
                  onDuplicate={() => setConfirmDuplicate(program)}
                  onDelete={() => setConfirmDelete(program)}
                  onSaveAsTemplate={() => setSaveAsTemplateTarget(program)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ProgramCard({
  program,
  togglingId,
  deletingId,
  duplicatingId,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
  onSaveAsTemplate,
}: {
  program: Program;
  togglingId: string | null;
  deletingId: string | null;
  duplicatingId: string | null;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate: () => void;
}) {
  const isToggling = togglingId === program.id;
  const isDeleting = deletingId === program.id;
  const isDuplicating = duplicatingId === program.id;
  const stats = program.program_stats;
  const goalLabel = program.goal ? GOAL_LABELS[program.goal] ?? program.goal : null;
  const levelLabel = program.level ? LEVEL_LABELS[program.level] ?? program.level : null;
  const structure = buildStructure(program);
  const volumePoints = (stats?.volume_series ?? []).map((point) => point.value);
  const trendDelta = volumePoints.length >= 2 && volumePoints[0] > 0
    ? Math.round(((volumePoints[volumePoints.length - 1] - volumePoints[0]) / volumePoints[0]) * 100)
    : null;
  const trendTone =
    trendDelta == null
      ? "neutral"
      : trendDelta > 6
        ? "up"
        : trendDelta < -6
          ? "down"
          : "neutral";
  const trendLabel =
    trendTone === "up" ? "Hausse" : trendTone === "down" ? "Baisse" : "Stable";

  const quickNote =
    program.muscle_tags && program.muscle_tags.length > 0
      ? program.muscle_tags.slice(0, 3).join(" · ")
      : "Programme structuré pour ce client";

  const metricCards = [
    {
      label: "Structure",
      value: `${stats?.session_count ?? program.program_sessions?.length ?? 0} séances`,
      detail: structure,
      icon: Layers3,
    },
    {
      label: "Exercices",
      value: `${stats?.exercise_count ?? 0} exercices · ${stats?.planned_set_count ?? 0} séries`,
      detail: "Charge programmée",
      icon: Dumbbell,
    },
    {
      label: "Volume réel",
      value: formatVolume(stats?.total_volume_kg),
      detail: stats?.total_reps ? `${stats.total_reps} reps cumulées` : "Aucune charge enregistrée",
      icon: BarChart3,
    },
    {
      label: "Durée moyenne",
      value: stats?.avg_duration_min ? `${stats.avg_duration_min} min` : "—",
      detail: `${stats?.completed_session_count ?? 0} séances enregistrées`,
      icon: Clock3,
    },
  ];

  return (
    <div className="group rounded-[24px] border-[0.3px] border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] p-4 transition-colors hover:bg-[#191919] md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                program.is_client_visible
                  ? "bg-[#1f8a65]/10 text-[#8ce7c4]"
                  : "bg-white/[0.04] text-white/32"
              }`}
            >
              {program.is_client_visible ? "Actif app" : "Hors app"}
            </span>
            {goalLabel ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/44">
                {goalLabel}
              </span>
            ) : null}
            {levelLabel ? (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/44">
                {levelLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-white">{program.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/42">
            <span>Créé le {formatDate(program.created_at)}</span>
            <span>{program.weeks ?? 0} sem.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={onToggle}
            disabled={isToggling}
            title={program.is_client_visible ? "Visible sur l'app client — cliquer pour masquer" : "Masqué sur l'app client — cliquer pour activer"}
            className={`h-8 rounded-xl px-2.5 text-[10px] font-bold transition-colors ${
              program.is_client_visible
                ? "bg-[#1f8a65]/10 text-[#8ce7c4] hover:bg-[#1f8a65]/16"
                : "bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/55"
            }`}
          >
            {isToggling ? <Loader2 size={12} className="animate-spin" /> : program.is_client_visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button
            onClick={onDuplicate}
            disabled={isDuplicating}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white/[0.04] px-2.5 text-[10px] font-semibold text-white/50 transition-colors hover:bg-sky-500/10 hover:text-sky-300"
            title="Dupliquer le programme"
          >
            {isDuplicating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Copy size={12} />
            )}
            <span>Dupliquer</span>
          </button>
          <button
            onClick={onSaveAsTemplate}
            className="h-8 w-8 rounded-xl bg-white/[0.04] text-white/25 transition-colors hover:bg-white/[0.08] hover:text-white/60"
            title="Enregistrer comme template"
          >
            <BookmarkPlus size={12} className="mx-auto" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 w-8 rounded-xl bg-white/[0.04] text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Supprimer le programme"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin mx-auto" /> : <Trash2 size={12} className="mx-auto" />}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {metricCards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.04] bg-black/10 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Icon size={12} className="shrink-0 text-white/28" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">{label}</p>
            </div>
            <p className="mt-2 text-[15px] font-semibold text-white">{value}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.04] bg-black/10 px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={12} className="text-white/28" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Progression du volume</p>
            </div>
            <div className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              trendTone === "up"
                ? "bg-[#1f8a65]/12 text-[#8ce7c4]"
                : trendTone === "down"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-white/[0.05] text-white/45"
            }`}>
              {trendLabel}
            </div>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-[20px] font-semibold text-white">{formatVolume(stats?.total_volume_kg)}</p>
            <p className={`text-[11px] font-medium ${
              trendTone === "up"
                ? "text-[#8ce7c4]"
                : trendTone === "down"
                  ? "text-red-300"
                  : "text-white/45"
            }`}>
              {formatSignedPercent(trendDelta)}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-white/42">
            {stats?.volume_series?.length ? `${stats.volume_series.length} séances suivies` : "Aucune série exploitable"}
          </p>
          <div className="mt-3 rounded-2xl border border-white/[0.04] bg-black/20 px-3 py-2">
            <div className="flex justify-center">
              <Sparkline points={volumePoints} color="#79e2c0" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-black/10 px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock3 size={12} className="text-white/28" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Activité récente</p>
            </div>
            <div className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {stats?.completed_session_count ?? 0} logs
            </div>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-[20px] font-semibold text-white">
              {stats?.completed_session_count ?? 0} séance{(stats?.completed_session_count ?? 0) > 1 ? "s" : ""}
            </p>
            <p className="text-[11px] text-white/45">
              sur 30 jours
            </p>
          </div>
          <p className="mt-1 text-[11px] text-white/42">
            {stats?.latest_completed_at ? `Dernière séance ${formatShortDate(stats.latest_completed_at)}` : "Aucune activité récente"}
          </p>
          <div className="mt-3 rounded-2xl border border-white/[0.04] bg-black/20 px-3 py-3">
            <ActivityHeatmap dates={stats?.recent_session_dates} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3.5">
        <div className="text-[11px] text-white/42">{quickNote}</div>
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/[0.1]"
          title="Ouvrir le programme"
        >
          Ouvrir
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
