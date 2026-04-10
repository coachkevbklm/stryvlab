"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// UI Components
import { Card } from "@/components/ui/Card";

// Layout
import { useSetTopBar } from "@/components/layout/useSetTopBar";

// Icons
import {
  Utensils,
  BarChart3,
  RefreshCw,
  HeartPulse,
  Droplet,
  Dumbbell,
  Moon,
  Search,
  Database,
  XCircle,
  Brain,
  Activity,
  Layers,
  Lock,
  ArrowLeft,
} from "lucide-react";

const toolIds = [
  // --- NIVEAU 1 : PHYSIOLOGIE (ACTIFS) ---
  {
    id: "macros",
    href: "macros",
    status: "active",
    icon: Utensils,
    type: "Nutrition",
    title: "Kcal & Macros",
    description:
      "Besoins caloriques & macronutriments (BMR + NEAT + EAT + TEF).",
    code: "CALC_01",
    keywords: [
      "manger",
      "diète",
      "régime",
      "protéines",
      "glucides",
      "lipides",
      "calories",
      "poids",
      "maigrir",
      "muscler",
    ],
  },
  {
    id: "bodyFat",
    href: "body-fat",
    status: "active",
    icon: BarChart3,
    type: "Composition",
    title: "Body Fat %",
    description: "Estimation masse grasse via Navy Method & Jackson-Pollock.",
    code: "MEAS_01",
    keywords: [
      "gras",
      "fat",
      "img",
      "masse",
      "poids",
      "maigrir",
      "sèche",
      "mensurations",
      "ventre",
    ],
  },
  {
    id: "cycleSync",
    href: "cycle-sync",
    status: "active",
    icon: Moon,
    type: "Protocole Hormonal",
    title: "Cycle Sync",
    description: "Nutrition et training adaptés aux fluctuations hormonales.",
    code: "HORM_01",
    keywords: [
      "femme",
      "règles",
      "menstruel",
      "pms",
      "hormones",
      "cycle",
      "period",
      "fille",
      "ovulation",
    ],
  },
  {
    id: "carbCycling",
    href: "carb-cycling",
    status: "active",
    icon: RefreshCw,
    type: "Glycogène",
    title: "Carb Cycling",
    description: "Stratégie glucidique cyclique pour la performance.",
    code: "DIET_02",
    keywords: [
      "sucre",
      "glucides",
      "rebond",
      "refeed",
      "sèche",
      "pdm",
      "insuline",
      "énergie",
      "fatigue",
    ],
  },
  {
    id: "hydratation",
    href: "hydratation",
    status: "active",
    icon: Droplet,
    type: "Santé",
    title: "Hydratation",
    description:
      "Besoins hydriques selon climat, activité et taux de sudation.",
    code: "HYDR_01",
    keywords: [
      "eau",
      "boire",
      "soif",
      "h2o",
      "water",
      "litres",
      "bouteille",
      "sueur",
      "chaleur",
    ],
  },
  {
    id: "hrZones",
    href: "hr-zones",
    status: "active",
    icon: HeartPulse,
    type: "Cardio",
    title: "HR Zones",
    description: "Zones cardiaques cibles via méthode Karvonen (FC réserve).",
    code: "CARD_01",
    keywords: [
      "coeur",
      "bpm",
      "frequence",
      "courir",
      "endurance",
      "vma",
      "seuil",
      "pulsation",
      "jogging",
    ],
  },
  {
    id: "oneRM",
    href: "1rm",
    status: "active",
    icon: Dumbbell,
    type: "Force",
    title: "1RM Calculator",
    description: "Charge maximale théorique & zones de force (Brzycki, Epley).",
    code: "STR_01",
    keywords: [
      "muscu",
      "force",
      "max",
      "poids",
      "haltère",
      "barre",
      "bench",
      "squat",
      "deadlift",
      "rep",
    ],
  },

  // --- NIVEAU 2 : SYSTÉMIQUE (EN DÉVELOPPEMENT) ---
  {
    id: "neuroProfile",
    href: "neuro-profile",
    status: "dev",
    icon: Brain,
    type: "Neurologie",
    title: "Neuro Profiler",
    description:
      "Test de dominance neurochimique (Braverman) pour adapter la programmation.",
    code: "NEURO_01",
    keywords: [
      "cerveau",
      "mental",
      "dopamine",
      "sérotonine",
      "test",
      "psychologie",
    ],
  },
  {
    id: "stressLoad",
    href: "stress-load",
    status: "dev",
    icon: Activity,
    type: "Systémique",
    title: "Charge Allostatique",
    description:
      "Évaluation du risque de burnout métabolique et saturation HPA.",
    code: "SYS_01",
    keywords: ["stress", "cortisol", "fatigue", "sommeil", "récupération"],
  },
  {
    id: "mrv",
    href: "mrv-calculator",
    status: "dev",
    icon: Layers,
    type: "Programmation",
    title: "MRV Estimator",
    description:
      "Maximum Recoverable Volume. La limite théorique de sets par semaine.",
    code: "VOL_01",
    keywords: ["volume", "sets", "séries", "hypertrophie", "récupération"],
  },
] as const;

