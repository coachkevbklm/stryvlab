'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// UI Components
import { Card } from '@/components/ui/Card';

// Icons
import { 
  Utensils, 
  BarChart3, 
  RefreshCw, 
  HeartPulse, 
  Droplet, 
  Dumbbell, 
  Moon,
  ArrowLeft,
  Search,
  Database,
  XCircle,
  Brain,
  Activity,
  Layers,
  Lock
} from 'lucide-react';

const toolIds = [
  // --- NIVEAU 1 : PHYSIOLOGIE (ACTIFS) ---
  { 
    id: 'macros', 
    href: 'macros', 
    status: 'active',
    icon: Utensils,
    type: 'Nutrition',
    title: 'Kcal & Macros',
    description: 'Besoins caloriques & macronutriments (BMR + NEAT + EAT + TEF).',
    code: 'CALC_01',
    keywords: ['manger', 'diète', 'régime', 'protéines', 'glucides', 'lipides', 'calories', 'poids', 'maigrir', 'muscler']
  },
  { 
    id: 'bodyFat', 
    href: 'body-fat', 
    status: 'active',
    icon: BarChart3, 
    type: 'Composition',
    title: 'Body Fat %',
    description: 'Estimation masse grasse via Navy Method & Jackson-Pollock.',
    code: 'MEAS_01',
    keywords: ['gras', 'fat', 'img', 'masse', 'poids', 'maigrir', 'sèche', 'mensurations', 'ventre']
  },
  { 
    id: 'cycleSync', 
    href: 'cycle-sync', 
    status: 'active',
    icon: Moon, 
    type: 'Protocole Hormonal',
    title: 'Cycle Sync',
    description: 'Nutrition et training adaptés aux fluctuations hormonales.',
    code: 'HORM_01',
    keywords: ['femme', 'règles', 'menstruel', 'pms', 'hormones', 'cycle', 'period', 'fille', 'ovulation']
  },
  { 
    id: 'carbCycling', 
    href: 'carb-cycling', 
    status: 'active',
    icon: RefreshCw, 
    type: 'Glycogène',
    title: 'Carb Cycling',
    description: 'Stratégie glucidique cyclique pour la performance.',
    code: 'DIET_02',
    keywords: ['sucre', 'glucides', 'rebond', 'refeed', 'sèche', 'pdm', 'insuline', 'énergie', 'fatigue']
  },
  { 
    id: 'hydratation', 
    href: 'hydratation', 
    status: 'active',
    icon: Droplet, 
    type: 'Santé',
    title: 'Hydratation',
    description: 'Besoins hydriques selon climat, activité et taux de sudation.',
    code: 'HYDR_01',
    keywords: ['eau', 'boire', 'soif', 'h2o', 'water', 'litres', 'bouteille', 'sueur', 'chaleur']
  },
  { 
    id: 'hrZones', 
    href: 'hr-zones', 
    status: 'active',
    icon: HeartPulse, 
    type: 'Cardio',
    title: 'HR Zones',
    description: 'Zones cardiaques cibles via méthode Karvonen (FC réserve).',
    code: 'CARD_01',
    keywords: ['coeur', 'bpm', 'frequence', 'courir', 'endurance', 'vma', 'seuil', 'pulsation', 'jogging']
  },
  { 
    id: 'oneRM', 
    href: '1rm', 
    status: 'active',
    icon: Dumbbell, 
    type: 'Force',
    title: '1RM Calculator',
    description: 'Charge maximale théorique & zones de force (Brzycki, Epley).',
    code: 'STR_01',
    keywords: ['muscu', 'force', 'max', 'poids', 'haltère', 'barre', 'bench', 'squat', 'deadlift', 'rep']
  }, 

  // --- NIVEAU 2 : SYSTÉMIQUE (EN DÉVELOPPEMENT) ---
  { 
    id: 'neuroProfile', 
    href: 'neuro-profile', 
    status: 'dev',
    icon: Brain, 
    type: 'Neurologie',
    title: 'Neuro Profiler',
    description: 'Test de dominance neurochimique (Braverman) pour adapter la programmation.',
    code: 'NEURO_01',
    keywords: ['cerveau', 'mental', 'dopamine', 'sérotonine', 'test', 'psychologie']
  },
  { 
    id: 'stressLoad', 
    href: 'stress-load', 
    status: 'dev',
    icon: Activity, 
    type: 'Systémique',
    title: 'Charge Allostatique',
    description: 'Évaluation du risque de burnout métabolique et saturation HPA.',
    code: 'SYS_01',
    keywords: ['stress', 'cortisol', 'fatigue', 'sommeil', 'récupération']
  },
  { 
    id: 'mrv', 
    href: 'mrv-calculator', 
    status: 'dev',
    icon: Layers, 
    type: 'Programmation',
    title: 'MRV Estimator',
    description: 'Maximum Recoverable Volume. La limite théorique de sets par semaine.',
    code: 'VOL_01',
    keywords: ['volume', 'sets', 'séries', 'hypertrophie', 'récupération']
  },
] as const;

