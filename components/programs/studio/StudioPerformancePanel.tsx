"use client";

import type { ElementType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Gauge,
  Moon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Period = 7 | 30 | 90 | 0;
type Segment = "summary" | "volume" | "intensity" | "exercises";
type Mode = "essential" | "analyst";

interface KPIs {
  totalSessions: number;
  completedSessions: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  avgDuration: number;
}

interface TimelinePoint {
  date: string;
  volume: number;
  reps: number;
  sets: number;
  sessions: number;
}

interface ExerciseSession {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
  sets: number;
}

interface ExerciseSummary {
  name: string;
  sessions: ExerciseSession[];
}

interface DurationBucket {
  id: string;
  date: string;
  durationMin: number;
  isCompleted: boolean;
}

interface MuscleGroup {
  name: string;
  volume: number;
  sets: number;
  reps: number;
}

interface MovementPattern {
  name: string;
  volume: number;
  sets: number;
  reps: number;
}

interface Adherence {
  plannedSessions: number;
  loggedSessions: number;
  completedPlannedSessions: number;
  sessionAdherenceRate: number | null;
  plannedExercises: number;
  performedExercises: number;
  exerciseCoverageRate: number | null;
}

interface PrescriptionDrift {
  plannedSets: number;
  effectiveSets: number;
  setCompletionRate: number | null;
  avgPlannedRestSec: number | null;
  avgActualRestSec: number | null;
  restDeltaSec: number | null;
  avgTargetRir: number | null;
  avgActualRir: number | null;
  rirDelta: number | null;
}

interface WeeklyComparisons {
  currentWeekVolume: number;
  previousWeekVolume: number;
  currentWeekSets: number;
  previousWeekSets: number;
  currentWeekSessions: number;
  previousWeekSessions: number;
}

interface Quality {
  hasDrafts: boolean;
  hasPartialData: boolean;
  missingDurationRate: number;
  missingRirRate: number;
  missingRestRate: number;
  exerciseHistoryCoverage: number;
  confidenceScore: number;
}

interface RirDistributionBucket {
  label: string;
  count: number;
}

interface ProgramContext {
  programId: string;
  programName: string;
  goal: string | null;
  level: string | null;
  weeks: number | null;
  frequency: number | null;
  sessionMode: string | null;
}

interface KeyExerciseSession extends ExerciseSession {
  oneRM: number;
  actualRestSec: number | null;
  actualRir: number | null;
}

interface KeyExercise {
  id: string;
  name: string;
  movementPattern: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  currentWeightKg: number | null;
  weightIncrementKg: number | null;
  targetRir: number | null;
  actualRirAvg: number | null;
  plannedRestSec: number | null;
  actualRestSec: number | null;
  plannedSets: number;
  performedSets: number;
  performedReps: number;
  performedVolume: number;
  exposureCount: number;
  estimated1RM: number | null;
  sessions: KeyExerciseSession[];
  hasEnoughHistory: boolean;
}

interface PerformancePayload {
  kpis: KPIs;
  timeline: TimelinePoint[];
  exercises: ExerciseSummary[];
  muscleGroups: MuscleGroup[];
  movementPatterns: MovementPattern[];
  keyExercises: KeyExercise[];
  rpeTrend: { date: string; avgRpe: number }[];
  draftSessions: number;
  completionRate: number;
  avgRestSec: number | null;
  durationBuckets: DurationBucket[];
  adherence: Adherence;
  prescriptionDrift: PrescriptionDrift;
  weeklyComparisons: WeeklyComparisons;
  quality: Quality;
  rirDistribution: RirDistributionBucket[];
  programContext: ProgramContext | null;
  latestSession: {
    id: string;
    sessionName: string;
    date: string;
    durationMin: number | null;
    volume: number;
    avgRpe: number | null;
    isCompleted: boolean;
  } | null;
  dataQuality: {
    hasPartialData: boolean;
    hasDrafts: boolean;
  };
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizePerformancePayload(payload: unknown): PerformancePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;

  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          date: typeof entry.date === "string" ? entry.date : "",
          volume: toNumber(entry.volume),
          reps: toNumber(entry.reps),
          sets: toNumber(entry.sets),
          sessions: toNumber(entry.sessions),
        };
      }).filter((item) => item.date)
    : [];

  const exercises = Array.isArray(raw.exercises)
    ? raw.exercises.map((item) => {
        const entry = item as Record<string, unknown>;
        const sessions = Array.isArray(entry.sessions)
          ? entry.sessions.map((session) => {
              const current = session as Record<string, unknown>;
              return {
                date: typeof current.date === "string" ? current.date : "",
                maxWeight: toNumber(current.maxWeight),
                totalVolume: toNumber(current.totalVolume),
                totalReps: toNumber(current.totalReps),
                sets: toNumber(current.sets),
              };
            }).filter((session) => session.date)
          : [];

        return {
          name: typeof entry.name === "string" ? entry.name : "Exercice",
          sessions,
        };
      })
    : [];

  const muscleGroups = Array.isArray(raw.muscleGroups)
    ? raw.muscleGroups.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          name: typeof entry.name === "string" ? entry.name : "Autre",
          volume: toNumber(entry.volume),
          sets: toNumber(entry.sets),
          reps: toNumber(entry.reps),
        };
      })
    : [];

  const movementPatterns = Array.isArray(raw.movementPatterns)
    ? raw.movementPatterns.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          name: typeof entry.name === "string" ? entry.name : "Pattern",
          volume: toNumber(entry.volume),
          sets: toNumber(entry.sets),
          reps: toNumber(entry.reps),
        };
      })
    : [];

  const keyExercises = Array.isArray(raw.keyExercises)
    ? raw.keyExercises.map((item) => {
        const entry = item as Record<string, unknown>;
        const sessions = Array.isArray(entry.sessions)
          ? entry.sessions.map((session) => {
              const current = session as Record<string, unknown>;
              return {
                date: typeof current.date === "string" ? current.date : "",
                maxWeight: toNumber(current.maxWeight),
                totalVolume: toNumber(current.totalVolume),
                totalReps: toNumber(current.totalReps),
                sets: toNumber(current.sets),
                oneRM: toNumber(current.oneRM),
                actualRestSec: toNullableNumber(current.actualRestSec),
                actualRir: toNullableNumber(current.actualRir),
              };
            }).filter((session) => session.date)
          : [];

        return {
          id: typeof entry.id === "string" ? entry.id : typeof entry.name === "string" ? entry.name : crypto.randomUUID(),
          name: typeof entry.name === "string" ? entry.name : "Exercice",
          movementPattern: typeof entry.movementPattern === "string" ? entry.movementPattern : null,
          primaryMuscles: toStringArray(entry.primaryMuscles),
          secondaryMuscles: toStringArray(entry.secondaryMuscles),
          currentWeightKg: toNullableNumber(entry.currentWeightKg),
          weightIncrementKg: toNullableNumber(entry.weightIncrementKg),
          targetRir: toNullableNumber(entry.targetRir),
          actualRirAvg: toNullableNumber(entry.actualRirAvg),
          plannedRestSec: toNullableNumber(entry.plannedRestSec),
          actualRestSec: toNullableNumber(entry.actualRestSec),
          plannedSets: toNumber(entry.plannedSets),
          performedSets: toNumber(entry.performedSets),
          performedReps: toNumber(entry.performedReps),
          performedVolume: toNumber(entry.performedVolume),
          exposureCount: toNumber(entry.exposureCount),
          estimated1RM: toNullableNumber(entry.estimated1RM),
          sessions,
          hasEnoughHistory: Boolean(entry.hasEnoughHistory),
        };
      })
    : [];

  const rpeTrend = Array.isArray(raw.rpeTrend)
    ? raw.rpeTrend.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          date: typeof entry.date === "string" ? entry.date : "",
          avgRpe: toNumber(entry.avgRpe),
        };
      }).filter((item) => item.date)
    : [];

  const durationBuckets = Array.isArray(raw.durationBuckets)
    ? raw.durationBuckets.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          id: typeof entry.id === "string" ? entry.id : typeof entry.date === "string" ? entry.date : crypto.randomUUID(),
          date: typeof entry.date === "string" ? entry.date : "",
          durationMin: toNumber(entry.durationMin),
          isCompleted: Boolean(entry.isCompleted),
        };
      }).filter((item) => item.date)
    : [];

  const rirDistribution = Array.isArray(raw.rirDistribution)
    ? raw.rirDistribution.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          label: typeof entry.label === "string" ? entry.label : "RIR",
          count: toNumber(entry.count),
        };
      })
    : [];

  const rawKpis = (raw.kpis as Record<string, unknown> | undefined) ?? {};
  const rawAdherence = (raw.adherence as Record<string, unknown> | undefined) ?? {};
  const rawPrescriptionDrift = (raw.prescriptionDrift as Record<string, unknown> | undefined) ?? {};
  const rawWeeklyComparisons = (raw.weeklyComparisons as Record<string, unknown> | undefined) ?? {};
  const rawQuality = (raw.quality as Record<string, unknown> | undefined) ?? {};
  const rawDataQuality = (raw.dataQuality as Record<string, unknown> | undefined) ?? {};
  const rawLatestSession = raw.latestSession && typeof raw.latestSession === "object"
    ? (raw.latestSession as Record<string, unknown>)
    : null;
  const rawProgramContext = raw.programContext && typeof raw.programContext === "object"
    ? (raw.programContext as Record<string, unknown>)
    : null;

  return {
    kpis: {
      totalSessions: toNumber(rawKpis.totalSessions),
      completedSessions: toNumber(rawKpis.completedSessions),
      totalSets: toNumber(rawKpis.totalSets),
      totalReps: toNumber(rawKpis.totalReps),
      totalVolume: toNumber(rawKpis.totalVolume),
      avgDuration: toNumber(rawKpis.avgDuration),
    },
    timeline,
    exercises,
    muscleGroups,
    movementPatterns,
    keyExercises,
    rpeTrend,
    draftSessions: toNumber(raw.draftSessions),
    completionRate: toNumber(raw.completionRate),
    avgRestSec: toNullableNumber(raw.avgRestSec),
    durationBuckets,
    adherence: {
      plannedSessions: toNumber(rawAdherence.plannedSessions),
      loggedSessions: toNumber(rawAdherence.loggedSessions),
      completedPlannedSessions: toNumber(rawAdherence.completedPlannedSessions),
      sessionAdherenceRate: toNullableNumber(rawAdherence.sessionAdherenceRate),
      plannedExercises: toNumber(rawAdherence.plannedExercises),
      performedExercises: toNumber(rawAdherence.performedExercises),
      exerciseCoverageRate: toNullableNumber(rawAdherence.exerciseCoverageRate),
    },
    prescriptionDrift: {
      plannedSets: toNumber(rawPrescriptionDrift.plannedSets),
      effectiveSets: toNumber(rawPrescriptionDrift.effectiveSets),
      setCompletionRate: toNullableNumber(rawPrescriptionDrift.setCompletionRate),
      avgPlannedRestSec: toNullableNumber(rawPrescriptionDrift.avgPlannedRestSec),
      avgActualRestSec: toNullableNumber(rawPrescriptionDrift.avgActualRestSec),
      restDeltaSec: toNullableNumber(rawPrescriptionDrift.restDeltaSec),
      avgTargetRir: toNullableNumber(rawPrescriptionDrift.avgTargetRir),
      avgActualRir: toNullableNumber(rawPrescriptionDrift.avgActualRir),
      rirDelta: toNullableNumber(rawPrescriptionDrift.rirDelta),
    },
    weeklyComparisons: {
      currentWeekVolume: toNumber(rawWeeklyComparisons.currentWeekVolume),
      previousWeekVolume: toNumber(rawWeeklyComparisons.previousWeekVolume),
      currentWeekSets: toNumber(rawWeeklyComparisons.currentWeekSets),
      previousWeekSets: toNumber(rawWeeklyComparisons.previousWeekSets),
      currentWeekSessions: toNumber(rawWeeklyComparisons.currentWeekSessions),
      previousWeekSessions: toNumber(rawWeeklyComparisons.previousWeekSessions),
    },
    quality: {
      hasDrafts: Boolean(rawQuality.hasDrafts),
      hasPartialData: Boolean(rawQuality.hasPartialData),
      missingDurationRate: toNumber(rawQuality.missingDurationRate),
      missingRirRate: toNumber(rawQuality.missingRirRate),
      missingRestRate: toNumber(rawQuality.missingRestRate),
      exerciseHistoryCoverage: toNumber(rawQuality.exerciseHistoryCoverage),
      confidenceScore: toNumber(rawQuality.confidenceScore),
    },
    rirDistribution,
    programContext: rawProgramContext
      ? {
          programId: typeof rawProgramContext.programId === "string" ? rawProgramContext.programId : "",
          programName: typeof rawProgramContext.programName === "string" ? rawProgramContext.programName : "Programme",
          goal: typeof rawProgramContext.goal === "string" ? rawProgramContext.goal : null,
          level: typeof rawProgramContext.level === "string" ? rawProgramContext.level : null,
          weeks: toNullableNumber(rawProgramContext.weeks),
          frequency: toNullableNumber(rawProgramContext.frequency),
          sessionMode: typeof rawProgramContext.sessionMode === "string" ? rawProgramContext.sessionMode : null,
        }
      : null,
    latestSession: rawLatestSession
      ? {
          id: typeof rawLatestSession.id === "string" ? rawLatestSession.id : "",
          sessionName:
            typeof rawLatestSession.sessionName === "string" ? rawLatestSession.sessionName : "Séance récente",
          date: typeof rawLatestSession.date === "string" ? rawLatestSession.date : "",
          durationMin: toNullableNumber(rawLatestSession.durationMin),
          volume: toNumber(rawLatestSession.volume),
          avgRpe: toNullableNumber(rawLatestSession.avgRpe),
          isCompleted: Boolean(rawLatestSession.isCompleted),
        }
      : null,
    dataQuality: {
      hasPartialData: Boolean(rawDataQuality.hasPartialData),
      hasDrafts: Boolean(rawDataQuality.hasDrafts),
    },
  };
}