export default function ToolsGrid() {
  const [searchQuery, setSearchQuery] = useState("");

  // Top bar : label + titre à gauche, barre de recherche à droite
  useSetTopBar(
    <p className="text-[13px] font-semibold text-white leading-none">
      Calculatrices Coach
    </p>,
    <div className="w-full max-w-sm">
      <div className="relative flex items-center group">
        <Search
          className="absolute left-4 text-white/40 group-focus-within:text-[#1f8a65] transition-colors"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher (ex: Eau, Force, Diète...)"
          className="w-full pl-9 pr-4 h-10 bg-[#0a0a0a] border-input rounded-xl text-[14px] font-medium text-white placeholder:text-white/25 outline-none focus:ring-0 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 text-white/40 hover:text-white transition-colors"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    </div>,
  );

  const filteredTools = toolIds.filter((tool) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.type.toLowerCase().includes(query) ||
      tool.code.toLowerCase().includes(query) ||
      tool.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  return (
    <main className="min-h-screen bg-[#121212] font-sans">
      <div>
        {/* ESPACE TOPBAR */}
        <section className="mt-8 mb-16" />

        {/* GRID */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-32">
          {/* En-tête supprimé pour un espace plus épuré */}

          {filteredTools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool, index) => {
                const isDev = tool.status === "dev";

                // CONSTRUCTION DU CONTENU DE LA CARTE (DRY - Don't Repeat Yourself)
                const CardContent = (
                  <Card
                    className={`
                            ring-0 group h-full flex flex-col justify-between transition-colors duration-150 bg-white/[0.02] hover:bg-white/[0.03] p-5 rounded-xl
                            ${
                              isDev
                                ? "opacity-40 cursor-not-allowed"
                                : "cursor-pointer"
                            }
                        `}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div
                          className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center
                                    ${
                                      isDev
                                        ? "bg-white/[0.04] text-white/30"
                                        : "bg-[#0a0a0a] text-white group-hover:text-[#1f8a65]"
                                    }
                                `}
                        >
                          <tool.icon size={22} strokeWidth={1.5} />
                        </div>

                        <div className="flex flex-col items-end">
                          <span
                            className={`text-[9px] font-mono ${isDev ? "text-white/25" : "text-white/40 group-hover:text-[#1f8a65]"} transition-colors duration-150`}
                          >
                            {tool.code || `TOOL_0${index + 1}`}
                          </span>
                          {isDev ? (
                            <span className="mt-1 px-2 py-0.5 bg-white/[0.04] rounded-full text-[8px] font-bold tracking-widest text-white/30 uppercase">
                              Locked
                            </span>
                          ) : (
                            <span className="mt-1 px-2 py-0.5 bg-white/[0.02] rounded-full text-[9px] text-white/60 font-medium transition-colors">
                              {tool.type}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3
                        className={`text-lg font-semibold mb-3 ${isDev ? "text-white/30" : "text-white group-hover:text-[#1f8a65]"} transition-colors duration-150`}
                      >
                        {tool.title}
                      </h3>

                      <p
                        className={`text-sm ${isDev ? "text-white/25" : "text-white/60"} leading-relaxed font-normal`}
                      >
                        {tool.description}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-150 ${isDev ? "text-white/25" : "text-white/40 group-hover:text-white"}`}
                      >
                        {isDev ? "Module en dev" : "Initialiser"}
                      </span>

                      <div
                        className={`
                                w-6 h-6 rounded-full flex items-center justify-center
                                ${
                                  isDev
                                    ? "bg-white/[0.04] text-white/25"
                                    : "bg-white/[0.02] text-white/40 group-hover:bg-[#1f8a65] group-hover:text-white"
                                }
                            `}
                      >
                        {isDev ? (
                          <Lock size={12} />
                        ) : (
                          <ArrowLeft size={12} className="rotate-180" />
                        )}
                      </div>
                    </div>
                  </Card>
                );

                // RENDU CONDITIONNEL STRICT (TypeScript Safe)
                if (isDev) {
                  return (
                    <div key={tool.id} className="block h-full">
                      {CardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={tool.id}
                    href={`/outils/${tool.href}`}
                    className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8a65]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
                  >
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <Search
                size={48}
                className="text-white/40 mb-4"
                strokeWidth={1}
              />
              <p className="text-lg font-medium text-white/60">
                Aucun outil trouvé pour "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-[#1f8a65] hover:underline underline-offset-4"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </section>

        <footer className="py-12 px-6 text-center">
          <p className="text-[11px] tracking-wide text-white/40 uppercase font-medium">
            © {new Date().getFullYear()} STRYV lab.
          </p>
        </footer>
      </div>
    </main>
  );
}
