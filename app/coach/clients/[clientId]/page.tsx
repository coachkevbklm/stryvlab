"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  ClipboardList,
  BarChart2,
  Mail,
  Phone,
  Calendar,
  Dumbbell,
  Plus,
  History,
  TrendingUp,
  CheckCircle2,
  LayoutTemplate,
  Loader2,
  X,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Save,
  Tag,
  CreditCard,
} from "lucide-react";
import ClientPageHeader from "@/components/coach/ClientPageHeader";
import SubmissionsList from "@/components/assessments/dashboard/SubmissionsList";
import ProgramEditor from "@/components/programs/ProgramEditor";
import ClientAccessToken from "@/components/clients/ClientAccessToken";
import SessionHistory from "@/components/clients/SessionHistory";
import PerformanceDashboard from "@/components/clients/PerformanceDashboard";
import ProgressionHistory from "@/components/clients/ProgressionHistory";
import ClientCrmTab from "@/components/crm/ClientCrmTab";
import ClientFormulasTab from "@/components/crm/ClientFormulasTab";
import MetricsSection from "@/components/clients/MetricsSection";
import { SubmissionWithClient } from "@/types/assessment";
import {
  rankTemplates as rankTemplatesFull,
  type ClientProfile,
} from "@/lib/matching/template-matcher";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  goal?: string;
  notes?: string;
  training_goal?: string | null;
  fitness_level?: string | null;
  sport_practice?: string | null;
  weekly_frequency?: number | null;
  equipment_category?: string | null;
  created_at: string;
}

type Tab =
  | "profil"
  | "crm"
  | "formules"
  | "bilans"
  | "metriques"
  | "programme"
  | "historique"
  | "performance";

