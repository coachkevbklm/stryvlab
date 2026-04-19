"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  GripVertical,
  Tag,
  ImagePlus,
  X,
  Library,
  Dumbbell,
  ArrowLeftRight,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import ExercisePicker from "./ExercisePicker";
import { useProgramIntelligence, useLabOverrides, type IntelligenceProfile } from "@/lib/programs/intelligence";
import ProgramIntelligencePanel from "./ProgramIntelligencePanel";
import IntelligenceAlertBadge from "./IntelligenceAlertBadge";
import ExerciseAlternativesDrawer from "./ExerciseAlternativesDrawer";
import ExerciseClientAlternatives from "./ExerciseClientAlternatives";
import NavigatorPane from "./studio/NavigatorPane";
import EditorPane from "./studio/EditorPane";
import IntelligencePanelShell from "./studio/IntelligencePanelShell";

const GOALS = [
  { value: "hypertrophy", label: "Hypertrophie" },
  { value: "strength", label: "Force" },
  { value: "endurance", label: "Endurance" },
  { value: "fat_loss", label: "Perte de gras" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Maintenance" },
  { value: "athletic", label: "Athletic" },
];

const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "elite", label: "Élite" },
];

const MUSCLE_OPTIONS = [
  "Full Body",
  "Jambes",
  "Fessiers",
  "Ischio-jambiers",
  "Quadriceps",
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Abdos",
  "Mollets",
  "Lombaires",
  "Posture",
];

const EQUIPMENT_ARCHETYPES = [
  { value: "", label: "— Non spécifié —" },
  { value: "bodyweight", label: "Poids du corps" },
  { value: "home_dumbbells", label: "Domicile — Haltères" },
  { value: "home_full", label: "Domicile — Complet" },
  { value: "home_rack", label: "Rack à domicile" },
  { value: "functional_box", label: "Box / Fonctionnel" },
  { value: "commercial_gym", label: "Salle de sport" },
];

const MOVEMENT_PATTERNS = [
  { value: "", label: "— Pattern —" },
  { value: "horizontal_push", label: "Poussée horizontale" },
  { value: "vertical_push", label: "Poussée verticale" },
  { value: "horizontal_pull", label: "Tirage horizontal" },
  { value: "vertical_pull", label: "Tirage vertical" },
  { value: "squat_pattern", label: "Pattern squat" },
  { value: "hip_hinge", label: "Charnière hanche" },
  { value: "knee_flexion", label: "Flexion genou" },
  { value: "knee_extension", label: "Extension genou" },
  { value: "calf_raise", label: "Extension mollets" },
  { value: "elbow_flexion", label: "Flexion coude (Biceps)" },
  { value: "elbow_extension", label: "Extension coude (Triceps)" },
  { value: "lateral_raise", label: "Élévation latérale" },
  { value: "carry", label: "Porté (Carry)" },
  { value: "scapular_elevation", label: "Élévation scapulaire (Shrug)" },
  { value: "core_anti_flex", label: "Gainage anti-flexion" },
  { value: "core_flex", label: "Flexion core" },
  { value: "core_rotation", label: "Rotation core" },
];