export default function ToolsGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const backHref = from === 'dashboard' ? '/dashboard' : '/';
  const backLabel = from === 'dashboard' ? 'Retour au Dashboard' : 'Retour au Lab';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = toolIds.filter((tool) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.type.toLowerCase().includes(query) ||
      tool.code.toLowerCase().includes(query) ||
      tool.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  return (
   <main className="min-h-screen bg-background text-primary pb-24">
      
      {/* HEADER */}
      <header className="w-full py-8 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Link
          href={backHref}
          className="group flex items-center gap-3 text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-surface shadow-soft-out flex items-center justify-center group-hover:shadow-soft-in transition-all duration-300">
            <ArrowLeft size={16} />
          </div>
          <span className="hidden md:inline-block opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            {backLabel}
          </span>
        </Link>
      </header>

      {/* HERO */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mt-8 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
            <h1 className="mb-6 leading-tight">
                  <span className="inline-block bg-accent text-white px-4 py-1 text-4xl md:text-6xl font-medium tracking-tight shadow-sm transform -rotate-0 origin-bottom-left">
                    Lab_Open Source
                  </span>
                </h1>
                <p className="text-secondary max-w-xl text-lg leading-relaxed">
                Accès direct aux modèles mathématiques utilisés par STRYV lab.
                Ces outils permettent d’analyser des métriques spécifiques, indépendamment ou dans un ordre logique.
                Ils ne remplacent pas une analyse systémique complète et ne produisent aucun protocole.
                </p>
            </div>
            
            <div className="w-full max-w-sm">
                <div className="relative flex items-center group">
                    <Search className="absolute left-4 text-secondary group-focus-within:text-accent transition-colors" size={18} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher (ex: Eau, Force, Diète...)"
                        className="w-full pl-11 pr-4 py-3 bg-surface rounded-btn shadow-soft-in text-sm text-primary placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 text-muted hover:text-primary transition-colors"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* GRID */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-32">
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/60">
            <div className="flex items-center gap-4">
                <Database size={20} className="text-accent"/>
                <span className="text-xs font-bold tracking-widest uppercase text-primary">
                    Base de données Active ({filteredTools.length})
                </span>
            </div>
        </div>

        {filteredTools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool, index) => {
                const isDev = tool.status === 'dev';

                // CONSTRUCTION DU CONTENU DE LA CARTE (DRY - Don't Repeat Yourself)
                const CardContent = (
                    <Card 
                        variant="widget"
                        className={`
                            group h-full flex flex-col justify-between transition-all duration-300
                            ${isDev 
                                ? 'opacity-60 grayscale bg-gray-50/50 border-dashed border-gray-300 cursor-not-allowed' 
                                : 'cursor-pointer hover:-translate-y-1'
                            }
                        `}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                    ${isDev 
                                        ? 'bg-gray-200 text-gray-400' 
                                        : 'bg-surface shadow-soft-out text-primary group-hover:text-accent group-hover:scale-110'
                                    }
                                `}>
                                    <tool.icon size={22} strokeWidth={1.5} />
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-mono text-muted group-hover:text-accent transition-colors">
                                        {tool.code || `TOOL_0${index + 1}`}
                                    </span>
                                    {isDev ? (
                                        <span className="mt-1 px-2 py-0.5 bg-gray-200 rounded text-[9px] font-bold tracking-widest text-muted uppercase">
                                            Locked
                                        </span>
                                    ) : (
                                        <span className="mt-1 px-2 py-0.5 bg-surface-light rounded text-[9px] text-secondary font-medium border border-transparent group-hover:border-accent/20 transition-colors">
                                            {tool.type}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className={`text-xl font-bold mb-3 ${isDev ? 'text-gray-400' : 'text-primary group-hover:text-accent'} transition-colors`}>
                                {tool.title}
                            </h3>
                            
                            <p className="text-sm text-secondary leading-relaxed font-normal">
                                {tool.description}
                            </p>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${isDev ? 'text-gray-400' : 'text-muted group-hover:text-primary'}`}>
                                {isDev ? 'Module en dev' : 'Initialiser'}
                            </span>
                            
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                                ${isDev 
                                    ? 'bg-gray-100 text-gray-400' 
                                    : 'bg-surface-light text-muted group-hover:bg-accent group-hover:text-white shadow-sm'
                                }
                            `}>
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
                    <Link key={tool.id} href={`/outils/${tool.href}`} className="block h-full">
                        {CardContent}
                    </Link>
                );
            })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <Search size={48} className="text-muted mb-4" strokeWidth={1} />
                <p className="text-lg font-medium text-secondary">Aucun outil trouvé pour "{searchQuery}"</p>
                <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-accent hover:underline underline-offset-4"
                >
                    Réinitialiser les filtres
                </button>
            </div>
        )}
      </section>

      <footer className="relative z-10 py-12 px-6 border-t border-gray-200 text-center">
        <p className="text-[11px] tracking-wide text-gray-400 uppercase font-medium">
            © {new Date().getFullYear()} STRYV lab.
        </p>
      </footer>
    </main>
  );
}