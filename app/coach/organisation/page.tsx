"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Kanban,
  Calendar,
  Trash2,
  X,
  Check,
  Edit3,
  GripVertical,
  BarChart2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanBoard, type KanbanBoard as KanbanBoardType, type KanbanTask } from "@/components/ui/KanbanBoard";
import AgendaCalendar, { type AgendaEvent } from "@/components/ui/AgendaCalendar";
import { useSetTopBar } from "@/components/layout/useSetTopBar";

type Tab = "kanban" | "agenda" | "dashboard";

// ─── Sortable board wrapper ────────────────────────────────────────────────────

function SortableBoardSection({
  board,
  colAdded,
  isDragging,
  onRename,
  onDelete,
  onAddColumn,
}: {
  board: KanbanBoardType;
  colAdded: number;
  isDragging: boolean;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddColumn: (boardId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(board.title);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const saveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === board.title) { setEditing(false); setTitleDraft(board.title); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/organisation/boards?id=${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) onRename(board.id, trimmed);
    } catch { /* silent */ }
    finally { setSaving(false); setEditing(false); }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border-[0.3px] border-white/[0.06] bg-white/[0.015] overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setConfirmDelete(false); }}
    >
      {/* Board header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab text-white/15 hover:text-white/40 transition-colors active:cursor-grabbing touch-none"
          aria-label="Réorganiser"
        >
          <GripVertical size={15} />
        </button>

        {/* Title */}
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); saveTitle(); }}
            className="flex flex-1 items-center gap-2"
          >
            <input
              autoFocus
              className="flex-1 min-w-0 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-[13px] font-bold text-white outline-none"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
            />
            <button type="submit" disabled={saving} className="text-[#1f8a65] hover:text-[#217356] transition-colors">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => { setEditing(false); setTitleDraft(board.title); }} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={14} />
            </button>
          </form>
        ) : (
          <span className="flex-1 text-[13px] font-bold text-white/70 tracking-wide">
            {board.title}
          </span>
        )}

        {/* Actions — visible on hover */}
        {!editing && (
          <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-150 ${showActions ? "opacity-100" : "opacity-0"}`}>
            <button
              type="button"
              onClick={() => { setEditing(true); setTitleDraft(board.title); }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              aria-label="Renommer"
            >
              <Edit3 size={12} />
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-[11px] text-white/40">Supprimer ?</span>
                <button
                  type="button"
                  onClick={() => onDelete(board.id)}
                  className="px-2 py-0.5 rounded-md bg-red-500/80 text-[11px] text-white font-semibold hover:bg-red-500 transition-colors"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[11px] text-white/55 hover:bg-white/[0.10] transition-colors"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                aria-label="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Kanban content */}
      <div className="p-4">
        <KanbanBoard
          key={`${board.id}-${colAdded}`}
          boardId={board.id}
          onAddColumnRequest={() => onAddColumn(board.id)}
        />
      </div>
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────

const NOTIFY_LABELS: Record<number, string> = {
  0: "au moment",
  5: "5 min",
  10: "10 min",
  15: "15 min",
  30: "30 min",
  60: "1h",
  1440: "1 jour",
};

function DashboardTab({ boards }: { boards: KanbanBoardType[] }) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [evRes, ...taskResults] = await Promise.all([
          fetch("/api/organisation/events"),
          ...boards.map((b) => fetch(`/api/organisation/tasks?boardId=${b.id}`)),
        ]);
        if (evRes.ok) {
          const data = await evRes.json();
          setEvents(Array.isArray(data) ? data : []);
        }
        const allTasks: KanbanTask[] = [];
        for (const res of taskResults) {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) allTasks.push(...data);
          }
        }
        setTasks(allTasks);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [boards]);

  const todayEvents = events
    .filter((e) => e.event_date === todayKey)
    .sort((a, b) => (a.event_time ?? "").localeCompare(b.event_time ?? ""));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const upcoming = events
    .filter((e) => {
      if (!e.notify_minutes_before || e.is_completed) return false;
      if (!e.event_time) return false;
      const evDate = new Date(`${e.event_date}T${e.event_time}`);
      const diffMin = (evDate.getTime() - now.getTime()) / 60000;
      return diffMin >= 0 && diffMin <= 1440;
    })
    .sort((a, b) => `${a.event_date}T${a.event_time}`.localeCompare(`${b.event_date}T${b.event_time}`));

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.06] p-5 space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 — Today's events */}
      <div className="rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f8a65]/15">
            <Calendar size={13} className="text-[#1f8a65]" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">Aujourd&apos;hui</p>
            <p className="text-[12px] font-bold text-white leading-none">Événements du jour</p>
          </div>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-[12px] text-white/25 italic text-center py-4">Aucun événement aujourd&apos;hui</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((ev) => (
              <div key={ev.id} className={`rounded-xl p-3 transition-colors ${ev.is_completed ? "bg-white/[0.015]" : "bg-white/[0.04] hover:bg-white/[0.06]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {ev.is_completed && <CheckCircle2 size={12} className="text-[#1f8a65] flex-shrink-0" />}
                    <p className={`text-[12px] font-medium truncate ${ev.is_completed ? "line-through text-white/30" : "text-white"}`}>
                      {ev.title}
                    </p>
                  </div>
                  {ev.event_time && (
                    <span className="text-[10px] text-white/35 flex-shrink-0">{ev.event_time}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {ev.linked_column_title && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/40">
                      <Kanban size={8} />
                      {ev.linked_column_title}
                    </span>
                  )}
                  {ev.template_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30">
                      {ev.template_type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 2 — Task completion rate */}
      <div className="rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <BarChart2 size={13} className="text-white/60" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">Kanban</p>
            <p className="text-[12px] font-bold text-white leading-none">Taux de complétion</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-[32px] font-black text-white leading-none">{completionRate}<span className="text-[18px] text-white/40">%</span></span>
            <span className="text-[11px] text-white/35 mb-1">{completedTasks} / {totalTasks} tâches</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1f8a65] transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {boards.map((board) => {
          const boardTasks = tasks.filter((t) => t.board_id === board.id);
          const done = boardTasks.filter((t) => t.is_completed).length;
          const pct = boardTasks.length > 0 ? Math.round((done / boardTasks.length) * 100) : 0;
          return (
            <div key={board.id} className="mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/50 truncate">{board.title}</span>
                <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">{done}/{boardTasks.length}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1f8a65]/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Card 3 — Upcoming notifications */}
      <div className="rounded-2xl bg-[#181818] border-[0.3px] border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <Bell size={13} className="text-white/60" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 leading-none mb-0.5">À venir</p>
            <p className="text-[12px] font-bold text-white leading-none">Rappels (24h)</p>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-white/25 italic text-center py-4">Aucun rappel dans les 24h</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => {
              const evDt = new Date(`${ev.event_date}T${ev.event_time}`);
              const diffMin = Math.round((evDt.getTime() - now.getTime()) / 60000);
              const label = diffMin < 60
                ? `dans ${diffMin} min`
                : diffMin < 1440
                ? `dans ${Math.round(diffMin / 60)}h`
                : `dans ${Math.round(diffMin / 1440)}j`;
              return (
                <div key={ev.id} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1f8a65]/15 flex-shrink-0 mt-0.5">
                    <Bell size={10} className="text-[#1f8a65]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#1f8a65]/80">{label}</span>
                      {ev.notify_minutes_before != null && (
                        <span className="text-[10px] text-white/25">
                          rappel {NOTIFY_LABELS[ev.notify_minutes_before] ?? `${ev.notify_minutes_before}min`} avant
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OrganisationPage() {
  const [tab, setTab] = useState<Tab>("kanban");
  const [boards, setBoards] = useState<KanbanBoardType[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [agendaModalOpen, setAgendaModalOpen] = useState(false);

  // Board creation
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [savingBoard, setSavingBoard] = useState(false);

  // Column addition — tracks which board to add to
  const [addColModal, setAddColModal] = useState<{ boardId: string } | null>(null);
  const [newColTitle, setNewColTitle] = useState("");
  const [savingCol, setSavingCol] = useState(false);
  const [colAdded, setColAdded] = useState<Record<string, number>>({});

  // Board drag
  const [activeDragBoardId, setActiveDragBoardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ─── Load boards ─────────────────────────────────────────────────────────────

  const loadBoards = useCallback(async () => {
    setLoadingBoards(true);
    try {
      const res = await fetch("/api/organisation/boards");
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[loadBoards] HTTP', res.status, errBody);
        throw new Error(`HTTP ${res.status}: ${errBody?.error ?? 'Unknown error'}`);
      }
      const data: KanbanBoardType[] = await res.json();

      if (data.length === 0) {
        const created = await fetch("/api/organisation/boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Tableau principal" }),
        });
        if (created.ok) {
          const board = await created.json();
          setBoards([board]);
        }
      } else {
        setBoards(data);
      }
    } catch (err) {
      console.error('[loadBoards] caught:', err);
    }
    finally { setLoadingBoards(false); }
  }, []);

  useEffect(() => { loadBoards(); }, [loadBoards]);

  // ─── Board CRUD ───────────────────────────────────────────────────────────────

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    setSavingBoard(true);
    try {
      const res = await fetch("/api/organisation/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBoardTitle.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Erreur");
        return;
      }
      const board = await res.json();
      setBoards((prev) => [...prev, { ...board, order: prev.length }]);
      setCreatingBoard(false);
      setNewBoardTitle("");
    } catch { /* silent */ }
    finally { setSavingBoard(false); }
  };

  const handleDeleteBoard = async (id: string) => {
    if (boards.length <= 1) { alert("Impossible de supprimer le dernier tableau"); return; }
    const res = await fetch(`/api/organisation/boards?id=${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error ?? "Erreur"); return; }
    setBoards((prev) => prev.filter((b) => b.id !== id));
  };

  const handleRenameBoard = (id: string, title: string) => {
    setBoards((prev) => prev.map((b) => b.id === id ? { ...b, title } : b));
  };

  // ─── Board drag reorder ───────────────────────────────────────────────────────

  const handleBoardDragStart = (event: DragStartEvent) => {
    setActiveDragBoardId(String(event.active.id));
  };

  const handleBoardDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragBoardId(null);
    if (!over || active.id === over.id) return;

    const oldIdx = boards.findIndex((b) => b.id === active.id);
    const newIdx = boards.findIndex((b) => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(boards, oldIdx, newIdx);
    setBoards(reordered);

    // Persist new order for each board
    await Promise.all(
      reordered.map((board, index) =>
        fetch(`/api/organisation/boards?id=${board.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    );
  };

  // ─── Column addition ──────────────────────────────────────────────────────────

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim() || !addColModal) return;
    setSavingCol(true);
    try {
      const res = await fetch("/api/organisation/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: addColModal.boardId, title: newColTitle.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      // Increment counter for this specific board to re-mount its KanbanBoard
      setColAdded((prev) => ({ ...prev, [addColModal.boardId]: (prev[addColModal.boardId] ?? 0) + 1 }));
      setAddColModal(null);
      setNewColTitle("");
    } catch { /* silent */ }
    finally { setSavingCol(false); }
  };

  // ─── TopBar ───────────────────────────────────────────────────────────────────

  const openNewEvent = useCallback(() => {
    setTab("agenda");
    setAgendaModalOpen(true);
  }, []);

  const topBarLeft = useMemo(
    () => (
      <div className="flex flex-col">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30 leading-none mb-0.5">
          Espace Coach
        </span>
        <span className="text-[13px] font-semibold text-white leading-none">
          Organisation
        </span>
      </div>
    ),
    [],
  );

  const topBarRight = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {tab === "kanban" && boards.length < 10 && (
          <button
            type="button"
            onClick={() => setCreatingBoard(true)}
            className="flex items-center gap-2 px-3 h-8 rounded-lg bg-white/[0.04] text-[12px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition-all"
          >
            <Plus size={13} />
            Nouveau tableau
          </button>
        )}
        <button
          type="button"
          onClick={openNewEvent}
          className="flex items-center gap-2 px-4 h-8 rounded-lg bg-[#1f8a65] text-[12px] font-bold text-white hover:bg-[#217356] transition-colors active:scale-[0.98]"
        >
          <Plus size={13} />
          Nouvel événement
        </button>
      </div>
    ),
    [tab, boards.length, openNewEvent],
  );

  useSetTopBar(topBarLeft, topBarRight);

  // ─── Render ───────────────────────────────────────────────────────────────────

  const activeDragBoard = boards.find((b) => b.id === activeDragBoardId);

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 bg-[#121212]">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("kanban")}
          className={`flex items-center gap-2 px-4 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
            tab === "kanban"
              ? "bg-white/[0.07] text-white"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
          }`}
        >
          <Kanban size={13} />
          Kanban
        </button>
        <button
          type="button"
          onClick={() => setTab("agenda")}
          className={`flex items-center gap-2 px-4 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
            tab === "agenda"
              ? "bg-white/[0.07] text-white"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
          }`}
        >
          <Calendar size={13} />
          Agenda
        </button>
        <button
          type="button"
          onClick={() => setTab("dashboard")}
          className={`flex items-center gap-2 px-4 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
            tab === "dashboard"
              ? "bg-white/[0.07] text-white"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
          }`}
        >
          <BarChart2 size={13} />
          Résumé
        </button>
      </div>

      {/* ─── Kanban tab ─── */}
      {tab === "kanban" && (
        <>
          {loadingBoards ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border-[0.3px] border-white/[0.06] bg-white/[0.015] overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                    <div className="h-3 w-32 rounded-full bg-white/[0.06] animate-pulse" />
                  </div>
                  <div className="p-4 flex gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex-shrink-0 w-[280px] rounded-xl bg-white/[0.02] border-[0.3px] border-white/[0.06] p-3 space-y-3 h-40">
                        <div className="h-3 w-20 rounded-full bg-white/[0.06] animate-pulse" />
                        <div className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-[0.3px] border-white/[0.05] bg-white/[0.01]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                <Kanban size={22} className="text-white/25" />
              </div>
              <p className="text-[13px] text-white/35">Aucun tableau kanban</p>
              <button
                type="button"
                onClick={() => setCreatingBoard(true)}
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-[#1f8a65] text-[13px] font-bold text-white hover:bg-[#217356] transition-colors"
              >
                <Plus size={14} />
                Créer un tableau
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleBoardDragStart}
              onDragEnd={handleBoardDragEnd}
            >
              <SortableContext
                items={boards.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6">
                  {boards.map((board) => (
                    <SortableBoardSection
                      key={board.id}
                      board={board}
                      colAdded={colAdded[board.id] ?? 0}
                      isDragging={activeDragBoardId === board.id}
                      onRename={handleRenameBoard}
                      onDelete={handleDeleteBoard}
                      onAddColumn={(boardId) => setAddColModal({ boardId })}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Ghost overlay while dragging a board */}
              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeDragBoard && (
                  <div className="rounded-2xl border border-[#1f8a65]/30 bg-[#181818] p-4 shadow-2xl opacity-90">
                    <p className="text-[13px] font-bold text-white/60">{activeDragBoard.title}</p>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* "Ajouter un tableau" footer link */}
          {!loadingBoards && boards.length > 0 && boards.length < 10 && (
            <button
              type="button"
              onClick={() => setCreatingBoard(true)}
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border-[0.3px] border-dashed border-white/[0.08] text-[12px] text-white/25 hover:text-white/50 hover:border-white/[0.16] transition-all"
            >
              <Plus size={13} />
              Ajouter un tableau
            </button>
          )}
        </>
      )}

      {/* ─── Dashboard tab ─── */}
      {tab === "dashboard" && (
        <DashboardTab boards={boards} />
      )}

      {/* ─── Agenda tab ─── */}
      {tab === "agenda" && (
        <div className="bg-[#181818] border-[0.3px] border-white/[0.06] rounded-2xl p-5">
          <AgendaCalendar
            modalOpen={agendaModalOpen}
            setModalOpen={setAgendaModalOpen}
          />
        </div>
      )}

      {/* ─── Create board modal ─── */}
      {creatingBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border-[0.3px] border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white text-[15px] mb-1">Nouveau tableau Kanban</h3>
            <p className="text-[11px] text-white/30 mb-4">
              {10 - boards.length} emplacement{10 - boards.length !== 1 ? "s" : ""} restant{10 - boards.length !== 1 ? "s" : ""}
            </p>
            <form onSubmit={handleCreateBoard} className="space-y-3">
              <input
                autoFocus
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                placeholder="Nom du tableau"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCreatingBoard(false); setNewBoardTitle(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newBoardTitle.trim() || savingBoard}
                  className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-colors"
                >
                  {savingBoard ? "..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add column modal ─── */}
      {addColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#181818] border-[0.3px] border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white text-[15px] mb-1">Nouvelle colonne</h3>
            <p className="text-[11px] text-white/30 mb-4">
              Tableau : {boards.find((b) => b.id === addColModal.boardId)?.title}
            </p>
            <form onSubmit={handleAddColumn} className="space-y-3">
              <input
                autoFocus
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                placeholder="Nom de la colonne"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAddColModal(null); setNewColTitle(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newColTitle.trim() || savingCol}
                  className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-colors"
                >
                  {savingCol ? "..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
