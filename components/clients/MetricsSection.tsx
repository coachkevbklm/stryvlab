"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  BarChart2,
  Table2,
  PenLine,
  SlidersHorizontal,
  Filter,
  ArrowLeftRight,
  Calendar,
  Layers,
  GripHorizontal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Slider } from "@/components/ui/slider";
import CsvImportButton from "./CsvImportButton";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Chart color palette (semantic mapping to STRYVR design tokens) ────────────
// Only gray tones for charts - green only on hover/active states
const CHART_COLOR_PRIMARY = "#3d3d3d"; // gris neutre sombre DS v2.0
const CHART_COLOR_ACCENT = "#525252"; // gris neutre moyen DS v2.0

// ─── Chart config for shadcn charts ───────────────────────────────────────────
function createChartConfig(selectedMetrics: string[]): ChartConfig {
  const config: ChartConfig = {};
  selectedMetrics.forEach((key) => {
    const field = FIELD_MAP[key];
    if (field) {
      const color = getMetricColor(key);
      config[key] = { label: field.label, color };
      config[`__pct_${key}`] = { label: `${field.label} (%)`, color };
    }
  });
  return config;
}

// ─── Field definitions ────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  unit: string;
  color: string;
  category: "composition" | "measurements" | "wellness";
  step: number;
}

const FIELDS: FieldDef[] = [
  {
    key: "weight_kg",
    label: "Poids",
    unit: "kg",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 0.1,
  },
  {
    key: "body_fat_pct",
    label: "Masse grasse %",
    unit: "%",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.1,
  },
  {
    key: "fat_mass_kg",
    label: "Masse grasse",
    unit: "kg",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.1,
  },
  {
    key: "muscle_mass_kg",
    label: "Masse musculaire",
    unit: "kg",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 0.1,
  },
  {
    key: "muscle_pct",
    label: "Musculaire %",
    unit: "%",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.1,
  },
  {
    key: "body_water_pct",
    label: "Hydrique %",
    unit: "%",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 0.1,
  },
  {
    key: "bone_mass_kg",
    label: "Masse osseuse",
    unit: "kg",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.01,
  },
  {
    key: "visceral_fat",
    label: "Graisse viscérale",
    unit: "",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 1,
  },
  {
    key: "skeletal_muscle_mass_kg",
    label: "Masse musculaire squelettique",
    unit: "kg",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.1,
  },
  {
    key: "bmr_kcal",
    label: "Métabolisme de base",
    unit: "kcal",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 1,
  },
  {
    key: "waist_cm",
    label: "Tour de taille",
    unit: "cm",
    color: CHART_COLOR_PRIMARY,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "hips_cm",
    label: "Hanches",
    unit: "cm",
    color: CHART_COLOR_ACCENT,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "chest_cm",
    label: "Poitrine",
    unit: "cm",
    color: CHART_COLOR_PRIMARY,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "arm_cm",
    label: "Bras",
    unit: "cm",
    color: CHART_COLOR_ACCENT,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "thigh_cm",
    label: "Cuisse",
    unit: "cm",
    color: CHART_COLOR_PRIMARY,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "calf_cm",
    label: "Mollet",
    unit: "cm",
    color: CHART_COLOR_ACCENT,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "neck_cm",
    label: "Cou",
    unit: "cm",
    color: CHART_COLOR_PRIMARY,
    category: "measurements",
    step: 0.5,
  },
  {
    key: "sleep_hours",
    label: "Sommeil",
    unit: "h",
    color: CHART_COLOR_PRIMARY,
    category: "wellness",
    step: 0.25,
  },
  {
    key: "energy_level",
    label: "Énergie",
    unit: "/10",
    color: CHART_COLOR_ACCENT,
    category: "wellness",
    step: 1,
  },
  {
    key: "stress_level",
    label: "Stress",
    unit: "/10",
    color: CHART_COLOR_PRIMARY,
    category: "wellness",
    step: 1,
  },
];

const FIELD_MAP = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
const KPI_FIELDS = ["weight_kg", "body_fat_pct", "muscle_mass_kg", "bmr_kcal"];
const NEG_GOOD_FIELDS = [
  "body_fat_pct",
  "fat_mass_kg",
  "visceral_fat",
  "bmi",
  "stress_level",
];

// ─── Couleurs sémantiques par métrique ───────────────────────────────────────
// Chaque métrique a une couleur fixe — pas index-based.
// Palette : teintes distinctes, lisibles sur fond sombre DS v2.0.
const METRIC_COLORS: Record<string, string> = {
  weight_kg: "#9ca3af", // gris neutre — poids total
  body_fat_pct: "#f97316", // orange — masse grasse %
  fat_mass_kg: "#fb923c", // orange clair — masse grasse kg
  muscle_mass_kg: "#1f8a65", // vert accent — masse musculaire
  muscle_pct: "#34d399", // vert émeraude — % musculaire
  skeletal_muscle_mass_kg: "#10b981", // vert moyen — musc. squelettique
  body_water_pct: "#38bdf8", // bleu clair — hydratation
  bone_mass_kg: "#a78bfa", // violet — os
  visceral_fat: "#ef4444", // rouge — graisse viscérale
  bmr_kcal: "#facc15", // jaune — métabolisme
  waist_cm: "#f97316", // orange — tour de taille
  hips_cm: "#fb7185", // rose — hanches
  chest_cm: "#c084fc", // violet clair — poitrine
  arm_cm: "#34d399", // vert — bras
  thigh_cm: "#38bdf8", // bleu — cuisse
  calf_cm: "#22d3ee", // cyan — mollet
  neck_cm: "#a3e635", // vert lime — cou
  sleep_hours: "#818cf8", // indigo — sommeil
  energy_level: "#facc15", // jaune — énergie
  stress_level: "#f87171", // rouge clair — stress
};

function getMetricColor(key: string): string {
  return METRIC_COLORS[key] ?? "#9ca3af";
}

// Groupes de métriques pour la vue superposée
// Seules les métriques comparables ensemble (même échelle narrative) sont groupées.
const OVERLAY_GROUPS = [
  {
    key: "body_composition",
    label: "Composition corporelle",
    desc: "Poids, masse grasse et muscle en kg — trajectoires de recomposition",
    interpretation: "Toutes les courbes partent de 0 % au point de départ. Une hausse de la masse musculaire couplée à une baisse de la masse grasse indique une recomposition réussie, même si le poids total reste stable. Idéal pour évaluer l'efficacité d'un protocole sur la durée.",
    metrics: [
      "weight_kg",
      "fat_mass_kg",
      "muscle_mass_kg",
      "skeletal_muscle_mass_kg",
      "bone_mass_kg",
    ],
  },
  {
    key: "body_ratios",
    label: "Ratios corporels",
    desc: "Pourcentages — grasse, musculaire, hydrique",
    interpretation: "Ces ratios sont interdépendants : une baisse du % masse grasse entraîne mécaniquement une hausse relative du % musculaire, même sans gain de muscle. Interpréter toujours en parallèle avec les valeurs absolues (kg) pour distinguer une vraie prise de muscle d'un simple effet de dilution.",
    metrics: ["body_fat_pct", "muscle_pct", "body_water_pct"],
  },
  {
    key: "measurements",
    label: "Mensurations",
    desc: "Tours de taille, hanches, bras, cuisse — en cm",
    interpretation: "Les mensurations reflètent les changements morphologiques locaux, souvent avant que le poids ne bouge. Une baisse du tour de taille avec stabilité des bras et cuisses est un signal positif de perte de graisse centrale. Particulièrement utile pour les clients en recomposition corporelle.",
    metrics: [
      "waist_cm",
      "hips_cm",
      "chest_cm",
      "arm_cm",
      "thigh_cm",
      "calf_cm",
    ],
  },
  {
    key: "wellness",
    label: "Bien-être",
    desc: "Sommeil, énergie, stress — scores et heures",
    interpretation: "Le bien-être conditionne directement la récupération et les adaptations. Un stress chronique élevé ou un sommeil insuffisant peuvent bloquer les progrès malgré un entraînement optimal. Corréler ces courbes avec les phases d'entraînement intensif pour identifier les périodes à risque de surentraînement.",
    metrics: ["sleep_hours", "energy_level", "stress_level"],
  },
];

