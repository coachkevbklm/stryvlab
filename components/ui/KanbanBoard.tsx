import React, { useState, useEffect } from "react";
import { Plus, Edit3 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type KanbanTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "done";
};

export type KanbanColumn = {
  id: string;
  title: string;
  status: KanbanTask["status"];
};

interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns?: KanbanColumn[];
  modalOpen?: boolean;
  setModalOpen?: (open: boolean) => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "À faire", status: "todo" },
  { id: "in_progress", title: "En cours", status: "in_progress" },
  { id: "done", title: "Terminé", status: "done" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks: initialTasks,
  columns = DEFAULT_COLUMNS,
  modalOpen,
  setModalOpen,
}) => {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [columnsState, setColumnsState] = useState<KanbanColumn[]>(columns);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnTitleDraft, setColumnTitleDraft] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<KanbanTask>>({
    status: "todo",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setColumnsState(columns);
  }, [columns]);

  useEffect(() => {
    fetch("/api/kanban/columns")
      .then((res) => res.json())
      .then((data) => setColumnsState(data))
      .catch(() => {});
  }, []);

  // Chargement initial depuis l'API tâches
  useEffect(() => {
    fetch("/api/kanban")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  useEffect(() => {
    if (modalOpen !== undefined) {
      setShowModal(modalOpen);
    }
  }, [modalOpen]);

  // Ajout d'une tâche (POST)
  const handleAddTask = async () => {
    if (!newTask.title) return;
    setLoading(true);
    const res = await fetch("/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        priority: newTask.priority || "medium",
        status: newTask.status || "todo",
      }),
    });
    const created = await res.json();
    setTasks((prev) => [...prev, created]);
    setShowModal(false);
    setModalOpen?.(false);
    setLoading(false);
  };

  // Suppression d'une tâche (DELETE)
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch("/api/kanban", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Mise à jour de toutes les tâches (PUT, pour drag & drop ou bulk update)
  const handleUpdateTasks = async (newTasks: KanbanTask[]) => {
    setTasks(newTasks);
    await fetch("/api/kanban", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTasks),
    });
  };

  // dnd-kit setup
  const sensors = useSensors(useSensor(PointerSensor));

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Cherche la colonne source et cible
    let sourceCol: KanbanColumn | undefined,
      targetCol: KanbanColumn | undefined;
    for (const col of columnsState) {
      if (
        tasks
          .filter((t) => t.status === col.status)
          .some((t) => t.id === active.id)
      )
        sourceCol = col;
      if (
        tasks
          .filter((t) => t.status === col.status)
          .some((t) => t.id === over.id)
      )
        targetCol = col;
    }
    if (!sourceCol || !targetCol) return;

    // Si même colonne : reorder
    if (sourceCol.id === targetCol.id) {
      const colTasks = tasks.filter((t) => t.status === sourceCol.status);
      const oldIdx = colTasks.findIndex((t) => t.id === active.id);
      const newIdx = colTasks.findIndex((t) => t.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const newColTasks = arrayMove(colTasks, oldIdx, newIdx);
      // Reconstruit la liste globale
      const newTasks = tasks.map((t) =>
        t.status === sourceCol.status
          ? newColTasks.find((nt) => nt.id === t.id) || t
          : t,
      );
      setTasks(newTasks);
      handleUpdateTasks(newTasks);
    } else {
      // Changement de colonne
      const newTasks = tasks.map((t) =>
        t.id === active.id ? { ...t, status: targetCol.status } : t,
      );
      setTasks(newTasks);
      handleUpdateTasks(newTasks);
    }
  };

  const openCreateTaskInColumn = (status: KanbanTask["status"]) => {
    setNewTask({ status, priority: "medium" });
    setShowModal(true);
    setModalOpen?.(true);
  };

  const startEditingColumn = (column: KanbanColumn) => {
    setEditingColumnId(column.id);
    setColumnTitleDraft(column.title);
  };

  const saveColumnTitle = async (columnId: string) => {
    const nextColumns = columnsState.map((col) =>
      col.id === columnId
        ? { ...col, title: columnTitleDraft.trim() || col.title }
        : col,
    );

    setColumnsState(nextColumns);
    setEditingColumnId(null);
    setColumnTitleDraft("");

    await fetch("/api/kanban/columns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextColumns),
    });
  };

  const cancelEditingColumn = () => {
    setEditingColumnId(null);
    setColumnTitleDraft("");
  };

  // SortableTask composant interne
  function SortableTask({ task }: { task: KanbanTask }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: "grab",
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white/[0.03] rounded-lg p-3 group relative"
      >
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-white font-semibold text-sm flex-1">
            {task.title}
          </span>
          <div className="flex items-center gap-2">
            {task.priority && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  task.priority === "high"
                    ? "bg-red-500/30 text-red-400"
                    : task.priority === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-green-500/20 text-green-400"
                }`}
              >
                {task.priority === "high"
                  ? "Priorité haute"
                  : task.priority === "medium"
                    ? "Moyenne"
                    : "Basse"}
              </span>
            )}
            <button
              type="button"
              className="text-white/40 hover:text-red-400 text-xs transition cursor-pointer"
              title="Supprimer cette tâche"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              ✕
            </button>
          </div>
        </div>
        {task.description && (
          <div className="text-white/50 text-xs mb-1">{task.description}</div>
        )}
        {task.dueDate && (
          <div className="text-white/30 text-[11px]">
            À faire avant : {formatDate(task.dueDate)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 w-full overflow-x-auto">
          {columnsState.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.id}
                className="flex-1 min-w-[260px] bg-[#181818] rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2 gap-3">
                  {editingColumnId === col.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveColumnTitle(col.id);
                      }}
                      className="flex flex-1 items-center gap-2"
                    >
                      <input
                        className="min-w-0 rounded-xl bg-[#0a0a0a] px-3 py-2 text-sm font-semibold text-white placeholder:text-white/30 outline-none"
                        value={columnTitleDraft}
                        onChange={(e) => setColumnTitleDraft(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveColumnTitle(col.id)}
                        className="rounded-lg bg-[#1f8a65] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#217356] transition-colors"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingColumn}
                        className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.1] transition-colors"
                      >
                        Annuler
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider">
                        {col.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => startEditingColumn(col)}
                        className="text-white/40 hover:text-white text-xs"
                        aria-label="Modifier le nom de la colonne"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openCreateTaskInColumn(col.status)}
                    className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                <SortableContext
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[32px]">
                    {colTasks.length === 0 && (
                      <div className="text-white/30 text-xs italic">
                        Aucune tâche
                      </div>
                    )}
                    {colTasks.map((task) => (
                      <SortableTask key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Modal ajout tâche */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">Nouvelle tâche</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                placeholder="Titre de la tâche"
                value={newTask.title || ""}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, title: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[70px]"
                placeholder="Description (optionnel)"
                value={newTask.description || ""}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, description: e.target.value }))
                }
              />
              <input
                type="date"
                className="w-full rounded-xl bg-[#0a0a0a] px-4 py-2 text-[14px] font-medium text-white placeholder:text-white/20 outline-none h-[44px]"
                value={newTask.dueDate || ""}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, dueDate: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <select
                  className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-white text-sm"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((t) => ({
                      ...t,
                      priority: e.target.value as KanbanTask["priority"],
                    }))
                  }
                >
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
                <select
                  className="rounded-xl bg-[#0a0a0a] px-3 py-2 text-white text-sm"
                  value={newTask.status}
                  onChange={(e) =>
                    setNewTask((t) => ({
                      ...t,
                      status: e.target.value as KanbanTask["status"],
                    }))
                  }
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalOpen?.(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] transition-colors"
                disabled={!newTask.title || loading}
              >
                {loading ? "..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
