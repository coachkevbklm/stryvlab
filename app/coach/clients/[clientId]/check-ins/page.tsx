"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, Flame, Star, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Moment = { moment: "morning" | "evening"; fields: string[] };

type Config = {
  id: string;
  is_active: boolean;
  days_of_week: number[];
  moments: Moment[];
} | null;

type Summary = {
  field_averages: Record<string, number>;
  response_rate: number | null;
  configured_days_count: number;
  streak: {
    current_streak: number;
    longest_streak: number;
    total_points: number;
    level: string;
  } | null;
  heatmap: Record<string, { morning: boolean; evening: boolean; late: boolean }>;
  responses_by_date: Record<string, { moment: string; responses: Record<string, number>; is_late: boolean; responded_at: string }[]>;
} | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const MORNING_FIELDS = [
  { key: "sleep_duration", label: "Durée sommeil (h)" },
  { key: "sleep_quality", label: "Qualité sommeil" },
  { key: "energy", label: "Énergie" },
];

const EVENING_FIELDS = [
  { key: "energy_evening", label: "Énergie fin de journée" },
  { key: "stress", label: "Stress" },
  { key: "mood", label: "Humeur" },
];

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "text-amber-400" },
  silver: { label: "Argent", color: "text-white/60" },
  gold: { label: "Or", color: "text-yellow-400" },
  platinum: { label: "Platine", color: "text-cyan-400" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckInsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  useClientTopBar("Check-ins");

  const [config, setConfig] = useState<Config>(null);
  const [summary, setSummary] = useState<Summary>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drillDate, setDrillDate] = useState<string | null>(null);

  // Local edit state for config
  const [isActive, setIsActive] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [configRes, summaryRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/checkin-config`),
      fetch(`/api/clients/${clientId}/checkin-summary?days=30`),
    ]);
    const configData = configRes.ok ? await configRes.json() : null;
    const summaryData = summaryRes.ok ? await summaryRes.json() : null;

    setConfig(configData);
    setSummary(summaryData);

    if (configData) {
      setIsActive(configData.is_active);
      setDaysOfWeek(configData.days_of_week ?? []);
      setMoments(configData.moments ?? []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleMoment = (moment: "morning" | "evening") => {
    setMoments(prev => {
      const exists = prev.find(m => m.moment === moment);
      if (exists) return prev.filter(m => m.moment !== moment);
      const defaultFields = moment === "morning"
        ? MORNING_FIELDS.map(f => f.key)
        : EVENING_FIELDS.map(f => f.key);
      return [...prev, { moment, fields: defaultFields }];
    });
  };

  const toggleField = (moment: "morning" | "evening", field: string) => {
    setMoments(prev => prev.map(m => {
      if (m.moment !== moment) return m;
      const fields = m.fields.includes(field)
        ? m.fields.filter(f => f !== field)
        : [...m.fields, field];
      return { ...m, fields };
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch(`/api/clients/${clientId}/checkin-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive, days_of_week: daysOfWeek, moments }),
    });
    await fetchData();
    setSaving(false);
  };

  const hasMoment = (m: "morning" | "evening") => moments.some(x => x.moment === m);
  const getMomentFields = (m: "morning" | "evening") => moments.find(x => x.moment === m)?.fields ?? [];

  // Build last 30 days for heatmap
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  if (loading) return <CheckInsSkeletons />;

  const streak = summary?.streak;
  const level = streak ? LEVEL_LABELS[streak.level] ?? LEVEL_LABELS.bronze : null;

  return (
    <div className="px-6 pb-24 space-y-6">

      {/* ── Config Panel ─────────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Configuration
          </p>
          {/* Active toggle */}
          <button
            onClick={() => setIsActive(v => !v)}
            className={cn(
              "flex items-center gap-2 h-7 px-3 rounded-lg text-[11px] font-semibold transition-colors",
              isActive
                ? "bg-[#1f8a65]/15 text-[#1f8a65]"
                : "bg-white/[0.04] text-white/40 hover:text-white/60"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-[#1f8a65]" : "bg-white/30")} />
            {isActive ? "Actif" : "Inactif"}
          </button>
        </div>

        {/* Days of week */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Jours actifs</p>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[11px] font-semibold transition-colors",
                  daysOfWeek.includes(i)
                    ? "bg-[#1f8a65]/15 text-[#1f8a65]"
                    : "bg-white/[0.04] text-white/30 hover:text-white/50"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Moments */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Moments</p>

          {/* Morning */}
          <MomentAccordion
            label="Matin"
            active={hasMoment("morning")}
            onToggle={() => toggleMoment("morning")}
            fields={MORNING_FIELDS}
            selectedFields={getMomentFields("morning")}
            onToggleField={(f) => toggleField("morning", f)}
          />

          {/* Evening */}
          <MomentAccordion
            label="Soir"
            active={hasMoment("evening")}
            onToggle={() => toggleMoment("evening")}
            fields={EVENING_FIELDS}
            selectedFields={getMomentFields("evening")}
            onToggleField={(f) => toggleField("evening", f)}
          />
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex h-8 items-center gap-2 px-4 rounded-lg bg-[#1f8a65] text-white text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-[#217356] disabled:opacity-50 transition-colors active:scale-[0.98]"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {/* ── Analytics ────────────────────────────────────────────────────── */}
      {summary && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              icon={<Flame size={14} className="text-orange-400" />}
              label="Streak actuel"
              value={streak?.current_streak ?? 0}
              suffix="j"
            />
            <StatCard
              icon={<Star size={14} className="text-yellow-400" />}
              label="Points total"
              value={streak?.total_points ?? 0}
            />
            <StatCard
              icon={<Trophy size={14} className={level?.color ?? "text-amber-400"} />}
              label="Niveau"
              value={level?.label ?? "Bronze"}
              isText
            />
            <StatCard
              icon={<TrendingUp size={14} className="text-[#1f8a65]" />}
              label="Taux réponse"
              value={summary.response_rate ?? 0}
              suffix="%"
            />
          </div>

          {/* Field averages */}
          {Object.keys(summary.field_averages).length > 0 && (
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Moyennes 30 jours
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(summary.field_averages).map(([field, avg]) => {
                  const allFields = [...MORNING_FIELDS, ...EVENING_FIELDS];
                  const label = allFields.find(f => f.key === field)?.label ?? field;
                  return (
                    <div key={field} className="flex items-center justify-between">
                      <p className="text-[12px] text-white/55">{label}</p>
                      <p className="text-[13px] font-bold text-white">{avg}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Calendrier — 30 derniers jours
            </p>
            <div className="flex flex-wrap gap-1.5">
              {heatmapDays.map(date => {
                const cell = summary.heatmap[date];
                const responded = cell && (cell.morning || cell.evening);
                const late = cell?.late;
                return (
                  <button
                    key={date}
                    onClick={() => setDrillDate(drillDate === date ? null : date)}
                    title={date}
                    className={cn(
                      "w-7 h-7 rounded-md transition-colors",
                      responded && !late ? "bg-[#1f8a65]/60" :
                      late ? "bg-amber-500/50" :
                      "bg-white/[0.04]",
                      drillDate === date ? "ring-1 ring-white/30" : ""
                    )}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4">
              {[
                { color: "bg-[#1f8a65]/60", label: "Complet" },
                { color: "bg-amber-500/50", label: "Tardif" },
                { color: "bg-white/[0.04]", label: "Manqué" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 rounded-sm", color)} />
                  <span className="text-[10px] text-white/35">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drill-down */}
          {drillDate && (
            <DrillDownPanel
              date={drillDate}
              responses={summary.responses_by_date[drillDate] ?? []}
              onClose={() => setDrillDate(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MomentAccordion({
  label, active, onToggle, fields, selectedFields, onToggleField,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  fields: { key: string; label: string }[];
  selectedFields: string[];
  onToggleField: (f: string) => void;
}) {
  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[12px] font-semibold text-white/80">{label}</span>
        <span className={cn(
          "w-4 h-4 rounded-full border text-[9px] flex items-center justify-center transition-colors",
          active ? "border-[#1f8a65] bg-[#1f8a65]/20 text-[#1f8a65]" : "border-white/20 text-white/20"
        )}>
          {active ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
        </span>
      </button>
      {active && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/[0.04]">
          {fields.map(f => (
            <label key={f.key} className="flex items-center gap-2.5 cursor-pointer py-1">
              <span className={cn(
                "w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0",
                selectedFields.includes(f.key)
                  ? "bg-[#1f8a65] border-[#1f8a65]"
                  : "border-white/20 bg-transparent"
              )}>
                {selectedFields.includes(f.key) && <CheckCircle2 size={9} className="text-white" />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedFields.includes(f.key)}
                onChange={() => onToggleField(f.key)}
              />
              <span className="text-[12px] text-white/60">{f.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, suffix, isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-3.5 space-y-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[9.5px] font-medium text-white/40 leading-tight">{label}</p>
      </div>
      <p className={cn("font-black leading-none", isText ? "text-[15px] text-white" : "text-[22px] text-white")}>
        {value}{suffix && <span className="text-[13px] text-white/40 ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}

type DailyResponse = {
  moment: string;
  responses: Record<string, number>;
  is_late: boolean;
  responded_at: string;
};

function DrillDownPanel({
  date, responses, onClose,
}: {
  date: string;
  responses: DailyResponse[];
  onClose: () => void;
}) {
  const allFields = [...MORNING_FIELDS, ...EVENING_FIELDS];

  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">
          {new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <button
          onClick={onClose}
          className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
        >
          Fermer
        </button>
      </div>

      {responses.length === 0 ? (
        <p className="text-[12px] text-white/35">Aucune réponse ce jour.</p>
      ) : (
        responses.map((r, i) => (
          <div key={i} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-white/60 capitalize">{r.moment}</p>
              {r.is_late && (
                <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">Tardif</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(r.responses).map(([field, value]) => {
                const label = allFields.find(f => f.key === field)?.label ?? field;
                return (
                  <div key={field} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2">
                    <p className="text-[11px] text-white/45">{label}</p>
                    <p className="text-[13px] font-bold text-white">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CheckInsSkeletons() {
  return (
    <div className="px-6 pb-24 space-y-6">
      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-5 space-y-4">
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-1.5">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="w-8 h-8 rounded-lg" />)}
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );
}
