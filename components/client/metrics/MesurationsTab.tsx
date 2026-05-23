"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import MetricCard from "./MetricCard";
import ClientMeasurementSheet from "@/components/client/ClientMeasurementSheet";
import type { BodyDataResponse } from "@/app/api/client/body-data/route";

interface Props {
  data: BodyDataResponse;
  onRefresh?: () => void;
}

const MEASURE_CONFIG = [
  { key: "waist_cm" as const, label: "Tour de taille", unit: " cm" },
  { key: "hips_cm" as const, label: "Hanches", unit: " cm" },
  { key: "chest_cm" as const, label: "Poitrine", unit: " cm" },
  { key: "neck_cm" as const, label: "Cou", unit: " cm" },
  {
    key: "shoulder_width_cm" as const,
    label: "Largeur des épaules",
    unit: " cm",
  },
  { key: "shoulder_circ_cm" as const, label: "Tour d’épaule", unit: " cm" },
  { key: "arm_left_cm" as const, label: "Bras gauche", unit: " cm" },
  { key: "arm_right_cm" as const, label: "Bras droit", unit: " cm" },
  { key: "thigh_left_cm" as const, label: "Cuisse gauche", unit: " cm" },
  { key: "thigh_right_cm" as const, label: "Cuisse droite", unit: " cm" },
  { key: "calf_left_cm" as const, label: "Mollet gauche", unit: " cm" },
  { key: "calf_right_cm" as const, label: "Mollet droit", unit: " cm" },
  { key: "glutes_cm" as const, label: "Fessiers", unit: " cm" },
  { key: "arm_cm" as const, label: "Bras (moyenne)", unit: " cm" },
];

type MeasureKey = (typeof MEASURE_CONFIG)[number]["key"];

function buildMeasureSeries(
  measuresByBilan: BodyDataResponse["measuresByBilan"],
  key: MeasureKey,
) {
  return measuresByBilan
    .filter((b) => b[key] != null)
    .map((b) => ({
      date: b.date,
      value: b[key] as number,
      bilanIndex: b.bilanIndex,
    }));
}

function measureDelta(
  series: { value: number }[],
): { delta: string; deltaGood: boolean } | undefined {
  if (series.length < 2) return undefined;
  const diff = series[series.length - 1].value - series[0].value;
  const sign = diff > 0 ? "+" : "";
  return { delta: `${sign}${diff.toFixed(1)} cm`, deltaGood: diff <= 0 };
}

export default function MesurationsTab({ data, onRefresh }: Props) {
  const [showSheet, setShowSheet] = useState(false);

  const measures = useMemo(
    () =>
      MEASURE_CONFIG.map((config) => {
        const series = buildMeasureSeries(data.measuresByBilan, config.key);
        const latest = series[series.length - 1];
        const delta = series.length > 0 ? measureDelta(series) : undefined;
        return { config, series, latest, delta };
      }),
    [data.measuresByBilan],
  );

  const hasAnyMeasurements = data.measuresByBilan.some((b) =>
    MEASURE_CONFIG.some(({ key }) => b[key] != null),
  );

  if (!hasAnyMeasurements) {
    return (
      <>
        <p className="text-[12px] text-[#8f8f8f] leading-relaxed py-4 text-center">
          Aucune mensuration enregistrée. Appuyez sur + pour en ajouter.
        </p>

        <button
          onClick={() => setShowSheet(true)}
          className="fixed right-4 z-50 h-12 w-12 flex items-center justify-center rounded-xl bg-[#f2f2f2] text-[#080808] shadow-lg active:scale-95 transition-transform"
          style={{
            bottom: "calc(88px + max(env(safe-area-inset-bottom, 0px), 16px))",
          }}
          aria-label="Ajouter des mensurations"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

        <AnimatePresence>
          {showSheet && (
            <ClientMeasurementSheet
              onClose={() => setShowSheet(false)}
              onSaved={() => {
                setShowSheet(false);
                onRefresh?.();
              }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="space-y-4">
        {measures.map(({ config, series, latest, delta }) => (
          <div key={config.key} className="bg-[#111111] rounded-2xl p-4">
            <MetricCard
              label={config.label}
              value={
                latest ? `${latest.value}${config.unit}` : `—${config.unit}`
              }
              series={series}
              unit={config.unit}
              delta={delta?.delta}
              deltaGood={delta?.deltaGood ?? true}
            />
            {series.length === 0 && (
              <p className="mt-3 text-[12px] text-white/50">
                Aucune donnée historique disponible pour cette mesure.
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowSheet(true)}
        className="fixed right-4 z-50 h-12 w-12 flex items-center justify-center rounded-xl bg-[#f2f2f2] text-[#080808] shadow-lg active:scale-95 transition-transform"
        style={{
          bottom: "calc(88px + max(env(safe-area-inset-bottom, 0px), 16px))",
        }}
        aria-label="Ajouter des mensurations"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {showSheet && (
          <ClientMeasurementSheet
            onClose={() => setShowSheet(false)}
            onSaved={() => {
              setShowSheet(false);
              onRefresh?.();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
