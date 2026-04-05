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
  GitCompare,
  SlidersHorizontal,
  Filter,
  ArrowLeftRight,
  Calendar,
  Layers,
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
} from "recharts";
import CsvImportButton from "./CsvImportButton";

// ─── Chart color palette (semantic mapping to STRYVR design tokens) ────────────
// Alternating primary ↔ accent for visual distinction in chart series
const CHART_COLOR_PRIMARY = "#1A1A1A"; // primary (from design system)
const CHART_COLOR_ACCENT = "#FCF76E"; // accent yellow (from design system)

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
    label: "% Masse grasse",
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
    label: "Masse musc.",
    unit: "kg",
    color: CHART_COLOR_PRIMARY,
    category: "composition",
    step: 0.1,
  },
  {
    key: "muscle_pct",
    label: "% Musculaire",
    unit: "%",
    color: CHART_COLOR_ACCENT,
    category: "composition",
    step: 0.1,
  },
  {
    key: "body_water_pct",
    label: "% Hydrique",
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
    key: "bmi",
    label: "IMC",
    unit: "",
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
    label: "Taille",
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
const KPI_FIELDS = ["weight_kg", "body_fat_pct", "muscle_mass_kg", "bmi"];
const NEG_GOOD_FIELDS = [
  "body_fat_pct",
  "fat_mass_kg",
  "visceral_fat",
  "bmi",
  "stress_level",
];

// Multi-series palette — visible on both light and dark backgrounds
// Never use #1A1A1A (invisible on dark) or pure yellow alone
const SERIES_COLORS = [
  "#FCF76E", // acid yellow — primary
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricRow {
  submissionId: string;
  date: string;
  values: Record<string, number>;
}

interface MetricSeries {
  [fieldKey: string]: { date: string; value: number }[];
}

type ViewMode = "table" | "charts" | "compare";
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
  selectedMetrics: KPI_FIELDS,
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCF76E] text-[#1A1A1A] text-[10px] font-bold leading-none">
      <Icon size={9} />
      {label}
      {isGood !== null && (
        <span
          className={`ml-0.5 ${isGood ? "text-green-700" : "text-red-600"}`}
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
        className="bg-[#1A1A1A] rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.20)", minWidth: 140 }}
      >
        <p className="text-[9px] text-white/40 font-medium border-b border-white/10 pb-1.5">
          {dateStr}
        </p>
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
      className="bg-[#1A1A1A] rounded-xl px-3 py-2.5 flex flex-col gap-1"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.20)", minWidth: 120 }}
    >
      <p className="text-[9px] text-white/40 font-medium">{dateStr}</p>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: accentColor ?? "#FCF76E" }}
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

  const lineColor = isDark ? "#FCF76E" : "#343434";
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

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col min-w-0 ${isDark ? "bg-[#343434]" : "bg-[#FEFEFE]"}`}
      style={{
        boxShadow: isDark
          ? "0 0 0 1px rgba(255,255,255,0.06)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)",
      }}
    >
      {/* Text zone */}
      <div className="px-5 pt-5 pb-2 flex flex-col gap-2">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.12em] truncate ${isDark ? "text-white/35" : "text-[#8A8A85]"}`}
        >
          {field?.label}
        </p>

        {last ? (
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span
                className={`font-bold tabular-nums leading-none ${isDark ? "text-[#FEFEFE]" : "text-[#1A1A1A]"}`}
                style={{ fontSize: 38, letterSpacing: "-0.02em" }}
              >
                {last.value % 1 === 0 ? last.value : last.value.toFixed(1)}
              </span>
              {field?.unit && (
                <span
                  className={`text-sm font-semibold pb-1 ${isDark ? "text-white/30" : "text-[#BCBCB8]"}`}
                >
                  {field.unit}
                </span>
              )}
            </div>
            {/* Delta pill vertical */}
            {delta !== null && (
              <div className={`flex flex-col items-end gap-0.5 shrink-0`}>
                <span
                  className={`text-[9px] font-bold tabular-nums px-2 py-1 rounded-lg leading-tight flex items-center gap-0.5 ${
                    delta === 0
                      ? isDark
                        ? "bg-white/10 text-white/50"
                        : "bg-[#E2E1D9] text-[#8A8A85]"
                      : deltaGood
                        ? "bg-[#FCF76E] text-[#1A1A1A]"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  {delta === 0 ? "─" : delta > 0 ? "↗" : "↘"}
                  <span className="font-semibold">
                    {Math.abs(delta).toFixed(1)}
                  </span>
                  {field?.unit && (
                    <span className="text-[8px] opacity-75">{field.unit}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p
            className={`font-bold ${isDark ? "text-white/15" : "text-[#D8D7CE]"}`}
            style={{ fontSize: 38 }}
          >
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
                    stopColor={lineColor}
                    stopOpacity={isDark ? 0.35 : 0.12}
                  />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height={64}>
              <AreaChart
                data={data}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <YAxis domain={domain} hide />
                <Tooltip
                  content={
                    <CustomTooltip
                      unit={field?.unit ?? ""}
                      fieldLabel={field?.label ?? ""}
                      accentColor={isDark ? "#FCF76E" : "#1A1A1A"}
                    />
                  }
                  cursor={{
                    stroke: lineColor,
                    strokeWidth: 1,
                    strokeOpacity: 0.4,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div
            className={`mx-5 mb-4 h-px ${isDark ? "bg-white/10" : "bg-[#E2E1D9]"}`}
          />
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
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id="gradSparklineInline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1A1A" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#1A1A1A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={domain} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#1A1A1A"
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

  // All single-series charts use the dark line — clean, professional
  const lineColor = "#343434";
  const gradId = `fullChart_${fieldKey}`;

  const last = data[data.length - 1];
  const baseline = data[0]?.value;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const padding = (max - min) * 0.25 || Math.abs(last.value) * 0.05 || 1;
  const domain: [number, number] = [Math.max(0, min - padding), max + padding];
  const tickCount = Math.min(data.length, 6);

  return (
    <div
      className="bg-[#FEFEFE] rounded-2xl overflow-hidden flex flex-col"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-[#8A8A85] uppercase tracking-[0.12em] mb-1.5">
            {field.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold text-[#1A1A1A] tabular-nums leading-none"
              style={{ fontSize: 36, letterSpacing: "-0.02em" }}
            >
              {Number.isInteger(last.value)
                ? last.value
                : last.value.toFixed(1)}
            </span>
            {field.unit && (
              <span className="text-base font-semibold text-[#BCBCB8]">
                {field.unit}
              </span>
            )}
          </div>
          {/* Baseline comparison inline */}
          {baseline !== undefined && data.length > 1 && (
            <p className="text-[10px] text-[#BCBCB8] mt-1.5">
              Départ :{" "}
              <span className="font-semibold text-[#8A8A85]">
                {Number.isInteger(baseline) ? baseline : baseline.toFixed(1)}{" "}
                {field.unit}
              </span>
            </p>
          )}
        </div>

        {/* Delta block */}
        {delta !== null && (
          <div
            className={`flex flex-col items-center px-3 py-2.5 rounded-xl shrink-0 ${
              delta === 0
                ? "bg-[#F0EFE7]"
                : deltaGood
                  ? "bg-[#FCF76E]"
                  : "bg-red-50"
            }`}
          >
            {delta === 0 ? (
              <Minus size={14} className="text-[#8A8A85] mb-0.5" />
            ) : delta > 0 ? (
              <TrendingUp
                size={14}
                className={
                  deltaGood ? "text-[#1A1A1A] mb-0.5" : "text-red-500 mb-0.5"
                }
              />
            ) : (
              <TrendingDown
                size={14}
                className={
                  deltaGood ? "text-[#1A1A1A] mb-0.5" : "text-red-500 mb-0.5"
                }
              />
            )}
            <span
              className={`text-sm font-bold tabular-nums leading-none ${
                delta === 0
                  ? "text-[#8A8A85]"
                  : deltaGood
                    ? "text-[#1A1A1A]"
                    : "text-red-600"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {Math.abs(delta) < 0.1 ? delta.toFixed(2) : delta.toFixed(1)}
            </span>
            {field.unit && (
              <span
                className={`text-[9px] font-medium mt-0.5 ${
                  delta === 0
                    ? "text-[#BCBCB8]"
                    : deltaGood
                      ? "text-[#1A1A1A]/50"
                      : "text-red-400"
                }`}
              >
                {field.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart area — darker background for contrast */}
      <div className="bg-[#F0EFE7] pt-2 pb-1 mx-0">
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#343434" stopOpacity={0.14} />
              <stop offset="70%" stopColor="#343434" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#343434" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 16, right: 16, bottom: 4, left: -8 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#D8D7CE"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#8A8A85", fontWeight: 600 }}
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
              tick={{ fontSize: 10, fill: "#8A8A85", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={domain}
              tickFormatter={(v) =>
                Number.isInteger(v) ? String(v) : v.toFixed(1)
              }
            />
            <Tooltip
              content={
                <CustomTooltip
                  unit={field.unit}
                  fieldLabel={field.label}
                  accentColor="#FCF76E"
                />
              }
              cursor={{
                stroke: "#343434",
                strokeWidth: 1,
                strokeDasharray: "4 3",
                strokeOpacity: 0.3,
              }}
            />
            {baseline !== undefined && data.length > 1 && (
              <ReferenceLine
                y={baseline}
                stroke="#BCBCB8"
                strokeDasharray="5 3"
                strokeWidth={1.5}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(props: any) => {
                const isLast = props.index === data.length - 1;
                if (!isLast && data.length > 8) return <g key={props.index} />;
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={isLast ? 5 : 3}
                    fill={isLast ? "#343434" : "#FEFEFE"}
                    stroke="#343434"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 6,
                fill: "#FCF76E",
                stroke: "#343434",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-[#F0EFE7]">
        <p className="text-[9px] font-medium text-[#BCBCB8]">
          {new Date(data[0].date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })}
        </p>
        <p className="text-[9px] font-medium text-[#BCBCB8]">
          {data.length} point{data.length > 1 ? "s" : ""}
        </p>
        <p className="text-[9px] font-medium text-[#BCBCB8]">
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

type OverlayMode = "pct" | "abs";

// Tooltip for normalized view — shows real value + % change
interface MultiTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey?: string; color?: string }>;
  label?: string;
  rawSeries: MetricSeries;
  mode: OverlayMode;
  baselineValues: Record<string, number>;
}

function MultiTooltip({
  active,
  payload,
  label,
  rawSeries,
  mode,
  baselineValues,
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
      className="bg-[#1A1A1A] rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
        minWidth: 160,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="text-[9px] text-white/40 font-medium border-b border-white/10 pb-1.5">
        {dateStr}
      </p>
      {payload.map((p, i) => {
        const fieldKey =
          typeof p.dataKey === "string" ? p.dataKey.replace("__pct_", "") : "";
        const f = FIELD_MAP[fieldKey];
        if (!f) return null;
        const color = p.color ?? "#FCF76E";

        if (mode === "pct") {
          const pctVal = p.value;
          const baseline = baselineValues[fieldKey];
          // Recover real value from % change: v = baseline * (1 + pct/100)
          const realVal =
            baseline !== undefined ? baseline * (1 + pctVal / 100) : undefined;
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
                        ? "text-[#FCF76E]"
                        : "text-red-400"
                  }`}
                >
                  {pctVal > 0 ? "+" : ""}
                  {pctVal.toFixed(1)}%
                </span>
                {realVal !== undefined && (
                  <p className="text-[9px] text-white/30 tabular-nums">
                    {Number.isInteger(realVal) ? realVal : realVal.toFixed(1)}{" "}
                    {f.unit}
                  </p>
                )}
              </div>
            </div>
          );
        }

        const val = p.value;
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[9px] text-white/50 truncate">
                {f.label}
              </span>
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color }}>
              {Number.isInteger(val) ? val : val.toFixed(1)}
              {f.unit && (
                <span className="text-white/30 font-normal text-[9px] ml-0.5">
                  {f.unit}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MultiSeriesChart({
  selectedMetrics,
  series,
}: {
  selectedMetrics: string[];
  series: MetricSeries;
}) {
  const [mode, setMode] = useState<OverlayMode>("pct");
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    () => new Set(selectedMetrics),
  );

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
    (series[k] ?? []).forEach((d) => dateSet.add(d.date));
  });
  const dates = Array.from(dateSet).sort();

  // Merge — in pct mode, store normalized values under `__pct_${key}`
  const merged = useMemo(
    () =>
      dates.map((date) => {
        const row: Record<string, number | string> = { date };
        selectedMetrics.forEach((k) => {
          const point = (series[k] ?? []).find((d) => d.date === date);
          if (point) {
            if (mode === "pct") {
              const baseline = baselineValues[k];
              if (baseline !== undefined && baseline !== 0) {
                row[`__pct_${k}`] =
                  ((point.value - baseline) / Math.abs(baseline)) * 100;
              } else {
                row[`__pct_${k}`] = 0;
              }
            } else {
              row[k] = point.value;
            }
          }
        });
        return row;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [dates.join(","), selectedMetrics.join(","), mode, baselineValues],
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
      <div className="bg-[#343434] rounded-2xl p-8 text-center text-white/40 text-sm">
        Aucune donnée pour les métriques sélectionnées
      </div>
    );

  const dataKeys =
    mode === "pct" ? selectedMetrics.map((k) => `__pct_${k}`) : selectedMetrics;

  // Y axis range for pct mode — symmetric around 0
  const allPctVals =
    mode === "pct"
      ? merged.flatMap((row) =>
          dataKeys
            .map((k) => row[k] as number)
            .filter((v) => typeof v === "number"),
        )
      : [];
  const pctMax =
    allPctVals.length > 0 ? Math.max(...allPctVals.map(Math.abs)) * 1.2 : 10;
  const pctDomain: [number, number] = [-pctMax, pctMax];

  return (
    <div
      className="bg-[#343434] rounded-2xl overflow-hidden"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.20), 0 16px 40px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em]">
              Vue superposée
            </p>
            {mode === "pct" && (
              <p className="text-[10px] text-white/20 mt-0.5">
                Variation en % depuis le point de départ
              </p>
            )}
          </div>
          {/* Mode toggle */}
          <div
            className="flex items-center gap-0.5 bg-white/8 rounded-full p-1 shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setMode("pct")}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                mode === "pct"
                  ? "bg-[#FCF76E] text-[#1A1A1A]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              % variation
            </button>
            <button
              onClick={() => setMode("abs")}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                mode === "abs"
                  ? "bg-[#FCF76E] text-[#1A1A1A]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Valeurs
            </button>
          </div>
        </div>

        {/* Legend grid */}
        <div
          className="grid gap-x-4 gap-y-2 pb-4 border-b border-white/8"
          style={{
            gridTemplateColumns: `repeat(${Math.min(selectedMetrics.length, 3)}, 1fr)`,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {selectedMetrics.map((k, i) => {
            const f = FIELD_MAP[k];
            if (!f) return null;
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            const val = lastValues[k];
            const delta = deltas[k];
            const isNegGood = NEG_GOOD_FIELDS.includes(k);
            const deltaGood =
              delta === null
                ? null
                : delta === 0
                  ? null
                  : isNegGood
                    ? delta < 0
                    : delta > 0;
            return (
              <div
                key={k}
                className="flex items-center gap-2 cursor-pointer group"
              >
                {/* Toggle checkbox */}
                <input
                  type="checkbox"
                  checked={visibleSeries.has(k)}
                  onChange={(e) => {
                    const newSet = new Set(visibleSeries);
                    if (e.target.checked) newSet.add(k);
                    else newSet.delete(k);
                    setVisibleSeries(newSet);
                  }}
                  className="w-3.5 h-3.5 rounded shrink-0 cursor-pointer accent-[#FCF76E]"
                />
                {/* Colored line sample */}
                <div
                  className="flex flex-col items-center gap-0.5 shrink-0"
                  style={{ opacity: visibleSeries.has(k) ? 1 : 0.35 }}
                >
                  <div
                    className="w-5 h-0.5 rounded-full"
                    style={{ background: color }}
                  />
                </div>
                <div
                  className="min-w-0 flex-1"
                  style={{ opacity: visibleSeries.has(k) ? 1 : 0.35 }}
                >
                  <p className="text-[9px] text-white/35 font-medium truncate">
                    {f.label}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    {val !== undefined && (
                      <span
                        className="text-sm font-bold tabular-nums leading-none"
                        style={{ color }}
                      >
                        {Number.isInteger(val) ? val : val.toFixed(1)}
                        <span className="text-[9px] font-normal text-white/25 ml-0.5">
                          {f.unit}
                        </span>
                      </span>
                    )}
                    {delta !== null && (
                      <span
                        className={`text-[9px] font-bold tabular-nums ${
                          delta === 0
                            ? "text-white/25"
                            : deltaGood
                              ? "text-[#FCF76E]"
                              : "text-red-400"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="pb-2 px-1 pt-2">
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            {selectedMetrics.map((k, i) => {
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <linearGradient
                  key={k}
                  id={`multiGrad_${k}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
        </svg>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={merged}
            margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />

            {/* Zero-line reference in pct mode */}
            {mode === "pct" && (
              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.20)"
                strokeWidth={1}
              />
            )}

            <XAxis
              dataKey="date"
              tick={{
                fontSize: 10,
                fill: "rgba(255,255,255,0.30)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              tickCount={6}
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
                fill: "rgba(255,255,255,0.30)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={mode === "pct" ? pctDomain : ["auto", "auto"]}
              tickFormatter={(v) =>
                mode === "pct"
                  ? `${v > 0 ? "+" : ""}${v.toFixed(0)}%`
                  : Number.isInteger(v)
                    ? String(v)
                    : v.toFixed(1)
              }
            />
            <Tooltip
              content={
                <MultiTooltip
                  rawSeries={series}
                  mode={mode}
                  baselineValues={baselineValues}
                />
              }
              cursor={{
                stroke: "rgba(255,255,255,0.15)",
                strokeWidth: 1,
                strokeDasharray: "4 3",
              }}
            />

            {selectedMetrics.map((k, i) => {
              if (!visibleSeries.has(k)) return null;
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              const dataKey = mode === "pct" ? `__pct_${k}` : k;
              return (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={mode === "pct" ? "none" : `url(#multiGrad_${k})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: color,
                    stroke: "#343434",
                    strokeWidth: 2,
                  }}
                  connectNulls
                  isAnimationActive
                  animationDuration={500}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <p className="text-[9px] text-white/20 font-medium">
          {merged[0]
            ? new Date(merged[0].date as string).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })
            : ""}
        </p>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <p className="text-[9px] text-white/20 font-medium">
          {merged[merged.length - 1]
            ? new Date(
                merged[merged.length - 1].date as string,
              ).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })
            : ""}
        </p>
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
      <div
        className="bg-[#FEFEFE] rounded-2xl p-8 text-center text-sm text-[#8A8A85]"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        Il faut au moins 2 mesures pour comparer des snapshots.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Date pickers */}
      <div
        className="bg-[#FEFEFE] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide">
              Mesure A
            </label>
            <select
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] outline-none focus:border-[#111111] focus:bg-[#FEFEFE] transition-colors"
            >
              {availableDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center text-[#BCBCB8] self-center mt-4 sm:mt-0">
          <ArrowLeftRight size={14} />
        </div>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FCF76E] border border-[#D4CE00] shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide">
              Mesure B
            </label>
            <select
              value={dateB}
              onChange={(e) => setDateB(e.target.value)}
              className="bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] outline-none focus:border-[#111111] focus:bg-[#FEFEFE] transition-colors"
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
      <div
        className="bg-[#FEFEFE] rounded-2xl overflow-hidden"
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header row */}
        <div className="grid grid-cols-[1fr_100px_100px_80px] border-b border-[#E2E1D9] px-4 py-3">
          <p className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide">
            Métrique
          </p>
          <div className="text-right">
            <div className="inline-flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
              <p className="text-[10px] font-semibold text-[#1A1A1A]">
                {rowA ? formatDate(rowA.date) : "—"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#D4CE00] border border-[#D4CE00]" />
              <p className="text-[10px] font-semibold text-[#1A1A1A]">
                {rowB ? formatDate(rowB.date) : "—"}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide text-right">
            Δ
          </p>
        </div>

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
              <div className="px-4 py-2 bg-[#F0EFE7]">
                <p className="text-[10px] font-bold text-[#8A8A85] uppercase tracking-widest">
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
                    className="grid grid-cols-[1fr_100px_100px_80px] px-4 py-2.5 border-b border-[#F0EFE7] last:border-0 hover:bg-[#F0EFE7]/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#1A1A1A]">
                        {f.label}
                      </p>
                      {f.unit && (
                        <p className="text-[9px] text-[#BCBCB8]">{f.unit}</p>
                      )}
                    </div>
                    <p className="text-right font-mono text-xs font-bold text-[#1A1A1A] self-center">
                      {vA !== undefined ? (
                        fmtVal(vA, f.unit)
                      ) : (
                        <span className="text-[#BCBCB8]">—</span>
                      )}
                    </p>
                    <p className="text-right font-mono text-xs font-bold text-[#1A1A1A] self-center">
                      {vB !== undefined ? (
                        fmtVal(vB, f.unit)
                      ) : (
                        <span className="text-[#BCBCB8]">—</span>
                      )}
                    </p>
                    <div className="flex justify-end items-center self-center">
                      {diff !== null ? (
                        <span
                          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                            diff === 0
                              ? "bg-[#E2E1D9] text-[#8A8A85]"
                              : diffGood
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {diffSign}
                          {Math.abs(diff) < 0.1
                            ? diff.toFixed(2)
                            : diff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[#BCBCB8] text-[10px]">—</span>
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
            <div className="bg-[#343434] rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-4">
                Plus grands écarts A → B
              </p>
              <div className="flex flex-col gap-3">
                {deltas.map((d) => {
                  if (!d) return null;
                  const barWidth = Math.min(Math.abs(d.pct), 100);
                  return (
                    <div key={d.field.key} className="flex items-center gap-3">
                      <p className="text-xs text-[#FEFEFE] w-28 shrink-0 truncate">
                        {d.field.label}
                      </p>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${d.good === true ? "bg-[#FCF76E]" : d.good === false ? "bg-red-400" : "bg-white/30"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p
                        className={`text-[10px] font-bold tabular-nums w-16 text-right ${
                          d.good === true
                            ? "text-[#FCF76E]"
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
    <div
      className="bg-[#FEFEFE] rounded-2xl p-5 flex flex-col gap-5"
      style={{
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#535353]" />
          <p className="text-sm font-bold text-[#1A1A1A]">Filtres</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#8A8A85] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#E2E1D9] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Period presets */}
      <div>
        <p className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide mb-2">
          Période
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                local.preset === p.key
                  ? "bg-[#343434] text-[#FEFEFE]"
                  : "bg-[#E2E1D9] text-[#535353] hover:text-[#1A1A1A]"
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
              <label className="text-[10px] text-[#8A8A85] block mb-1">
                Du
              </label>
              <input
                type="date"
                value={local.dateFrom}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, dateFrom: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg text-xs text-[#1A1A1A] outline-none focus:bg-[#FEFEFE] focus:border-[#111111] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8A8A85] block mb-1">
                Au
              </label>
              <input
                type="date"
                value={local.dateTo}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, dateTo: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg text-xs text-[#1A1A1A] outline-none focus:bg-[#FEFEFE] focus:border-[#111111] transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric selector (only relevant for charts/overlay view) */}
      {(viewMode === "charts" || viewMode === "compare") && (
        <div>
          <p className="text-[10px] font-semibold text-[#8A8A85] uppercase tracking-wide mb-2">
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
                    <p className="text-[9px] font-bold text-[#BCBCB8] uppercase tracking-widest mb-1.5">
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
                                ? "bg-[#1A1A1A] text-[#FCF76E]"
                                : "bg-[#E2E1D9] text-[#535353] hover:text-[#1A1A1A]"
                            }`}
                          >
                            {f.label}
                            {f.unit && (
                              <span
                                className={`${active ? "text-[#FCF76E]/60" : "text-[#BCBCB8]"} text-[9px]`}
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
      <div className="flex items-center justify-between pt-2 border-t border-[#E2E1D9]">
        <button
          onClick={reset}
          className="text-xs text-[#8A8A85] hover:text-[#1A1A1A] font-medium transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={apply}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FCF76E] text-[#1A1A1A] text-xs font-bold hover:opacity-90 transition-opacity"
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
      <label className="text-[10px] text-[#8A8A85] block mb-0.5">
        {field.label}
        {field.unit ? ` (${field.unit})` : ""}
      </label>
      <input
        type="number"
        step={field.step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full px-2.5 py-1.5 bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg text-xs font-mono text-[#1A1A1A] outline-none focus:bg-[#FEFEFE] focus:border-[#111111] transition-colors placeholder:text-[#BCBCB8]"
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
      <div
        className="bg-[#FEFEFE] rounded-2xl w-full max-w-lg my-8"
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E1D9]">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">{title}</p>
            {subtitle && (
              <p className="text-xs text-[#8A8A85] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A85] hover:text-[#1A1A1A] transition-colors p-1 rounded-lg hover:bg-[#E2E1D9]"
          >
            <X size={15} />
          </button>
        </div>
        {children}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E1D9]">
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
            className="text-xs text-[#8A8A85] hover:text-[#1A1A1A] font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FCF76E] text-[#1A1A1A] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
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
      <div className="px-5 py-4 border-b border-[#E2E1D9]">
        <label className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wide block mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg text-sm text-[#1A1A1A] outline-none focus:bg-[#FEFEFE] focus:border-[#111111] transition-colors"
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wide mb-2">
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
            className="text-xs text-[#8A8A85] hover:text-[#1A1A1A] font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || filledCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FCF76E] text-[#1A1A1A] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
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
      <div className="px-5 py-4 border-b border-[#E2E1D9]">
        <label className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wide block mb-1.5">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-[#E2E1D9] border border-[#BCBCB8] rounded-lg text-sm text-[#1A1A1A] outline-none focus:bg-[#FEFEFE] focus:border-[#111111] transition-colors"
        />
      </div>
      <div className="px-5 py-4 flex flex-col gap-5 max-h-[50vh] overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wide mb-2">
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

  // Derived: effective date range from filter
  const effectiveDateFrom =
    filter.preset !== "custom"
      ? presetToRange(filter.preset).from
      : filter.dateFrom;
  const effectiveDateTo =
    filter.preset !== "custom"
      ? presetToRange(filter.preset).to
      : filter.dateTo;

  const filteredRows = useMemo(
    () => filterRows(rows, effectiveDateFrom, effectiveDateTo),
    [rows, effectiveDateFrom, effectiveDateTo],
  );

  const filteredSeries = useMemo(() => {
    const result: MetricSeries = {};
    for (const [k, data] of Object.entries(series)) {
      result[k] = filterSeries(data, effectiveDateFrom, effectiveDateTo);
    }
    return result;
  }, [series, effectiveDateFrom, effectiveDateTo]);

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
    <div className="flex flex-col gap-5">
      {/* ── KPI strip ── */}
      {hasData && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          style={{ gridAutoRows: "160px" }}
        >
          {KPI_FIELDS.map((k, i) => (
            <KpiCard key={k} fieldKey={k} series={filteredSeries} index={i} />
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* View mode toggle */}
        <div
          className="flex items-center gap-0.5 bg-[#D8D7CE] rounded-full p-1"
          style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}
        >
          {[
            { key: "table" as ViewMode, label: "Tableau", Icon: Table2 },
            { key: "charts" as ViewMode, label: "Graphiques", Icon: BarChart2 },
            { key: "compare" as ViewMode, label: "Comparer", Icon: GitCompare },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === key
                  ? "bg-[#343434] text-[#FEFEFE] shadow-sm"
                  : "text-[#535353] hover:text-[#1A1A1A]"
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
              showFilters
                ? "bg-[#343434] text-[#FEFEFE]"
                : "bg-[#FEFEFE] border border-[#BCBCB8] text-[#535353] hover:text-[#1A1A1A] hover:border-[#111111]"
            }`}
          >
            <Filter size={12} />
            Filtrer
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FCF76E] text-[#1A1A1A] text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FEFEFE] border border-[#BCBCB8] text-xs font-semibold text-[#535353] hover:text-[#1A1A1A] hover:border-[#111111] transition-colors"
          >
            <PenLine size={12} />
            <span className="hidden sm:inline">Saisie manuelle</span>
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#343434] text-[#FCF76E] text-[10px] font-semibold">
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
          <p className="text-[10px] text-[#8A8A85]">
            {filteredRows.length} mesure{filteredRows.length !== 1 ? "s" : ""}{" "}
            dans cette période
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          className="bg-[#FEFEFE] rounded-2xl p-8 flex items-center justify-center gap-2 text-[#8A8A85] text-sm"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <Loader2 size={16} className="animate-spin" />
          Chargement…
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !hasData && (
        <div
          className="bg-[#FEFEFE] rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
        >
          <div className="w-12 h-12 rounded-full bg-[#343434] flex items-center justify-center">
            <BarChart2 size={20} className="text-[#FCF76E]" />
          </div>
          <div>
            <p className="font-bold text-[#1A1A1A]">Aucune donnée</p>
            <p className="text-xs text-[#8A8A85] max-w-xs mt-1">
              Importez un fichier CSV depuis votre balance connectée, ou
              saisissez les mesures manuellement.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#343434] text-[#FCF76E] text-xs font-bold hover:opacity-90 transition-opacity"
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
        <div
          className="bg-[#FEFEFE] rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E2E1D9]">
                  <th className="px-3 py-3 text-left w-8" />
                  <th className="px-3 py-3 text-left font-semibold text-[#8A8A85] uppercase tracking-wide text-[10px] whitespace-nowrap">
                    Date
                  </th>
                  {TABLE_COLS.map((f) => (
                    <th
                      key={f.key}
                      className="px-3 py-3 text-right font-semibold text-[#8A8A85] uppercase tracking-wide text-[10px] whitespace-nowrap"
                    >
                      {f.label}
                      {f.unit ? (
                        <span className="font-normal opacity-60 ml-0.5">
                          ({f.unit})
                        </span>
                      ) : null}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-[#8A8A85] uppercase tracking-wide text-[10px] whitespace-nowrap">
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
                        className={`border-b border-[#F0EFE7] transition-colors hover:bg-[#E2E1D9]/40 ${idx % 2 === 0 ? "" : "bg-[#F0EFE7]/60"}`}
                      >
                        <td className="px-3 py-2.5">
                          {hiddenFields.length > 0 && (
                            <button
                              onClick={() => toggleRow(row.submissionId)}
                              className="text-[#BCBCB8] hover:text-[#535353] transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp size={13} />
                              ) : (
                                <ChevronDown size={13} />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[#535353] whitespace-nowrap text-[11px]">
                          {formatDate(row.date)}
                        </td>
                        {TABLE_COLS.map((f) => (
                          <td
                            key={f.key}
                            className="px-3 py-2.5 text-right font-mono tabular-nums"
                          >
                            {row.values[f.key] !== undefined ? (
                              <span className="font-bold text-[#1A1A1A]">
                                {row.values[f.key]}
                              </span>
                            ) : (
                              <span className="text-[#BCBCB8]">—</span>
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
                              className="p-1.5 rounded-lg text-[#BCBCB8] hover:text-[#1A1A1A] hover:bg-[#E2E1D9] transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 rounded-lg text-[#BCBCB8] hover:text-red-500 hover:bg-red-50 transition-colors"
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
                          className="bg-[#E2E1D9]/30 border-b border-[#E2E1D9]"
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
                                  <span className="text-[10px] text-[#8A8A85]">
                                    {f.label} :
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#1A1A1A]">
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
          <div className="px-4 py-2.5 border-t border-[#E2E1D9] flex items-center justify-between">
            <p className="text-[10px] text-[#8A8A85]">
              {filteredRows.length} mesure{filteredRows.length > 1 ? "s" : ""}
              {filter.preset !== "all" ? " (filtrées)" : " au total"}
            </p>
            <p className="text-[10px] text-[#BCBCB8]">
              ↕ Cliquez sur la flèche pour voir toutes les valeurs
            </p>
          </div>
        </div>
      )}

      {/* ── CHARTS VIEW ── */}
      {!loading && hasData && viewMode === "charts" && (
        <div className="flex flex-col gap-4">
          {/* Sub-tabs: category OR overlay */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category tabs */}
            <div
              className="flex items-center gap-0.5 bg-[#D8D7CE] rounded-full p-1"
              style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}
            >
              {[
                { key: "composition" as ChartCategory, label: "Composition" },
                { key: "measurements" as ChartCategory, label: "Mensurations" },
                { key: "wellness" as ChartCategory, label: "Bien-être" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setChartCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    chartCategory === cat.key
                      ? "bg-[#343434] text-[#FEFEFE] shadow-sm"
                      : "text-[#535353] hover:text-[#1A1A1A]"
                  }`}
                >
                  {cat.label}
                  {fieldsWithData.filter((f) => f.category === cat.key).length >
                    0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${chartCategory === cat.key ? "bg-white/20" : "bg-[#1A1A1A]/10"}`}
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

            {/* Overlay button */}
            {filter.selectedMetrics.length > 1 && (
              <button
                onClick={() => setChartCategory("overlay" as ChartCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  chartCategory === ("overlay" as ChartCategory)
                    ? "bg-[#343434] text-[#FCF76E] border-[#343434]"
                    : "bg-[#FEFEFE] border-[#BCBCB8] text-[#535353] hover:text-[#1A1A1A]"
                }`}
              >
                <Layers size={12} />
                Superposé ({filter.selectedMetrics.length})
              </button>
            )}
          </div>

          {/* Overlay chart */}
          {chartCategory === ("overlay" as ChartCategory) ? (
            <MultiSeriesChart
              selectedMetrics={overlayMetrics}
              series={filteredSeries}
            />
          ) : chartsInCategory.length === 0 ? (
            <div
              className="bg-[#FEFEFE] rounded-2xl p-8 text-center text-[#8A8A85] text-sm"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              Aucune donnée pour cette catégorie
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* ── COMPARE VIEW ── */}
      {!loading && hasData && viewMode === "compare" && (
        <SnapshotCompare rows={filteredRows} series={filteredSeries} />
      )}

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
          <div
            className="bg-[#FEFEFE] rounded-2xl p-6 w-full max-w-sm"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.14)" }}
          >
            <h3 className="font-bold text-[#1A1A1A] mb-2">
              Supprimer cette mesure ?
            </h3>
            <p className="text-sm text-[#535353] mb-5">
              La mesure du{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {formatDate(deleteTarget.date)}
              </span>{" "}
              sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg bg-[#D8D7CE] border border-[#BCBCB8] text-sm text-[#535353] hover:text-[#1A1A1A] transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#343434] text-[#FEFEFE] text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 size={13} className="text-[#FCF76E]" />
          {toast}
        </div>
      )}
    </div>
  );
}
