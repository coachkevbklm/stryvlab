'use client';

import { motion } from 'framer-motion';
import { AppMockup } from './AppMockup';
import { BetaForm } from './BetaForm';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const FEATURES = [
  {
    title: 'Smart Agenda intelligent',
    desc: 'Ton agenda du jour orchestré par ton moteur physiologique. Check-in, repas, séance, compléments — dans le bon ordre, au bon moment.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6116" strokeWidth="1.75" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="12" cy="16" r="1.5" fill="#FF6116" />
      </svg>
    ),
  },
  {
    title: 'Nutrition Composer',
    desc: '4 couches de saisie. Portions estimées par la morphologie de ta main. Macros calculés en temps réel. Sans peser, sans compter.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6116" strokeWidth="1.75" strokeLinecap="round">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: 'Cycle & Physiologie',
    desc: 'Adapté à ta biologie réelle — cycle féminin, niveau training, conditions médicales. Chaque recommandation est individualisée.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6116" strokeWidth="1.75" strokeLinecap="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '95%', label: 'abandonnent en 12 semaines', sub: 'Le statu quo actuel' },
  { value: '5 min', label: 'par jour suffisent', sub: 'Check-in complet' },
  { value: '20', label: 'signaux physiologiques', sub: 'Analysés quotidiennement' },
];

export function BetaLandingClient({ betaCount }: { betaCount: number }) {
  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#000000]" style={{ fontFamily: 'var(--font-urbanist, system-ui, sans-serif)' }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#F3F3F3]/95 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[18px] tracking-tight text-[#000000]">STRYVR</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF6116]/10 text-[10px] font-bold text-[#FF6116] uppercase tracking-widest">Bêta</span>
          </div>
          <a href="#waitlist"
            className="hidden sm:flex h-9 px-4 rounded-xl bg-[#000000] items-center text-[12px] font-bold text-white uppercase tracking-[0.1em] hover:bg-[#FF6116] transition-colors duration-200">
            Rejoindre la bêta
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="waitlist" className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-20 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full bg-[#FF6116]/[0.08] border border-[#FF6116]/20">
            <span className="text-[11px] font-semibold text-[#FF6116]">🇧🇪 Belgique · 🇫🇷 France</span>
            <span className="w-px h-3 bg-[#FF6116]/30" />
            <span className="text-[11px] font-semibold text-[#FF6116]">Places bêta limitées</span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-[3.2rem] sm:text-[4rem] lg:text-[4.5rem] font-extrabold leading-[1.0] tracking-[-0.03em] text-[#000000] mb-5">
            Pas un tracker.
            <br />
            <span className="text-[#FF6116]">Ton moteur</span>
            <br />
            physiologique.
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-[15px] text-[#767676] leading-[1.7] max-w-[400px] mb-8">
            STRYVR comprend ta biologie et adapte chaque recommandation en temps réel — nutrition, entraînement, récupération. 5 min par jour.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <BetaForm />
          </motion.div>

          {betaCount > 0 && (
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-4 text-[12px] text-[#ABABAB] font-medium">
              <span className="text-[#000000] font-bold">{betaCount}+</span> personnes déjà sur la liste
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end">
          <AppMockup />
        </motion.div>
      </section>

      {/* ── STATS — dark ── */}
      <section className="bg-[#000000] py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.value}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.1 }}>
              <p className="text-[3.5rem] font-extrabold text-white leading-none mb-1">{s.value}</p>
              <p className="text-[13px] font-semibold text-white/80 mb-0.5">{s.label}</p>
              <p className="text-[11px] text-white/35">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ABABAB] text-center mb-3">
            Ce qui change tout
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-[2rem] sm:text-[2.5rem] font-extrabold text-center text-[#000000] mb-12 tracking-[-0.02em]">
            Conçu pour ta biologie.<br className="hidden sm:block" /> Pas pour la moyenne.
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.1 }}
                className="rounded-2xl bg-[#F3F3F3] p-6">
                <div className="w-10 h-10 rounded-xl bg-[#FF6116]/10 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <p className="text-[14px] font-bold text-[#000000] mb-2 leading-snug">{f.title}</p>
                <p className="text-[12px] text-[#767676] leading-[1.65]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPEAT FORM — dark ── */}
      <section className="bg-[#000000] py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6116] mb-4">
            Tu es encore là ? C&apos;est bon signe.
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-[2rem] font-extrabold text-white mb-3 tracking-[-0.02em]">
            Rejoins la liste bêta.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[13px] text-white/40 mb-8">
            Lancement Belgique & France. Places limitées.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <BetaForm dark />
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#000000] border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[14px] text-white">STRYVR</span>
            <span className="text-white/20">·</span>
            <span className="text-[11px] text-white/30">by STRYVLAB</span>
          </div>
          <p className="text-[11px] text-white/30">🇧🇪 Belgique · 🇫🇷 France · © 2026</p>
          <a href="/mentions-legales" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
            Mentions légales
          </a>
        </div>
      </footer>
    </div>
  );
}
