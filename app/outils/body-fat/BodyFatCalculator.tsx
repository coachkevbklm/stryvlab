'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Copy,
  Check,
  Ruler,
  User,
  Scale,
  AlertTriangle
} from 'lucide-react';

// UI Components
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import GenesisAssistant from '@/components/GenesisAssistant';

// Formulas & Store
import {
  navyBodyFat, skinfoldBodyFat,
  getBodyFatCategory, getOptimalBFZone, clampBodyFat, buildBodyFatWarnings,
  type BodyFatGender, type BodyFatMethod, type BodyFatResult,
} from '@/lib/formulas';
import { useClientStore } from '@/lib/stores/useClientStore';

export default function BodyFatCalculator() {
  const setProfile = useClientStore((s) => s.setProfile);

  const [method, setMethod] = useState<BodyFatMethod>('navy');
  const [gender, setGender] = useState<BodyFatGender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // US Navy Inputs
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  // Skinfold Inputs
  const [chest, setChest] = useState('');
  const [abdominal, setAbdominal] = useState('');
  const [thigh, setThigh] = useState('');
  const [triceps, setTriceps] = useState('');
  const [suprailiac, setSuprailiac] = useState('');

  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<BodyFatResult | null>(null);

  const calculateBodyFat = () => {
    setCopied(false);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (!w || !h || !a) return;

    let bf: number;
    let methodName: string;
    let marginOfError: BodyFatResult['marginOfError'];

    if (method === 'navy') {
      const n = parseFloat(neck);
      const wa = parseFloat(waist);
      const hi = parseFloat(hips);
      if (!n || !wa || (gender === 'female' && !hi)) return;
      bf = navyBodyFat({ gender, weight: w, height: h, neck: n, waist: wa, hips: hi });
      methodName = 'US Navy';
      marginOfError = '±3-5%';
    } else {
      if (gender === 'male') {
        const ch = parseFloat(chest);
        const ab = parseFloat(abdominal);
        const th = parseFloat(thigh);
        if (!ch || !ab || !th) return;
        bf = skinfoldBodyFat({ gender, age: a, chest: ch, abdominal: ab, thigh: th });
      } else {
        const tr = parseFloat(triceps);
        const su = parseFloat(suprailiac);
        const th = parseFloat(thigh);
        if (!tr || !su || !th) return;
        bf = skinfoldBodyFat({ gender, age: a, triceps: tr, suprailiac: su, thigh: th });
      }
      methodName = 'Jackson-Pollock 3-Site';
      marginOfError = '±3-4%';
    }

    bf = clampBodyFat(bf, gender);
    const category = getBodyFatCategory(bf, gender);
    const fm = (w * bf) / 100;
    const lm = w - fm;
    const bmi = w / ((h / 100) ** 2);
    const warnings = buildBodyFatWarnings(bf, bmi, gender, method, parseFloat(waist) || undefined, h);

    const res: BodyFatResult = {
      bodyFat: Math.round(bf * 10) / 10,
      fatMass: Math.round(fm * 10) / 10,
      leanMass: Math.round(lm * 10) / 10,
      bmi: Math.round(bmi * 10) / 10,
      category,
      marginOfError,
      methodUsed: methodName,
      warnings,
    };

    setResult(res);

    // Propagate bodyFat and weight to shared store
    setProfile({ weight: w, height: h, age: a, gender, bodyFat: res.bodyFat });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const optimalZone = result ? getOptimalBFZone(gender) : null;

  const faqItems = [
    {
      title: "BF% vs IMC : Quelle différence ?",
      content: "L'IMC est un simple rapport poids/taille qui ignore totalement la composition corporelle. Le BF% mesure précisément la quantité de graisse vs muscle. Un bodybuilder peut avoir un IMC \"obèse\" avec 8% de BF. Inversement, une personne sédentaire peut avoir un IMC \"normal\" avec 30% de BF (obésité sarcopénique)."
    },
    {
      title: "Méthode Navy vs Jackson-Pollock : Laquelle choisir ?",
      content: "US Navy utilise des circonférences (facile à mesurer seul, ±3-5% de précision). Jackson-Pollock utilise une pince à plis cutanés (plus précis ±3-4% mais nécessite de la pratique et un partenaire). Navy est idéal pour un suivi régulier, Jackson-Pollock pour une mesure ponctuelle précise."
    },
    {
      title: "Que signifient les catégories ACE ?",
      content: "L'American Council on Exercise définit les zones de santé. Hommes : 14-17% (Fitness optimal, équilibre santé/performance). Femmes : 21-24% (Fitness optimal, fonction hormonale préservée). Descendre plus bas nécessite une discipline stricte et n'améliore pas forcément la santé."
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
                    <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-2 block">Composition Analysis</span>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Body Fat Calculator</h1>
                </div>
                <div className="hidden md:block">
                    <span className="px-3 py-1 bg-surface-light border border-white/50 rounded-lg text-[10px] font-mono text-secondary">CODE: MEAS_01</span>
                </div>
            </div>
        </header>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-8">

            {/* COLONNE GAUCHE */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-surface-light rounded-lg text-accent"><Scale size={20} /></div>
                        <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Configuration</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <User size={10} /> Sexe
                        </label>
                        <div className="grid grid-cols-2 p-1 bg-surface-light/50 border border-gray-100 rounded-xl">
                            {(['male', 'female'] as BodyFatGender[]).map(g => (
                                <button
                                    key={g}
                                    onClick={() => { setGender(g); setResult(null); }}
                                    className={`py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                                        gender === g
                                        ? 'bg-white text-accent shadow-sm ring-1 ring-black/5'
                                        : 'text-secondary hover:text-primary'
                                    }`}
                                >
                                    {g === 'male' ? 'Homme' : 'Femme'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-wider flex items-center gap-1">
                            <Ruler size={10} /> Méthode
                        </label>
                        <div className="grid grid-cols-2 p-1 bg-surface-light/50 border border-gray-100 rounded-xl">
                            {[
                                { id: 'navy' as BodyFatMethod, label: 'US Navy' },
                                { id: 'skinfold' as BodyFatMethod, label: 'Pince' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => { setMethod(m.id); setResult(null); }}
                                    className={`py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                                        method === m.id
                                        ? 'bg-white text-accent shadow-sm ring-1 ring-black/5'
                                        : 'text-secondary hover:text-primary'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-secondary ml-1">ÂGE</label>
                                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-gray-300" placeholder="30" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-secondary ml-1">POIDS (kg)</label>
                                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-gray-300" placeholder="75" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-secondary ml-1">TAILLE (cm)</label>
                            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-gray-300" placeholder="180" />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        {method === 'navy' ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-secondary ml-1">TOUR DE COU (cm)</label>
                                    <input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="38" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-secondary ml-1">TOUR DE TAILLE (cm)</label>
                                    <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="85" />
                                </div>
                                {gender === 'female' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-secondary ml-1">TOUR DE HANCHES (cm)</label>
                                        <input type="number" value={hips} onChange={(e) => setHips(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="95" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-3">
                                {gender === 'male' ? (
                                    <>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">PECTORAL (mm)</label><input type="number" value={chest} onChange={(e) => setChest(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="12" /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">ABDOMINAL (mm)</label><input type="number" value={abdominal} onChange={(e) => setAbdominal(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="20" /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">CUISSE (mm)</label><input type="number" value={thigh} onChange={(e) => setThigh(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="15" /></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">TRICEPS (mm)</label><input type="number" value={triceps} onChange={(e) => setTriceps(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="14" /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">SUPRA-ILIAQUE (mm)</label><input type="number" value={suprailiac} onChange={(e) => setSuprailiac(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="16" /></div>
                                        <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 ml-1">CUISSE (mm)</label><input type="number" value={thigh} onChange={(e) => setThigh(e.target.value)} className="w-full bg-surface-light shadow-soft-in rounded-xl py-3 pl-4 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 border border-gray-100" placeholder="18" /></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={calculateBodyFat}
                        disabled={!weight || !height || !age}
                        className="w-full py-4 bg-accent text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Lancer l&apos;analyse
                    </button>
                </Card>
            </div>

            {/* COLONNE DROITE */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">

              <div className="flex-grow space-y-8">
                {result && optimalZone ? (
                    <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">

                        <Card className="relative overflow-hidden border-accent/10">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BarChart3 size={100} className="rotate-12" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
                                <div>
                                    <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded-md border border-accent/10">Résultat Analyse</span>
                                    <div className="mt-2 text-6xl md:text-8xl font-bold text-primary tracking-tighter">
                                        {result.bodyFat}<span className="text-3xl md:text-4xl text-secondary ml-2 font-medium">%</span>
                                    </div>
                                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-lg border text-xs font-bold uppercase ${result.category.colorClass}`}>
                                        {result.category.label}
                                    </div>
                                </div>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(`Bilan Body Fat : ${result.bodyFat}% (${result.category.label}) - FM: ${result.fatMass}kg | LBM: ${result.leanMass}kg - https://www.stryvlab.com/outils/body-fat`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-surface-light text-secondary hover:text-primary hover:bg-white border border-gray-100'}`}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'COPIÉ' : 'EXPORTER'}
                                </button>
                            </div>
                        </Card>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className={`p-5 rounded-2xl border ${result.category.colorClass}`}>
                                <div className="text-xs font-bold opacity-60 uppercase mb-1">Masse Grasse</div>
                                <div className="text-2xl font-bold">{result.fatMass} kg</div>
                                <div className="text-[10px] opacity-70 mt-1">Tissu adipeux</div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 p-5 rounded-2xl">
                                <div className="text-xs font-bold opacity-60 uppercase mb-1">Masse Maigre</div>
                                <div className="text-2xl font-bold">{result.leanMass} kg</div>
                                <div className="text-[10px] opacity-70 mt-1">Muscle + Os + Eau</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 text-blue-900 p-5 rounded-2xl">
                                <div className="text-xs font-bold opacity-60 uppercase mb-1">Cible Santé</div>
                                <div className="text-2xl font-bold">{optimalZone.range}</div>
                                <div className="text-[10px] opacity-70 mt-1">{optimalZone.desc}</div>
                            </div>
                        </div>

                        {result.warnings.length > 0 && (
                            <div className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={18} className="text-yellow-700" />
                                    <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">Alertes Qualité</h3>
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

                        <Card>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs font-bold text-secondary uppercase mb-2">Méthode Utilisée</div>
                                    <div className="text-lg font-bold text-primary">{result.methodUsed}</div>
                                    <div className="text-sm text-secondary mt-1">Marge d&apos;erreur: {result.marginOfError}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-secondary uppercase mb-2">IMC (Référence)</div>
                                    <div className="text-lg font-bold text-primary">{result.bmi}</div>
                                    <div className="text-sm text-secondary mt-1">
                                        {result.bmi < 18.5 ? 'Sous-poids' : result.bmi < 25 ? 'Normal' : result.bmi < 30 ? 'Surpoids' : 'Obésité'}
                                    </div>
                                </div>
                            </div>
                        </Card>

                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-card opacity-60">
                        <BarChart3 size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-primary">En attente de mesures</h3>
                        <p className="text-sm text-secondary max-w-xs mt-2">Remplissez le formulaire complet pour obtenir votre analyse scientifiquement validée.</p>
                    </div>
                )}
              </div>

              <div className="pt-8 mt-auto">
                   <SectionHeader title="Base de Connaissance" subtitle="Comprendre la composition corporelle." />
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
