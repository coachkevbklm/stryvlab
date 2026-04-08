"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import {
  Users,
  Calculator,
  ChevronRight,
  Settings,
  UserPlus,
  ClipboardList,
  AlertTriangle,
  CalendarCheck2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import KanbanBoard, { KanbanTask } from "@/components/ui/KanbanBoard";
import AgendaCalendar, { AgendaEvent } from "@/components/ui/AgendaCalendar";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      setLoading(false);

      Promise.all([
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/assessments/submissions").then((r) => r.json()),
      ])
        .then(([clientsData, subsData]) => {
          setClientCount(clientsData.clients?.length ?? 0);
          setSubmissionCount(subsData.submissions?.length ?? 0);
        })
        .catch(() => {});
    });
  }, [router]);

  const meta = user?.user_metadata || {};
  const firstName = meta.first_name || "";
  const coachName =
    meta.coach_name || meta.first_name || user?.email?.split("@")[0] || "Coach";
  const initials =
    (meta.first_name?.[0] || "") + (meta.last_name?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "C";
  const activeClients = meta.active_clients || "";
  const profileClientRange =
    activeClients === "30_plus"
      ? "30+"
      : activeClients === "15_30"
        ? "15–30"
        : activeClients === "5_15"
          ? "5–15"
          : activeClients === "0_5"
            ? "0–5"
            : "—";

  const hasClients = clientCount === null || clientCount > 0;

  const topBarLeft = useMemo(
    () => (
      <div className="flex flex-col leading-tight">
        <p className="text-[11px] font-medium text-white/35 uppercase tracking-[0.14em]">
          Espace Coach
        </p>
        <p className="text-[13px] font-semibold text-white/80">
          {firstName ? `Bonjour, ${firstName}` : coachName}
        </p>
      </div>
    ),
    [firstName, coachName],
  );

  useSetTopBar(topBarLeft);

  // Tâches Kanban démo (à remplacer par fetch API)
  const demoTasks: KanbanTask[] = [
    {
      id: "1",
      title: "Valider le bilan de Paul",
      status: "todo",
      priority: "high",
      dueDate: "2026-04-08",
    },
    {
      id: "2",
      title: "Relancer Julie (inactif)",
      status: "in_progress",
      priority: "medium",
      dueDate: "2026-04-09",
    },
    {
      id: "3",
      title: "Programmer séance Luc",
      status: "todo",
      priority: "low",
    },
    { id: "4", title: "Analyser progression Emma", status: "done" },
  ];

  // Événements agenda démo (à remplacer par fetch API)
  const demoEvents: AgendaEvent[] = [
    {
      id: "e1",
      title: "Séance Paul",
      date: "2026-04-08",
      time: "10:00",
      priority: "high",
    },
    {
      id: "e2",
      title: "Bilan Julie",
      date: "2026-04-09",
      time: "14:00",
      priority: "medium",
    },
    {
      id: "e3",
      title: "Appel découverte",
      date: "2026-04-10",
      time: "09:00",
      priority: "low",
    },
  ];

  const QUICK_ACTIONS = [
    {
      icon: UserPlus,
      label: "Nouveau client",
      desc: "Ajouter un profil",
      href: "/coach/clients",
      accent: true,
    },
    {
      icon: ClipboardList,
      label: "Envoyer un bilan",
      desc: "Choisir un template",
      href: "/coach/assessments",
      accent: false,
    },
    {
      icon: Calculator,
      label: "Calculer",
      desc: "Ouvrir un outil",
      href: "/outils?from=dashboard",
      accent: false,
    },
    {
      icon: Settings,
      label: "Mon profil",
      desc: "Paramètres coach",
      href: "#",
      accent: false,
    },
  ];

  if (loading) {
    return (
      <main className="font-sans">
        <div className="p-6 max-w-[1300px] mx-auto space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#181818] border-subtle rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>
                <Skeleton className="h-9 w-14" />
              </div>
            ))}
          </div>
          {/* Alertes & tâches */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          {/* Agenda */}
          <div className="mt-8">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="font-sans">
      <div className="p-6 max-w-[1300px] mx-auto">
        {/* Bannière bienvenue */}
        {!hasClients && (
          <div
            className={`mb-8 rounded-2xl bg-[#181818] border-subtle p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1.5">
                Bienvenue dans l&apos;Espace Coach
              </p>
              <h3 className="text-white text-xl font-bold tracking-tight">
                Tu viens d&apos;entrer dans la{" "}
                <span className="text-[#1f8a65]">nouvelle ère</span> du
                coaching.
              </h3>
              <p className="text-white/45 text-[13px] mt-1 leading-relaxed">
                Commence par créer ton premier client pour démarrer le suivi.
              </p>
            </div>
            <button
              onClick={() => router.push("/coach/clients")}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[#1f8a65] border-button text-white rounded-xl font-bold text-[13px] hover:bg-[#217356] transition-colors active:scale-[0.98]"
            >
              <UserPlus size={15} />
              Créer un client
            </button>
          </div>
        )}

        {/* KPIs */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {[
            {
              label: "Clients actifs",
              value:
                clientCount !== null ? String(clientCount) : profileClientRange,
              icon: Users,
              accent: true,
              href: "/coach/clients",
            },
            {
              label: "Bilans envoyés",
              value: submissionCount !== null ? String(submissionCount) : "—",
              icon: ClipboardList,
              accent: false,
              href: "/coach/assessments",
            },
            {
              label: "Outils disponibles",
              value: "12+",
              icon: Calculator,
              accent: false,
              href: "/outils?from=dashboard",
            },
            {
              label: "Alertes",
              value: "2",
              icon: AlertTriangle,
              accent: false,
              href: "#",
            },
          ].map(({ label, value, icon: Icon, accent, href }) => (
            <div
              key={label}
              onClick={() => href !== "#" && router.push(href)}
              className={`bg-[#181818] border-subtle rounded-2xl p-5 transition-colors duration-150 ${href !== "#" ? "cursor-pointer hover:bg-white/[0.06]" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.16em]">
                  {label}
                </p>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ? "bg-[#1f8a65]/20" : "bg-white/[0.04]"}`}
                >
                  <Icon
                    size={14}
                    className={accent ? "text-[#1f8a65]" : "text-white/45"}
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Alertes & tâches (Kanban) + Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#181818] border-subtle rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-yellow-400" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-wider">
                Tâches & Priorités
              </span>
            </div>
            <KanbanBoard tasks={demoTasks} />
          </div>
          <div className="bg-[#181818] border-subtle rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck2 size={18} className="text-[#1f8a65]" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-wider">
                Agenda
              </span>
            </div>
            <AgendaCalendar events={demoEvents} />
          </div>
        </div>

        {/* Actions rapides */}
        <div
          className={`transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mb-4">
            Actions Rapides
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, accent }) => (
              <button
                key={label}
                onClick={() => href !== "#" && router.push(href)}
                disabled={href === "#"}
                className="bg-[#181818] border-subtle rounded-2xl p-5 text-left group hover:bg-white/[0.06] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#181818]"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-[#1f8a65]/20" : "bg-white/0.04]"}`}
                >
                  <Icon
                    size={16}
                    className={accent ? "text-[#1f8a65]" : "text-white/45"}
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-[13px] font-semibold text-white/90">
                  {label}
                </p>
                <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
