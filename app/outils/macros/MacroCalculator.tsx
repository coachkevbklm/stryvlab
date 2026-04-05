'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Utensils, 
  ArrowLeft, 
  Copy, 
  Check, 
  User,
  Activity,
  Target,
  ChevronDown,
  Dumbbell,
  AlertTriangle,
  Scale
} from 'lucide-react';

// UI Components
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import GenesisAssistant from '@/components/GenesisAssistant';

// Formulas & Store
import { calculateMacros as calcMacros, type MacroGoal, type MacroGender, type MacroResult } from '@/lib/formulas';
import { useClientStore } from '@/lib/stores/useClientStore';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

// Activity level → daily steps mapping for NEAT
const ACTIVITY_STEPS: Record<ActivityLevel, number> = {
  sedentary: 2000, light: 4000, moderate: 6500, active: 10000, veryActive: 14000,
};

const GOAL_LABELS: Record<MacroGoal, string> = {
  deficit: 'Perte de Gras (Déficit Stratifié)',
  maintenance: 'Maintenance (Homéostasie)',
  surplus: 'Prise de Muscle (Lean Bulk)',
};

export default function MacroCalculator() {
  const setProfile = useClientStore((s) => s.setProfile);

  const [gender, setGender] = useState<MacroGender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [workouts, setWorkouts] = useState('3');
  const [goal, setGoal] = useState<MacroGoal>('deficit');

  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<(MacroResult & { goalLabel: string; bmr: number }) | null>(null);

  const calculateMacros = () => {
    setCopied(false);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    const wo = parseInt(workouts) || 3;
    if (!w || !h || !a) return;

    const res = calcMacros({
      weight: w, height: h, age: a, gender, goal,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      steps: ACTIVITY_STEPS[activityLevel],
      workouts: wo,
    });

    setResult({ ...res, goalLabel: GOAL_LABELS[goal], bmr: res.breakdown.bmr });
    setProfile({ weight: w, height: h, age: a, gender, bodyFat: res.estimatedBF, workouts: wo, macroGoal: goal });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCopy = () => {
    if (!result) return;
    const url = 'https://www.stryvlab.com/outils/macros';
    const text = `Bilan Nutritionnel - STRYV lab\n\n• Objectif : ${result.goalLabel}\n• Cible : ${result.calories} kcal/jour\n• TDEE : ${result.tdee} kcal\n\nMacros Optimisées :\n• Protéines : ${result.macros.p}g (${result.ratios.p}g/kg LBM)\n• Lipides : ${result.macros.f}g (${result.ratios.f}g/kg)\n• Glucides : ${result.macros.c}g (${result.ratios.c}g/kg)\n\nComposition :\n• Masse Maigre : ${result.leanMass} kg\n• Body Fat : ${result.estimatedBF}%\n\n${url}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activityLevels = [
    { id: 'sedentary', label: 'Sédentaire', desc: '<3k pas/j' },
    { id: 'light', label: 'Léger', desc: '3-5k pas/j' },
    { id: 'moderate', label: 'Modéré', desc: '5-8k pas/j' },
    { id: 'active', label: 'Actif', desc: '8-12k pas/j' },
    { id: 'veryActive', label: 'Très Actif', desc: '>12k pas/j' }
  ];

  const goals = [
    { id: 'deficit', label: 'Perte de Gras', desc: 'Déficit -20-25%' },
    { id: 'maintenance', label: 'Maintenance', desc: 'Homéostasie' },
    { id: 'surplus', label: 'Prise de Muscle', desc: 'Surplus +10%' }
  ];

  const faqItems = [
    {
      title: "Pourquoi Mifflin-St Jeor plutôt que Harris-Benedict ?",
      content: "Mifflin-St Jeor (1990) est le gold standard actuel pour calculer le métabolisme basal (BMR). Validé sur populations modernes (>500 sujets) vs Harris-Benedict (1919) calibré sur <200 individus début XXe siècle. Précision Mifflin : ±10% chez 82% de la population."
    },
    {
      title: "Pourquoi les protéines sont calculées sur la masse maigre (LBM) ?",
      content: "Le tissu adipeux est métaboliquement inactif. Seuls les muscles, os, organes (= LBM) nécessitent des acides aminés. Calculer sur le poids total surestime les besoins si BF% élevé. Helms et al. (2014) recommandent 1.8-2.6g/kg LBM en déficit pour préserver la masse musculaire."
    },
    {
      title: "Quel est le ratio lipides/glucides optimal ?",
      content: "Les lipides sont essentiels pour la santé hormonale (testostérone, œstrogènes). Minimum absolu recherche : 0.6-0.8g/kg poids. Notre calculateur impose un plancher 0.8g/kg en déficit et 1.0g/kg en surplus. Le reste des calories est alloué aux glucides pour la performance et la récupération."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary font-outfit">
      
      <div className="flex-grow w-full px-6 md:px-12 pb-20">
        
        <header className="max-w-5xl mx-auto py-8">
            <Link href="/outils" className="group inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors mb-8">
              <div className="w-8 h-8 rounded-full bg-surface shadow-soft-out flex items-center justify-center group-hover:shadow-soft-in transition-all">
                  <ArrowLeft size={14} />
              </div>
              <span>Retour au Hub</span>
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-2 block">Nutrition Analysis</span>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Macro Calculator</h1>
                </div>
                <div className="hidden md:block">
                    <span className="px-3 py-1 bg-surface-light border border-white/50 rounded-lg text-[10px] font-mono text-secondary">CODE: NUTR_02</span>
                </div>
            </div>
        </header>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-8">
            
            {/* --- COLONNE GAUCHE (INPUTS) --- */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-surface-light rounded-lg text-accent"><Utensils size={20} /></div>
                        <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Configuration</h2>
                    </div>

                    {/* 1. SEXE */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <User size={10} /> Sexe
                        </label>
                        <div className="grid grid-cols-2 p-1 bg-surface-light/50 border border-gray-100 rounded-xl">
                            {(['male', 'female'] as Gender[]).map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => setGender(g)}
                                    className={`py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${gender === g ? 'bg-white text-accent shadow-sm ring-1 ring-black/5' : 'text-secondary hover:text-primary'}`}
                                >
                                    {g === 'male' ? 'Homme' : 'Femme'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. BIOMÉTRIE */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-secondary ml-1">POIDS (kg)</label>
                                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="75" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-secondary ml-1">TAILLE (cm)</label>
                                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="180" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-secondary ml-1">ÂGE</label>
                            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="30" />
                        </div>
                    </div>

                    {/* 3. BODY FAT */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <Scale size={10} /> Body Fat % <span className="text-[9px] font-normal text-gray-400">(optionnel)</span>
                        </label>
                        <input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder={gender === 'male' ? '15' : '22'} />
                    </div>

                    {/* 4. ACTIVITÉ */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <Activity size={10} /> Activité Quotidienne (NEAT)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                            {activityLevels.map(level => (
                                <button 
                                    key={level.id} 
                                    onClick={() => setActivityLevel(level.id as ActivityLevel)}
                                    className={`p-3 rounded-xl border text-left transition-all ${activityLevel === level.id ? 'border-accent/30 bg-accent/5 text-primary' : 'border-gray-100 bg-surface-light text-secondary hover:border-gray-200'}`}
                                >
                                    <div className="text-[11px] font-bold">{level.label}</div>
                                    <div className="text-[9px] text-gray-400">{level.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. WORKOUTS */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <Dumbbell size={10} /> Séances / Semaine (EAT)
                        </label>
                        <input type="number" value={workouts} onChange={(e) => setWorkouts(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="3" />
                    </div>

                    {/* 6. OBJECTIF */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <Target size={10} /> Objectif
                        </label>
                        <div className="space-y-2">
                            {goals.map(g => (
                                <button 
                                    key={g.id} 
                                    onClick={() => setGoal(g.id as Goal)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${goal === g.id ? 'border-accent/30 bg-accent/5 text-primary' : 'border-gray-100 bg-surface-light text-secondary hover:border-gray-200'}`}
                                >
                                    <div className="text-[11px] font-bold">{g.label}</div>
                                    <div className="text-[9px] text-gray-400">{g.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={calculateMacros}
                        disabled={!weight || !height || !age}
                        className="w-full py-4 bg-accent text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Générer le bilan
                    </button>
                </Card>
            </div>

            {/* COLONNE DROITE */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              
              <div className="flex-grow space-y-8">
                {result ? (
                    <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                        
                        {/* HERO */}
                        <Card className="relative overflow-hidden border-accent/10">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Utensils size={100} className="rotate-12" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
                                <div>
                                    <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded-md border border-accent/10">{result.goalLabel}</span>
                                    <div className="mt-2 text-6xl md:text-8xl font-bold text-primary tracking-tighter">
                                        {result.calories}<span className="text-3xl md:text-4xl text-secondary ml-2 font-medium">kcal</span>
                                    </div>
                                    <p className="text-sm text-secondary font-medium mt-1">TDEE: {result.tdee} kcal • BMR: {result.bmr} kcal</p>
                                </div>
                                <button onClick={handleCopy} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-surface-light text-secondary hover:text-primary hover:bg-white border border-gray-100'}`}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'COPIÉ' : 'EXPORTER'}
                                </button>
                            </div>
                        </Card>

                        {/* WARNINGS */}
                        {result.warnings.length > 0 && (
                            <div className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={18} className="text-yellow-700" />
                                    <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">Informations</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-yellow-900">
                                    {result.warnings.map((w, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-yellow-600">•</span>
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* MACROS */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-primary">Macronutriments Optimisés</h3>
                            
                            {/* PROTÉINES */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-primary shadow-sm">1</div>
                                        <div>
                                            <div className="font-bold text-sm text-primary uppercase tracking-wide">Protéines</div>
                                            <div className="text-[10px] text-primary/60">Synthèse musculaire</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-2xl text-primary">{result.macros.p}g</div>
                                        <div className="text-[9px] text-primary/50 uppercase">{result.percents.p}%</div>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-primary/10 flex justify-between items-center">
                                    <div className="text-[10px] text-primary/70 font-medium">Priorité structurelle</div>
                                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded-md shadow-sm text-primary">{result.ratios.p}g/kg LBM</div>
                                </div>
                            </div>

                            {/* LIPIDES */}
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200/50 p-6 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-primary shadow-sm">2</div>
                                        <div>
                                            <div className="font-bold text-sm text-primary uppercase tracking-wide">Lipides</div>
                                            <div className="text-[10px] text-primary/60">Santé hormonale</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-2xl text-primary">{result.macros.f}g</div>
                                        <div className="text-[9px] text-primary/50 uppercase">{result.percents.f}%</div>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-primary/10 flex justify-between items-center">
                                    <div className="text-[10px] text-primary/70 font-medium">Seuil minimal</div>
                                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded-md shadow-sm text-primary">{result.ratios.f}g/kg</div>
                                </div>
                            </div>

                            {/* GLUCIDES */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 p-6 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-primary shadow-sm">3</div>
                                        <div>
                                            <div className="font-bold text-sm text-primary uppercase tracking-wide">Glucides</div>
                                            <div className="text-[10px] text-primary/60">Performance</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-2xl text-primary">{result.macros.c}g</div>
                                        <div className="text-[9px] text-primary/50 uppercase">{result.percents.c}%</div>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-primary/10 flex justify-between items-center">
                                    <div className="text-[10px] text-primary/70 font-medium">Variable ajustement</div>
                                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded-md shadow-sm text-primary">{result.ratios.c}g/kg</div>
                                </div>
                            </div>
                        </div>

                        {/* TDEE BREAKDOWN */}
                        <Card>
                            <h3 className="text-sm font-bold text-primary uppercase mb-4">Breakdown TDEE</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { key: 'bmr', label: 'BMR' },
                                    { key: 'neat', label: 'NEAT' },
                                    { key: 'eat', label: 'EAT' },
                                    { key: 'tef', label: 'TEF' }
                                ].map(item => (
                                    <div key={item.key} className="bg-surface-light p-4 rounded-xl text-center">
                                        <div className="text-[10px] text-secondary uppercase mb-1">{item.label}</div>
                                        <div className="text-xl font-bold text-primary">{result.breakdown[item.key as keyof typeof result.breakdown]}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* COMPOSITION */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 p-5 rounded-2xl">
                                <div className="text-xs font-bold opacity-60 uppercase mb-1">Masse Maigre</div>
                                <div className="text-2xl font-bold">{result.leanMass} kg</div>
                                <div className="text-[10px] opacity-70 mt-1">LBM (Lean Body Mass)</div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 text-blue-900 p-5 rounded-2xl">
                                <div className="text-xs font-bold opacity-60 uppercase mb-1">Body Fat</div>
                                <div className="text-2xl font-bold">{result.estimatedBF}%</div>
                                <div className="text-[10px] opacity-70 mt-1">{bodyFat ? 'Renseigné' : 'Estimé (Deurenberg)'}</div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-card opacity-60">
                        <Utensils size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-primary">En attente de données</h3>
                        <p className="text-sm text-secondary max-w-xs mt-2">Remplissez le formulaire complet pour générer votre plan nutritionnel.</p>
                    </div>
                )}
              </div>

              <div className="pt-8 mt-auto">
                   <SectionHeader title="Base de Connaissance" subtitle="Méthodologie scientifique." />
                   <div className="mt-6"><Accordion items={faqItems} /></div>
              </div>

            </div>
        </div>
      </div>

      <footer className="w-full py-12 text-center border-t border-gray-200 bg-background z-10 mt-auto">
        <p className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
            © {new Date().getFullYear()} STRYV lab.
        </p>
      </footer>

      <GenesisAssistant />
    </div>
  );
}