/// Toutes les métriques overlay — chargées en série, visibilité contrôlée par visibleSeries
const DEFAULT_OVERLAY_METRICS = Array.from(
  new Set(OVERLAY_GROUPS.flatMap((g) => g.metrics)),
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricRow {
  submissionId: string;
  date: string;
  values: Record<string, number>;
}

interface MetricSeries {
  [fieldKey: string]: { date: string; value: number }[];
}

type ViewMode = "table" | "charts" | "overlay";
type ChartCategory = "composition" | "measurements" | "wellness";
type DateRangePreset = "1m" | "3m" | "6m" | "1y" | "all" | "custom";

interface FilterState {
  dateFrom: string; // ISO date string or ''
  dateTo: string; // ISO date string or ''
  preset: DateRangePreset;
  selectedMetrics: string[]; // keys of FIELDS to show in charts
}

const DEFAULT_FILTER: FilterState = {
  dateFrom: "",
  dateTo: "",
  preset: "all",
  selectedMetrics: DEFAULT_OVERLAY_METRICS,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateInput(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().split("T")[0];
}

function getDelta(series: { date: string; value: number }[]) {
  if (series.length < 2) return null;
  return series[series.length - 1].value - series[series.length - 2].value;
}

function fmtVal(v: number, unit: string) {
  const s = Number.isInteger(v) ? String(v) : v.toFixed(v < 10 ? 2 : 1);
  return unit ? `${s} ${unit}` : s;
}

function presetToRange(preset: DateRangePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[preset];
  const from = new Date(now);
  from.setMonth(from.getMonth() - months);
  return { from: from.toISOString().split("T")[0], to };
}

function filterSeries(
  data: { date: string; value: number }[],
  dateFrom: string,
  dateTo: string,
): { date: string; value: number }[] {
  return data.filter((d) => {
    if (dateFrom && d.date < dateFrom) return false;
    if (dateTo && d.date > dateTo) return false;
    return true;
  });
}

function filterRows(
  rows: MetricRow[],
  dateFrom: string,
  dateTo: string,
): MetricRow[] {
  return rows.filter((r) => {
    const d = r.date.split("T")[0];
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
}

// ─── DeltaBadge ──────────────────────────────────────────────────────────────

function DeltaBadge({
  delta,
  unit,
  negGood,
}: {
  delta: number;
  unit: string;
  negGood: boolean;
}) {
  const isGood = delta === 0 ? null : negGood ? delta < 0 : delta > 0;
  const label =
    delta === 0
      ? "Stable"
      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}${unit ? ` ${unit}` : ""}`;
  const Icon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1f8a65] text-white text-[10px] font-bold leading-none">
      <Icon size={9} />
      {label}
      {isGood !== null && (
        <span
          className={`ml-0.5 ${isGood ? "text-white/70" : "text-white/50"}`}
        >
          {isGood ? "↑" : "↓"}
        </span>
      )}
    </span>
  );
}

// ─── Custom tooltip dark ──────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  unit?: string;
  fieldLabel?: string;
  accentColor?: string;
  multiSeries?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  fieldLabel,
  accentColor,
  multiSeries,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const dateStr = label
    ? new Date(label).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  if (multiSeries) {
    return (
      <div
        className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
        style={{ minWidth: 140 }}
      >
        <p className="text-[9px] text-white/40 font-medium pb-1.5">{dateStr}</p>
        <div className="mb-1 h-px bg-white/[0.07]" />
        {payload.map((p, i) => {
          const fieldKey = typeof p.dataKey === "string" ? p.dataKey : "";
          const field = FIELD_MAP[fieldKey];
          const v = p.value;
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="text-[9px] text-white/50">
                  {field?.label ?? fieldKey}
                </span>
              </div>
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: p.color }}
              >
                {Number.isInteger(v) ? v : v.toFixed(1)}
                {field?.unit ? (
                  <span className="text-white/40 font-normal ml-0.5 text-[9px]">
                    {field.unit}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  const val = payload[0].value;
  return (
    <div
      className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex flex-col gap-1"
      style={{ minWidth: 120 }}
    >
      <p className="text-[9px] text-white/40 font-medium">{dateStr}</p>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: accentColor ?? "#1f8a65" }}
        >
          {Number.isInteger(val) ? val : val.toFixed(1)}
        </span>
        {unit && (
          <span className="text-xs text-white/50 font-medium">{unit}</span>
        )}
      </div>
      {fieldLabel && <p className="text-[9px] text-white/30">{fieldLabel}</p>}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  fieldKey,
  series,
  index,
}: {
  fieldKey: string;
  series: MetricSeries;
  index: number;
}) {
  const field = FIELD_MAP[fieldKey];
  const data = series[fieldKey] ?? [];
  const last = data[data.length - 1];
  const delta = getDelta(data);
  const isDark = index % 2 === 1;
  const isNegGood = NEG_GOOD_FIELDS.includes(fieldKey);

  const lineColor = isDark ? "var(--chart-2)" : "var(--chart-1)";
  const gradId = `kpiGrad_${fieldKey}`;

  const min = data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0;
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;
  const pad = (max - min) * 0.2 || 1;
  const domain: [number, number] = [min - pad, max + pad];

  const deltaGood =
    delta === null
      ? null
      : delta === 0
        ? null
        : isNegGood
          ? delta < 0
          : delta > 0;

  // Chart config for shadcn
  const chartConfig: ChartConfig = {
    value: {
      label: field?.label ?? "",
      color: isDark ? "var(--chart-2)" : "var(--chart-1)",
    },
  };

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col min-w-0 bg-[#181818]">
      {/* Text zone */}
      <div className="px-6 pt-6 pb-3 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] truncate text-white/40">
          {field?.label}
        </p>

        {last ? (
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2 leading-none">
              <span
                className="font-bold tabular-nums leading-none text-white"
                style={{ fontSize: 44, letterSpacing: "-0.03em" }}
              >
                {last.value % 1 === 0 ? last.value : last.value.toFixed(1)}
              </span>
              {field?.unit && (
                <span className="text-base font-semibold pb-1 text-white/40">
                  {field.unit}
                </span>
              )}
            </div>
            {/* Delta pill */}
            {delta !== null && (
              <div className={`flex flex-col items-center shrink-0 px-3 py-2 rounded-xl ${
                delta === 0
                  ? "bg-white/[0.06]"
                  : deltaGood
                    ? "bg-[#1f8a65]"
                    : "bg-red-500/15"
              }`}>
                <span
                  className={`text-[11px] font-bold tabular-nums leading-tight flex items-center gap-0.5 ${
                    delta === 0
                      ? "text-white/40"
                      : deltaGood
                        ? "text-white"
                        : "text-red-300"
                  }`}
                >
                  {delta === 0 ? "─" : delta > 0 ? "↗" : "↘"}
                  <span>{Math.abs(delta).toFixed(1)}</span>
                </span>
                {field?.unit && (
                  <span className={`text-[9px] font-medium mt-0.5 ${
                    delta === 0 ? "text-white/40" : deltaGood ? "text-white/60" : "text-red-400"
                  }`}>{field.unit}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="font-bold text-white/30" style={{ fontSize: 44 }}>
            —
          </p>
        )}
      </div>

      {/* Mini chart flush to bottom */}
      <div className="mt-auto">
        {data.length >= 2 ? (
          <>
            <svg width={0} height={0} style={{ position: "absolute" }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-value)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
            </svg>
            <ChartContainer
              config={chartConfig}
              className="min-h-[80px] w-full"
            >
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <YAxis domain={domain} hide />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const value = payload[0].value as number;
                    const dateStr = label
                      ? new Date(label).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "";
                    const unit = field?.unit ?? "";
                    return (
                      <div
                        className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex flex-col gap-1"
                        style={{ minWidth: 120 }}
                      >
                        <p className="text-[9px] text-white/40 font-medium">
                          {dateStr}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-xl font-bold tabular-nums"
                            style={{
                              color: isDark
                                ? "var(--chart-2)"
                                : "var(--chart-1)",
                            }}
                          >
                            {Number.isInteger(value) ? value : value.toFixed(1)}
                          </span>
                          {unit && (
                            <span className="text-xs text-white/50 font-medium">
                              {unit}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-white/30">
                          {field?.label}
                        </p>
                      </div>
                    );
                  }}
                  cursor={{
                    stroke: "var(--color-value)",
                    strokeWidth: 1,
                    strokeOpacity: 0.4,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
          </>
        ) : (
          <div className="mx-5 mb-4 h-px bg-white/[0.07]" />
        )}
      </div>
    </div>
  );
}

// ─── Sparkline (table) ────────────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const domain: [number, number] = [min * 0.99, max * 1.01];
  return (
    <ResponsiveContainer width={72} height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="gradSparklineInline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={domain} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeWidth={1.5}
          fill="url(#gradSparklineInline)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Full metric chart (single series) ───────────────────────────────────────

function FullChart({
  fieldKey,
  data,
}: {
  fieldKey: string;
  data: { date: string; value: number }[];
}) {
  const field = FIELD_MAP[fieldKey];
  if (!field || data.length === 0) return null;

  const isComposition = field.category === "composition";
  const ChartComponent = isComposition ? BarChart : AreaChart;

  const delta = getDelta(data);
  const isNegGood = NEG_GOOD_FIELDS.includes(fieldKey);
  const deltaGood =
    delta === null
      ? null
      : delta === 0
        ? null
        : isNegGood
          ? delta < 0
          : delta > 0;

  const lineColor = "var(--chart-1)";
  const gradId = `fullChart_${fieldKey}`;

  const last = data[data.length - 1];
  const baseline = data[0]?.value;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const padding = (max - min) * 0.25 || Math.abs(last.value) * 0.05 || 1;
  const domain: [number, number] = [Math.max(0, min - padding), max + padding];
  const tickCount = Math.min(data.length, 6);

  // Chart config for shadcn
  const chartConfig: ChartConfig = {
    value: {
      label: field.label,
      color: "var(--chart-1)",
    },
  };

  return (
    <div className="bg-[#181818] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em] mb-2">
            {field.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{ fontSize: 42, letterSpacing: "-0.03em" }}
            >
              {Number.isInteger(last.value)
                ? last.value
                : last.value.toFixed(1)}
            </span>
            {field.unit && (
              <span className="text-lg font-semibold text-white/40">
                {field.unit}
              </span>
            )}
          </div>
          {/* Baseline comparison inline */}
          {baseline !== undefined && data.length > 1 && (
            <p className="text-[11px] text-white/35 mt-2">
              Départ :{" "}
              <span className="font-semibold text-white/45">
                {Number.isInteger(baseline) ? baseline : baseline.toFixed(1)}{" "}
                {field.unit}
              </span>
            </p>
          )}
        </div>

        {/* Delta block */}
        {delta !== null && (
          <div
            className={`flex flex-col items-center px-4 py-3 rounded-xl shrink-0 ${
              delta === 0
                ? "bg-white/[0.05]"
                : deltaGood
                  ? "bg-[#1f8a65]"
                  : "bg-red-500/15"
            }`}
          >
            {delta === 0 ? (
              <Minus size={15} className="text-white/40 mb-1" />
            ) : delta > 0 ? (
              <TrendingUp
                size={15}
                className={deltaGood ? "text-white mb-1" : "text-red-400 mb-1"}
              />
            ) : (
              <TrendingDown
                size={15}
                className={deltaGood ? "text-white mb-1" : "text-red-400 mb-1"}
              />
            )}
            <span
              className={`text-base font-bold tabular-nums leading-none ${
                delta === 0
                  ? "text-white/40"
                  : deltaGood
                    ? "text-white"
                    : "text-red-300"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {Math.abs(delta) < 0.1 ? delta.toFixed(2) : delta.toFixed(1)}
            </span>
            {field.unit && (
              <span
                className={`text-[10px] font-medium mt-1 ${
                  delta === 0
                    ? "text-white/40"
                    : deltaGood
                      ? "text-white/60"
                      : "text-red-400"
                }`}
              >
                {field.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="bg-[#0a0a0a] pt-2 pb-1 mx-0">
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} />
              <stop
                offset="70%"
                stopColor="var(--chart-1)"
                stopOpacity={0.04}
              />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
        <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
          <ChartComponent
            data={data}
            margin={{ top: 16, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 10,
                fill: "rgba(255,255,255,0.40)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              tickCount={tickCount}
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "rgba(255,255,255,0.35)",
                fontWeight: 500,
              }}
              axisLine={false}
              tickLine={false}
              width={48}
              domain={domain}
              tickFormatter={(v) =>
                Number.isInteger(v) ? String(v) : v.toFixed(1)
              }
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0].value as number;
                const dateStr = label
                  ? new Date(label).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "";
                const unit = field?.unit ?? "";
                return (
                  <div
                    className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex flex-col gap-1"
                    style={{ minWidth: 120 }}
                  >
                    <p className="text-[9px] text-white/40 font-medium">
                      {dateStr}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: "#1f8a65" }}
                      >
                        {Number.isInteger(value) ? value : value.toFixed(1)}
                      </span>
                      {unit && (
                        <span className="text-xs text-white/50 font-medium">
                          {unit}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-white/30">{field?.label}</p>
                  </div>
                );
              }}
              cursor={{
                stroke: "rgba(255,255,255,0.20)",
                strokeWidth: 1,
                strokeDasharray: "4 3",
                strokeOpacity: 0.35,
              }}
            />
            {baseline !== undefined && data.length > 1 && (
              <ReferenceLine
                y={baseline}
                stroke="rgba(255,255,255,0.10)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
              />
            )}
            {isComposition ? (
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[2, 2, 0, 0]}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dot={(props: any) => {
                  const isLast = props.index === data.length - 1;
                  if (!isLast && data.length > 8)
                    return <g key={props.index} />;
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={isLast ? 5 : 3}
                      fill="#181818"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: "#1f8a65",
                  stroke: "#181818",
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            )}
          </ChartComponent>
        </ChartContainer>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between">
        <p className="text-[9px] font-medium text-white/40">
          {new Date(data[0].date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })}
        </p>
        <p className="text-[9px] font-medium text-white/40">
          {data.length} point{data.length > 1 ? "s" : ""}
        </p>
        <p className="text-[9px] font-medium text-white/40">
          {new Date(data[data.length - 1].date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Multi-series overlay chart ───────────────────────────────────────────────
// The core problem with overlaying metrics (weight kg, fat %, BMI) is that
// their absolute scales are incompatible — everything flattens on a shared Y axis.
// Solution: normalize all series to % change from their own baseline (first point = 0%).
// Each series becomes a trajectory, not an absolute value — comparable regardless of unit.

// Tooltip for normalized % change view
interface MultiTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey?: string; color?: string }>;
  label?: string;
}

function MultiTooltip({
  active,
  payload,
  label,
}: MultiTooltipProps) {
  if (!active || !payload?.length) return null;
  const dateStr = label
    ? new Date(label).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="bg-[#0f0f0f] rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
      style={{
        minWidth: 160,
      }}
    >
      <p className="text-[9px] text-white/40 font-medium pb-1.5">{dateStr}</p>
      <div className="mb-1 h-px bg-white/[0.07]" />
      {payload.map((p, i) => {
        const fieldKey =
          typeof p.dataKey === "string" ? p.dataKey.replace("__pct_", "") : "";
        const f = FIELD_MAP[fieldKey];
        if (!f) return null;
        const color = p.color ?? "#1f8a65";

        const pctVal = p.value;
        const isGood =
          pctVal === 0
            ? null
            : NEG_GOOD_FIELDS.includes(fieldKey)
              ? pctVal < 0
              : pctVal > 0;
        return (
          <div key={i} className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[9px] text-white/50 truncate">
                {f.label}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xs font-bold tabular-nums ${
                  pctVal === 0
                    ? "text-white/50"
                    : isGood
                      ? "text-[#1f8a65]"
                      : "text-red-400"
                }`}
              >
                {pctVal > 0 ? "+" : ""}
                {pctVal.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MultiSeriesChart({
  selectedMetrics,
  series,
  rows,
}: {
  selectedMetrics: string[];
  series: MetricSeries;
  rows: MetricRow[];
}) {
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    () => new Set(OVERLAY_GROUPS[0].metrics),
  );
  const [chartHeight, setChartHeight] = useState(220);

  // Baseline = first value of each series (used for % normalization)
  const baselineValues = useMemo(() => {
    const b: Record<string, number> = {};
    selectedMetrics.forEach((k) => {
      const s = series[k] ?? [];
      if (s.length > 0) b[k] = s[0].value;
    });
    return b;
  }, [selectedMetrics, series]);

  // Build unified date axis
  const dateSet = new Set<string>();
  selectedMetrics.forEach((k) => {
    const metricSeries = series[k] ?? [];
    metricSeries.forEach((d) => dateSet.add(d.date));
  });
  const dates = Array.from(dateSet).sort();

  // Merge — store normalized values under `__pct_${key}`
  const merged = useMemo(
    () =>
      dates.map((date) => {
        const row: Record<string, number | string> = { date };
        selectedMetrics.forEach((k) => {
          const point = (series[k] ?? []).find((d) => d.date === date);
          if (point) {
            const baseline = baselineValues[k];
            if (baseline !== undefined && baseline !== 0) {
              row[`__pct_${k}`] =
                ((point.value - baseline) / Math.abs(baseline)) * 100;
            } else {
              row[`__pct_${k}`] = 0;
            }
          }
        });
        return row;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [dates.join(","), selectedMetrics.join(","), baselineValues],
  );

  const lastValues = useMemo(() => {
    const lv: Record<string, number | undefined> = {};
    selectedMetrics.forEach((k) => {
      const s = series[k] ?? [];
      lv[k] = s[s.length - 1]?.value;
    });
    return lv;
  }, [selectedMetrics, series]);

  // Delta % for each series (last vs first)
  const deltas = useMemo(() => {
    const d: Record<string, number | null> = {};
    selectedMetrics.forEach((k) => {
      const s = series[k] ?? [];
      if (s.length < 2) {
        d[k] = null;
        return;
      }

      const baseline = s[0].value;
      const last = s[s.length - 1].value;

      d[k] =
        baseline !== 0 ? ((last - baseline) / Math.abs(baseline)) * 100 : null;
    });
    return d;
  }, [selectedMetrics, series]);

  if (merged.length === 0)
    return (
      <div className="bg-[#181818] rounded-2xl p-8 text-center text-white/40 text-sm">
        Aucune donnée pour les métriques sélectionnées
      </div>
    );

  // Chart config for shadcn with semantic colors
  const chartConfig = createChartConfig(selectedMetrics);

  const dataKeys = selectedMetrics.map((k) => `__pct_${k}`);

  // Y axis range — based on actual visible data only, not symmetric
  const visibleDataKeys = dataKeys.filter((k) =>
    visibleSeries.has(k.replace("__pct_", "")),
  );
  const allPctVals = merged.flatMap((row) =>
    visibleDataKeys
      .map((k) => row[k] as number)
      .filter((v) => typeof v === "number"),
  );
  const pctMin = allPctVals.length > 0 ? Math.min(...allPctVals) : -5;
  const pctMax = allPctVals.length > 0 ? Math.max(...allPctVals) : 5;
  const pctPad = Math.max((pctMax - pctMin) * 0.15, 1);
  const pctDomain: [number, number] = [
    Math.floor(pctMin - pctPad),
    Math.ceil(pctMax + pctPad),
  ];

  // Active group detection
  const activeGroupKey = OVERLAY_GROUPS.find((g) => {
    const withData = g.metrics.filter((m) => (series[m]?.length ?? 0) > 0);
    if (withData.length === 0) return false;
    return (
      withData.every((m) => visibleSeries.has(m)) &&
      visibleSeries.size === withData.length
    );
  })?.key ?? null;

  const activeGroup = OVERLAY_GROUPS.find((g) => g.key === activeGroupKey) ?? null;

  return (
    <div className="bg-[#181818] rounded-2xl overflow-visible relative pb-3">
      <div className="px-5 pt-5 pb-0">

        {/* Description globale */}
        <div className="mb-5 pb-5 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.14em] mb-1.5">
            Vue superposée
          </p>
          <p className="text-[12px] text-white/55 leading-relaxed">
            Compare l'évolution relative de plusieurs métriques sur la même période. Chaque courbe part de <span className="text-white/80 font-semibold">0 %</span> au premier point de mesure — ce qui permet de comparer des indicateurs d'unités différentes (kg, cm, score) sur un même graphique. L'axe vertical indique la variation en pourcentage par rapport au départ.
          </p>
        </div>

        {/* Groupes */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.14em] mb-2">
            Groupes
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {OVERLAY_GROUPS.map((group) => {
              const withData = group.metrics.filter(
                (m) => (series[m]?.length ?? 0) > 0,
              );
              const isActive = activeGroupKey === group.key;
              const hasData = withData.length > 0;
              return (
                <button
                  key={group.key}
                  disabled={!hasData}
                  onClick={() => setVisibleSeries(new Set(withData))}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-[#1f8a65] text-white"
                      : hasData
                        ? "bg-white/[0.06] text-white/60 hover:bg-white/[0.10] hover:text-white"
                        : "bg-white/[0.03] text-white/20 cursor-not-allowed"
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>

          {/* Description du groupe actif */}
          {activeGroup && (
            <div className="rounded-xl bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1">
                Comment interpréter
              </p>
              <p className="text-[12px] text-white/55 leading-relaxed">
                {activeGroup.interpretation}
              </p>
            </div>
          )}
        </div>

        {/* Métriques individuelles */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.14em]">
              Métriques
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVisibleSeries(new Set(selectedMetrics))}
                className="text-[10px] font-semibold text-[#1f8a65] hover:text-[#217356] transition-colors"
              >
                Tout
              </button>
              <button
                onClick={() => setVisibleSeries(new Set())}
                className="text-[10px] font-semibold text-white/35 hover:text-white/60 transition-colors"
              >
                Aucun
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedMetrics.map((k) => {
              const f = FIELD_MAP[k];
              if (!f) return null;
              const color = getMetricColor(k);
              const isVisible = visibleSeries.has(k);
              return (
                <button
                  key={k}
                  onClick={() => {
                    const newSet = new Set(visibleSeries);
                    if (isVisible) newSet.delete(k);
                    else newSet.add(k);
                    setVisibleSeries(newSet);
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={
                    isVisible
                      ? {
                          backgroundColor: `${color}22`,
                          color: color,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "rgba(255,255,255,0.35)",
                        }
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart — empty state si aucune série visible n'a de données */}
      {visibleSeries.size > 0 && merged.length === 0 && (
        <div className="mx-5 mb-5 rounded-xl bg-white/[0.03] px-5 py-6 text-center">
          <p className="text-[12px] font-semibold text-white/40 mb-1">Aucune donnée pour ce groupe</p>
          <p className="text-[11px] text-white/25">Ces métriques n'ont pas encore été saisies pour ce client. Importez un CSV ou ajoutez une mesure manuellement.</p>
        </div>
      )}

      <div className="pb-3 px-1 pt-1">
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            {selectedMetrics.map((k) => {
              return (
                <linearGradient
                  key={k}
                  id={`multiGrad_${k}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={getMetricColor(k)}
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor={getMetricColor(k)}
                    stopOpacity={0}
                  />
                </linearGradient>
              );
            })}
          </defs>
        </svg>

        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
              <LineChart
                data={merged}
                margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.20)" strokeWidth={1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.30)", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={6}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  }
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.30)", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  domain={pctDomain}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                />
                <ChartTooltip
                  content={<MultiTooltip />}
                  cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 3" }}
                />
                {selectedMetrics.map((k) => {
                  if (!visibleSeries.has(k)) return null;
                  return (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={`__pct_${k}`}
                      stroke={getMetricColor(k)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive
                      animationDuration={500}
                    />
                  );
                })}
              </LineChart>
            </ChartContainer>

      </div>

      {/* Footer */}
      <div className="px-5 pb-2 flex items-center gap-2">
        <p className="text-[9px] text-white/20 font-medium">
          {merged[0]
            ? new Date(merged[0].date as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })
            : ""}
        </p>
        <div className="flex-1 h-px bg-white/[0.08]" />
        <p className="text-[9px] text-white/20 font-medium">
          {merged[merged.length - 1]
            ? new Date(merged[merged.length - 1].date as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })
            : ""}
        </p>
      </div>

      {/* Drag handle — positionné sur le bord bas */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startH = chartHeight;
          const onMove = (ev: MouseEvent) => {
            const next = Math.max(120, Math.min(600, startH + ev.clientY - startY));
            setChartHeight(next);
          };
          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 cursor-row-resize group"
      >
        <div className="z-10 flex h-5 w-10 items-center justify-center rounded-lg bg-[#2a2a2a] group-hover:bg-[#333] transition-colors">
          <GripHorizontal size={12} className="text-white/40 group-hover:text-white/70 transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot compare (date A vs date B) ─────────────────────────────────────

interface SnapshotCompareProps {
  rows: MetricRow[];
  series: MetricSeries;
}

function SnapshotCompare({ rows, series }: SnapshotCompareProps) {
  const availableDates = rows.map((r) => ({
    id: r.submissionId,
    date: r.date,
    label: formatDate(r.date),
  }));

  const [dateA, setDateA] = useState<string>(availableDates[0]?.id ?? "");
  const [dateB, setDateB] = useState<string>(
    availableDates[availableDates.length - 1]?.id ?? "",
  );

  const rowA = rows.find((r) => r.submissionId === dateA);
  const rowB = rows.find((r) => r.submissionId === dateB);

  // All fields that have data in at least one of the two snapshots
  const comparedFields = FIELDS.filter(
    (f) =>
      rowA?.values[f.key] !== undefined || rowB?.values[f.key] !== undefined,
  );

  if (availableDates.length < 2) {
    return (
      <div className="bg-[#181818] rounded-2xl p-8 text-center text-sm text-[rgba(255,255,255,0.40)]">
        Il faut au moins 2 mesures pour comparer des snapshots.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Date pickers */}
      <div className="bg-[#181818] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20 shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide">
              Mesure A
            </label>
            <select
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="bg-[#0a0a0a] rounded-lg px-2.5 py-1.5 text-xs font-medium text-white outline-none transition-colors"
            >
              {availableDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center self-center mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              setDateA(dateB);
              setDateB(dateA);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-2 text-[10px] font-semibold text-white/80 transition hover:bg-white/[0.08]"
          >
            <ArrowLeftRight size={14} />
            Inverser
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1f8a65] shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide">
              Mesure B
            </label>
            <select
              value={dateB}
              onChange={(e) => setDateB(e.target.value)}
              className="bg-[#0a0a0a] rounded-lg px-2.5 py-1.5 text-xs font-medium text-white outline-none transition-colors"
            >
              {availableDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-[#181818] rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="h-px bg-white/[0.07] mx-4" />
        <div className="grid grid-cols-[1fr_100px_100px_80px] px-4 py-3">
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide">
            Métrique
          </p>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 justify-end">
              <div className="w-2 h-2 rounded-full bg-white/25" />
              <p className="text-[10px] font-semibold text-white">
                {rowA ? formatDate(rowA.date) : "—"}
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/50">
                A
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 justify-end">
              <div className="w-2 h-2 rounded-full bg-[#1f8a65] shrink-0" />
              <p className="text-[10px] font-semibold text-white">
                {rowB ? formatDate(rowB.date) : "—"}
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/50">
                B
              </span>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide text-right">
            Δ
          </p>
        </div>
        <div className="h-px bg-white/[0.07] mx-4" />

        {/* Group by category */}
        {(["composition", "measurements", "wellness"] as const).map((cat) => {
          const catFields = comparedFields.filter((f) => f.category === cat);
          if (catFields.length === 0) return null;
          const catLabels: Record<string, string> = {
            composition: "Composition",
            measurements: "Mensurations",
            wellness: "Bien-être",
          };
          return (
            <div key={cat}>
              <div className="px-4 py-2 bg-white/[0.03]">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {catLabels[cat]}
                </p>
              </div>
              {catFields.map((f) => {
                const vA = rowA?.values[f.key];
                const vB = rowB?.values[f.key];
                const diff =
                  vA !== undefined && vB !== undefined ? vB - vA : null;
                const isNegGood = NEG_GOOD_FIELDS.includes(f.key);
                const diffGood =
                  diff === null || diff === 0
                    ? null
                    : isNegGood
                      ? diff < 0
                      : diff > 0;
                const diffSign =
                  diff === null ? null : diff > 0 ? "+" : diff < 0 ? "" : "=";

                return (
                  <div
                    key={f.key}
                    className="grid grid-cols-[1fr_100px_100px_80px] px-4 py-2.5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">
                        {f.label}
                      </p>
                      {f.unit && (
                        <p className="text-[9px] text-white/40">{f.unit}</p>
                      )}
                    </div>
                    <p className="text-right font-mono text-xs font-bold text-white self-center">
                      {vA !== undefined ? (
                        fmtVal(vA, f.unit)
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </p>
                    <p className="text-right font-mono text-xs font-bold text-white self-center">
                      {vB !== undefined ? (
                        fmtVal(vB, f.unit)
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </p>
                    <div className="flex justify-end items-center self-center">
                      {diff !== null ? (
                        <span
                          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                            diff === 0
                              ? "bg-[#0a0a0a] text-[rgba(255,255,255,0.40)]"
                              : diffGood
                                ? "bg-[#1f8a65]/15 text-[#1f8a65]"
                                : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {diffSign}
                          {Math.abs(diff) < 0.1
                            ? diff.toFixed(2)
                            : diff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-white/40 text-[10px]">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Radar-style summary bar (top 5 deltas) */}
      {rowA &&
        rowB &&
        (() => {
          const deltas = FIELDS.map((f) => {
            const vA = rowA.values[f.key];
            const vB = rowB.values[f.key];
            if (vA === undefined || vB === undefined) return null;
            const diff = vB - vA;
            const pct = vA !== 0 ? (diff / Math.abs(vA)) * 100 : 0;
            const isNegGood = NEG_GOOD_FIELDS.includes(f.key);
            const good = diff === 0 ? null : isNegGood ? diff < 0 : diff > 0;
            return { field: f, diff, pct, good };
          })
            .filter(Boolean)
            .filter((d) => d!.diff !== 0)
            .sort((a, b) => Math.abs(b!.pct) - Math.abs(a!.pct))
            .slice(0, 5);

          if (deltas.length === 0) return null;

          return (
            <div className="bg-[#181818] rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                Plus grands écarts A → B
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.12em] mb-4">
                A = {formatDate(rowA.date)} • B = {formatDate(rowB.date)}
              </p>
              <div className="flex flex-col gap-3">
                {deltas.map((d) => {
                  if (!d) return null;
                  const barWidth = Math.min(Math.abs(d.pct), 100);
                  return (
                    <div key={d.field.key} className="flex items-center gap-3">
                      <p className="text-xs text-white/60 w-28 shrink-0 truncate">
                        {d.field.label}
                      </p>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${d.good === true ? "bg-[#1f8a65]" : d.good === false ? "bg-red-400" : "bg-white/30"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p
                        className={`text-[10px] font-bold tabular-nums w-16 text-right ${
                          d.good === true
                            ? "text-[#1f8a65]"
                            : d.good === false
                              ? "text-red-400"
                              : "text-white/50"
                        }`}
                      >
                        {d.diff > 0 ? "+" : ""}
                        {d.diff < 0.1 && d.diff > -0.1
                          ? d.diff.toFixed(2)
                          : d.diff.toFixed(1)}{" "}
                        {d.field.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ─── Filter panel ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  fieldsWithData: FieldDef[];
  viewMode: ViewMode;
  onClose: () => void;
}

function FilterPanel({
  filter,
  onChange,
  fieldsWithData,
  viewMode,
  onClose,
}: FilterPanelProps) {
  const [local, setLocal] = useState<FilterState>(filter);

  function apply() {
    onChange(local);
    onClose();
  }

  function reset() {
    setLocal(DEFAULT_FILTER);
    onChange(DEFAULT_FILTER);
    onClose();
  }

  function setPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      setLocal((p) => ({ ...p, preset }));
      return;
    }
    const { from, to } = presetToRange(preset);
    setLocal((p) => ({ ...p, preset, dateFrom: from, dateTo: to }));
  }

  function toggleMetric(key: string) {
    setLocal((p) => {
      const has = p.selectedMetrics.includes(key);
      if (has && p.selectedMetrics.length === 1) return p; // keep at least 1
      return {
        ...p,
        selectedMetrics: has
          ? p.selectedMetrics.filter((k) => k !== key)
          : [...p.selectedMetrics, key],
      };
    });
  }

  const PRESETS: { key: DateRangePreset; label: string }[] = [
    { key: "1m", label: "1 mois" },
    { key: "3m", label: "3 mois" },
    { key: "6m", label: "6 mois" },
    { key: "1y", label: "1 an" },
    { key: "all", label: "Tout" },
    { key: "custom", label: "Perso." },
  ];

  return (
    <div className="bg-[#181818] rounded-2xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-white/60" />
          <p className="text-sm font-bold text-white">Filtres</p>
        </div>
        <button
          onClick={onClose}
          className="text-[rgba(255,255,255,0.40)] hover:text-white p-1 rounded-lg hover:bg-[#0a0a0a] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Period presets */}
      <div>
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide mb-2">
          Période
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                local.preset === p.key
                  ? "bg-[#1f8a65] text-white"
                  : "bg-[#0a0a0a] text-white/60 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {local.preset === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[rgba(255,255,255,0.40)] block mb-1">
                Du
              </label>
              <input
                type="date"
                value={local.dateFrom}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, dateFrom: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] rounded-lg text-xs text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[rgba(255,255,255,0.40)] block mb-1">
                Au
              </label>
              <input
                type="date"
                value={local.dateTo}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, dateTo: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] rounded-lg text-xs text-white outline-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric selector (only relevant for charts/overlay view) */}
      {(viewMode === "charts" || viewMode === "compare") && (
        <div>
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide mb-2">
            Métriques affichées
          </p>
          <div className="flex flex-col gap-1">
            {(["composition", "measurements", "wellness"] as const).map(
              (cat) => {
                const catFields = fieldsWithData.filter(
                  (f) => f.category === cat,
                );
                if (catFields.length === 0) return null;
                const catLabels: Record<string, string> = {
                  composition: "Composition",
                  measurements: "Mensurations",
                  wellness: "Bien-être",
                };
                return (
                  <div key={cat} className="mb-2">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                      {catLabels[cat]}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {catFields.map((f) => {
                        const active = local.selectedMetrics.includes(f.key);
                        return (
                          <button
                            key={f.key}
                            onClick={() => toggleMetric(f.key)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              active
                                ? "bg-[#1f8a65] text-white"
                                : "bg-[#0a0a0a] text-white/60 hover:text-white"
                            }`}
                          >
                            {f.label}
                            {f.unit && (
                              <span
                                className={`${active ? "text-[#1f8a65]/60" : "text-white/40"} text-[9px]`}
                              >
                                {f.unit}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="h-px bg-white/[0.07]" />
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={reset}
          className="text-xs text-[rgba(255,255,255,0.40)] hover:text-white font-medium transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={apply}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f8a65] text-white text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <CheckCircle2 size={12} />
          Appliquer
        </button>
      </div>
    </div>
  );
}

// ─── Field input row ──────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-[rgba(255,255,255,0.40)] block mb-0.5">
        {field.label}
        {field.unit ? ` (${field.unit})` : ""}
      </label>
      <input
        type="number"
        step={field.step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full px-2.5 py-1.5 bg-[#0a0a0a] rounded-lg text-xs font-mono text-white outline-none transition-colors placeholder:text-white/40"
      />
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#181818] rounded-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            {subtitle && (
              <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={15} />
          </button>
        </div>
        <div className="h-px bg-white/[0.07] mx-5" />
        {children}
        <div className="h-px bg-white/[0.07] mx-5" />
        <div className="flex items-center justify-between px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  {
    key: "composition" as const,
    label: "Composition corporelle",
    fields: FIELDS.filter((f) => f.category === "composition"),
  },
  {
    key: "measurements" as const,
    label: "Mensurations",
    fields: FIELDS.filter((f) => f.category === "measurements"),
  },
  {
    key: "wellness" as const,
    label: "Bien-être",
    fields: FIELDS.filter((f) => f.category === "wellness"),
  },
];

// ─── Edit row modal ───────────────────────────────────────────────────────────

function EditRowModal({
  row,
  clientId,
  onClose,
  onSaved,
}: {
  row: MetricRow;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(formatDateInput(row.date));
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(row.values).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const numericValues: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const raw = values[f.key];
      if (raw === "" || raw === undefined) {
        if (row.values[f.key] !== undefined) numericValues[f.key] = null;
      } else {
        const n = parseFloat(raw.replace(",", "."));
        if (!isNaN(n)) numericValues[f.key] = n;
      }
    }
    const res = await fetch(
      `/api/clients/${clientId}/metrics/${row.submissionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, values: numericValues }),
      },
    );
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erreur lors de la sauvegarde");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <ModalShell
      title="Modifier la mesure"
      subtitle="Laissez vide pour supprimer une valeur"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-xs text-[rgba(255,255,255,0.40)] hover:text-white font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f8a65] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Sauvegarde…
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                Sauvegarder
              </>
            )}
          </button>
        </>
      }
    >
      <div className="px-5 py-4">
        <label className="text-[11px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide block mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-[#0a0a0a] rounded-lg text-sm text-white outline-none focus:bg-[#181818] transition-colors"
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide mb-2">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cat.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </ModalShell>
  );
}

// ─── Manual entry form ────────────────────────────────────────────────────────

function ManualEntryForm({
  clientId,
  onSaved,
  onClose,
}: {
  clientId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filledCount = Object.values(values).filter(
    (v) => v.trim() !== "",
  ).length;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const numericValues: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v.trim() === "") continue;
      const n = parseFloat(v.replace(",", "."));
      if (!isNaN(n)) numericValues[k] = n;
    }
    if (Object.keys(numericValues).length === 0) {
      setError("Saisissez au moins une valeur");
      setSaving(false);
      return;
    }
    const res = await fetch(`/api/clients/${clientId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, values: numericValues }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erreur");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <ModalShell
      title="Saisie manuelle"
      subtitle="Ajoutez une mesure pour une date donnée"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-xs text-[rgba(255,255,255,0.40)] hover:text-white font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f8a65] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Sauvegarde…
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                Enregistrer{filledCount > 0 ? ` (${filledCount})` : ""}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="px-5 py-4">
        <label className="text-[11px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide block mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-[#0a0a0a] rounded-lg text-sm text-white outline-none focus:bg-[#181818] transition-colors"
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide mb-2">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cat.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <div className="px-5 pb-2 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </ModalShell>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  clientId: string;
}

const TABLE_COLS = FIELDS.filter((f) =>
  [
    "weight_kg",
    "body_fat_pct",
    "muscle_mass_kg",
    "waist_cm",
    "energy_level",
  ].includes(f.key),
);

// ─── Time range utilities ───────────────────────────────────────────────────

type TimeRangeDays = [number, number];

function formatTimeRange(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "1 jour";
  if (days <= 7) return `${days} jours`;
  if (days < 35) {
    const weeks = Math.ceil(days / 7);
    return weeks === 1 ? "1 semaine" : `${weeks} semaines`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 mois" : `${months} mois`;
  }
  if (days === 365) return "1 an";
  if (days === 730) return "2 ans";
  const years = days / 365;
  return `${years.toFixed(1).replace(/\.0$/, "")} ans`;
}

function formatTimeRangeLabel(range: TimeRangeDays): string {
  if (range[0] === range[1]) {
    return formatTimeRange(range[0]);
  }
  return `${formatTimeRange(range[0])} — ${formatTimeRange(range[1])}`;
}

function getTimeRangeDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

function getTimeRangeBounds(range: TimeRangeDays) {
  return {
    from: getTimeRangeDate(range[1]),
    to: getTimeRangeDate(range[0]),
  };
}

export default function MetricsSection({ clientId }: Props) {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [series, setSeries] = useState<MetricSeries>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [chartCategory, setChartCategory] =
    useState<ChartCategory>("composition");
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRow, setEditingRow] = useState<MetricRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MetricRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [timeRangeDays, setTimeRangeDays] = useState<TimeRangeDays>([0, 730]); // Default: tout l'historique (2 ans)

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/metrics`);
      const d = await res.json();
      setRows(d.rows ?? []);
      setSeries(d.series ?? {});
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(
      `/api/clients/${clientId}/metrics/${deleteTarget.submissionId}`,
      { method: "DELETE" },
    );
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      showToast("Mesure supprimée");
      load();
    } else showToast("Erreur lors de la suppression");
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Derived: effective date range from filter AND time range
  const timeRangeBounds = getTimeRangeBounds(timeRangeDays);
  const effectiveDateFrom =
    filter.preset !== "custom"
      ? presetToRange(filter.preset).from
      : filter.dateFrom;
  const effectiveDateTo =
    filter.preset !== "custom"
      ? presetToRange(filter.preset).to
      : filter.dateTo;

  const finalDateFrom = [effectiveDateFrom, timeRangeBounds.from]
    .filter(Boolean)
    .sort()
    .reverse()[0] as string;
  const finalDateTo = [effectiveDateTo, timeRangeBounds.to]
    .filter(Boolean)
    .sort()[0] as string;

  const filteredRows = useMemo(
    () => filterRows(rows, finalDateFrom, finalDateTo),
    [rows, finalDateFrom, finalDateTo],
  );

  const filteredSeries = useMemo(() => {
    const result: MetricSeries = {};
    for (const [k, data] of Object.entries(series)) {
      result[k] = filterSeries(data, finalDateFrom, finalDateTo);
    }
    return result;
  }, [series, finalDateFrom, finalDateTo]);

  const hasData = rows.length > 0;
  const fieldsWithData = FIELDS.filter((f) => (series[f.key]?.length ?? 0) > 0);
  const chartsInCategory = fieldsWithData.filter(
    (f) => f.category === chartCategory,
  );

  // For overlay view: only show metrics selected in filter AND that have data
  const overlayMetrics = filter.selectedMetrics.filter(
    (k) => (filteredSeries[k]?.length ?? 0) > 0,
  );

  // Active filter count (for badge)
  const activeFilterCount = [
    filter.preset !== "all" ? 1 : 0,
    viewMode !== "table" && filter.selectedMetrics.length !== KPI_FIELDS.length
      ? 1
      : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-0 px-10">
      {/* ── Main content ── */}
      <div className="flex flex-col gap-6">
        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#181818] rounded-2xl px-5 py-4">
          {/* Left: View mode toggle */}
          <div className="flex items-center gap-0.5 bg-white/[0.05] rounded-full p-1 shrink-0">
            {[
              { key: "table" as ViewMode, label: "Tableau", Icon: Table2 },
              {
                key: "charts" as ViewMode,
                label: "Graphiques",
                Icon: BarChart2,
              },
              ...(filter.selectedMetrics.length > 1
                ? [
                    {
                      key: "overlay" as ViewMode,
                      label: "Superposé",
                      Icon: Layers,
                    },
                  ]
                : []),
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === key
                    ? "bg-[#1f8a65] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter button */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showFilters
                  ? "bg-[#1f8a65] text-white"
                  : "bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <Filter size={12} />
              <span className="hidden sm:inline">Filtrer</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1f8a65] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <PenLine size={12} />
              <span className="hidden sm:inline">Saisie</span>
            </button>

            <CsvImportButton
              clientId={clientId}
              compact
              onImported={() => {
                showToast("Import CSV réussi");
                load();
              }}
            />
          </div>
        </div>

        {/* ── Filter panel (inline, below toolbar) ── */}
        {showFilters && (
          <FilterPanel
            filter={filter}
            onChange={setFilter}
            fieldsWithData={fieldsWithData}
            viewMode={viewMode}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* ── Active filter summary pill ── */}
        {!showFilters && filter.preset !== "all" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f8a65] text-white text-[10px] font-semibold">
              <Calendar size={10} />
              {filter.preset === "custom"
                ? `${filter.dateFrom ? formatDate(filter.dateFrom) : "…"} → ${filter.dateTo ? formatDate(filter.dateTo) : "…"}`
                : (
                    {
                      "1m": "1 mois",
                      "3m": "3 mois",
                      "6m": "6 mois",
                      "1y": "1 an",
                    } as Record<string, string>
                  )[filter.preset]}
              <button
                onClick={() =>
                  setFilter((p) => ({
                    ...p,
                    preset: "all",
                    dateFrom: "",
                    dateTo: "",
                  }))
                }
                className="ml-1 opacity-60 hover:opacity-100"
              >
                <X size={9} />
              </button>
            </div>
            <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
              {filteredRows.length} mesure{filteredRows.length !== 1 ? "s" : ""}{" "}
              dans cette période
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#181818] rounded-2xl p-5 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="bg-[#181818] rounded-2xl p-5 space-y-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !hasData && (
          <div className="bg-[#181818] rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
              <BarChart2 size={20} className="text-[#1f8a65]" />
            </div>
            <div>
              <p className="font-bold text-white">Aucune donnée</p>
              <p className="text-xs text-[rgba(255,255,255,0.40)] max-w-xs mt-1">
                Importez un fichier CSV depuis votre balance connectée, ou
                saisissez les mesures manuellement.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowManualEntry(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] text-[#1f8a65] text-xs font-bold hover:bg-white/[0.09] transition-colors"
              >
                <PenLine size={13} />
                Saisie manuelle
              </button>
              <CsvImportButton
                clientId={clientId}
                compact
                onImported={() => {
                  showToast("Import CSV réussi");
                  load();
                }}
              />
            </div>
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {!loading && hasData && viewMode === "table" && (
          <div className="bg-[#181818] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-3 py-3 text-left w-8" />
                    <th className="px-3 py-3 text-left font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide text-[10px] whitespace-nowrap">
                      Date
                    </th>
                    {TABLE_COLS.map((f) => (
                      <th
                        key={f.key}
                        className="px-3 py-3 text-right font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide text-[10px] whitespace-nowrap"
                      >
                        {f.label}
                        {f.unit ? (
                          <span className="font-normal opacity-60 ml-0.5">
                            ({f.unit})
                          </span>
                        ) : null}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-semibold text-[rgba(255,255,255,0.40)] uppercase tracking-wide text-[10px] whitespace-nowrap">
                      Tendance
                    </th>
                    <th className="px-3 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => {
                    const isExpanded = expandedRows.has(row.submissionId);
                    const allFieldsInRow = FIELDS.filter(
                      (f) => row.values[f.key] !== undefined,
                    );
                    const hiddenFields = allFieldsInRow.filter(
                      (f) => !TABLE_COLS.some((c) => c.key === f.key),
                    );
                    return (
                      <>
                        <tr
                          key={row.submissionId}
                          className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-2.5">
                            {hiddenFields.length > 0 && (
                              <button
                                onClick={() => toggleRow(row.submissionId)}
                                className="text-white/40 hover:text-white/60 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={13} />
                                ) : (
                                  <ChevronDown size={13} />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-white/60 whitespace-nowrap text-[11px]">
                            {formatDate(row.date)}
                          </td>
                          {TABLE_COLS.map((f) => (
                            <td
                              key={f.key}
                              className="px-3 py-2.5 text-right font-mono tabular-nums"
                            >
                              {row.values[f.key] !== undefined ? (
                                <span className="font-bold text-white">
                                  {row.values[f.key]}
                                </span>
                              ) : (
                                <span className="text-white/40">—</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end">
                              <Sparkline
                                data={(filteredSeries["weight_kg"] ?? []).slice(
                                  0,
                                  idx + 1,
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingRow(row)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-[#0a0a0a] transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(row)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-red-500 hover:bg-red-500/15 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hiddenFields.length > 0 && (
                          <tr
                            key={`${row.submissionId}-exp`}
                            className="bg-white/[0.02] border-b border-white/[0.05]"
                          >
                            <td
                              colSpan={TABLE_COLS.length + 4}
                              className="px-6 py-3"
                            >
                              <div className="flex flex-wrap gap-4">
                                {hiddenFields.map((f) => (
                                  <div
                                    key={f.key}
                                    className="flex items-center gap-1.5"
                                  >
                                    <span className="text-[10px] text-[rgba(255,255,255,0.40)]">
                                      {f.label} :
                                    </span>
                                    <span className="font-mono text-xs font-bold text-white">
                                      {row.values[f.key]}
                                      {f.unit ? ` ${f.unit}` : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="h-px bg-white/[0.06] mx-4" />
            <div className="px-4 py-2.5 flex items-center justify-between">
              <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                {filteredRows.length} mesure{filteredRows.length > 1 ? "s" : ""}
                {filter.preset !== "all" ? " (filtrées)" : " au total"}
              </p>
              <p className="text-[10px] text-white/40">
                ↕ Cliquez sur la flèche pour voir toutes les valeurs
              </p>
            </div>
          </div>
        )}

        {/* ── CHARTS VIEW ── */}
        {!loading && hasData && viewMode === "charts" && (
          <div className="flex flex-col gap-6">
            {/* Sub-tabs: category */}
            <div className="flex items-center gap-0.5 bg-white/[0.05] rounded-full p-1 self-start">
              {[
                { key: "composition" as ChartCategory, label: "Composition" },
                {
                  key: "measurements" as ChartCategory,
                  label: "Mensurations",
                },
                { key: "wellness" as ChartCategory, label: "Bien-être" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setChartCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    chartCategory === cat.key
                      ? "bg-[#181818] text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {cat.label}
                  {fieldsWithData.filter((f) => f.category === cat.key)
                    .length > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${chartCategory === cat.key ? "bg-white/20 text-white/80" : "bg-white/[0.06] text-white/40"}`}
                    >
                      {
                        fieldsWithData.filter((f) => f.category === cat.key)
                          .length
                      }
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Time range slider — pleine largeur */}
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-white/40 shrink-0" />
              <div className="flex-1">
                <Slider
                  value={timeRangeDays}
                  onValueChange={(value) => {
                    const next = Array.isArray(value)
                      ? [value[0], value[1]]
                      : timeRangeDays;
                    setTimeRangeDays(next as TimeRangeDays);
                  }}
                  min={0}
                  max={730}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-[11px] font-semibold text-white/60 min-w-[100px] text-right">
                {formatTimeRangeLabel(timeRangeDays)}
              </span>
            </div>

            {chartsInCategory.length === 0 ? (
              <div className="bg-[#181818] rounded-2xl p-8 text-center text-[rgba(255,255,255,0.40)] text-sm">
                Aucune donnée pour cette catégorie
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {chartsInCategory.map((f) => (
                  <FullChart
                    key={f.key}
                    fieldKey={f.key}
                    data={filteredSeries[f.key] ?? []}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OVERLAY VIEW ── */}
        {!loading && hasData && viewMode === "overlay" && (
          <div className="flex flex-col gap-4">
            {/* Time range range slider for overlay */}
            <div className="flex items-center justify-end gap-3">
              <Calendar size={14} className="text-white/40 shrink-0" />
              <div className="flex-1 min-w-[280px]">
                <Slider
                  value={timeRangeDays}
                  onValueChange={(value) => {
                    const next = Array.isArray(value)
                      ? [value[0], value[1]]
                      : timeRangeDays;
                    setTimeRangeDays(next as TimeRangeDays);
                  }}
                  min={0}
                  max={730} // 2 years = "all time"
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-[11px] font-semibold text-white/60 min-w-[100px] text-right">
                {formatTimeRangeLabel(timeRangeDays)}
              </span>
            </div>

            <MultiSeriesChart
              selectedMetrics={overlayMetrics}
              series={filteredSeries}
              rows={filteredRows}
            />
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {editingRow && (
        <EditRowModal
          row={editingRow}
          clientId={clientId}
          onClose={() => setEditingRow(null)}
          onSaved={() => {
            setEditingRow(null);
            showToast("Mesure modifiée");
            load();
          }}
        />
      )}
      {showManualEntry && (
        <ManualEntryForm
          clientId={clientId}
          onClose={() => setShowManualEntry(false)}
          onSaved={() => {
            setShowManualEntry(false);
            showToast("Mesure enregistrée");
            load();
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">
              Supprimer cette mesure ?
            </h3>
            <p className="text-sm text-white/60 mb-5">
              La mesure du{" "}
              <span className="font-semibold text-white">
                {formatDate(deleteTarget.date)}
              </span>{" "}
              sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500/15 text-red-300 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#181818] text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2">
          <CheckCircle2 size={13} className="text-[#1f8a65]" />
          {toast}
        </div>
      )}
    </div>
  );
}
