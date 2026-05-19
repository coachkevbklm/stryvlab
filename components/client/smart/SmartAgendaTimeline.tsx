"use client";

import Link from "next/link";
import type { TimelineEntry } from "@/lib/client/smart/timelineBuilder";
import {
  ForkKnife,
  Drop,
  Barbell,
  PersonSimpleRun,
  Moon,
} from "@phosphor-icons/react";

const KIND_CONFIG: Record<
  TimelineEntry["kind"],
  { Icon: React.ElementType; bg: string; tint: string }
> = {
  meal: { Icon: ForkKnife, bg: "bg-[#22c55e]/15", tint: "text-[#22c55e]" },
  water: { Icon: Drop, bg: "bg-[#06b6d4]/15", tint: "text-[#06b6d4]" },
  workout: { Icon: Barbell, bg: "bg-[#ffe01e]/15", tint: "text-[#ffe01e]" },
  activity: {
    Icon: PersonSimpleRun,
    bg: "bg-white/[0.08]",
    tint: "text-white/80",
  },
  checkin: { Icon: Moon, bg: "bg-[#8b5cf6]/15", tint: "text-[#8b5cf6]" },
};

function timeOf(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function SmartAgendaTimeline({
  entries,
}: {
  entries: TimelineEntry[];
}) {
  return (
    <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-[18px]">
      <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-3">
        Smart Agenda
      </div>

      {entries.length === 0 ? (
        <p className="text-[12px] text-white/40 py-4 text-center">
          Aucune activité enregistrée aujourd'hui.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e) => {
            const cfg = KIND_CONFIG[e.kind] ?? {
              Icon: ForkKnife,
              bg: "bg-white/[0.08]",
              tint: "text-white/80",
            };
            const highlight =
              e.kind === "workout"
                ? "bg-[#ffe01e]/[0.06] border border-[#ffe01e]/20"
                : "bg-white/[0.02]";

            const Body = (
              <div
                className={`flex items-center gap-3 p-2.5 rounded-xl ${highlight}`}
              >
                <div className="w-[44px] text-[10px] text-white/40 font-bold tabular-nums shrink-0">
                  {timeOf(e.start_iso)}
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
                >
                  <cfg.Icon size={14} className={cfg.tint} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white truncate">
                    {e.title}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {e.subtitle}
                  </div>
                </div>
              </div>
            );

            return e.href ? (
              <Link
                key={e.id}
                href={e.href}
                className="active:scale-[0.99] transition-transform"
              >
                {Body}
              </Link>
            ) : (
              <div key={e.id}>{Body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
