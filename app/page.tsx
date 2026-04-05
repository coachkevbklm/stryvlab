'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User, Users, Mail, Lock, Loader2, ChevronLeft, ChevronDown,
  Briefcase, Activity, Phone, ShieldCheck, AlertCircle, CheckCircle2,
  Utensils, BarChart3, Moon, RefreshCw, Droplet, HeartPulse,
  Dumbbell, Brain, Layers, Zap, Database, FileText, ArrowRight,
  MessageCircle, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, signup, resendEmail } from '@/app/auth/login/actions';

// --- TOOLS ---
const TOOLS = [
  { id: 'macros', title: 'Kcal & Macros', icon: Utensils, desc: 'Moteur de calcul des besoins énergétiques et segmentation des nutriments (BMR, NEAT) selon le profil métabolique.' },
  { id: 'bodyfat', title: 'Body Fat %', icon: BarChart3, desc: 'Calcul précis de la composition corporelle (masse grasse/maigre) via les protocoles Navy et Jackson-Pollock.' },
  { id: 'cycle', title: 'Cycle Sync', icon: Moon, desc: 'Synchronisation de la nutrition et de l\'entraînement avec les cycles hormonaux pour maximiser la performance féminine.' },
  { id: 'carb', title: 'Carb Cycling', icon: RefreshCw, desc: 'Stratégie de cyclage des glucides pour optimiser la sensibilité à l\'insuline et relancer le métabolisme.' },
  { id: 'hydro', title: 'Hydratation', icon: Droplet, desc: 'Suivi hydrique et électrolytique personnalisé selon l\'intensité de l\'effort, le climat et le métabolisme individuel.' },
  { id: 'hr', title: 'HR Zones', icon: HeartPulse, desc: 'Prescription d\'intensité précise via la méthode Karvonen pour le travail cardiovasculaire et le VO2 Max.' },
  { id: '1rm', title: '1RM Calc.', icon: Dumbbell, desc: 'Estimation de la force maximale permettant de définir les charges de travail théoriques sans risque de blessure.' },
  { id: 'neuro', title: 'Neuro Profile', icon: Brain, desc: 'Individualisation de l\'entraînement et de la récupération selon la dominance neurochimique de l\'athlète.' },
  { id: 'stress', title: 'Charge Allost.', icon: Activity, desc: 'Surveillance nerveuse globale (sommeil, fatigue, cortisol) pour ajuster l\'intensité et éviter le surentraînement.' },
  { id: 'mrv', title: 'MRV Estim.', icon: Layers, desc: 'Définition du volume maximal récupérable pour saturer l\'hypertrophie musculaire sans saturation systémique.' },
  { id: 'morpho', title: 'Morpho', icon: Zap, desc: 'Analyse visuelle par IA des leviers articulaires et de la morphologie pour adapter chaque mouvement.', isNew: true },
];

const SIGNUP_TOOLS = [
  'Excel / Sheets', 'WhatsApp', 'Email', 'Notion / Docs',
  'Hevy', 'TrueCoach', 'MyFitnessPal', 'Trainerize',
  'Cahier / Papier', 'Canva', 'Google Forms', 'Instagram DM',
];

const SIGNUP_CHALLENGES = [
  'Trop de temps passé en administration',
  'Suivi dispersé entre plusieurs outils',
  'Difficultés à créer des programmes',
  'Manque de visibilité sur la progression client',
  'Communication compliquée avec les clients',
  'Gestion des paiements et factures',
  'Pas de process de suivi structuré',
];

const SIGNUP_DISCOVERY = [
  'Instagram / TikTok',
  'Recommandation d\'un collègue',
  'Bouche à oreille',
  'Google',
  'YouTube / Podcast',
  'Événement / formation',
];

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

const formVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.3, ease: 'easeIn' } }
};

