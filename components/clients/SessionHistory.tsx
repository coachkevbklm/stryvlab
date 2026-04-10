"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  clientId: string;
}

export default function SessionHistory({ clientId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/session-logs?client_id=${clientId}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#181818] rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-[#181818] border-subtle rounded-xl p-10 text-center">
        <Dumbbell size={36} className="text-white/45 mx-auto mb-3 opacity-30" />
        <p className="text-sm text-white/45">Aucune séance enregistrée.</p>
        <p className="text-xs text-white/45/60 mt-1">
          Les séances réalisées par le client apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {logs.map((log) => {
        const sets: any[] = log.client_set_logs ?? [];
        const completedSets = sets.filter((s) => s.completed).length;
        const isOpen = expanded === log.id;
        const date = new Date(log.logged_at).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        // Group sets by exercise
        const byExercise: Record<string, any[]> = {};
        for (const s of sets) {
          if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
          byExercise[s.exercise_name].push(s);
        }

        return (
          <div
            key={log.id}
            className="bg-[#181818] border-subtle rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : log.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                  <Dumbbell size={16} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {log.session_name}
                  </p>
                  <p className="text-xs text-white/45 capitalize">{date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-white">
                    {completedSets}/{sets.length} sets
                  </p>
                  {log.duration_min && (
                    <p className="text-[10px] text-white/45 flex items-center gap-1 justify-end">
                      <Clock size={9} />
                      {log.duration_min} min
                    </p>
                  )}
                </div>
                {log.completed_at ? (
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                ) : (
                  <Clock size={16} className="text-amber-500 shrink-0" />
                )}
                {isOpen ? (
                  <ChevronUp size={14} className="text-white/45" />
                ) : (
                  <ChevronDown size={14} className="text-white/45" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-white/40 p-4 flex flex-col gap-4">
                {Object.entries(byExercise).map(([exName, exSets]) => {
                  const maxWeight = Math.max(
                    ...exSets
                      .filter((s) => s.actual_weight_kg)
                      .map((s) => s.actual_weight_kg),
                  );
                  return (
                    <div key={exName}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">
                          {exName}
                        </p>
                        {maxWeight > 0 && (
                          <span className="text-[10px] text-accent font-bold font-mono">
                            {maxWeight} kg max
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {exSets
                          .sort((a, b) => a.set_number - b.set_number)
                          .map((s) => (
                            <div
                              key={s.id}
                              className={`flex items-center gap-3 py-1.5 px-3 rounded-lg text-xs ${s.completed ? "bg-green-50/40" : "bg-white/[0.04]/60"}`}
                            >
                              <span className="font-mono text-white/45 w-4">
                                {s.set_number}
                              </span>
                              <span
                                className={`font-mono font-bold ${s.completed ? "text-white" : "text-white/45 line-through"}`}
                              >
                                {s.actual_reps ?? "—"} reps
                              </span>
                              {s.actual_weight_kg && (
                                <span className="font-mono text-white/45">
                                  × {s.actual_weight_kg} kg
                                </span>
                              )}
                              {s.rpe && (
                                <span className="ml-auto text-[10px] text-white/45">
                                  RPE {s.rpe}
                                </span>
                              )}
                              {s.completed && (
                                <CheckCircle2
                                  size={12}
                                  className="text-green-500 ml-auto"
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
                {log.notes && (
                  <p className="text-xs text-white/45 italic border-t border-white/30 pt-3">
                    {log.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
