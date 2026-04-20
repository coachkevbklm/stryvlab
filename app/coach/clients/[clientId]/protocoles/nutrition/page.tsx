"use client";

import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import Link from "next/link";
import { Utensils, RefreshCw, Droplet, Moon, ArrowRight } from "lucide-react";

const NUTRITION_TOOLS = [
  {
    id: "macros",
    href: "/outils/macros",
    icon: Utensils,
    title: "Kcal & Macros",
    description: "Besoins caloriques & macronutriments avec données client injectées.",
  },
  {
    id: "carb-cycling",
    href: "/outils/carb-cycling",
    icon: RefreshCw,
    title: "Carb Cycling",
    description: "Stratégie glucidique cyclique pour la performance.",
  },
  {
    id: "hydratation",
    href: "/outils/hydratation",
    icon: Droplet,
    title: "Hydratation",
    description: "Besoins hydriques selon activité et taux de sudation.",
  },
  {
    id: "cycle-sync",
    href: "/outils/cycle-sync",
    icon: Moon,
    title: "Cycle Sync",
    description: "Nutrition adaptée aux fluctuations hormonales.",
  },
];

export default function NutritionPage() {
  const { client } = useClient();

  const topBarLeft = useMemo(
    () => (
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">Lab · Protocoles</p>
        <p className="text-[13px] font-semibold text-white leading-none">
          {client.first_name} {client.last_name} — Nutrition
        </p>
      </div>
    ),
    [client.first_name, client.last_name],
  );
  useSetTopBar(topBarLeft);

  return (
    <main className="min-h-screen bg-[#121212]">
      <ClientHeader />
      <div className="px-6 pb-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-4">
          Outils nutrition
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {NUTRITION_TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group flex items-center gap-4 bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 text-white/40 group-hover:text-[#1f8a65] transition-colors">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white">{tool.title}</p>
                  <p className="text-[11px] text-white/40 leading-relaxed mt-0.5">{tool.description}</p>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-[#1f8a65] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