// --- AUTH FORM CARD ---
type FormValues = {
  firstName: string;
  lastName: string;
  coachName: string;
  phone: string;
  experienceLevel: string;
  activeClients: string;
  discoverySource: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthCardProps = {
  isLogin: boolean;
  setIsLogin: (v: boolean) => void;
  step: number;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  resendStatus: 'idle' | 'loading' | 'success' | 'error';
  formValues: FormValues;
  setFormValue: (field: keyof FormValues, value: string) => void;
  selectedTools: string[];
  setSelectedTools: (v: string[]) => void;
  selectedChallenges: string[];
  setSelectedChallenges: (v: string[]) => void;
  handleBack: () => void;
  handleResend: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

function AuthFormCard({
  isLogin, setIsLogin, step, isLoading, error, success, resendStatus,
  formValues, setFormValue, selectedTools, setSelectedTools,
  selectedChallenges, setSelectedChallenges,
  handleBack, handleResend, handleSubmit,
}: AuthCardProps) {
  const toggleTool = (item: string) => {
    setSelectedTools(selectedTools.includes(item)
      ? selectedTools.filter(i => i !== item)
      : [...selectedTools, item]);
  };
  const toggleChallenge = (item: string) => {
    setSelectedChallenges(selectedChallenges.includes(item)
      ? selectedChallenges.filter(i => i !== item)
      : [...selectedChallenges, item]);
  };
  const f = (field: keyof FormValues) => ({
    value: formValues[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormValue(field, e.target.value),
  });

  const stepIcon = () => {
    if (isLogin) return <User size={32} className="text-accent opacity-90" strokeWidth={1.5} />;
    if (step === 1) return <User size={32} className="text-accent opacity-90" strokeWidth={1.5} />;
    if (step === 2) return <Users size={32} className="text-accent opacity-90" strokeWidth={1.5} />;
    return <Lock size={32} className="text-accent opacity-90" strokeWidth={1.5} />;
  };

  return (
    <div className="bg-surface rounded-card-lg shadow-soft-out border border-white text-center relative group flex flex-col h-[calc(100vh-64px)]">

      {/* Header — shrink-0, ne scrolle pas */}
      <div className="shrink-0 px-10 md:px-14 pt-10 md:pt-12 pb-6">

        {/* Progress bar (signup only) */}
        {!isLogin && (
          <div className="w-full h-[3px] bg-surface-light overflow-hidden rounded-full mb-6">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
        {isLogin && <div className="h-[3px] mb-6" />}
        <div className="w-14 h-14 mx-auto bg-surface-light rounded-2xl shadow-soft-in flex items-center justify-center border border-subtle mb-6">
          {stepIcon()}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-primary mb-3 leading-tight mx-auto max-w-[280px]">
          {isLogin ? 'Accès Coach' : (step === 1 ? 'Votre profil' : step === 2 ? 'Votre pratique' : 'Votre accès')}
        </h2>
        <p className="text-secondary font-medium text-[14px] leading-relaxed max-w-[320px] mx-auto opacity-70">
          {isLogin
            ? "Identifiez-vous pour accéder à votre espace coach."
            : (step === 1
                ? "Configurez votre espace de travail en quelques secondes."
                : step === 2
                  ? "Parlez-nous de votre activité pour personnaliser votre espace."
                  : "Choisissez votre email et mot de passe."
              )}
        </p>
      </div>

      {/* Zone scrollable — form + alerts */}
      <div className="flex-1 overflow-y-auto px-10 md:px-14 no-scrollbar">

      {/* Alert erreur */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-red-800 font-bold leading-snug text-left">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière confirmation e-mail (visible après inscription réussie) */}
      <AnimatePresence>
        {isLogin && success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left"
          >
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[13px] text-emerald-800 font-bold leading-snug">{success}</p>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'loading' || resendStatus === 'success'}
              className="w-full py-2.5 rounded-xl text-[12px] font-bold border transition-all duration-200 disabled:opacity-50
                bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200 disabled:cursor-not-allowed"
            >
              {resendStatus === 'loading' && 'Envoi en cours...'}
              {resendStatus === 'success' && '✓ E-mail renvoyé'}
              {resendStatus === 'error' && 'Erreur — réessayer'}
              {resendStatus === 'idle' && 'Renvoyer l\'e-mail de confirmation'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="text-left">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div key="login" initial="hidden" animate="visible" exit="exit" variants={formVariants} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1 opacity-60">Email Coach</label>
                <div className="relative group/input">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within/input:text-accent transition-colors" size={20} strokeWidth={1.5} />
                  <input name="email" type="email" required placeholder="nom@stryvlab.com" {...f('email')} className="ui-input-purity pl-16 pr-6 h-16 shadow-soft-in" />
                </div>
              </div>
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-60">Mot de Passe</label>
                  <a href="#" className="text-[10px] font-bold text-accent hover:text-accent/60 transition-colors uppercase tracking-widest underline underline-offset-4 decoration-accent/20">Oubliée ?</a>
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within/input:text-accent transition-colors" size={20} strokeWidth={1.5} />
                  <input name="password" type="password" required placeholder="••••••••" {...f('password')} className="ui-input-purity pl-16 pr-6 h-16 tracking-[0.4em] shadow-soft-in" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="signup" initial="hidden" animate="visible" exit="exit" variants={formVariants} className="space-y-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Prénom</label>
                      <input name="firstName" type="text" required placeholder="Jean" {...f('firstName')} className="ui-input-purity px-6 h-14 shadow-soft-in" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Nom</label>
                      <input name="lastName" type="text" required placeholder="Dupont" {...f('lastName')} className="ui-input-purity px-6 h-14 shadow-soft-in" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Nom Studio / Lab</label>
                    <div className="relative group/input">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within/input:text-accent transition-colors" size={20} strokeWidth={1.5} />
                      <input name="coachName" type="text" placeholder="STRYV Performance Lab" {...f('coachName')} className="ui-input-purity pl-16 pr-6 h-16 shadow-soft-in" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Téléphone</label>
                    <div className="relative group/input">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within/input:text-accent transition-colors" size={20} strokeWidth={1.5} />
                      <input name="phone" type="tel" required placeholder="+33 6 ..." {...f('phone')} className="ui-input-purity pl-16 pr-6 h-16 shadow-soft-in" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">

                  {/* Expérience + Clients */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Expérience</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={16} strokeWidth={1.5} />
                        <select name="experienceLevel" required {...f('experienceLevel')} className="ui-input-purity pl-10 pr-8 h-12 appearance-none shadow-soft-in text-[13px]">
                          <option value="" disabled>Niveau ?</option>
                          <option value="debutant">Débutant (- 1 an)</option>
                          <option value="intermediaire">Intermédiaire (1-3 ans)</option>
                          <option value="confirme">Confirmé (3-5 ans)</option>
                          <option value="expert">Expert (5 ans +)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none" size={14} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Clients actifs</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={16} strokeWidth={1.5} />
                        <select name="activeClients" required {...f('activeClients')} className="ui-input-purity pl-10 pr-8 h-12 appearance-none shadow-soft-in text-[13px]">
                          <option value="" disabled>Combien ?</option>
                          <option value="0_5">Moins de 5</option>
                          <option value="5_15">5 à 15</option>
                          <option value="15_30">15 à 30</option>
                          <option value="30_plus">Plus de 30</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none" size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Outils utilisés */}
                  <input type="hidden" name="currentTools" value={selectedTools.join(', ')} />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Outils utilisés actuellement</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SIGNUP_TOOLS.map(tool => (
                        <button
                          key={tool} type="button" onClick={() => toggleTool(tool)}
                          className={`py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 border text-center leading-tight ${
                            selectedTools.includes(tool)
                              ? 'bg-accent/10 text-accent border-accent/30 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06)]'
                              : 'bg-surface text-secondary/70 border-subtle shadow-[3px_3px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.8)] hover:text-accent/70 hover:border-accent/20'
                          }`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Problèmes rencontrés */}
                  <input type="hidden" name="mainChallenges" value={selectedChallenges.join(', ')} />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Ce qui vous pose problème aujourd'hui</label>
                    <div className="flex flex-col gap-2">
                      {SIGNUP_CHALLENGES.map(challenge => (
                        <button
                          key={challenge} type="button" onClick={() => toggleChallenge(challenge)}
                          className={`py-2.5 px-4 rounded-xl text-[11px] font-medium text-left transition-all duration-200 border ${
                            selectedChallenges.includes(challenge)
                              ? 'bg-accent/10 text-accent border-accent/30 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06)]'
                              : 'bg-surface text-secondary/70 border-subtle shadow-[3px_3px_8px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.8)] hover:text-primary hover:border-accent/20'
                          }`}
                        >
                          {challenge}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment nous avez-vous connu */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Comment nous avez-vous connu ?</label>
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary/20" size={18} strokeWidth={1.5} />
                      <select name="discoverySource" {...f('discoverySource')} className="ui-input-purity pl-14 pr-12 h-14 appearance-none shadow-soft-in">
                        <option value="">Sélectionner...</option>
                        {SIGNUP_DISCOVERY.map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none" size={16} />
                    </div>
                  </div>

                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Email Pro</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within/input:text-accent transition-colors" size={20} strokeWidth={1.5} />
                      <input name="email" type="email" required placeholder="nom@stryvlab.com" {...f('email')} className="ui-input-purity pl-16 pr-6 h-16 shadow-soft-in" />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Mot de passe</label>
                      <input name="password" type="password" required placeholder="••••••••" {...f('password')} className="ui-input-purity px-6 h-16 tracking-[0.4em] shadow-soft-in" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1 opacity-60">Confirmation</label>
                      <input name="confirmPassword" type="password" required placeholder="••••••••" {...f('confirmPassword')} className="ui-input-purity px-6 h-16 tracking-[0.4em] shadow-soft-in" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div className="pt-6 flex gap-4">
          {!isLogin && (
            <button type="button" onClick={handleBack} className="w-16 h-16 rounded-2xl bg-surface shadow-soft-out border border-white flex items-center justify-center text-secondary hover:text-accent transition-all active:scale-95 group">
              <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <button
            type="submit" disabled={isLoading}
            className="group/btn relative flex-1 h-16 flex items-center justify-between pl-6 pr-2 bg-primary hover:bg-[#000000] text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(26,26,26,0.3)] transition-all duration-400 ease-out hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover/btn:animate-[shine_1.5s_ease-out_infinite]"></div>
            <div className="flex gap-4 items-center relative z-10">
              <ShieldCheck size={20} className={`transition-colors duration-500 ${isLoading ? 'animate-pulse text-white/50' : 'text-white/60 group-hover/btn:text-accent'}`} />
              <span className="font-semibold text-base tracking-wide uppercase">
                {isLoading ? 'Connexion...' : (isLogin ? 'Se Connecter' : (step === 3 ? 'Créer mon compte' : 'Suivant'))}
              </span>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-accent transition-colors duration-400 relative z-10">
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <ArrowRight size={20} className="text-white transform group-hover/btn:translate-x-0.5 transition-transform duration-300" strokeWidth={2} />
              )}
            </div>
          </button>
        </div>
      </form>

      {/* Toggle login / signup */}
      <div className="mt-6 pt-6 border-t border-subtle/[0.5] pb-10 md:pb-12">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-[12px] font-bold text-secondary tracking-tight hover:text-accent transition-all group"
        >
          {isLogin ? (
            <>Nouveau sur STRYV ? <span className="text-accent underline underline-offset-4 decoration-accent/20 group-hover:decoration-accent">Créer un compte</span></>
          ) : (
            <>Déjà un compte ? <span className="text-accent underline underline-offset-4 decoration-accent/20 group-hover:decoration-accent">Se connecter</span></>
          )}
        </button>
      </div>

      </div>{/* fin zone scrollable */}
    </div>
  );
}

// --- PAGE PRINCIPALE ---
export default function ConnectionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formValues, setFormValues] = useState<FormValues>({
    firstName: '', lastName: '', coachName: '', phone: '',
    experienceLevel: '', activeClients: '', discoverySource: '',
    email: '', password: '', confirmPassword: '',
  });
  const setFormValue = (field: keyof FormValues, value: string) =>
    setFormValues(prev => ({ ...prev, [field]: value }));
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => step > 1 ? setStep(s => s - 1) : setIsLoginWithReset(true);

  const setIsLoginWithReset = (v: boolean, keepSuccess = false) => {
    setIsLogin(v);
    setStep(1);
    setError(null);
    if (!keepSuccess) setSuccess(null);
  };

  const handleResend = async () => {
    if (!formValues.email) return setError("Saisissez votre e-mail pour renvoyer le lien.");
    setResendStatus('loading');
    const result = await resendEmail(formValues.email);
    setResendStatus(result.success ? 'success' : 'error');
    if (result.error) setError(result.error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (isLogin) {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      if (step < 3) {
        handleNext();
        setIsLoading(false);
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        setIsLoading(false);
        return;
      }
      // Reconstruire FormData depuis le state (les champs des étapes précédentes
      // ne sont plus dans le DOM à l'étape 3)
      const formData = new FormData();
      formData.set('firstName', formValues.firstName);
      formData.set('lastName', formValues.lastName);
      formData.set('coachName', formValues.coachName);
      formData.set('phone', formValues.phone);
      formData.set('email', formValues.email);
      formData.set('password', formValues.password);
      formData.set('confirmPassword', formValues.confirmPassword);
      formData.set('experienceLevel', formValues.experienceLevel);
      formData.set('activeClients', formValues.activeClients);
      formData.set('discoverySource', formValues.discoverySource);
      formData.set('currentTools', selectedTools.join(', '));
      formData.set('currentProcess', selectedChallenges.join(', '));
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setSuccess("Compte créé ! Un e-mail de confirmation vous a été envoyé. Vérifiez votre boîte mail pour activer votre accès.");
        setIsLoading(false);
        setIsLoginWithReset(true, true);
      }
    }
  };

  const cardProps = {
    isLogin, setIsLogin: setIsLoginWithReset, step, isLoading,
    error, success, resendStatus,
    formValues, setFormValue,
    selectedTools, setSelectedTools,
    selectedChallenges, setSelectedChallenges,
    handleBack, handleResend, handleSubmit,
  };

  return (
    <main className="min-h-screen w-full bg-background text-primary selection:bg-accent selection:text-white flex p-4 md:p-6 lg:p-8 xl:p-12 justify-center relative overflow-x-hidden">

      {/* FLOW LAYOUT */}
      <div className="w-full max-w-[1240px] flex flex-col lg:flex-row items-stretch gap-12 lg:gap-20 xl:gap-32 relative z-10 px-4 pt-12 lg:pt-20">

        {/* LEFT COLUMN — brand + tools, scrollable */}
        <div className={`w-full lg:w-[55%] bg-surface rounded-card-lg shadow-soft-out p-12 lg:p-16 xl:p-20 relative flex flex-col justify-center border border-subtle transition-all duration-1000 ease-out transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="max-w-lg">
            <div className="mb-8 lg:mb-12 z-20 cursor-pointer group inline-flex items-center gap-3" onClick={() => router.push('/')}>
              <Image
                src="/images/logo.png"
                alt="STRYV"
                width={48} height={48}
                className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <span className="font-unbounded font-semibold text-xl text-primary tracking-tight leading-none">
                STRYV<span className="font-light text-secondary"> lab</span>
              </span>
            </div>

            <div className="relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6 group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:animate-ping"></div>
                <h3 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">STRYV LAB / 11 OUTILS SYNCHRONISÉS</h3>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-7xl font-black text-primary mb-10 tracking-tight leading-[1.05]">
                Évaluer. <br />
                <span className="text-accent">Calculer.</span> <br />
                <span className="text-secondary/30">Piloter.</span>
              </h1>
              <div className="flex gap-4 mb-10 max-w-sm">
                <div className="w-1 h-20 bg-accent/20 rounded-full mt-1"></div>
                <h2 className="text-lg text-secondary font-medium leading-relaxed opacity-80">
                  Ingénierie métabolique et analyse morphologique. <br className="hidden md:block" />
                  Automatisez vos protocoles et centralisez le suivi de vos clients sur une interface unique.
                </h2>
              </div>

              {/* Tools grid */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-10">
                {TOOLS.map((tool) => (
                  <div key={tool.id} className="relative group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-subtle shadow-soft-out flex items-center justify-center transition-all duration-300 group-hover:scale-100 group-hover:shadow-soft-in group-hover:border-accent/10 cursor-default">
                        <tool.icon size={20} className="text-accent/80 group-hover:text-accent group-hover:scale-95 transition-all duration-300" />
                      </div>
                      <span className="text-[9px] font-semibold text-secondary text-center leading-tight w-full opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all">{tool.title}</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-4 bg-surface/95 backdrop-blur-md border border-subtle rounded-2xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-accent rounded-full"></div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{tool.title}</span>
                      </div>
                      <p className="text-[11px] text-primary/80 font-medium leading-relaxed">{tool.desc}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface/95"></div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 opacity-20 cursor-help" title="Prochainement">
                  <div className="w-12 h-12 rounded-xl border border-dashed border-secondary flex items-center justify-center">
                    <Database size={16} className="text-secondary" />
                  </div>
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">?</span>
                </div>
              </div>

              <div className="p-6 bg-surface-light border border-subtle rounded-3xl shadow-soft-in mb-6 group hover:translate-y-[-2px] transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface shadow-soft-out flex items-center justify-center text-accent ring-1 ring-accent/5 group-hover:scale-110 transition-transform duration-500 shrink-0">
                    <Database size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-base font-bold text-primary mb-1 tracking-tight flex items-center gap-2">
                      Base de Données Unifiée
                      <span className="px-2 py-0.5 bg-accent/5 text-accent/70 text-[9px] font-black rounded uppercase border border-accent/10">SYNC AUTO</span>
                    </h4>
                    <p className="text-[12px] text-secondary font-medium leading-relaxed opacity-60">
                      Chaque résultat généré par les modules est intégré au profil de votre client. Consolidez l'historique et accédez à l'ensemble des rapports sur une interface unique.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-light border border-subtle rounded-3xl shadow-soft-in mb-6 group hover:translate-y-[-2px] transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface shadow-soft-out flex items-center justify-center text-accent ring-1 ring-accent/5 group-hover:scale-110 transition-transform duration-500 shrink-0">
                    <FileText size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-base font-bold text-primary mb-1 tracking-tight flex items-center gap-2">
                      Rapport de Synthèse Éditable
                      <span className="px-2 py-0.5 bg-accent/5 text-accent/70 text-[9px] font-black rounded uppercase border border-accent/10">EXPORT PDF</span>
                    </h4>
                    <p className="text-[12px] text-secondary font-medium leading-relaxed opacity-60">
                      Générez un document complet intégrant vos analyses et protocoles. Personnalisez l'affichage des modules et exportez le rapport final à votre image.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between opacity-40">
                <span className="text-[10px] font-bold tracking-[0.3em] text-secondary uppercase">STRYV LAB / 11 OUTILS SYNCHRONISÉS</span>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: auth card in flow */}
        <div className="w-full lg:hidden flex items-center justify-center py-12">
          <div className="w-full max-w-[480px]">
            <AuthFormCard {...cardProps} />
          </div>
        </div>

        {/* DESKTOP: invisible spacer */}
        <div className="hidden lg:block lg:w-[45%]" aria-hidden="true" />

      </div>

      {/* DESKTOP FIXED OVERLAY — card ne suit pas le scroll */}
      <div className="hidden lg:flex fixed inset-0 pointer-events-none z-50 items-center justify-center p-4 md:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-[1240px] flex flex-row items-stretch gap-12 lg:gap-20 xl:gap-32 px-4">
          <div className="w-[55%] invisible" aria-hidden="true" />
          <div className={`w-[45%] flex justify-center items-center pointer-events-auto transition-all duration-1000 delay-500 transform ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="w-full max-w-[480px]">
              <AuthFormCard {...cardProps} />
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
