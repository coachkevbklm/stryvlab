"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Loader2, Moon, Sunrise } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getFieldsForFlow } from "@/lib/client/checkin/fieldRegistry";
import { canonicalizeFields } from "@/lib/client/checkin/legacyFieldMap";

type Moment = { moment: "morning" | "evening"; fields: string[] };

const DAYS = [
  { value: 0, label: "Lun" },
  { value: 1, label: "Mar" },
  { value: 2, label: "Mer" },
  { value: 3, label: "Jeu" },
  { value: 4, label: "Ven" },
  { value: 5, label: "Sam" },
  { value: 6, label: "Dim" },
];

const MORNING_FIELDS = getFieldsForFlow("morning");
const EVENING_FIELDS = getFieldsForFlow("evening");

export default function CheckinConfigWidget({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/checkin-config`)
      .then((res) => res.json())
      .then((data) => {
        setIsActive(Boolean(data?.is_active));
        setDaysOfWeek(data?.days_of_week ?? []);
        // Canonicalize legacy keys on read so the UI always shows canonical fields.
        setMoments(
          ((data?.moments ?? []) as Moment[]).map((m) => ({
            moment: m.moment,
            fields: canonicalizeFields(m.fields ?? []),
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur réseau");
        setLoading(false);
      });
  }, [clientId]);

  async function persist(next: { is_active: boolean; days_of_week: number[]; moments: Moment[] }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/checkin-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function commit(partial: Partial<{ is_active: boolean; days_of_week: number[]; moments: Moment[] }>) {
    const next = {
      is_active: partial.is_active ?? isActive,
      days_of_week: partial.days_of_week ?? daysOfWeek,
      moments: partial.moments ?? moments,
    };
    setIsActive(next.is_active);
    setDaysOfWeek(next.days_of_week);
    setMoments(next.moments);
    void persist(next);
  }

  const hasMoment = (m: "morning" | "evening") => moments.some((x) => x.moment === m);
  const momentFields = (m: "morning" | "evening") => moments.find((x) => x.moment === m)?.fields ?? [];

  function toggleDay(d: number) {
    commit({ days_of_week: daysOfWeek.includes(d) ? daysOfWeek.filter((x) => x !== d) : [...daysOfWeek, d] });
  }

  function toggleMoment(m: "morning" | "evening") {
    if (hasMoment(m)) {
      commit({ moments: moments.filter((x) => x.moment !== m) });
    } else {
      const defaults = (m === "morning" ? MORNING_FIELDS : EVENING_FIELDS).map((f) => f.key);
      commit({ moments: [...moments, { moment: m, fields: defaults }] });
    }
  }

  function toggleField(m: "morning" | "evening", key: string) {
    commit({
      moments: moments.map((x) => {
        if (x.moment !== m) return x;
        const fields = x.fields.includes(key) ? x.fields.filter((f) => f !== key) : [...x.fields, key];
        return { ...x, fields };
      }),
    });
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  const MomentBlock = ({ flow, Icon, title }: { flow: "morning" | "evening"; Icon: typeof Sunrise; title: string }) => {
    const active = hasMoment(flow);
    const fields = flow === "morning" ? MORNING_FIELDS : EVENING_FIELDS;
    const selected = momentFields(flow);
    return (
      <div className="rounded-xl border-[0.3px] border-white/[0.06] bg-[#0a0a0a] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={13} className="text-white/45" />
            <p className="text-[12px] font-semibold text-white">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleMoment(flow)}
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${active ? "bg-[#1f8a65]" : "bg-white/[0.10]"}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${active ? "left-5" : "left-1"}`} />
          </button>
        </div>
        {active && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {fields.map((f) => {
              const on = selected.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleField(flow, f.key)}
                  className={`rounded-lg border-[0.3px] px-2 py-1 text-[10px] transition-colors ${
                    on ? "border-[#1f8a65]/40 bg-[#1f8a65]/[0.08] text-[#1f8a65]" : "border-white/[0.06] text-white/45 hover:text-white/70"
                  }`}
                >
                  {f.label.replace(/^ta |^ton |^tes /, "")}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck size={14} className="text-[#1f8a65]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Check-in quotidien</p>
        </div>
        {saving && <Loader2 size={12} className="animate-spin text-white/40" />}
      </div>

      {error && <p className="text-[11px] text-red-400 mb-3">{error}</p>}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[12px] font-semibold text-white">Activer les check-ins</p>
          <p className="text-[10px] text-white/40 mt-0.5">Routines matin/soir et collecte des métriques configurées.</p>
        </div>
        <button
          type="button"
          onClick={() => commit({ is_active: !isActive })}
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${isActive ? "bg-[#1f8a65]" : "bg-white/[0.10]"}`}
        >
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isActive ? "left-5" : "left-1"}`} />
        </button>
      </div>

      {isActive && (
        <div className="space-y-3 pt-3 border-t border-white/[0.05]">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-1.5">Jours</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const on = daysOfWeek.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`rounded-lg border-[0.3px] px-2.5 py-1 text-[10px] transition-colors ${
                      on ? "border-[#1f8a65]/40 bg-[#1f8a65]/[0.08] text-[#1f8a65]" : "border-white/[0.06] text-white/45 hover:text-white/70"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <MomentBlock flow="morning" Icon={Sunrise} title="Matin" />
          <MomentBlock flow="evening" Icon={Moon} title="Soir" />
        </div>
      )}
    </div>
  );
}
