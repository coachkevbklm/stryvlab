"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

const SUPERSET_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316']

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
  session_mode: 'day' | 'cycle';
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
          session_mode: (initial.session_mode ?? 'day') as 'day' | 'cycle',
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
          session_mode: 'day',
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

  const orderedSessions = useMemo(() =>
    meta.session_mode === 'day'
      ? [...sessions].sort((a, b) => (a.day_of_week ?? 99) - (b.day_of_week ?? 99))
      : sessions,
    [sessions, meta.session_mode]
  )

  function rawSessionIndex(orderedSi: number): number {
    const target = orderedSessions[orderedSi]
    if (!target) return 0  // defensive fallback — should never happen in practice
    return sessions.indexOf(target)
  }

  function moveSession(fromSi: number, toSi: number) {
    if (meta.session_mode !== 'cycle') return
    if (fromSi === toSi) return
    setSessions(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromSi, 1)
      next.splice(toSi, 0, moved)
      return next
    })
  }

  function moveExercise(
    fromSi: number, fromEi: number,
    toSi: number, toEi: number,
  ) {
    if (fromSi === toSi && fromEi === toEi) return
    setSessions(prev => {
      const next = prev.map(s => ({ ...s, exercises: [...s.exercises] }))
      const [moved] = next[fromSi].exercises.splice(fromEi, 1)
      next[toSi].exercises.splice(toEi, 0, moved)
      return next
    })
  }

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
  // Picker used to add a client alternative — callback receives the picked name
  const [altPickerCallback, setAltPickerCallback] = useState<((name: string) => Promise<void>) | null>(null);
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

  // Compute stable color mapping: group_id → color
  const supersetGroupColors = useMemo(() => {
    const map: Record<string, string> = {}
    let colorIdx = 0
    sessions.forEach(s => {
      s.exercises.forEach(e => {
        if (e.group_id && !map[e.group_id]) {
          map[e.group_id] = SUPERSET_COLORS[colorIdx % SUPERSET_COLORS.length]
          colorIdx++
        }
      })
    })
    return map
  }, [sessions])

  function toggleSuperset(si: number, ei: number) {
    setSessions(prev => {
      const session = prev[si]
      const ex = session.exercises[ei]

      if (ex.group_id) {
        // Remove from superset — if only 1 exercise left in group, clear the other too
        const groupId = ex.group_id
        const groupMembers = session.exercises.filter(e => e.group_id === groupId)
        return prev.map((s, i) => {
          if (i !== si) return s
          const updated = s.exercises.map(e => {
            if (e.group_id !== groupId) return e
            // If 2 members: removing one should clear both if only 1 remains after
            if (groupMembers.length <= 2 || e === ex) return { ...e, group_id: undefined }
            return e
          })
          return { ...s, exercises: updated }
        })
      } else {
        // Add to superset with the next exercise — create a new group_id
        const nextEx = session.exercises[ei + 1]
        if (!nextEx) return prev // no next exercise to pair with
        const groupId = `sg-${Date.now()}`
        return prev.map((s, i) => {
          if (i !== si) return s
          return {
            ...s,
            exercises: s.exercises.map((e, idx) => {
              if (idx === ei) return { ...e, group_id: groupId }
              if (idx === ei + 1) {
                // If next exercise already has a group, join that group instead
                return { ...e, group_id: nextEx.group_id ?? groupId }
              }
              return e
            }),
          }
        })
      }
    })
  }

  const navSessions = useMemo(() =>
    orderedSessions.map(s => ({
      name: s.name,
      exercises: s.exercises.map(e => ({ name: e.name })),
    })),
    [orderedSessions]
  )

  // ─── Resizable split layout ────────────────────────────────────────────────
  const [navWidth, setNavWidth] = useState(16)       // % of total width
  const [intelWidth, setIntelWidth] = useState(30)   // % of total width
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<'left' | 'right' | null>(null)
  const startXRef = useRef(0)
  const startNavRef = useRef(16)
  const startIntelRef = useRef(30)

  const onMouseDownLeft = useCallback((e: React.MouseEvent) => {
    draggingRef.current = 'left'
    startXRef.current = e.clientX
    startNavRef.current = navWidth
    e.preventDefault()
  }, [navWidth])

  const onMouseDownRight = useCallback((e: React.MouseEvent) => {
    draggingRef.current = 'right'
    startXRef.current = e.clientX
    startIntelRef.current = intelWidth
    e.preventDefault()
  }, [intelWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const totalW = containerRef.current.offsetWidth
      const dx = e.clientX - startXRef.current
      const dPct = (dx / totalW) * 100
      if (draggingRef.current === 'left') {
        const next = Math.min(Math.max(startNavRef.current + dPct, 12), 28)
        setNavWidth(next)
      } else {
        const next = Math.min(Math.max(startIntelRef.current - dPct, 22), 42)
        setIntelWidth(next)
      }
    }
    function onMouseUp() { draggingRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col bg-[#121212] overflow-hidden">
      {/* Dual-pane layout */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Navigator */}
        <div style={{ flexGrow: navWidth, flexShrink: 1, flexBasis: 0, minWidth: 160, overflow: 'hidden' }}>
          <NavigatorPane
            sessions={navSessions}
            activeSessionIndex={null}
            activeExerciseKey={highlightKey}
            onSelectSession={si => {
              const el = exerciseRefs.current[`${rawSessionIndex(si)}-0`]
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            onSelectExercise={(si, ei) => handleAlertClick(rawSessionIndex(si), ei)}
            onAddSession={() => setSessions(prev => [...prev, emptySession()])}
          />
        </div>

        {/* Resize handle left */}
        <div
          onMouseDown={onMouseDownLeft}
          className="w-1 flex-none bg-white/[0.06] hover:bg-[#1f8a65]/50 cursor-col-resize transition-colors active:bg-[#1f8a65]"
        />

        {/* Editor — takes remaining space */}
        <div style={{ flexGrow: 100 - navWidth - intelWidth, flexShrink: 1, flexBasis: 0, minWidth: 0, overflow: 'hidden' }}>
          <EditorPane
            meta={meta}
            sessions={orderedSessions}
            saving={saving}
            error={error}
            uploadingKey={uploadingKey}
            highlightKey={highlightKey}
            intelligenceResult={intelligenceResult}
            morphoConnected={morphoConnected}
            templateId={templateId}
            alertsFor={alertsFor}
            sessionMode={meta.session_mode}
            onMetaChange={patch => setMeta(m => ({ ...m, ...patch }))}
            onSessionModeChange={mode => setMeta(m => ({ ...m, session_mode: mode }))}
            onUpdateSession={(si, patch) => updateSession(rawSessionIndex(si), patch)}
            onUpdateExercise={(si, ei, patch) => updateExercise(rawSessionIndex(si), ei, patch)}
            onRemoveExercise={(si, ei) => removeExercise(rawSessionIndex(si), ei)}
            onAddExercise={si => addExercise(rawSessionIndex(si))}
            onRemoveSession={si => removeSession(rawSessionIndex(si))}
            onAddSession={() => setSessions(prev => [...prev, emptySession()])}
            onImageUpload={(si, ei, file) => handleImageUpload(rawSessionIndex(si), ei, file)}
            onPickExercise={(si, ei) => setPickerTarget({ si: rawSessionIndex(si), ei })}
            onPickExerciseForAlternative={(si, ei, addFn) => {
              setAltPickerCallback(() => addFn)
              setPickerTarget({ si: rawSessionIndex(si), ei })
            }}
            onOpenAlternatives={(si, ei) => setAlternativesTarget({ si: rawSessionIndex(si), ei })}
            onToggleSuperset={(si, ei) => toggleSuperset(rawSessionIndex(si), ei)}
            onMoveSession={(fromSi, toSi) => moveSession(rawSessionIndex(fromSi), rawSessionIndex(toSi))}
            supersetGroupColors={supersetGroupColors}
            onSave={handleSave}
            exerciseRefSetter={exerciseRefSetter}
          />
        </div>

        {/* Resize handle right */}
        <div
          onMouseDown={onMouseDownRight}
          className="w-1 flex-none bg-white/[0.06] hover:bg-[#1f8a65]/50 cursor-col-resize transition-colors active:bg-[#1f8a65]"
        />

        {/* Intelligence Panel */}
        <div style={{ flexGrow: intelWidth, flexShrink: 1, flexBasis: 0, minWidth: 260, overflow: 'hidden' }}>
          <IntelligencePanelShell
            result={intelligenceResult}
            weeks={meta.weeks}
            onAlertClick={handleAlertClick}
            morphoConnected={morphoConnected}
            sraHeatmap={intelligenceResult?.sraHeatmap}
            labOverrides={labOverrides}
            presentPatterns={Array.from(new Set(sessions.flatMap(s => s.exercises.map(e => e.movement_pattern).filter(Boolean) as string[])))}
            onOverrideChange={onOverrideChange}
            onOverrideReset={onOverrideReset}
          />
        </div>
      </div>

      {/* Overlays */}
      {pickerTarget && (
        <ExercisePicker
          onSelect={({ name, gifUrl, movementPattern, equipment, isCompound }) => {
            if (altPickerCallback) {
              // Mode: adding a client alternative
              altPickerCallback(name)
              setAltPickerCallback(null)
            } else {
              // Mode: replacing/setting main exercise
              updateExercise(pickerTarget.si, pickerTarget.ei, {
                name,
                image_url: gifUrl,
                movement_pattern: movementPattern,
                equipment_required: equipment,
                is_compound: isCompound,
              })
            }
            setPickerTarget(null)
          }}
          onClose={() => {
            setPickerTarget(null)
            setAltPickerCallback(null)
          }}
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
