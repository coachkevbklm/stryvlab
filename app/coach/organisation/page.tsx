"use client";
import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { KanbanBoard } from "@/components/ui/KanbanBoard";
import AgendaCalendar from "@/components/ui/AgendaCalendar";
import { useSetTopBar } from "@/components/layout/useSetTopBar";

const demoTasks = [
  {
    id: "1",
    title: "Valider le bilan de Paul",
    status: "todo" as const,
    priority: "high" as const,
    dueDate: "2026-04-08",
  },
  {
    id: "2",
    title: "Relancer Julie (inactif)",
    status: "in_progress" as const,
    priority: "medium" as const,
    dueDate: "2026-04-09",
  },
  {
    id: "3",
    title: "Programmer séance Luc",
    status: "todo" as const,
    priority: "low" as const,
  },
  { id: "4", title: "Analyser progression Emma", status: "done" as const },
];

const demoEvents = [
  {
    id: "e1",
    title: "Séance Paul",
    date: "2026-04-08",
    time: "10:00",
    priority: "high" as const,
  },
  {
    id: "e2",
    title: "Bilan Julie",
    date: "2026-04-09",
    time: "14:00",
    priority: "medium" as const,
  },
  {
    id: "e3",
    title: "Appel découverte",
    date: "2026-04-10",
    time: "09:00",
    priority: "low" as const,
  },
];

export default function OrganisationPage() {
  const [tab, setTab] = useState("kanban");
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);

  const openKanbanModal = useCallback(() => {
    setTab("kanban");
    setKanbanModalOpen(true);
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
      <button
        type="button"
        onClick={openKanbanModal}
        className="group/btn flex h-10 items-center gap-2 rounded-xl bg-[#1f8a65] px-4 pr-2 transition-all hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50"
      >
        <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
          Nouvelle tâche
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.12]">
          <Plus size={16} className="text-white" />
        </span>
      </button>
    ),
    [openKanbanModal],
  );

  useSetTopBar(topBarLeft, topBarRight);

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 bg-[#121212]">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          <KanbanBoard
            tasks={demoTasks}
            modalOpen={kanbanModalOpen}
            setModalOpen={setKanbanModalOpen}
          />
        </TabsContent>
        <TabsContent value="agenda">
          <AgendaCalendar initialEvents={demoEvents} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
