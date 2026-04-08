import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { BackButton } from "@/components/ui/BackButton";
import type { Metadata } from "next";
import CarbCyclingCalculator from "./CarbCyclingCalculator";

export const metadata: Metadata = {
  title: "Carb Cycling Calculator - Nutrition Cyclique | STRYV lab",
  description:
    "Calculateur de carb cycling scientifique. Protocoles 2/1 à 5/2. PAL METs-based (FAO/WHO 2004), macros Helms 2014. Score validation 95/100.",

  openGraph: {
    title: "Carb Cycling Calculator Pro | STRYV lab",
    description:
      "Optimisez votre nutrition cyclique avec précision scientifique.",
    url: "https://www.stryvlab.com/outils/carb-cycling",
    siteName: "STRYV lab",
    images: [
      {
        url: "/og-carbcycling.png",
        width: 1200,
        height: 630,
        alt: "Carb Cycling Calculator STRYV lab",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Carb Cycling Calculator Pro | STRYV lab",
    description: "Nutrition cyclique de précision.",
    images: ["/og-carbcycling.png"],
  },
};

export default function CarbCyclingPage() {
  useSetTopBar(useMemo(() => <BackButton label="Retour outils" />, []));
  return <CarbCyclingCalculator />;
}