const PERIOD_LABELS: Record<Period, string> = {
  7: "7 j",
  30: "30 j",
  90: "90 j",
  0: "Tout",
};

const SEGMENT_LABELS: Record<Segment, string> = {
  summary: "Synthèse",
  volume: "Volume",
  intensity: "Intensité",
  exercises: "Exercices",
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatVolume(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} t`;
  return `${Math.round(value)} kg`;
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function deltaPercent(points: TimelinePoint[]) {
  if (points.length < 2) return null;
  const first = points[0].volume;
  const last = points[points.length - 1].volume;
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

function trendLabel(points: TimelinePoint[], hasDrafts: boolean, partial: boolean) {
  const delta = deltaPercent(points);
  if (hasDrafts) return "Données à fiabiliser";
  if (partial) return "Tendance émergente";
  if (delta != null && delta > 5) return "Progression en hausse";
  if (delta != null && delta < -8) return "Stagnation à investiguer";
  return "Progression stable";
}

function buildExerciseTrend(sessions: ExerciseSession[]) {
  if (sessions.length < 2) return "stable" as const;
  const first = sessions[0].maxWeight;
  const last = sessions[sessions.length - 1].maxWeight;
  if (last > first) return "up" as const;
  if (last < first) return "down" as const;
  return "stable" as const;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
          {label}
        </p>
        <Icon size={13} className="text-white/45" />
      </div>
      <p className="text-[18px] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/45">{detail}</p>
    </div>
  );
}

function formatSignedNumber(value: number | null, suffix = "") {
  if (value == null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function SectionCard({
  label,
  title,
  detail,
  action,
  children,
}: {
  label: string;
  title?: string;
  detail?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
            {label}
          </p>
          {title ? <p className="mt-1 text-sm font-semibold text-white">{title}</p> : null}
          {detail ? <p className="mt-1 text-[12px] text-white/50">{detail}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function StudioPerformancePanel({
  clientId,
  programId: _programId,
  period: initialPeriod = 30,
  anchorExerciseNames = [],
  onExerciseSelect,
}: {
  clientId?: string;
  programId?: string;
  period?: Period;
  anchorExerciseNames?: string[];
  onExerciseSelect?: (exerciseName: string) => void;
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [segment, setSegment] = useState<Segment>("summary");
  const [mode, setMode] = useState<Mode>("essential");
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("stryvr-studio-performance-mode");
    if (stored === "essential" || stored === "analyst") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("stryvr-studio-performance-mode", mode);
  }, [mode]);

  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [segment, period, mode]);

  useEffect(() => {
    if (!clientId) {
      setData(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/clients/${clientId}/performance?days=${period}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (!alive) return;
        setData(normalizePerformancePayload(json));
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erreur de chargement");
        setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [clientId, period]);

  const anchoredExercises = useMemo(() => {
    if (!data) return [];
    const anchorSet = new Set(
      anchorExerciseNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
    );

    const source = data.keyExercises.length > 0
      ? data.keyExercises.map((exercise) => ({
          name: exercise.name,
          sessions: exercise.sessions,
          exposureCount: exercise.exposureCount,
          performedVolume: exercise.performedVolume,
          estimated1RM: exercise.estimated1RM,
          plannedSets: exercise.plannedSets,
          performedSets: exercise.performedSets,
          plannedRestSec: exercise.plannedRestSec,
          actualRestSec: exercise.actualRestSec,
          targetRir: exercise.targetRir,
          actualRirAvg: exercise.actualRirAvg,
          movementPattern: exercise.movementPattern,
          hasEnoughHistory: exercise.hasEnoughHistory,
        }))
      : data.exercises.map((exercise) => ({
          name: exercise.name,
          sessions: exercise.sessions,
          exposureCount: exercise.sessions.length,
          performedVolume: exercise.sessions.reduce((sum, item) => sum + item.totalVolume, 0),
          estimated1RM: null,
          plannedSets: 0,
          performedSets: exercise.sessions.reduce((sum, item) => sum + item.sets, 0),
          plannedRestSec: null,
          actualRestSec: null,
          targetRir: null,
          actualRirAvg: null,
          movementPattern: null,
          hasEnoughHistory: exercise.sessions.length >= 2,
        }));

    const prioritized = [...source].sort((a, b) => {
      const aAnchor = anchorSet.has(a.name.toLowerCase()) ? 1 : 0;
      const bAnchor = anchorSet.has(b.name.toLowerCase()) ? 1 : 0;
      if (aAnchor !== bAnchor) return bAnchor - aAnchor;
      return b.performedVolume - a.performedVolume;
    });

    return prioritized.slice(0, mode === "analyst" ? 6 : 4);
  }, [data, anchorExerciseNames, mode]);

  const hasRenderableData = data
    ? data.kpis.totalSessions > 0 ||
      data.timeline.length > 0 ||
      data.exercises.length > 0 ||
      data.keyExercises.length > 0 ||
      data.muscleGroups.length > 0 ||
      data.movementPatterns.length > 0 ||
      data.rpeTrend.length > 0 ||
      data.durationBuckets.length > 0 ||
      data.rirDistribution.length > 0 ||
      data.latestSession != null
    : false;

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[12px] text-white/45">
          La vue Performance est disponible uniquement dans le contexte client.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-4">
        <p className="text-sm font-semibold text-white">Performance indisponible</p>
        <p className="mt-1 text-[12px] text-red-200/75">
          {error ?? "Impossible de charger les données."}
        </p>
      </div>
    );
  }

  if (!hasRenderableData) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-sm font-semibold text-white">Performance indisponible</p>
        <p className="mt-1 text-[12px] text-white/45">
          Données performance insuffisantes pour générer une analyse fiable.
        </p>
      </div>
    );
  }

  const volumeDelta = deltaPercent(data.timeline);
  const avgRpe =
    data.rpeTrend.length > 0
      ? data.rpeTrend.reduce((sum, item) => sum + item.avgRpe, 0) / data.rpeTrend.length
      : null;
  const status = trendLabel(
    data.timeline,
    data.dataQuality.hasDrafts,
    data.dataQuality.hasPartialData,
  );
  const topSignals = [
    data.dataQuality.hasDrafts
      ? `${data.draftSessions} brouillon${data.draftSessions > 1 ? "s" : ""} à nettoyer`
      : null,
    data.adherence.sessionAdherenceRate != null && data.adherence.plannedSessions > 0
      ? `${Math.round(data.adherence.sessionAdherenceRate * 100)}% d'adhérence séances`
      : null,
    volumeDelta != null
      ? `${formatPercent(volumeDelta)} de volume utile sur la période`
      : "Pas assez de recul pour une tendance robuste",
    avgRpe != null
      ? avgRpe >= 8.5
        ? "Intensité élevée sur la période"
        : avgRpe <= 6.5
          ? "Marge d'effort encore large"
          : `RPE moyen ${avgRpe.toFixed(1)}`
      : "RIR/RPE encore incomplets",
  ].filter(Boolean) as string[];
  const averageSetsPerSession =
    data.kpis.completedSessions > 0
      ? data.kpis.totalSets / data.kpis.completedSessions
      : null;
  const averageRepsPerSession =
    data.kpis.completedSessions > 0
      ? data.kpis.totalReps / data.kpis.completedSessions
      : null;
  const densityKgPerMin =
    data.kpis.avgDuration > 0
      ? data.kpis.totalVolume / Math.max(data.kpis.avgDuration, 1)
      : null;

  const muscleGroupsSorted = data.muscleGroups
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, mode === "analyst" ? 6 : 5);

  const topMuscleVolume = Math.max(...muscleGroupsSorted.map((item) => item.volume), 1);
  const movementPatternsSorted = data.movementPatterns.slice().sort((a, b) => b.volume - a.volume).slice(0, 4);
  const adherencePercent = data.adherence.sessionAdherenceRate != null
    ? Math.round(data.adherence.sessionAdherenceRate * 100)
    : null;
  const exerciseCoveragePercent = data.adherence.exerciseCoverageRate != null
    ? Math.round(data.adherence.exerciseCoverageRate * 100)
    : null;
  const avgTargetRir = data.prescriptionDrift.avgTargetRir;
  const avgActualRir = data.prescriptionDrift.avgActualRir;
  const restDeltaSec = data.prescriptionDrift.restDeltaSec;
  const weeklyVolumeDelta =
    data.weeklyComparisons.previousWeekVolume > 0
      ? ((data.weeklyComparisons.currentWeekVolume - data.weeklyComparisons.previousWeekVolume) /
          data.weeklyComparisons.previousWeekVolume) *
        100
      : null;

  return (
    <div ref={panelRef} className="space-y-4">
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-white/[0.015] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Pulse
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-white">{status}</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-white/50">
              {volumeDelta != null
                ? `${formatPercent(volumeDelta)} de volume utile sur ${period === 0 ? "tout l'historique" : `${period} jours`}.`
                : "Pas encore assez de recul pour quantifier la tendance."}
            </p>
          </div>
          <div className="rounded-full border border-white/[0.05] bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            {data.kpis.completedSessions}/{data.kpis.totalSessions} validées
          </div>
        </div>

        {data.latestSession ? (
          <div className="mt-4 rounded-xl border border-white/[0.04] bg-black/15 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              Dernière séance
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {data.latestSession.sessionName}
            </p>
            <p className="mt-1 text-[11px] text-white/45">
              {formatLongDate(data.latestSession.date)} · {data.latestSession.durationMin ?? "—"} min ·{" "}
              {formatVolume(data.latestSession.volume)}
              {data.latestSession.avgRpe != null
                ? ` · RPE ${data.latestSession.avgRpe.toFixed(1)}`
                : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {topSignals.slice(0, mode === "analyst" ? 3 : 2).map((signal) => (
            <div
              key={signal}
              className="rounded-full border border-white/[0.05] bg-black/15 px-3 py-1.5 text-[10px] font-semibold text-white/60"
            >
              {signal}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/[0.04] bg-white/[0.018] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
            Lecture
          </p>
          <p className="text-[11px] text-white/42">Mode coach et période</p>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.035] p-1">
            <button
              type="button"
              onClick={() => setMode("essential")}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                mode === "essential" ? "bg-accent text-white" : "text-white/45 hover:text-white"
              }`}
            >
              Essentiel
            </button>
            <button
              type="button"
              onClick={() => setMode("analyst")}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                mode === "analyst" ? "bg-accent text-white" : "text-white/45 hover:text-white"
              }`}
            >
              Analyste
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/[0.035] p-1">
            {([7, 30, 90, 0] as Period[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                  period === value ? "bg-accent text-white" : "text-white/45 hover:text-white"
                }`}
              >
                {PERIOD_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={segment} onValueChange={(value) => setSegment(value as Segment)}>
        <TabsList className="flex-wrap gap-2 border-b border-white/[0.04] bg-transparent p-0 pb-0">
          {(Object.keys(SEGMENT_LABELS) as Segment[]).map((value) => (
            <TabsTrigger key={value} value={value}>
              {SEGMENT_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={TrendingUp}
              label="Volume"
              value={formatVolume(data.kpis.totalVolume)}
              detail={`${data.kpis.totalSets} séries effectives suivies`}
            />
            <StatCard
              icon={Activity}
              label="Répétitions"
              value={data.kpis.totalReps.toLocaleString("fr-FR")}
              detail={`${data.kpis.completedSessions} séances validées sur la période`}
            />
            <StatCard
              icon={Clock3}
              label="Durée"
              value={data.kpis.avgDuration ? `${data.kpis.avgDuration} min` : "—"}
              detail={
                data.avgRestSec != null
                  ? `Repos moyen ${data.avgRestSec}s`
                  : "Repos réel pas encore assez renseigné"
              }
            />
            <StatCard
              icon={CheckCircle2}
              label={data.programContext ? "Adhérence" : "Complétion"}
              value={
                data.programContext && adherencePercent != null
                  ? `${adherencePercent}%`
                  : `${Math.round(data.completionRate * 100)}%`
              }
              detail={
                data.programContext && data.adherence.plannedSessions > 0
                  ? `${data.adherence.completedPlannedSessions}/${data.adherence.plannedSessions} séances prévues réalisées`
                  : data.draftSessions > 0
                    ? `${data.draftSessions} brouillon${data.draftSessions > 1 ? "s" : ""} à nettoyer`
                    : "Aucun brouillon détecté sur la période"
              }
            />
          </div>

          {mode === "analyst" ? (
            <SectionCard
              label="Lecture analyste"
              detail="Secondaires utiles pour affiner le dosage sans surcharger la vue."
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    Confiance
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {data.quality.confidenceScore}/100
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Fiabilité globale des données pour décider
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    Coverage
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {exerciseCoveragePercent != null ? `${exerciseCoveragePercent}%` : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Exercices du programme réellement couverts
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {data.programContext ? (
            <SectionCard
              label="Programme vs terrain"
              detail={`${data.programContext.programName} · ${
                data.programContext.frequency != null
                  ? `${data.programContext.frequency} séances / sem.`
                  : "fréquence non renseignée"
              }`}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    Séries prévues / réalisées
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {data.prescriptionDrift.plannedSets > 0
                      ? `${data.prescriptionDrift.effectiveSets}/${data.prescriptionDrift.plannedSets}`
                      : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {data.prescriptionDrift.setCompletionRate != null
                      ? `${Math.round(data.prescriptionDrift.setCompletionRate * 100)}% des sets prescrits réalisés`
                      : "Prescription sets non exploitable"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    Semaine vs semaine
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {weeklyVolumeDelta != null ? formatPercent(weeklyVolumeDelta) : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {data.weeklyComparisons.currentWeekVolume} kg vs {data.weeklyComparisons.previousWeekVolume} kg
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            label="Signaux prioritaires"
            detail="Ce qui mérite ton attention avant de modifier le bloc."
          >
            <div className="space-y-3">
              {topSignals.slice(0, mode === "analyst" ? 3 : 2).map((signal, index) => (
                <div
                  key={`${signal}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3"
                >
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05]">
                    {index === 0 ? (
                      <Sparkles size={12} className="text-accent" />
                    ) : index === 1 ? (
                      <Target size={12} className="text-white/60" />
                    ) : (
                      <AlertTriangle size={12} className="text-white/60" />
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/65">{signal}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            label="Charge utile"
            detail="Volume et intensité en un coup d'œil"
            action={
              avgRpe != null ? (
                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/55">
                  RPE {avgRpe.toFixed(1)}
                </span>
              ) : null
            }
          >
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline}>
                  <defs>
                    <linearGradient id="studioPerfSummary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f8a65" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1f8a65" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#181818",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                    }}
                    labelFormatter={(value) => formatLongDate(String(value))}
                    formatter={(value: number) => [formatVolume(value), "Volume"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#1f8a65"
                    strokeWidth={2}
                    fill="url(#studioPerfSummary)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <SectionCard
            label="Timeline"
            detail="Répartition de la charge utile"
            action={
              <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/55">
                {volumeDelta != null ? formatPercent(volumeDelta) : "—"}
              </span>
            }
          >
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeline}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#181818",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                    }}
                    labelFormatter={(value) => formatLongDate(String(value))}
                  />
                  <Bar dataKey={mode === "analyst" ? "sets" : "volume"} fill="#1f8a65" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            label="Répartition musculaire"
            detail="Lecture plus utile en rail: où passe la majorité de la charge."
          >
            <div className="space-y-3">
              {muscleGroupsSorted.map((group) => (
                <div key={group.name} className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-white">{group.name}</p>
                      {mode === "analyst" ? (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/35">
                          {group.sets} sets · {group.reps} reps
                        </p>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-white/50">{formatVolume(group.volume)}</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04]">
                    <div
                      className="h-2 rounded-full bg-[#1f8a65]"
                      style={{
                        width: `${Math.max(8, (group.volume / topMuscleVolume) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {mode === "analyst" && movementPatternsSorted.length > 0 ? (
            <SectionCard
              label="Patterns de mouvement"
              detail="Répartition par intention mécanique du programme."
            >
              <div className="space-y-3">
                {movementPatternsSorted.map((pattern) => (
                  <div key={pattern.name} className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-white">{pattern.name}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/35">
                          {pattern.sets} sets · {pattern.reps} reps
                        </p>
                      </div>
                      <p className="text-[11px] text-white/50">{formatVolume(pattern.volume)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </TabsContent>

        <TabsContent value="intensity" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Gauge}
              label="RPE moyen"
              value={avgRpe != null ? avgRpe.toFixed(1) : "—"}
              detail="Dérivé du RIR saisi"
            />
            <StatCard
              icon={Clock3}
              label="Repos moyen"
              value={data.avgRestSec != null ? `${data.avgRestSec}s` : "—"}
              detail="Repos réel entre les sets"
            />
            {mode === "analyst" ? (
              <>
                <StatCard
                  icon={Moon}
                  label="Séances suivies"
                  value={`${data.durationBuckets.length}`}
                  detail="Séances chronométrées récentes"
                />
                <StatCard
                  icon={Activity}
                  label="Densité"
                  value={densityKgPerMin != null ? `${Math.round(densityKgPerMin)} kg/min` : "—"}
                  detail="Volume ramené au temps moyen"
                />
              </>
            ) : null}
          </div>

          {data.programContext ? (
            <SectionCard
              label="Prescription vs ressenti"
              detail="Comparer ce qui était demandé et ce qui a réellement été absorbé."
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    RIR cible / réel
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {avgTargetRir != null && avgActualRir != null
                      ? `${avgTargetRir.toFixed(1)} / ${avgActualRir.toFixed(1)}`
                      : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Delta {formatSignedNumber(data.prescriptionDrift.rirDelta)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    Repos prescrit / réel
                  </p>
                  <p className="mt-2 text-[20px] font-semibold text-white">
                    {data.prescriptionDrift.avgPlannedRestSec != null && data.prescriptionDrift.avgActualRestSec != null
                      ? `${data.prescriptionDrift.avgPlannedRestSec}s / ${data.prescriptionDrift.avgActualRestSec}s`
                      : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Delta {formatSignedNumber(restDeltaSec, "s")}
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            label="Intensité par séance"
            detail="Zone cible hypertrophie: RPE 7–9"
            action={<Gauge size={13} className="text-white/45" />}
          >
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.rpeTrend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      background: "#181818",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                    }}
                    labelFormatter={(value) => formatLongDate(String(value))}
                    formatter={(value: number) => [`RPE ${value.toFixed(1)}`, "Intensité"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRpe"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            label="Lecture coach"
            action={<Brain size={13} className="text-white/45" />}
          >
            <div className="space-y-2 text-[12px] leading-relaxed text-white/55">
              <p>
                {avgRpe != null && avgRpe <= 6.5
                  ? "L'effort perçu reste assez bas: le client peut souvent absorber plus de charge ou de densité."
                  : avgRpe != null && avgRpe >= 8.5
                    ? "L'intensité est haute: surveille la récupération avant d'ajouter du stress."
                    : "L'intensité semble globalement dans une zone de travail exploitable."}
              </p>
              <p>
                {data.avgRestSec != null
                  ? `Le repos réel tourne autour de ${data.avgRestSec}s. Vérifie qu'il reste cohérent avec l'objectif du bloc.`
                  : "Le repos réel est encore incomplet: à utiliser comme signal secondaire pour l'instant."}
              </p>
            </div>
          </SectionCard>

          {mode === "analyst" ? (
            <SectionCard
              label="Distribution RIR"
              detail="Qualité de l'effort perçu sur les sets effectivement saisis."
            >
              <div className="grid grid-cols-4 gap-2">
                {data.rirDistribution.map((bucket) => (
                  <div key={bucket.label} className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                      {bucket.label}
                    </p>
                    <p className="mt-2 text-[18px] font-semibold text-white">{bucket.count}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <SectionCard
            label="Sauts rapides"
            detail="Ouvre directement le mouvement concerné dans le builder"
            action={<Dumbbell size={13} className="text-white/45" />}
          >
            <div className="flex flex-wrap gap-2">
              {anchoredExercises.length > 0 ? (
                anchoredExercises.map((exercise) => {
                  const isSelected =
                    selectedExerciseName?.toLowerCase() === exercise.name.toLowerCase();
                  return (
                    <button
                      key={`jump-${exercise.name}`}
                      type="button"
                      onClick={() => {
                        setSelectedExerciseName(exercise.name);
                        onExerciseSelect?.(exercise.name);
                      }}
                      className={`max-w-full truncate rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                        isSelected
                          ? "bg-[#1f8a65] text-white"
                          : "bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/80"
                      }`}
                      title={exercise.name}
                    >
                      {exercise.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-[12px] text-white/45">
                  Aucun mouvement disponible sur cette période.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            label="Durées d'entraînement"
            detail="Les dernières séances en bulles de temps"
            action={<Clock3 size={13} className="text-white/45" />}
          >
            <div className="flex flex-wrap gap-2">
              {data.durationBuckets.length > 0 ? (
                data.durationBuckets.map((bucket) => (
                  <div
                    key={bucket.id}
                    className={`rounded-full border px-3 py-2 text-center ${
                      bucket.isCompleted
                        ? "border-[#1f8a65]/18 bg-[#1f8a65]/8"
                        : "border-amber-500/18 bg-amber-500/8"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-white">{bucket.durationMin} min</p>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-white/35">
                      {formatShortDate(bucket.date)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-white/45">
                  Pas encore assez de séances chronométrées.
                </p>
              )}
            </div>
          </SectionCard>

          <div className="space-y-3">
            {anchoredExercises.length > 0 ? (
              anchoredExercises.map((exercise) => {
                const latest = exercise.sessions[exercise.sessions.length - 1];
                const trend = buildExerciseTrend(exercise.sessions);
                const isSelected =
                  selectedExerciseName?.toLowerCase() === exercise.name.toLowerCase();
                return (
                  <button
                    key={exercise.name}
                    type="button"
                    onClick={() => {
                      setSelectedExerciseName(exercise.name);
                      onExerciseSelect?.(exercise.name);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#1f8a65]/30 bg-[#1f8a65]/8"
                        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white" title={exercise.name}>
                            {exercise.name}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                              trend === "up"
                                ? "bg-[#1f8a65]/14 text-[#7fe2bf]"
                                : trend === "down"
                                  ? "bg-red-500/14 text-red-300"
                                  : "bg-white/[0.06] text-white/45"
                            }`}
                          >
                            {trend === "up" ? (
                              <TrendingUp size={10} />
                            ) : trend === "down" ? (
                              <TrendingDown size={10} />
                            ) : (
                              <ChevronRight size={10} />
                            )}
                          {trend === "up" ? "Hausse" : trend === "down" ? "Baisse" : "Stable"}
                          </span>
                          {isSelected ? (
                            <span className="rounded-full bg-[#1f8a65]/14 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#7fe2bf]">
                              Actif
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-white/45">
                          {exercise.exposureCount} exposition
                          {exercise.exposureCount > 1 ? "s" : ""}
                          {latest ? ` · ${latest.maxWeight} kg max` : ""}
                        </p>
                        {mode === "analyst" ? (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.1em] text-white/35">
                            <span>{latest ? formatVolume(latest.totalVolume) : "—"} utiles</span>
                            <span>
                              {exercise.performedSets} séries
                            </span>
                            <span>
                              {exercise.performedReps} reps
                            </span>
                            {exercise.estimated1RM != null ? (
                              <span>e1RM {exercise.estimated1RM} kg</span>
                            ) : null}
                            {exercise.targetRir != null && exercise.actualRirAvg != null ? (
                              <span>RIR {exercise.targetRir} / {exercise.actualRirAvg}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/60">
                        {latest ? formatVolume(latest.totalVolume) : "—"}
                      </span>
                    </div>
                    {mode === "analyst" ? (
                      <div className="mt-2 h-14">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={exercise.sessions}>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickFormatter={formatShortDate}
                              tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 9 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip
                              contentStyle={{
                                background: "#181818",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 12,
                              }}
                              labelFormatter={(value) => formatLongDate(String(value))}
                            />
                            <Line
                              type="monotone"
                              dataKey="maxWeight"
                              stroke={trend === "down" ? "#f87171" : "#1f8a65"}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : null}
                    {mode === "analyst" ? (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.1em] text-white/35">
                        {exercise.movementPattern ? <span>{exercise.movementPattern}</span> : null}
                        {exercise.plannedSets > 0 ? (
                          <span>{exercise.performedSets}/{exercise.plannedSets} séries</span>
                        ) : null}
                        {exercise.plannedRestSec != null && exercise.actualRestSec != null ? (
                          <span>Repos {exercise.plannedRestSec}s / {exercise.actualRestSec}s</span>
                        ) : null}
                        {!exercise.hasEnoughHistory ? <span>Historique léger</span> : null}
                      </div>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[12px] text-white/45">
                  Aucun mouvement exploitable sur la période sélectionnée.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
