"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";

interface MissingAlert {
  field: string;
  category: "biometric" | "training" | "lifestyle";
  severity: "warning" | "critical";
  label: string;
}

interface MissingDataAlertsProps {
  alerts: MissingAlert[];
  onEdit: (field: string) => void;
  onCalculate?: (field: string) => void;
}

export function MissingDataAlerts({
  alerts,
  onEdit,
  onCalculate,
}: MissingDataAlertsProps) {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");
  const visibleAlerts = [...criticalAlerts, ...warningAlerts].slice(0, 3);

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-2 px-3 py-2">
        <AlertTriangle size={16} className="text-amber-400" />
        <p className="text-[11px] font-bold text-amber-400">
          DONNÉES MANQUANTES ({alerts.length})
        </p>
      </div>

      <div className="bg-amber-500/[0.08] rounded-lg border-[0.3px] border-amber-500/20 overflow-hidden">
        {visibleAlerts.map((alert, idx) => (
          <div
            key={`${alert.field}-${idx}`}
            className={`px-3 py-2.5 flex items-start justify-between gap-3 ${
              idx < visibleAlerts.length - 1
                ? "border-b-[0.3px] border-amber-500/10"
                : ""
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1">
              <div className="mt-0.5">
                {alert.severity === "critical" ? (
                  <AlertCircle size={14} className="text-red-400" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/80">
                  {alert.label}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 shrink-0">
              {onCalculate && alert.field === "bmr" && (
                <button
                  onClick={() => onCalculate("bmr")}
                  className="px-2 py-1 text-[10px] font-bold text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-md transition-colors"
                >
                  Calculer
                </button>
              )}
              <button
                onClick={() => onEdit(alert.field)}
                className="px-2 py-1 text-[10px] font-bold text-[#1f8a65] hover:text-[#217356] bg-[#1f8a65]/[0.08] hover:bg-[#1f8a65]/[0.12] rounded-md transition-colors"
              >
                Saisir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