const EQUIPMENT_ITEMS = [
  { value: "bodyweight", label: "Poids du corps" },
  { value: "band", label: "Élastique" },
  { value: "dumbbell", label: "Haltère" },
  { value: "barbell", label: "Barre" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "machine", label: "Machine" },
  { value: "cable", label: "Poulie" },
  { value: "smith", label: "Smith machine" },
  { value: "trx", label: "TRX" },
  { value: "ez_bar", label: "Barre EZ" },
  { value: "trap_bar", label: "Trap bar" },
  { value: "landmine", label: "Landmine" },
  { value: "medicine_ball", label: "Med ball" },
  { value: "swiss_ball", label: "Swiss ball" },
  { value: "rings", label: "Anneaux" },
  { value: "sled", label: "Sled" },
];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MUSCLE_GROUPS: { slug: string; label: string }[] = [
  { slug: 'chest',      label: 'Pectoraux' },
  { slug: 'shoulders',  label: 'Épaules' },
  { slug: 'biceps',     label: 'Biceps' },
  { slug: 'triceps',    label: 'Triceps' },
  { slug: 'abs',        label: 'Abdos' },
  { slug: 'back_upper', label: 'Dos (haut)' },
  { slug: 'back_lower', label: 'Lombaires' },
  { slug: 'traps',      label: 'Trapèzes' },
  { slug: 'quads',      label: 'Quadriceps' },
  { slug: 'hamstrings', label: 'Ischios' },
  { slug: 'glutes',     label: 'Fessiers' },
  { slug: 'calves',     label: 'Mollets' },
]

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_sec: number | null;
  rir: number | null;
  notes: string;
  image_url: string | null;
  movement_pattern: string | null;
  equipment_required: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  is_compound: boolean | undefined;
  group_id?: string;
  dbId?: string;
}
interface Session {
  name: string;
  day_of_week: number | null;
  notes: string;
  exercises: Exercise[];
  open: boolean;
}
interface TemplateMeta {
  name: string;
  description: string;
  goal: string;
  level: string;
  frequency: number;
  weeks: number;
  muscle_tags: string[];
  notes: string;
  equipment_archetype: string;
}

function emptyExercise(): Exercise {
  return {
    name: "",
    sets: 3,
    reps: "8-12",
    rest_sec: 90,
    rir: 2,
    notes: "",
    image_url: null,
    movement_pattern: null,
    equipment_required: [],
    primary_muscles: [],
    secondary_muscles: [],
    is_compound: undefined,
    group_id: undefined,
    dbId: undefined,
  };
}
function emptySession(): Session {
  return {
    name: "",
    day_of_week: null,
    notes: "",
    exercises: [emptyExercise()],
    open: true,
  };
}

interface Props {
  initial?: any; // template existant pour l'édition
  templateId?: string;
  clientId?: string;
}

