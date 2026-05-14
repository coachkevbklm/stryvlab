"use client";

import { useEffect, useMemo, useState } from "react";
import { useClient } from "@/lib/client-context";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import { AnimatePresence, motion } from "framer-motion";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Slider } from "@/components/ui/slider";

type MomentConfig = { moment: "morning" | "evening"; fields: string[] };
type CheckinConfig = {
  id: string;
  is_active: boolean;
  days_of_week: number[];
  moments: MomentConfig[];
} | null;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const MORNING_FIELDS = [
  { key: "sleep_duration", label: "Durée sommeil" },
  { key: "sleep_quality", label: "Qualité sommeil" },
  { key: "energy", label: "Énergie matin" },
];

const EVENING_FIELDS = [
  { key: "energy", label: "Énergie soir" },
  { key: "stress", label: "Stress" },
  { key: "mood", label: "Humeur" },
];

export default function ClientCheckinsPage() {
  const { clientId } = useClient();
  useClientTopBar("Check-ins");

  const [config, setConfig] = useState<CheckinConfig>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateMeals, setDateMeals] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [configRes, summaryRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/checkin-config`),
        fetch(`/api/clients/${clientId}/checkin-summary`),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      const historyRes = await fetch(`/api/clients/${clientId}/checkin-history?limit=50`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData?.data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [clientId]);

  useEffect(() => {
    async function loadMeals() {
      if (!selectedDate) return;
      const res = await fetch(`/api/clients/${clientId}/meal-logs?date=${selectedDate}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      setDateMeals(data?.data ?? []);
    }
    loadMeals();
  }, [clientId, selectedDate]);

  const safeConfig = useMemo<CheckinConfig>(() => {
    if (config) return config;
    return {
      id: "",
      is_active: false,
      days_of_week: [0, 1, 2, 3, 4],
      moments: [],
    };
  }, [config]);

  function toggleDay(day: number) {
    if (!safeConfig) return;
    const exists = safeConfig.days_of_week.includes(day);
    const days = exists
      ? safeConfig.days_of_week.filter((d) => d !== day)
      : [...safeConfig.days_of_week, day].sort((a, b) => a - b);
    setConfig({ ...safeConfig, days_of_week: days });
  }

  function setMomentEnabled(moment: "morning" | "evening", enabled: boolean) {
    if (!safeConfig) return;
    const moments = safeConfig.moments.filter((m) => m.moment !== moment);
    if (enabled) moments.push({ moment, fields: [] });
    setConfig({ ...safeConfig, moments });
  }

  function toggleField(moment: "morning" | "evening", field: string) {
    if (!safeConfig) return;
    const existing = safeConfig.moments.find((m) => m.moment === moment);
    if (!existing) return;
    const fields = existing.fields.includes(field)
      ? existing.fields.filter((f) => f !== field)
      : [...existing.fields, field];
    const moments = safeConfig.moments.map((m) =>
      m.moment === moment ? { ...m, fields } : m
    );
    setConfig({ ...safeConfig, moments });
  }

  async function saveConfig() {
    if (!safeConfig) return;
    setSaving(true);
    await fetch(`/api/clients/${clientId}/checkin-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_active: safeConfig.is_active,
        days_of_week: safeConfig.days_of_week,
        moments: safeConfig.moments,
      }),
    });
    setSaving(false);
  }

  if (loading || !safeConfig) {
    return (
      <main className="min-h-screen bg-[#121212]">
        <div className="px-6 pb-24 text-white/50">Chargement check-ins…</div>
      </main>
    );
  }

  const morning = safeConfig.moments.find((m) => m.moment === "morning");
  const evening = safeConfig.moments.find((m) => m.moment === "evening");
  const trendData = Object.entries(summary?.responses_by_date ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]: any) => {
      const byMoment = (rows as any[]).reduce((acc, r) => {
        acc[r.moment] = r.responses ?? {};
        return acc;
      }, {} as Record<string, Record<string, number>>);
      return {
        date: date.slice(5),
        energy_morning: byMoment.morning?.energy ?? null,
        sleep_quality: byMoment.morning?.sleep_quality ?? null,
        stress_evening: byMoment.evening?.stress ?? null,
      };
    });

  const monthDays = Array.from({ length: 31 }).map((_, i) => i + 1);
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="px-6 pb-24 space-y-4">
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
            Configuration
          </p>

          <label className="flex items-center justify-between">
            <span className="text-[13px] text-white">Activer les check-ins</span>
            <input
              type="checkbox"
              checked={safeConfig.is_active}
              onChange={(e) =>
                setConfig({ ...safeConfig, is_active: e.target.checked })
              }
            />
          </label>

          <div>
            <p className="text-[11px] text-white/50 mb-2">Jours actifs</p>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, day) => {
                const active = safeConfig.days_of_week.includes(day);
                return (
                  <button
                    key={`${label}-${day}`}
                    onClick={() => toggleDay(day)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold ${
                      active
                        ? "bg-[#1f8a65] text-white"
                        : "bg-white/[0.04] text-white/45"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/[0.02] rounded-xl p-3">
              <label className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white">Matin</span>
                <input
                  type="checkbox"
                  checked={!!morning}
                  onChange={(e) => setMomentEnabled("morning", e.target.checked)}
                />
              </label>
              {morning && (
                <div className="flex flex-wrap gap-2">
                  {MORNING_FIELDS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => toggleField("morning", f.key)}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        morning.fields.includes(f.key)
                          ? "bg-[#1f8a65] text-white"
                          : "bg-white/[0.05] text-white/50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3">
              <label className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white">Soir</span>
                <input
                  type="checkbox"
                  checked={!!evening}
                  onChange={(e) => setMomentEnabled("evening", e.target.checked)}
                />
              </label>
              {evening && (
                <div className="flex flex-wrap gap-2">
                  {EVENING_FIELDS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => toggleField("evening", f.key)}
                      className={`text-[11px] px-2 py-1 rounded-md ${
                        evening.fields.includes(f.key)
                          ? "bg-[#1f8a65] text-white"
                          : "bg-white/[0.05] text-white/50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="h-10 px-4 rounded-xl bg-[#1f8a65] text-white text-[12px] font-bold disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </section>

        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-3">
            Synthèse 30 jours
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Streak actuel" value={summary?.streak?.current_streak ?? 0} />
            <Stat label="Points total" value={summary?.streak?.total_points ?? 0} />
            <Stat label="Niveau" value={summary?.streak?.level ?? "bronze"} />
            <Stat label="Taux réponse" value={`${summary?.response_rate ?? 0}%`} />
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-3">
            Tendances (30j)
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                <YAxis domain={[1, 5]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.08)" }}
                  labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                />
                <Line type="monotone" dataKey="energy_morning" stroke="#22c55e" dot={false} name="Énergie matin" />
                <Line type="monotone" dataKey="sleep_quality" stroke="#60a5fa" dot={false} name="Qualité sommeil" />
                <Line type="monotone" dataKey="stress_evening" stroke="#f59e0b" dot={false} name="Stress soir" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-3">
            Heatmap mensuelle
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((d) => {
              const date = `${year}-${month}-${String(d).padStart(2, "0")}`;
              const heat = summary?.heatmap?.[date];
              const configured = (safeConfig.days_of_week ?? []).includes(
                (() => {
                  const dt = new Date(`${date}T12:00:00.000Z`);
                  const jsDay = dt.getUTCDay();
                  return jsDay === 0 ? 6 : jsDay - 1;
                })()
              );

              let cls = "bg-white/[0.06]";
              if (!configured) cls = "bg-white/[0.03]";
              else if (heat?.late) cls = "bg-amber-500/60";
              else if (heat?.morning || heat?.evening) cls = "bg-green-500/60";
              else cls = "bg-red-500/55";

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`h-7 rounded-md text-[10px] text-white/90 ${cls}`}
                  title={date}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-3">
            Historique check-ins
          </p>
          {!history.length ? (
            <p className="text-[12px] text-white/40">Aucune réponse récente.</p>
          ) : (
            <div className="space-y-2">
              {history.map((row) => {
                const date = String(row.responded_at).split("T")[0];
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={row.id}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left rounded-xl p-3 ${
                      isSelected ? "bg-[#1f8a65]/15" : "bg-white/[0.03]"
                    }`}
                  >
                    <p className="text-[12px] text-white font-semibold">
                      {row.moment === "morning" ? "Matin" : "Soir"} · {date}
                    </p>
                    <p className="text-[11px] text-white/45">
                      {row.is_late ? "Soumis tardivement" : "Soumis à l'heure"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <AnimatePresence>
          {selectedDate && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDate(null)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.section
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-[95vw] bg-[#181818] border-l border-white/[0.08] p-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
                    Drill-down {selectedDate}
                  </p>
                  <button onClick={() => setSelectedDate(null)} className="text-[11px] text-white/60">Fermer</button>
                </div>
                <div className="space-y-3">
                  {(summary?.responses_by_date?.[selectedDate] ?? []).map((row: any) => (
                    <div key={row.id} className="bg-white/[0.03] rounded-xl p-3 space-y-2">
                      <p className="text-[12px] text-white font-semibold">
                        {row.moment === "morning" ? "Matin" : "Soir"}
                      </p>
                      {Object.entries(row.responses ?? {}).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[10px] text-white/45 mb-1">{key}</p>
                          <Slider min={1} max={5} step={1} value={[Number(value)]} disabled />
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="text-[11px] text-white/50 mb-2">Repas loggués</p>
                    {!dateMeals.length ? (
                      <p className="text-[11px] text-white/35">Aucun repas ce jour.</p>
                    ) : (
                      <div className="space-y-2">
                        {dateMeals.map((meal: any) => (
                          <div key={meal.id} className="bg-white/[0.03] rounded-xl p-2.5 flex gap-2.5">
                            {meal.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={meal.photo_url} alt={meal.name} className="w-12 h-12 rounded-md object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-white/[0.05]" />
                            )}
                            <div className="text-[11px] text-white/70">
                              <div>
                                {new Date(meal.logged_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {meal.name}
                              </div>
                              <div className="text-white/45">Qualité {meal.quality_rating ?? "-"}</div>
                              {meal.notes ? <div className="text-white/45 mt-0.5">{meal.notes}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3">
      <p className="text-[10px] text-white/40 uppercase tracking-[0.12em]">{label}</p>
      <p className="text-[16px] text-white font-bold mt-1">{value}</p>
    </div>
  );
}