type ProfileEdit = {
  training_goal: string;
  fitness_level: string;
  sport_practice: string;
  weekly_frequency: string;
  equipment_category: string;
  notes: string;
};

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
const EQUIPMENT_CATEGORIES = [
  { value: "bodyweight", label: "Poids du corps" },
  { value: "home_dumbbells", label: "Domicile — Haltères" },
  { value: "home_full", label: "Domicile — Complet" },
  { value: "home_rack", label: "Rack à domicile" },
  { value: "functional_box", label: "Box / Fonctionnel" },
  { value: "commercial_gym", label: "Salle de sport" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [programTemplates, setProgramTemplates] = useState<
    {
      id: string;
      name: string;
      goal: string;
      level: string;
      frequency: number;
      weeks: number;
      muscle_tags: string[];
    }[]
  >([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>("profil");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileEdit>({
    training_goal: "",
    fitness_level: "",
    sport_practice: "",
    weekly_frequency: "",
    equipment_category: "",
    notes: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
      fetch(`/api/assessments/submissions?client_id=${clientId}`).then((r) =>
        r.json(),
      ),
      fetch("/api/assessments/templates").then((r) => r.json()),
      fetch(`/api/programs?client_id=${clientId}`).then((r) => r.json()),
      fetch("/api/program-templates").then((r) => r.json()),
    ])
      .then(
        ([
          clientData,
          subsData,
          templatesData,
          programsData,
          progTemplatesData,
        ]) => {
          if (clientData.client) setClient(clientData.client);
          else setError("Client introuvable");
          setSubmissions(subsData.submissions ?? []);
          setTemplates(templatesData.templates ?? []);
          setPrograms(programsData.programs ?? []);
          setProgramTemplates(progTemplatesData.templates ?? []);
        },
      )
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSendBilan(
    templateId: string,
    bilanDate: string,
    sendEmail: boolean,
  ) {
    const res = await fetch("/api/assessments/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        template_id: templateId,
        filled_by: "client",
        send_email: sendEmail,
        bilan_date: bilanDate,
      }),
    });
    const d = await res.json();
    if (d.submission) {
      setSubmissions(
        (prev) =>
          [
            {
              ...d.submission,
              template: templates.find((t) => t.id === templateId),
              client: {
                id: clientId,
                first_name: client?.first_name ?? "",
                last_name: client?.last_name ?? "",
              },
            },
            ...prev,
          ] as SubmissionWithClient[],
      );
      if (d.bilan_url) {
        navigator.clipboard.writeText(d.bilan_url).catch(() => {});
        setToast("Lien copié dans le presse-papiers");
        setTimeout(() => setToast(null), 3000);
      }
    }
  }

  async function handleAssignTemplate(templateId: string) {
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/program-templates/${templateId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setToast(d.error ?? "Erreur lors de l'assignation");
        return;
      }
      // Recharger les programmes
      const programsData = await fetch(
        `/api/programs?client_id=${clientId}`,
      ).then((r) => r.json());
      setPrograms(programsData.programs ?? []);
      setAssigningTemplate(false);
      setToast("Programme assigné avec succès");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Erreur réseau");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleToggleProgramVisibility(
    programId: string,
    currentStatus: string,
  ) {
    const newStatus = currentStatus === "active" ? "archived" : "active";
    const res = await fetch(`/api/programs/${programId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setPrograms((prev) =>
        prev.map((p) => (p.id === programId ? { ...p, status: newStatus } : p)),
      );
      setToast(
        newStatus === "active"
          ? "Programme visible par le client"
          : "Programme masqué au client",
      );
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function handleDeleteProgram() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/programs/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPrograms((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setToast("Programme supprimé");
      setTimeout(() => setToast(null), 3000);
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EFE7] font-sans flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FCF76E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-[#F0EFE7] font-sans flex items-center justify-center text-[var(--text-muted)]">
        {error || "Client introuvable"}
      </div>
    );
  }

  // ── Profile edit ──────────────────────────────────────────────────────
  function openProfileEdit() {
    setProfileDraft({
      training_goal: client?.training_goal ?? "",
      fitness_level: client?.fitness_level ?? "",
      sport_practice: client?.sport_practice ?? "",
      weekly_frequency:
        client?.weekly_frequency != null ? String(client.weekly_frequency) : "",
      equipment_category: client?.equipment_category ?? "",
      notes: client?.notes ?? "",
    });
    setEditingProfile(true);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_goal: profileDraft.training_goal || null,
          fitness_level: profileDraft.fitness_level || null,
          sport_practice: profileDraft.sport_practice || null,
          weekly_frequency: profileDraft.weekly_frequency
            ? parseInt(profileDraft.weekly_frequency)
            : null,
          equipment_category: profileDraft.equipment_category || null,
          notes: profileDraft.notes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setToast(d.error ?? "Erreur");
        return;
      }
      setClient((prev) => (prev ? { ...prev, ...d.client } : prev));
      setEditingProfile(false);
      setToast("Profil mis à jour");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Erreur réseau");
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Compatibility scoring — 3 phases ──
  // Phase 1 : équipement (hard stop)  |  Phase 2 : fréquence exacte + niveau ±1 (hard stop)
  // Phase 3 : substitution ignorée ici (templates sans sessions chargées dans cette vue)

  const rankedTemplates = client
    ? (() => {
        const profile: ClientProfile = {
          equipment_category: (client.equipment_category as any) ?? null,
          fitness_level: (client.fitness_level as any) ?? null,
          training_goal: (client.training_goal as any) ?? null,
          weekly_frequency: client.weekly_frequency ?? null,
          sport_practice: client.sport_practice ?? null,
        };
        try {
          return [...programTemplates]
            .map((t) => {
              const tWithSessions = {
                ...t,
                coach_program_template_sessions: [],
              };
              const results = rankTemplatesFull(
                [tWithSessions as any],
                profile,
              );
              const result = results?.[0];
              if (!result) {
                console.warn(
                  "No result from rankTemplatesFull for template:",
                  t.id,
                );
                return {
                  ...t,
                  match: {
                    score: 0,
                    hardStop: true,
                    hardStopReason: "Erreur calcul compatibilité",
                    breakdown: {
                      goal: 0,
                      level: 0,
                      frequency: 0,
                      muscleTags: 0,
                      bonus: 0,
                    },
                    substitutions: [],
                    substituable: false,
                    templateId: t.id,
                  } as any,
                };
              }
              return { ...t, match: result };
            })
            .sort((a, b) => {
              if (a.match.hardStop && !b.match.hardStop) return 1;
              if (!a.match.hardStop && b.match.hardStop) return -1;
              return b.match.score - a.match.score;
            });
        } catch (err) {
          console.error("Error computing ranked templates:", err);
          return programTemplates.map((t) => ({
            ...t,
            match: {
              score: 0,
              hardStop: true,
              hardStopReason: `Erreur calculation: ${err instanceof Error ? err.message : "Unknown"}`,
              breakdown: {
                goal: 0,
                level: 0,
                frequency: 0,
                muscleTags: 0,
                bonus: 0,
              },
              substitutions: [],
              substituable: false,
              templateId: t.id,
            } as any,
          }));
        }
      })()
    : programTemplates.map((t) => ({
        ...t,
        match: {
          score: 0,
          hardStop: false,
          hardStopReason: undefined,
          breakdown: {
            goal: 0,
            level: 0,
            frequency: 0,
            muscleTags: 0,
            bonus: 0,
          },
          substitutions: [],
          substituable: true,
          templateId: t.id,
        },
      }));

  // How many signals are actually filled — drives the "confidence" hint
  function scoringSignalCount(): number {
    if (!client) return 0;
    return [
      client.training_goal,
      client.fitness_level,
      client.weekly_frequency,
      client.sport_practice,
      client.equipment_category,
    ].filter(Boolean).length;
  }

  function scoreColor(score: number, hardStop?: boolean): string {
    if (hardStop) return "bg-red-100 text-red-600";
    if (score >= 70) return "bg-green-100 text-green-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-[#E2E1D9] text-[var(--text-muted)]";
  }

  function scoreLabel(score: number, hardStop?: boolean): string {
    if (hardStop) return "Incompatible";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon match";
    if (score >= 40) return "Partiel";
    return "Faible";
  }

  const TABS: Array<{ key: Tab; label: string; Icon: React.ElementType }> = [
    { key: "profil", label: "Profil", Icon: User },
    { key: "crm", label: "CRM", Icon: Tag },
    { key: "formules", label: "Formules", Icon: CreditCard },
    { key: "bilans", label: "Bilans", Icon: ClipboardList },
    { key: "metriques", label: "Métriques", Icon: BarChart2 },
    { key: "programme", label: "Programme", Icon: Dumbbell },
    { key: "historique", label: "Historique", Icon: History },
    { key: "performance", label: "Performance", Icon: TrendingUp },
  ];

  return (
    <main className="min-h-screen bg-[#F0EFE7] font-sans flex flex-col">
      {/* Delete program confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--text-on-dark)] rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-[var(--text-main)] mb-2">
              Supprimer le programme ?
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Le programme{" "}
              <span className="font-medium text-[var(--text-main)]">
                "{deleteTarget.name}"
              </span>{" "}
              sera supprimé définitivement, ainsi que toutes ses séances et
              exercices.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-btn bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-btn bg-red-500 text-[var(--text-on-dark)] text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 bg-[var(--text-main)] text-[var(--text-on-dark)] text-sm font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={15} className="text-[#FCF76E] shrink-0" />
          {toast}
        </div>
      )}

      {/* UNIFIED CLIENT PAGE HEADER */}
      <ClientPageHeader
        firstName={client.first_name}
        lastName={client.last_name}
        email={client.email}
        tabs={TABS}
        activeTab={tab}
        onTabChange={(key) => setTab(key as Tab)}
      />

      {/* CONTENT AREA — Layer 3 */}
      <div className="flex-1 overflow-auto bg-[#F0EFE7]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {tab === "profil" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[var(--text-on-dark)] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-[var(--text-main)]">Informations</h2>
                  {!editingProfile ? (
                    <button
                      onClick={openProfileEdit}
                      className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[#FCF76E] transition-colors font-medium"
                    >
                      <Edit2 size={13} />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-1.5 bg-[#FCF76E] text-[var(--text-on-dark)] text-xs font-bold px-3 py-1.5 rounded-btn hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {savingProfile ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact info — always read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-widget bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center shrink-0">
                        <Mail size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                          Email
                        </p>
                        <p className="text-sm text-[var(--text-main)] font-medium">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-widget bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                          Téléphone
                        </p>
                        <p className="text-sm text-[var(--text-main)] font-medium">
                          {client.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {client.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-widget bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                          Date de naissance
                        </p>
                        <p className="text-sm text-[var(--text-main)] font-medium">
                          {new Date(client.date_of_birth).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-widget bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                        Client depuis
                      </p>
                      <p className="text-sm text-[var(--text-main)] font-medium">
                        {new Date(client.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scoring fields — read view */}
                {!editingProfile &&
                  (client.training_goal ||
                    client.fitness_level ||
                    client.sport_practice ||
                    client.weekly_frequency != null) && (
                    <div className="mt-5 pt-5 border-t border-[#BCBCB8] grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {client.training_goal && (
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                            Objectif
                          </p>
                          <p className="text-sm text-[var(--text-main)] font-semibold">
                            {TRAINING_GOALS.find(
                              (g) => g.value === client.training_goal,
                            )?.label ?? client.training_goal}
                          </p>
                        </div>
                      )}
                      {client.fitness_level && (
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                            Niveau
                          </p>
                          <p className="text-sm text-[var(--text-main)] font-semibold">
                            {FITNESS_LEVELS.find(
                              (l) => l.value === client.fitness_level,
                            )?.label ?? client.fitness_level}
                          </p>
                        </div>
                      )}
                      {client.sport_practice && (
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                            Pratique sport
                          </p>
                          <p className="text-sm text-[var(--text-main)] font-semibold">
                            {SPORT_PRACTICES.find(
                              (s) => s.value === client.sport_practice,
                            )?.label ?? client.sport_practice}
                          </p>
                        </div>
                      )}
                      {client.weekly_frequency != null && (
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                            Fréquence souhaitée
                          </p>
                          <p className="text-sm text-[var(--text-main)] font-semibold font-mono">
                            {client.weekly_frequency}j/sem.
                          </p>
                        </div>
                      )}
                      {client.equipment_category && (
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">
                            Équipement
                          </p>
                          <p className="text-sm text-[var(--text-main)] font-semibold">
                            {EQUIPMENT_CATEGORIES.find(
                              (e) => e.value === client.equipment_category,
                            )?.label ?? client.equipment_category}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* Scoring fields — edit form */}
                {editingProfile && (
                  <div className="mt-5 pt-5 border-t border-[#BCBCB8] flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Objectif
                        </label>
                        <select
                          value={profileDraft.training_goal}
                          onChange={(e) =>
                            setProfileDraft((d) => ({
                              ...d,
                              training_goal: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">— Non renseigné</option>
                          {TRAINING_GOALS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Niveau
                        </label>
                        <select
                          value={profileDraft.fitness_level}
                          onChange={(e) =>
                            setProfileDraft((d) => ({
                              ...d,
                              fitness_level: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">— Non renseigné</option>
                          {FITNESS_LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Pratique sport
                        </label>
                        <select
                          value={profileDraft.sport_practice}
                          onChange={(e) =>
                            setProfileDraft((d) => ({
                              ...d,
                              sport_practice: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">— Non renseigné</option>
                          {SPORT_PRACTICES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Fréquence souhaitée
                        </label>
                        <select
                          value={profileDraft.weekly_frequency}
                          onChange={(e) =>
                            setProfileDraft((d) => ({
                              ...d,
                              weekly_frequency: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-xs font-mono text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">— Non renseigné</option>
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>
                              {n}j/sem.
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Équipement disponible
                        </label>
                        <select
                          value={profileDraft.equipment_category}
                          onChange={(e) =>
                            setProfileDraft((d) => ({
                              ...d,
                              equipment_category: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-xs text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <option value="">— Non renseigné</option>
                          {EQUIPMENT_CATEGORIES.map((e) => (
                            <option key={e.value} value={e.value}>
                              {e.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                        Notes
                      </label>
                      <textarea
                        value={profileDraft.notes}
                        onChange={(e) =>
                          setProfileDraft((d) => ({
                            ...d,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Observations, contexte, contre-indications…"
                        className="w-full px-3 py-2 bg-[#E2E1D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-btn text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Notes — read view */}
                {!editingProfile && client.notes && (
                  <div className="mt-5 pt-5 border-t border-[#BCBCB8]">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
              <ClientAccessToken clientId={clientId} />
            </div>
          )}

          {tab === "bilans" && (
            <div className="bg-[var(--text-on-dark)] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6">
              <SubmissionsList
                submissions={submissions}
                clientId={clientId}
                templates={templates}
                clientEmail={client.email}
                onSend={handleSendBilan}
                onDelete={(id) =>
                  setSubmissions((prev) => prev.filter((s) => s.id !== id))
                }
                onRenew={(updated) =>
                  setSubmissions((prev) =>
                    prev.map((s) =>
                      s.id === updated.id ? { ...s, ...updated } : s,
                    ),
                  )
                }
              />
            </div>
          )}

          {tab === "metriques" && <MetricsSection clientId={clientId} />}

          {tab === "historique" && <SessionHistory clientId={clientId} />}

          {tab === "performance" && (
            <div className="flex flex-col gap-6">
              <PerformanceDashboard clientId={clientId} />
              <ProgressionHistory clientId={clientId} />
            </div>
          )}

          {tab === "crm" && (
            <ClientCrmTab
              clientId={clientId}
              initialCrm={{
                date_of_birth: client.date_of_birth,
                gender: client.gender,
              }}
            />
          )}

          {tab === "formules" && <ClientFormulasTab clientId={clientId} />}

          {tab === "programme" && (
            <div>
              {creatingProgram || editingProgram ? (
                <ProgramEditor
                  clientId={clientId}
                  initial={editingProgram ?? undefined}
                  onSaved={(saved) => {
                    setPrograms((prev) =>
                      editingProgram
                        ? prev.map((p) => (p.id === saved?.id ? saved : p))
                        : [saved, ...prev],
                    );
                    setCreatingProgram(false);
                    setEditingProgram(null);
                  }}
                  onCancel={() => {
                    setCreatingProgram(false);
                    setEditingProgram(null);
                  }}
                />
              ) : assigningTemplate ? (
                /* ── Picker template ── */
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-[var(--text-main)]">
                      Choisir un template
                    </h2>
                    <button
                      onClick={() => setAssigningTemplate(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {rankedTemplates.length === 0 ? (
                    <div className="bg-[var(--text-on-dark)] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-10 text-center">
                      <LayoutTemplate
                        size={32}
                        className="text-[var(--text-muted)] mx-auto mb-3 opacity-30"
                      />
                      <p className="text-sm text-[var(--text-muted)] mb-1">
                        Aucun template disponible.
                      </p>
                      <p className="text-xs text-[var(--text-muted)]/60">
                        Crée des templates depuis la section{" "}
                        <span className="font-semibold text-[#FCF76E]">
                          Templates
                        </span>
                        .
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Hint about sorting */}
                      <p className="text-[10px] text-[var(--text-muted)]/60 px-1">
                        Triés par compatibilité ·{" "}
                        {scoringSignalCount() === 0 ? (
                          <span className="text-amber-600">
                            Aucun signal de profil — renseigne objectif, niveau
                            et fréquence dans l'onglet Profil
                          </span>
                        ) : (
                          <span>
                            {scoringSignalCount()}/4 signal
                            {scoringSignalCount() > 1 ? "s" : ""} de profil
                            disponible{scoringSignalCount() > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                      {rankedTemplates.map((t, idx) => {
                        const goalLabels: Record<string, string> = {
                          hypertrophy: "Hypertrophie",
                          strength: "Force",
                          endurance: "Endurance",
                          fat_loss: "Perte de gras",
                          recomp: "Recomposition",
                          maintenance: "Maintenance",
                          athletic: "Athletic",
                        };
                        const levelLabels: Record<string, string> = {
                          beginner: "Débutant",
                          intermediate: "Intermédiaire",
                          advanced: "Avancé",
                          elite: "Élite",
                        };
                        const { match } = t;
                        const isTop =
                          idx === 0 && !match.hardStop && match.score >= 60;
                        return (
                          <div
                            key={t.id}
                            className={`bg-[#F0EFE7] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 flex items-center justify-between gap-4 ${isTop ? "ring-1 ring-accent/30" : ""} ${match.hardStop ? "opacity-40" : ""}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-[var(--text-main)] truncate">
                                  {t.name}
                                </p>
                                {isTop && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FCF76E]/10 text-[#FCF76E] shrink-0">
                                    Recommandé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {goalLabels[t.goal] ?? t.goal} ·{" "}
                                {levelLabels[t.level] ?? t.level} ·{" "}
                                {t.frequency}j/sem. · {t.weeks} sem.
                              </p>
                              {match.hardStop && match.hardStopReason && (
                                <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
                                  ✕ {match.hardStopReason}
                                </p>
                              )}
                              {!match.hardStop && (match as any).warning && (
                                <p className="text-[9px] text-amber-600 mt-1 flex items-center gap-1">
                                  ⚠ {(match as any).warning}
                                </p>
                              )}
                              {t.muscle_tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {t.muscle_tags.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E2E1D9] text-[var(--text-muted)]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Compatibility score */}
                              <div className="flex flex-col items-center gap-0.5">
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-btn ${scoreColor(match.score, match.hardStop)}`}
                                >
                                  {match.hardStop ? "—" : match.score}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)]/70">
                                  {scoreLabel(match.score, match.hardStop)}
                                </span>
                              </div>
                              <button
                                disabled={assignLoading || match.hardStop}
                                onClick={() => handleAssignTemplate(t.id)}
                                className="flex items-center gap-1.5 bg-[#FCF76E] text-[var(--text-on-dark)] text-xs font-bold px-4 py-2 rounded-btn hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {assignLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Plus size={12} />
                                )}
                                Assigner
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-bold text-[var(--text-main)]">Programmes</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssigningTemplate(true)}
                        className="flex items-center gap-1.5 bg-[#E2E1D9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[var(--text-main)] text-xs font-bold px-4 py-2 rounded-btn hover:opacity-80 transition-opacity"
                      >
                        <LayoutTemplate size={13} />
                        Depuis un template
                      </button>
                      <button
                        onClick={() => setCreatingProgram(true)}
                        className="flex items-center gap-1.5 bg-[#FCF76E] text-[var(--text-on-dark)] text-xs font-bold px-4 py-2 rounded-btn hover:opacity-90 transition-opacity shadow-lg"
                      >
                        <Plus size={13} />
                        Nouveau programme
                      </button>
                    </div>
                  </div>

                  {programs.length === 0 ? (
                    <div className="bg-[var(--text-on-dark)] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-10 text-center">
                      <Dumbbell
                        size={36}
                        className="text-[var(--text-muted)] mx-auto mb-3 opacity-30"
                      />
                      <p className="text-sm text-[var(--text-muted)] mb-1">
                        Aucun programme pour ce client.
                      </p>
                      <p className="text-xs text-[var(--text-muted)]/60">
                        Créez son premier programme d'entraînement.
                      </p>
                    </div>
                  ) : (
                    programs.map((prog: any) => (
                      <div
                        key={prog.id}
                        className="bg-[#F0EFE7] rounded-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--text-main)]">
                                {prog.name}
                              </p>
                              {prog.status !== "active" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E2E1D9] text-[var(--text-muted)] border border-white/40">
                                  Masqué
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {prog.weeks} semaine{prog.weeks > 1 ? "s" : ""} ·{" "}
                              {(prog.program_sessions ?? []).length} séance
                              {(prog.program_sessions ?? []).length !== 1
                                ? "s"
                                : ""}
                              {prog.description && ` · ${prog.description}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleToggleProgramVisibility(
                                  prog.id,
                                  prog.status,
                                )
                              }
                              title={
                                prog.status === "active"
                                  ? "Masquer au client"
                                  : "Rendre visible au client"
                              }
                              className={`p-1 transition-colors ${prog.status === "active" ? "text-[#FCF76E] hover:text-[var(--text-muted)]" : "text-[var(--text-muted)] hover:text-[#FCF76E]"}`}
                            >
                              {prog.status === "active" ? (
                                <Eye size={14} />
                              ) : (
                                <EyeOff size={14} />
                              )}
                            </button>
                            <Link
                              href={`/coach/clients/${clientId}/programs/${prog.id}/preview`}
                              title="Visualiser comme le client"
                              className="p-1 text-[var(--text-muted)] hover:text-[#FCF76E] transition-colors"
                            >
                              <ExternalLink size={14} />
                            </Link>
                            <button
                              onClick={() => setEditingProgram(prog)}
                              className="text-xs text-[var(--text-muted)] hover:text-[#FCF76E] font-medium transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: prog.id,
                                  name: prog.name,
                                })
                              }
                              className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(prog.program_sessions ?? [])
                            .sort((a: any, b: any) => a.position - b.position)
                            .map((s: any) => {
                              const days = [
                                "Lun",
                                "Mar",
                                "Mer",
                                "Jeu",
                                "Ven",
                                "Sam",
                                "Dim",
                              ];
                              return (
                                <div
                                  key={s.id}
                                  className="bg-[#E2E1D9] rounded-btn px-3 py-2"
                                >
                                  <p className="text-xs font-semibold text-[var(--text-main)]">
                                    {s.name}
                                  </p>
                                  {s.day_of_week && (
                                    <p className="text-[10px] text-[#FCF76E] font-bold">
                                      {days[s.day_of_week - 1]}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                    {(s.program_exercises ?? []).length}{" "}
                                    exercice
                                    {(s.program_exercises ?? []).length !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
