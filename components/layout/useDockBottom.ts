"use client";

import { usePathname } from "next/navigation";
import {
  BarChart2,
  ClipboardList,
  TrendingUp,
  Scan,
  Utensils,
  Dumbbell,
  HeartPulse,
  BarChart3,
  CreditCard,
  Euro,
  Activity,
  ClipboardCheck,
  Salad,
  UserCircle,
  Bell,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DockBottomItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export function useDockBottom(): DockBottomItem[] {
  const pathname = usePathname();

  // Lab — Data & Analyse
  if (pathname.includes("/lab/") && pathname.includes("/data")) {
    return [
      { id: "metriques", label: "Métriques", href: "", icon: BarChart2 },
      { id: "bilans", label: "Bilans", href: "", icon: ClipboardList },
      { id: "performances", label: "Performances", href: "", icon: TrendingUp },
      { id: "morphopro", label: "MorphoPro", href: "", icon: Scan },
    ];
  }

  // Lab — Protocoles
  if (pathname.includes("/lab/") && pathname.includes("/protocoles")) {
    return [
      { id: "nutrition", label: "Nutrition", href: "", icon: Utensils },
      { id: "entrainement", label: "Entraînement", href: "", icon: Dumbbell },
      { id: "cardio", label: "Cardio", href: "", icon: HeartPulse },
      { id: "composition", label: "Composition", href: "", icon: BarChart3 },
    ];
  }

  // Business
  if (
    pathname.startsWith("/coach/comptabilite") ||
    pathname.startsWith("/coach/formules") ||
    pathname.startsWith("/coach/organisation")
  ) {
    return [
      { id: "comptabilite", label: "Comptabilité", href: "/coach/comptabilite", icon: Euro },
      { id: "formules", label: "Formules", href: "/coach/formules", icon: CreditCard },
      { id: "organisation", label: "Organisation", href: "/coach/organisation", icon: Activity },
    ];
  }

  // Templates
  if (pathname.startsWith("/coach/programs") || pathname.startsWith("/coach/assessments")) {
    return [
      { id: "programmes", label: "Programmes", href: "/coach/programs/templates", icon: Dumbbell },
      { id: "bilans", label: "Bilans", href: "/coach/assessments", icon: ClipboardCheck },
      { id: "nutrition", label: "Nutrition", href: "#", icon: Salad },
    ];
  }

  // Mon compte
  if (pathname.startsWith("/coach/settings")) {
    return [
      { id: "profil", label: "Profil", href: "/coach/settings", icon: UserCircle },
      { id: "preferences", label: "Préférences", href: "/coach/settings#preferences", icon: Settings },
      { id: "notifications", label: "Notifications", href: "/coach/settings#notifications", icon: Bell },
    ];
  }

  // Dashboard et autres — pas de dock bas
  return [];
}