export default function ProgramTemplateBuilder({ initial, templateId, clientId }: Props) {
  const router = useRouter();
  const isEdit = !!templateId;

  const [meta, setMeta] = useState<TemplateMeta>(() =>
    initial
      ? {
          name: initial.name ?? "",
          description: initial.description ?? "",
          goal: initial.goal ?? "hypertrophy",
          level: initial.level ?? "intermediate",
          frequency: initial.frequency ?? 3,
          weeks: initial.weeks ?? 8,
          muscle_tags: initial.muscle_tags ?? [],
          notes: initial.notes ?? "",
          equipment_archetype: initial.equipment_archetype ?? "",
        }
      : {
          name: "",
          description: "",
          goal: "hypertrophy",
          level: "intermediate",
          frequency: 3,
          weeks: 8,
          muscle_tags: [],
          notes: "",
          equipment_archetype: "",
        },
  );

  const [sessions, setSessions] = useState<Session[]>(() =>
    initial?.coach_program_template_sessions
      ? initial.coach_program_template_sessions
          .sort((a: any, b: any) => a.position - b.position)
          .map((s: any) => ({
            name: s.name,
            day_of_week: s.day_of_week,
            notes: s.notes ?? "",
            open: false,
            exercises: (s.coach_program_template_exercises ?? [])
              .sort((a: any, b: any) => a.position - b.position)
              .map((e: any) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_sec: e.rest_sec,
                rir: e.rir,
                notes: e.notes ?? "",
                image_url: e.image_url ?? null,
                movement_pattern: e.movement_pattern ?? null,
                equipment_required: e.equipment_required ?? [],
                primary_muscles: e.primary_muscles ?? [],
                secondary_muscles: e.secondary_muscles ?? [],
                is_compound: e.is_compound ?? undefined,
                group_id: e.group_id ?? undefined,
                dbId: e.id ?? undefined,
              })),
          }))
      : [emptySession()],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [intelligenceProfile, setIntelligenceProfile] = useState<IntelligenceProfile | undefined>(undefined);
  const [morphoAdjustments, setMorphoAdjustments] = useState<Record<string, number> | undefined>(undefined);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { overrides: labOverrides, setOverride: onOverrideChange, resetOverrides: onOverrideReset } = useLabOverrides()

  useEffect(() => {
    if (!clientId) return
    Promise.all([
      fetch(`/api/clients/${clientId}/intelligence-profile`).then(r => r.ok ? r.json() : null),
      fetch(`/api/clients/${clientId}/morpho/latest`).then(r => r.ok ? r.json() : null),
    ]).then(([profile, morpho]) => {
      if (profile) setIntelligenceProfile(profile)
      if (morpho?.data?.stimulus_adjustments) {
        setMorphoAdjustments(morpho.data.stimulus_adjustments)
      }
    }).catch(() => {})
  }, [clientId]);
  const [pickerTarget, setPickerTarget] = useState<{
    si: number;
    ei: number;
  } | null>(null);
  const [alternativesTarget, setAlternativesTarget] = useState<{ si: number; ei: number } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const intelligenceMeta = {
    goal: meta.goal,
    level: meta.level,
    weeks: meta.weeks,
    frequency: meta.frequency,
    equipment_archetype: meta.equipment_archetype,
  };
  const intelligenceSessions = sessions.map(s => ({
    name: s.name,
    day_of_week: s.day_of_week,
    exercises: s.exercises.map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      rest_sec: e.rest_sec,
      rir: e.rir,
      notes: e.notes,
      movement_pattern: e.movement_pattern,
      equipment_required: e.equipment_required,
      primary_muscles: e.primary_muscles,
      secondary_muscles: e.secondary_muscles,
      is_compound: e.is_compound,
    })),
  }));
  const { result: intelligenceResult, alertsFor } = useProgramIntelligence(intelligenceSessions, intelligenceMeta, intelligenceProfile, morphoAdjustments ?? undefined, labOverrides);

  function handleAlertClick(sessionIndex: number, exerciseIndex: number) {
    const key = `${sessionIndex}-${exerciseIndex}`
    const el = exerciseRefs.current[key]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightKey(key)
      setTimeout(() => setHighlightKey(null), 2000)
    }
  }

  async function handleImageUpload(si: number, ei: number, file: File) {
    const key = `${si}-${ei}`;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/program-templates/exercises/upload-image", {
        method: "POST",
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Erreur upload");
        return;
      }
      updateExercise(si, ei, { image_url: d.url });
    } catch {
      setError("Erreur réseau lors de l'upload");
    } finally {
      setUploadingKey(null);
    }
  }

  function toggleMuscleTag(tag: string) {
    setMeta((m) => ({
      ...m,
      muscle_tags: m.muscle_tags.includes(tag)
        ? m.muscle_tags.filter((t) => t !== tag)
        : [...m.muscle_tags, tag],
    }));
  }

  function updateSession(i: number, patch: Partial<Session>) {
    setSessions((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  function removeSession(si: number) {
    setSessions((prev) => prev.filter((_, i) => i !== si));
  }

  function exerciseRefSetter(key: string) {
    return (el: HTMLDivElement | null) => {
      exerciseRefs.current[key] = el;
    };
  }

  function addExercise(si: number) {
    setSessions((prev) =>
      prev.map((s, idx) =>
        idx === si ? { ...s, exercises: [...s.exercises, emptyExercise()] } : s,
      ),
    );
  }

  function removeExercise(si: number, ei: number) {
    setSessions((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, exercises: s.exercises.filter((_, i) => i !== ei) }
          : s,
      ),
    );
  }

  function updateExercise(si: number, ei: number, patch: Partial<Exercise>) {
    setSessions((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? {
              ...s,
              exercises: s.exercises.map((e, i) =>
                i === ei ? { ...e, ...patch } : e,
              ),
            }
          : s,
      ),
    );
  }

  async function handleSave() {
    setError("");
    if (!meta.name.trim()) {
      setError("Le nom du template est requis.");
      return;
    }
    if (sessions.some((s) => !s.name.trim())) {
      setError("Chaque séance doit avoir un nom.");
      return;
    }
    if (sessions.some((s) => s.exercises.some((e) => !e.name.trim()))) {
      setError("Chaque exercice doit avoir un nom.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...meta,
        sessions: sessions.map((s) => ({
          name: s.name,
          day_of_week: s.day_of_week,
          notes: s.notes,
          exercises: s.exercises,
        })),
      };

      const url = isEdit
        ? `/api/program-templates/${templateId}`
        : "/api/program-templates";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Erreur");
        return;
      }

      router.push("/coach/programs/templates");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  const morphoConnected = !!morphoAdjustments && Object.keys(morphoAdjustments).length > 0

  const navSessions = sessions.map(s => ({
    name: s.name,
    exercises: s.exercises.map(e => ({ name: e.name })),
  }))

  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Dual-pane layout */}
      <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
        {/* Navigator — 16% */}
        <Panel defaultSize={16} minSize={12} maxSize={25}>
          <NavigatorPane
            sessions={navSessions}
            activeSessionIndex={null}
            activeExerciseKey={highlightKey}
            onSelectSession={si => {
              const el = exerciseRefs.current[`${si}-0`]
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            onSelectExercise={(si, ei) => handleAlertClick(si, ei)}
            onAddSession={() => setSessions(prev => [...prev, emptySession()])}
          />
        </Panel>

        <PanelResizeHandle className="w-px bg-white/[0.06] hover:bg-[#1f8a65]/40 transition-colors cursor-col-resize" />

        {/* Editor — 54% */}
        <Panel defaultSize={54} minSize={40}>
          <EditorPane
            meta={meta}
            sessions={sessions}
            saving={saving}
            error={error}
            uploadingKey={uploadingKey}
            highlightKey={highlightKey}
            intelligenceResult={intelligenceResult}
            morphoConnected={morphoConnected}
            templateId={templateId}
            alertsFor={alertsFor}
            onMetaChange={patch => setMeta(m => ({ ...m, ...patch }))}
            onUpdateSession={updateSession}
            onUpdateExercise={updateExercise}
            onRemoveExercise={removeExercise}
            onAddExercise={addExercise}
            onRemoveSession={removeSession}
            onAddSession={() => setSessions(prev => [...prev, emptySession()])}
            onImageUpload={handleImageUpload}
            onPickExercise={(si, ei) => setPickerTarget({ si, ei })}
            onOpenAlternatives={(si, ei) => setAlternativesTarget({ si, ei })}
            onSave={handleSave}
            exerciseRefSetter={exerciseRefSetter}
            sraHeatmap={intelligenceResult?.sraHeatmap}
            labOverrides={labOverrides}
            onOverrideChange={onOverrideChange}
            onOverrideReset={onOverrideReset}
          />
        </Panel>

        <PanelResizeHandle className="w-px bg-white/[0.06] hover:bg-[#1f8a65]/40 transition-colors cursor-col-resize" />

        {/* Intelligence Panel — 30% */}
        <Panel defaultSize={30} minSize={20} maxSize={40}>
          <IntelligencePanelShell
            result={intelligenceResult}
            weeks={meta.weeks}
            onAlertClick={handleAlertClick}
          />
        </Panel>
      </PanelGroup>

      {/* Overlays */}
      {pickerTarget && (
        <ExercisePicker
          onSelect={({ name, gifUrl, movementPattern, equipment, isCompound }) => {
            updateExercise(pickerTarget.si, pickerTarget.ei, {
              name,
              image_url: gifUrl,
              movement_pattern: movementPattern,
              equipment_required: equipment,
              is_compound: isCompound,
            });
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {alternativesTarget && (
        <ExerciseAlternativesDrawer
          exercise={intelligenceSessions[alternativesTarget.si]?.exercises[alternativesTarget.ei]}
          sessionExercises={intelligenceSessions[alternativesTarget.si]?.exercises ?? []}
          meta={intelligenceMeta}
          onReplace={(name, gifUrl, movementPattern, equipment) => {
            updateExercise(alternativesTarget.si, alternativesTarget.ei, {
              name,
              image_url: gifUrl,
              movement_pattern: movementPattern,
              equipment_required: equipment,
              is_compound: undefined,
            });
            setAlternativesTarget(null);
          }}
          onClose={() => setAlternativesTarget(null)}
        />
      )}
    </div>
  );
}
