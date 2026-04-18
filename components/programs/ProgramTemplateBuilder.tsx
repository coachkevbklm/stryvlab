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
import ExercisePicker from "./ExercisePicker";
import { useProgramIntelligence, type IntelligenceProfile } from "@/lib/programs/intelligence";
import ProgramIntelligencePanel from "./ProgramIntelligencePanel";
import IntelligenceAlertBadge from "./IntelligenceAlertBadge";
import ExerciseAlternativesDrawer from "./ExerciseAlternativesDrawer";
import ExerciseClientAlternatives from "./ExerciseClientAlternatives";

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

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/clients/${clientId}/intelligence-profile`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setIntelligenceProfile(data) })
      .catch(() => {})
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/clients/${clientId}/morpho/latest`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data?.stimulus_adjustments) {
          setMorphoAdjustments(data.data.stimulus_adjustments)
        }
      })
      .catch(() => {})
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
  const { result: intelligenceResult, alertsFor } = useProgramIntelligence(intelligenceSessions, intelligenceMeta, intelligenceProfile, morphoAdjustments);

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

  return (
    <div className="flex gap-6 items-start">
    <div className="flex-1 flex flex-col gap-6">
      {/* ── Meta ── */}
      <div className="bg-[#181818] border-subtle rounded-2xl p-6 flex flex-col gap-5">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Tag size={14} className="text-[#1f8a65]" />
          Informations du template
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Nom du template *
            </label>
            <input
              value={meta.name}
              onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
              placeholder="ex: PPL Hypertrophie 5j/sem"
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              value={meta.description}
              onChange={(e) =>
                setMeta((m) => ({ ...m, description: e.target.value }))
              }
              placeholder="Décris le programme, pour qui il est adapté…"
              rows={2}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Objectif
            </label>
            <select
              value={meta.goal}
              onChange={(e) => setMeta((m) => ({ ...m, goal: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Niveau
            </label>
            <select
              value={meta.level}
              onChange={(e) =>
                setMeta((m) => ({ ...m, level: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Fréquence (jours/sem.)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={meta.frequency}
              onChange={(e) =>
                setMeta((m) => ({
                  ...m,
                  frequency: parseInt(e.target.value) || 3,
                }))
              }
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm font-mono text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Durée (semaines)
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={meta.weeks}
              onChange={(e) =>
                setMeta((m) => ({ ...m, weeks: parseInt(e.target.value) || 8 }))
              }
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm font-mono text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Dumbbell size={10} className="text-[#1f8a65]" />
              Archétype équipement
              <span className="text-[9px] font-normal text-white/50 normal-case tracking-normal">
                — utilisé pour le matching client
              </span>
            </label>
            <select
              value={meta.equipment_archetype}
              onChange={(e) =>
                setMeta((m) => ({ ...m, equipment_archetype: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
            >
              {EQUIPMENT_ARCHETYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Muscle tags */}
        <div>
          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-2">
            Groupes musculaires ciblés
          </label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleMuscleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  meta.muscle_tags.includes(tag)
                    ? "bg-[#1f8a65] text-white"
                    : "bg-[#0a0a0a] text-white/70 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes internes */}
        <div>
          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
            Notes internes (coach)
          </label>
          <input
            value={meta.notes}
            onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))}
            placeholder="Contexte, précautions, contre-indications…"
            className="w-full px-3 py-2 bg-[#0a0a0a] rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40"
          />
        </div>
      </div>

      {/* ── Sessions ── */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-white text-sm">
          Séances ({sessions.length})
        </h3>

        {sessions.map((session, si) => (
          <div
            key={si}
            className="bg-[#181818] border-subtle rounded-2xl overflow-hidden"
          >
            {/* Session header */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10">
              <GripVertical size={14} className="text-white/60 shrink-0" />
              <input
                value={session.name}
                onChange={(e) => updateSession(si, { name: e.target.value })}
                placeholder="Nom de la séance (ex: Push A, Lower, Full Body…)"
                className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/40"
              />
              {/* Day picker */}
              <div className="flex gap-1">
                {DAYS.map((d, di) => (
                  <button
                    key={di}
                    type="button"
                    onClick={() =>
                      updateSession(si, {
                        day_of_week:
                          session.day_of_week === di + 1 ? null : di + 1,
                      })
                    }
                    className={`w-6 h-6 rounded text-[9px] font-bold transition-colors ${
                      session.day_of_week === di + 1
                        ? "bg-[#1f8a65] text-white"
                        : "bg-[#0a0a0a] text-white/70 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateSession(si, { open: !session.open })}
                className="text-white/70 hover:text-white transition-colors"
              >
                {session.open ? (
                  <ChevronUp size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </button>
              <button
                onClick={() =>
                  setSessions((prev) => prev.filter((_, idx) => idx !== si))
                }
                className="text-white/70 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Exercises */}
            {session.open && (
              <div className="p-4 flex flex-col gap-3">
                {session.exercises.map((ex, ei) => (
                  <div
                    key={ei}
                    ref={el => { exerciseRefs.current[`${si}-${ei}`] = el }}
                    className={`bg-[#0a0a0a] rounded-2xl p-3 grid grid-cols-[140px_1fr] gap-4 transition-all duration-300 ${highlightKey === `${si}-${ei}` ? 'ring-1 ring-[#1f8a65]/60 ring-offset-1 ring-offset-[#121212]' : ''}`}
                  >
                    {/* LEFT COLUMN: Image + metadata */}
                    <div className="flex flex-col gap-2">
                      {/* Image section — constrained square */}
                      <div>
                        {ex.image_url ? (
                          <div className="relative rounded-xl overflow-hidden group w-[140px] h-[140px]">
                            <Image
                              src={ex.image_url}
                              alt={ex.name || "Exercice"}
                              width={140}
                              height={140}
                              className="w-full h-full object-cover rounded-xl"
                              unoptimized={ex.image_url.endsWith(".gif")}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateExercise(si, ei, { image_url: null })
                              }
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Supprimer l'image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-[140px] h-[140px] bg-white/[0.04] rounded-xl flex flex-col items-center justify-center">
                            <ImagePlus size={20} className="text-white/30 mb-1" />
                            <span className="text-[8px] text-white/30 text-center px-1">Ajouter image</span>
                          </div>
                        )}
                      </div>

                      {/* Add/import buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ si, ei })}
                          className="flex items-center justify-center gap-1 text-[8px] font-semibold text-[#1f8a65] hover:opacity-80 transition-opacity bg-[#1f8a65]/10 px-2 py-1 rounded-lg"
                        >
                          <Library size={10} />
                          Biblio
                        </button>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[`${si}-${ei}`] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(si, ei, f);
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingKey === `${si}-${ei}`}
                          onClick={() =>
                            fileInputRefs.current[`${si}-${ei}`]?.click()
                          }
                          className="flex items-center justify-center gap-1 text-[8px] text-white/60 hover:text-white transition-colors disabled:opacity-50 bg-white/[0.03] hover:bg-white/[0.05] px-2 py-1 rounded-lg"
                        >
                          {uploadingKey === `${si}-${ei}` ? (
                            <>
                              <Loader2 size={10} className="animate-spin" />
                              <span>Upload…</span>
                            </>
                          ) : (
                            <>
                              <Upload size={10} />
                              <span>Importer</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Pattern & equipment */}
                      <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-1.5">
                        <div>
                          <label className="text-[8px] font-bold text-white/50 uppercase block mb-1">
                            Pattern
                          </label>
                          <select
                            value={ex.movement_pattern ?? ""}
                            onChange={(e) =>
                              updateExercise(si, ei, {
                                movement_pattern: e.target.value || null,
                              })
                            }
                            className="w-full bg-[#0a0a0a] rounded-lg px-1.5 py-0.5 text-[8px] text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                          >
                            {MOVEMENT_PATTERNS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-white/50 uppercase block mb-1">
                            Équipement
                          </label>
                          <div className="flex flex-wrap gap-0.5 bg-[#0a0a0a] rounded-lg px-1.5 py-0.5 min-h-[20px]">
                            {EQUIPMENT_ITEMS.map((eq) => {
                              const checked = ex.equipment_required.includes(
                                eq.value,
                              );
                              return (
                                <button
                                  key={eq.value}
                                  type="button"
                                  onClick={() =>
                                    updateExercise(si, ei, {
                                      equipment_required: checked
                                        ? ex.equipment_required.filter(
                                            (v) => v !== eq.value,
                                          )
                                        : [...ex.equipment_required, eq.value],
                                    })
                                  }
                                  className={`text-[7px] px-1 py-0.5 rounded-full font-medium transition-colors ${
                                    checked
                                      ? "bg-[#1f8a65] text-white"
                                      : "bg-white/[0.04] text-white/50 hover:text-white/70"
                                  }`}
                                >
                                  {eq.label.slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Poly-articulaire */}
                      <div className="border-t border-white/[0.06] pt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateExercise(si, ei, {
                            is_compound: ex.is_compound === true ? false : ex.is_compound === false ? undefined : true
                          })}
                          className={`w-3 h-3 rounded border transition-colors shrink-0 flex items-center justify-center ${
                            ex.is_compound === true
                              ? 'bg-[#1f8a65] border-[#1f8a65]'
                              : ex.is_compound === false
                              ? 'bg-red-500/20 border-red-500/40'
                              : 'bg-white/[0.04] border-white/[0.08]'
                          }`}
                        >
                          {ex.is_compound === true && <span className="text-white text-[6px] font-bold">✓</span>}
                          {ex.is_compound === false && <span className="text-red-400 text-[6px] font-bold">✗</span>}
                        </button>
                        <label className="text-[8px] font-semibold text-white/40 uppercase">
                          Polyart.
                        </label>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Name, sets/reps, muscles, notes, actions */}
                    <div className="flex flex-col gap-2">
                      {/* Exercise name + delete */}
                      <div className="flex items-center gap-2 -mt-1">
                        <input
                          value={ex.name}
                          onChange={(e) =>
                            updateExercise(si, ei, { name: e.target.value })
                          }
                          placeholder="Nom de l'exercice *"
                          className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/40"
                        />
                        <button
                          onClick={() => removeExercise(si, ei)}
                          className="text-white/70 hover:text-red-400 shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Sets, Reps, Rest, RIR — 2x2 grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Séries",
                            key: "sets",
                            type: "number",
                            min: 1,
                          },
                          { label: "Reps", key: "reps", type: "text" },
                          {
                            label: "Repos (s)",
                            key: "rest_sec",
                            type: "number",
                            min: 0,
                          },
                          {
                            label: "RIR",
                            key: "rir",
                            type: "number",
                            min: 0,
                            max: 5,
                          },
                        ].map(({ label, key, type, min, max }) => (
                          <div key={key}>
                            <label className="text-[9px] font-bold text-white/60 uppercase block mb-0.5">
                              {label}
                            </label>
                            <input
                              type={type}
                              min={min}
                              max={max}
                              value={(ex as any)[key] ?? ""}
                              onChange={(e) =>
                                updateExercise(si, ei, {
                                  [key]:
                                    type === "number"
                                      ? e.target.value
                                        ? parseFloat(e.target.value)
                                        : null
                                      : e.target.value,
                                })
                              }
                              className="w-full bg-[#0a0a0a] rounded-xl px-2 py-1 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Muscles */}
                      <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                          Muscles principaux
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {MUSCLE_GROUPS.map(({ slug, label }) => {
                            const active = ex.primary_muscles.includes(slug)
                            return (
                              <button
                                key={slug}
                                type="button"
                                onClick={() => {
                                  const next = active
                                    ? ex.primary_muscles.filter((m) => m !== slug)
                                    : [...ex.primary_muscles, slug]
                                  const sec = ex.secondary_muscles.filter((m) => m !== slug)
                                  updateExercise(si, ei, { primary_muscles: next, secondary_muscles: sec })
                                }}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-colors ${
                                  active
                                    ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                                    : 'bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
                                }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>

                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mt-1">
                          Muscles secondaires
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {MUSCLE_GROUPS.map(({ slug, label }) => {
                            const isPrimary   = ex.primary_muscles.includes(slug)
                            const isSecondary = ex.secondary_muscles.includes(slug)
                            return (
                              <button
                                key={slug}
                                type="button"
                                disabled={isPrimary}
                                onClick={() => {
                                  const next = isSecondary
                                    ? ex.secondary_muscles.filter((m) => m !== slug)
                                    : [...ex.secondary_muscles, slug]
                                  updateExercise(si, ei, { secondary_muscles: next })
                                }}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-colors ${
                                  isPrimary
                                    ? 'opacity-20 cursor-not-allowed bg-white/[0.02] text-white/20'
                                    : isSecondary
                                    ? 'bg-[#1f8a65]/10 text-[#1f8a65]/60 border border-[#1f8a65]/20'
                                    : 'bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07]'
                                }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      <input
                        value={ex.notes}
                        onChange={(e) =>
                          updateExercise(si, ei, { notes: e.target.value })
                        }
                        placeholder="Notes optionnelles"
                        className="bg-transparent text-xs text-white/70 outline-none placeholder:text-white/30 border-t border-white/[0.06] pt-2"
                      />

                      {/* Alternatives client (mode édition uniquement) */}
                      {isEdit && templateId && ex.dbId && (
                        <ExerciseClientAlternatives
                          templateId={templateId}
                          exerciseId={ex.dbId}
                        />
                      )}

                      {/* Intelligence alerts */}
                      <IntelligenceAlertBadge
                        alerts={alertsFor(si, ei)}
                        onOpenAlternatives={() => setAlternativesTarget({ si, ei })}
                      />

                      {/* Bouton alternatives */}
                      <button
                        type="button"
                        onClick={() => setAlternativesTarget({ si, ei })}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-white/30 hover:text-[#1f8a65] transition-colors"
                      >
                        <ArrowLeftRight size={10} />
                        Alternatives
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addExercise(si)}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors py-1"
                >
                  <Plus size={13} />
                  Ajouter un exercice
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => setSessions((prev) => [...prev, emptySession()])}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors py-2"
        >
          <Plus size={15} />
          Ajouter une séance
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Exercise picker modal */}
      {pickerTarget && (
        <ExercisePicker
          onSelect={({ name, gifUrl, movementPattern, equipment, isCompound }) => {
            const { si, ei } = pickerTarget;
            updateExercise(si, ei, {
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

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-white/70 hover:text-white px-4 py-2"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1f8a65] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#217356] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saving
            ? "Enregistrement…"
            : isEdit
              ? "Mettre à jour"
              : "Créer le template"}
        </button>
      </div>
    </div>

    {/* Panel intelligence — colonne droite fixe */}
    <div className="w-[420px] shrink-0 sticky top-[96px] self-start flex flex-col gap-2 max-h-[calc(100vh-112px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {intelligenceProfile && (intelligenceProfile.injuries.length > 0 || intelligenceProfile.equipment.length > 0) && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-[#1f8a65] bg-[#1f8a65]/10 px-2 py-0.5 rounded-full">
            Profil client appliqué
          </span>
        </div>
      )}
      <ProgramIntelligencePanel
        result={intelligenceResult}
        weeks={meta.weeks}
        onAlertClick={handleAlertClick}
      />
    </div>

    {/* Drawer alternatives */}
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
        }}
        onClose={() => setAlternativesTarget(null)}
      />
    )}
    </div>
  );
}
