"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  X,
  Loader2,
  Mail,
  Phone,
  Target,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Filter,
  LayoutGrid,
  List,
  Tag,
  CreditCard,
  TrendingUp,
  Clock,
  Euro,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useDock } from "@/components/layout/DockContext";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tag = { id: string; name: string; color: string };

type Subscription = {
  id: string;
  status: string;
  formula: { name: string; price_eur: number; billing_cycle: string } | null;
};

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  goal: string | null;
  notes: string | null;
  status: "active" | "inactive" | "archived";
  training_goal: string | null;
  fitness_level: string | null;
  created_at: string;
  // enriched client-side
  tags?: Tag[];
  subscriptions?: Subscription[];
  lastActivity?: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const TRAINING_GOALS = [
  { value: "hypertrophy", label: "Hypertrophie" },
  { value: "strength", label: "Force" },
  { value: "fat_loss", label: "Perte de gras" },
  { value: "endurance", label: "Endurance" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Maintenance" },
  { value: "athletic", label: "Athletic" },
];
const FITNESS_LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "elite", label: "Élite" },
];
const SPORT_PRACTICES = [
  { value: "sedentary", label: "Sédentaire" },
  { value: "light", label: "Légèrement actif" },
  { value: "moderate", label: "Modérément actif" },
  { value: "active", label: "Actif" },
  { value: "athlete", label: "Athlète" },
];

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "Hypertrophie",
  strength: "Force",
  fat_loss: "Perte de gras",
  endurance: "Endurance",
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
const STATUS_CONFIG = {
  active: { label: "Actif", cls: "bg-[#1f8a65]/15 text-[#1f8a65]" },
  inactive: { label: "Inactif", cls: "bg-amber-500/15 text-amber-400" },
  archived: { label: "Archivé", cls: "bg-white/[0.06] text-white/35" },
};
const SUB_STATUS_CONFIG: Record<string, { dot: string }> = {
  active: { dot: "bg-emerald-400" },
  trial: { dot: "bg-blue-400" },
  paused: { dot: "bg-amber-400" },
  cancelled: { dot: "bg-red-400" },
  expired: { dot: "bg-white/30" },
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  training_goal: string;
  fitness_level: string;
  sport_practice: string;
  weekly_frequency: string;
  notes: string;
};
const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  training_goal: "",
  fitness_level: "",
  sport_practice: "",
  weekly_frequency: "",
  notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(c: Client) {
  return `${c.first_name[0] ?? ""}${c.last_name[0] ?? ""}`.toUpperCase();
}

