import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { BackButton } from "@/components/ui/BackButton";
import type { Metadata } from "next";
import HydrationCalculator from "./HydratationCalculator";

export const metadata: Metadata = {
  title: "Hydration Calculator - Besoins Hydriques | STRYV lab",
  description:
    "Calculateur d'hydratation scientifique. Base EFSA 2010 (35ml/kg). Ajustements ACSM 2007 activité/climat. Prévention déshydratation et optimisation performance.",

  openGraph: {
    title: "Hydration Calculator Pro | STRYV lab",
    description: "Combien d'eau boire vraiment ? Calculez vos besoins précis.",
    url: "https://www.stryvlab.com/outils/hydratation",
    siteName: "STRYV lab",
    images: [
      {
        url: "/og-hydratation.png",
        width: 1200,
        height: 630,
        alt: "Hydration Calculator STRYV lab",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Hydration Calculator Pro | STRYV lab",
    description: "Optimisez votre hydratation pour la performance.",
    images: ["/og-hydratation.png"],
  },
};

export default function HydrationPage() {
  useSetTopBar(useMemo(() => <BackButton label="Retour outils" />, []));
  return <HydrationCalculator />;
}