function avatarColor(id: string) {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xfffffff;
  return colors[hash % colors.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CoachClientsPage() {
  const router = useRouter();
  const { openClient } = useDock();

  const [clients, setClients] = useState<Client[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const topBarLeft = useMemo(
    () => (
      <p className="text-[13px] font-semibold text-white leading-none">
        Clients
      </p>
    ),
    [],
  );

  const topBarRight = useMemo(
    () => (
      <>
        <button
          onClick={() => router.push("/coach/comptabilite")}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-white/[0.04] text-[12px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition-all"
        >
          <Euro size={13} />
          <span className="hidden sm:inline">Comptabilité</span>
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-8 rounded-lg bg-[#1f8a65] text-[12px] font-bold text-white hover:bg-[#217356] transition-colors active:scale-[0.98]"
        >
          <UserPlus size={13} />
          Nouveau client
        </button>
      </>
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ),
    [],
  );

  useSetTopBar(topBarLeft, topBarRight);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGoal, setFilterGoal] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterSub, setFilterSub] = useState<string>("all"); // 'all' | 'with_sub' | 'no_sub'
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/");
    });
  }, [router]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const [clientsRes, tagsRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/tags"),
    ]);

    const clientsData = clientsRes.ok
      ? await clientsRes.json()
      : { clients: [] };
    const tagsData = tagsRes.ok ? await tagsRes.json() : { tags: [] };
    setAllTags(tagsData.tags ?? []);

    const baseClients: Client[] = clientsData.clients ?? [];

    // Setter clients + loading ensemble pour éviter le flash empty state
    setClients(baseClients);
    setLoading(false);
    // Note: React 18 batche ces deux setState dans le même render en mode concurrent

    // Enrichissement progressif en arrière-plan — un client à la fois pour éviter le N+1 en rafale
    for (const c of baseClients) {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/clients/${c.id}/tags`),
        fetch(`/api/clients/${c.id}/subscriptions`),
      ]);
      const tags = tRes.ok ? ((await tRes.json()).tags ?? []) : [];
      const subscriptions = sRes.ok
        ? ((await sRes.json()).subscriptions ?? [])
        : [];
      setClients((prev) =>
        prev.map((p) => (p.id === c.id ? { ...p, tags, subscriptions } : p)),
      );
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    if (
      q &&
      !`${c.first_name} ${c.last_name} ${c.email ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterGoal !== "all" && c.training_goal !== filterGoal) return false;
    if (filterTag !== "all" && !c.tags?.some((t) => t.id === filterTag))
      return false;
    if (
      filterSub === "with_sub" &&
      !c.subscriptions?.some((s) => s.status === "active")
    )
      return false;
    if (
      filterSub === "no_sub" &&
      c.subscriptions?.some((s) => s.status === "active")
    )
      return false;
    return true;
  });

  // ── Stats bar ──────────────────────────────────────────────────────────────

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    withSub: clients.filter((c) =>
      c.subscriptions?.some((s) => s.status === "active"),
    ).length,
  };

  // ── Form ───────────────────────────────────────────────────────────────────

  const setField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.email.trim()) {
      setError("L'email est obligatoire.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        training_goal: form.training_goal || null,
        fitness_level: form.fitness_level || null,
        sport_practice: form.sport_practice || null,
        weekly_frequency: form.weekly_frequency
          ? parseInt(form.weekly_frequency)
          : null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    setSuccess(
      `${data.client.first_name} ${data.client.last_name} a été ajouté.`,
    );
    setClients((prev) => [
      { ...data.client, tags: [], subscriptions: [] },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setSubmitting(false);
    setTimeout(() => {
      setShowModal(false);
      setSuccess(null);
    }, 1500);
  };

  const activeFiltersCount = [
    filterStatus !== "all",
    filterGoal !== "all",
    filterTag !== "all",
    filterSub !== "all",
  ].filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#121212] font-sans">
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* STATS STRIP */}
        <div
          className={`grid grid-cols-3 gap-4 mb-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {[
            {
              icon: Users,
              label: "Total clients",
              value: stats.total,
              accent: false,
            },
            {
              icon: TrendingUp,
              label: "Actifs",
              value: stats.active,
              accent: true,
            },
            {
              icon: CreditCard,
              label: "Avec formule",
              value: stats.withSub,
              accent: false,
            },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div
              key={label}
              className="rounded-2xl bg-[#181818] px-5 py-4 flex items-center gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-[#1f8a65]/20" : "bg-white/[0.04]"}`}
              >
                <Icon
                  size={18}
                  className={accent ? "text-[#1f8a65]" : "text-white/45"}
                />
              </div>
              <div>
                <p className="text-2xl font-black text-white tabular-nums">
                  {value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTERS BAR */}
        <div
          className={`flex items-center gap-3 mb-4 transition-all duration-500 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-[#0a0a0a] border-input pl-9 pr-4 h-10 text-[13px] text-white placeholder:text-white/25 outline-none"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 h-10 rounded-xl border-button text-xs font-semibold transition-all ${
              showFilters || activeFiltersCount > 0
                ? "bg-[#1f8a65] text-white"
                : "bg-[#181818] text-white/45 hover:text-white/80"
            }`}
          >
            <Filter size={13} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View mode */}
          <div className="flex items-center gap-0.5 bg-[#181818] border-subtle rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}
            >
              <List size={13} />
            </button>
          </div>

          <p className="text-xs font-semibold text-white/30 ml-auto tabular-nums">
            {filtered.length} / {clients.length}
          </p>
        </div>

        {/* FILTER PANEL */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-[#181818] border-subtle rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Statut",
                    value: filterStatus,
                    onChange: setFilterStatus,
                    options: [
                      ["all", "Tous"],
                      ["active", "Actif"],
                      ["inactive", "Inactif"],
                      ["archived", "Archivé"],
                    ],
                  },
                  {
                    label: "Objectif",
                    value: filterGoal,
                    onChange: setFilterGoal,
                    options: [
                      ["all", "Tous"],
                      ...TRAINING_GOALS.map((g) => [g.value, g.label]),
                    ],
                  },
                  {
                    label: "Tag",
                    value: filterTag,
                    onChange: setFilterTag,
                    options: [
                      ["all", "Tous"],
                      ...allTags.map((t) => [t.id, t.name]),
                    ],
                  },
                  {
                    label: "Formule",
                    value: filterSub,
                    onChange: setFilterSub,
                    options: [
                      ["all", "Tous"],
                      ["with_sub", "Avec formule active"],
                      ["no_sub", "Sans formule"],
                    ],
                  },
                ].map(({ label, value, onChange, options }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {label}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full rounded-xl bg-[#0a0a0a] border-input px-3 h-10 text-[13px] text-white outline-none"
                    >
                      {options.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CLIENT LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#181818] border-subtle rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="h-px bg-white/[0.05]" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#181818] flex items-center justify-center mb-4">
              <Users size={24} className="text-white/30" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {search || activeFiltersCount > 0
                ? "Aucun résultat"
                : "Aucun client pour l'instant"}
            </p>
            <p className="text-xs text-white/45 mb-6">
              {search || activeFiltersCount > 0
                ? "Ajustez vos filtres."
                : "Créez votre premier client pour commencer le suivi."}
            </p>
            {!search && activeFiltersCount === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] transition-colors"
              >
                <UserPlus size={14} />
                Créer un client
              </button>
            )}
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                index={i}
                onClick={() => {
                  openClient({ id: client.id, firstName: client.first_name, lastName: client.last_name });
                  router.push(`/coach/clients/${client.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#181818] border-subtle rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 hidden md:table-cell">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 hidden lg:table-cell">
                    Objectif / Niveau
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Formule
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 hidden md:table-cell">
                    Tags
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Statut
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    index={i}
                    onClick={() => {
                      openClient({ id: client.id, firstName: client.first_name, lastName: client.last_name });
                      router.push(`/coach/clients/${client.id}`);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CRÉATION CLIENT */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
              onClick={() => !submitting && setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#181818] border-subtle rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 pt-7 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1f8a65]/20 flex items-center justify-center">
                      <User
                        size={16}
                        className="text-[#1f8a65]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        Nouveau client
                      </h2>
                      <p className="text-xs text-white/45">
                        Remplissez les informations du client
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mx-7 mb-2 p-3 bg-red-500/10 rounded-xl flex items-center gap-2"
                    >
                      <AlertCircle
                        size={13}
                        className="text-red-400 shrink-0"
                      />
                      <p className="text-xs text-red-400 font-semibold">
                        {error}
                      </p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mx-7 mb-2 p-3 bg-[#1f8a65]/10 rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle2
                        size={13}
                        className="text-[#1f8a65] shrink-0"
                      />
                      <p className="text-xs text-[#1f8a65] font-semibold">
                        {success}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jean"
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] px-4 h-10 text-[13px] text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dupont"
                        value={form.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] px-4 h-10 text-[13px] text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                      />
                      <input
                        type="email"
                        required
                        placeholder="jean@email.com"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] pl-9 pr-4 h-10 text-[13px] text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                      />
                      <input
                        type="tel"
                        placeholder="+33 6 ..."
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        className="w-full rounded-xl bg-[#0a0a0a] pl-9 pr-4 h-10 text-[13px] text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Objectif",
                        field: "training_goal" as const,
                        options: TRAINING_GOALS,
                      },
                      {
                        label: "Niveau",
                        field: "fitness_level" as const,
                        options: FITNESS_LEVELS,
                      },
                      {
                        label: "Pratique sportive",
                        field: "sport_practice" as const,
                        options: SPORT_PRACTICES,
                      },
                    ].map(({ label, field, options }) => (
                      <div key={field} className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                          {label}
                        </label>
                        <select
                          value={form[field]}
                          onChange={(e) => setField(field, e.target.value)}
                          className="w-full rounded-xl bg-[#0a0a0a] px-3 h-10 text-[13px] text-white outline-none"
                        >
                          <option value="">— Non renseigné</option>
                          {options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                        Fréquence
                      </label>
                      <select
                        value={form.weekly_frequency}
                        onChange={(e) =>
                          setField("weekly_frequency", e.target.value)
                        }
                        className="w-full rounded-xl bg-[#0a0a0a] px-3 h-10 text-[13px] text-white outline-none tabular-nums"
                      >
                        <option value="">— Non renseigné</option>
                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                          <option key={n} value={n}>
                            {n}j/sem.
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
                      Notes
                    </label>
                    <div className="relative">
                      <FileText
                        size={13}
                        className="absolute left-3 top-3 text-white/25"
                      />
                      <textarea
                        placeholder="Contraintes, historique, remarques..."
                        value={form.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl bg-[#0a0a0a] pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Création
                        en cours...
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Créer le client
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClientCard({
  client,
  index,
  onClick,
}: {
  client: Client;
  index: number;
  onClick: () => void;
}) {
  const activeSub = client.subscriptions?.find((s) => s.status === "active");
  const color = avatarColor(client.id);
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="bg-[#181818] border-subtle rounded-2xl p-5 hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
    >
      {/* Avatar + name + status */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          {getInitials(client)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">
            {client.first_name} {client.last_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}
            >
              {statusCfg.label}
            </span>
            {client.training_goal && (
              <span className="text-[10px] text-white/35 font-medium">
                {GOAL_LABELS[client.training_goal] ?? client.training_goal}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1.5 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-white/45">
            <Mail size={11} className="shrink-0 text-white/30" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-xs text-white/45">
            <Phone size={11} className="shrink-0 text-white/30" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.fitness_level && (
          <div className="flex items-center gap-2 text-xs text-white/45">
            <BarChart3 size={11} className="shrink-0 text-white/30" />
            <span>
              {LEVEL_LABELS[client.fitness_level] ?? client.fitness_level}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {client.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/45">
              +{client.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: formule + date */}
      <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between">
        {activeSub ? (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${SUB_STATUS_CONFIG[activeSub.status]?.dot ?? "bg-gray-400"}`}
            />
            <span className="text-[11px] font-semibold text-white/45 truncate max-w-[120px]">
              {activeSub.formula?.name ?? "Formule active"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-[11px] text-white/30 font-medium">
              Pas de formule
            </span>
          </div>
        )}
        <p className="text-[10px] text-white/30 font-medium">
          {new Date(client.created_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </motion.div>
  );
}

function ClientRow({
  client,
  index,
  onClick,
}: {
  client: Client;
  index: number;
  onClick: () => void;
}) {
  const activeSubs =
    client.subscriptions?.filter((s) => s.status === "active") ?? [];
  const color = avatarColor(client.id);
  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="border-b border-white/[0.07] last:border-0 hover:bg-white/[0.04] cursor-pointer transition-colors"
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
            style={{ backgroundColor: color }}
          >
            {getInitials(client)}
          </div>
          <span className="font-semibold text-white text-sm">
            {client.first_name} {client.last_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="space-y-0.5">
          {client.email && (
            <p className="text-xs text-white/45 truncate max-w-[160px]">
              {client.email}
            </p>
          )}
          {client.phone && (
            <p className="text-xs text-white/35">{client.phone}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="space-y-0.5">
          {client.training_goal && (
            <p className="text-xs text-white font-medium">
              {GOAL_LABELS[client.training_goal]}
            </p>
          )}
          {client.fitness_level && (
            <p className="text-xs text-white/35">
              {LEVEL_LABELS[client.fitness_level]}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          {activeSubs.length === 0 ? (
            <span className="text-[11px] text-white/30">—</span>
          ) : (
            activeSubs.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${SUB_STATUS_CONFIG[s.status]?.dot ?? "bg-gray-400"}`}
                />
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {s.formula?.name ?? "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {(client.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {(client.tags?.length ?? 0) > 2 && (
            <span className="text-[10px] text-white/30">
              +{(client.tags?.length ?? 0) - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.cls}`}
        >
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronDown size={14} className="text-white/25 -rotate-90" />
      </td>
    </motion.tr>
  );
}
