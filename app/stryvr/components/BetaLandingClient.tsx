'use client';

import { motion } from 'framer-motion';
import { AppMockup } from './AppMockup';
import { BetaForm } from './BetaForm';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Programme adapté en temps réel',
    desc: 'Chaque séance évolue selon tes données, tes performances et ton énergie du jour.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: '5 min/jour, zéro friction',
    desc: 'Un log de séance pensé pour aller vite. Ton coach voit tout, tu ne fais rien de plus.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'Ton coach dans ta poche',
    desc: 'Protocoles entraînement + nutrition personnalisés. Tout au même endroit, toujours à jour.',
  },
];

const STATS = [
  { value: '95%', label: 'abandonnent en 12 semaines', sub: "L'industrie actuelle" },
  { value: '5 min', label: 'par jour suffisent', sub: 'Pour des vrais résultats' },
  { value: '0', label: 'config technique', sub: "Ton coach s'occupe de tout" },
];

type Props = { betaCount: number };

export function BetaLandingClient({ betaCount }: Props) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A]">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#E8E8E8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[17px] tracking-tight text-[#0A0A0A]">
              STRYVR
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#1F8A65]/10 text-[10px] font-bold text-[#1F8A65] uppercase tracking-widest">
              Bêta
            </span>
          </div>
          <a
            href="#waitlist"
            className="hidden sm:flex h-9 px-4 rounded-xl bg-[#0A0A0A] items-center text-[12px] font-bold text-white uppercase tracking-[0.1em] hover:bg-[#1F8A65] transition-colors"
          >
            Rejoindre la bêta
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center" id="waitlist">
        {/* Left */}
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-[#1F8A65]/[0.08] border border-[#1F8A65]/20"
          >
            <span className="text-[11px] font-semibold text-[#1F8A65]">🇧🇪 Belgique · 🇫🇷 France</span>
            <span className="w-px h-3 bg-[#1F8A65]/30" />
            <span className="text-[11px] font-semibold text-[#1F8A65]">Places bêta limitées</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5rem] font-extrabold leading-[1.0] tracking-[-0.03em] text-[#0A0A0A] mb-6"
          >
            95% abandonnent.
            <br />
            <span className="text-[#1F8A65]">Pas toi.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[420px] mb-8"
          >
            STRYVR adapte ton programme en temps réel selon tes données. Coaching ultra-personnalisé, 5 min par jour — sans friction, sans excuses.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <BetaForm />
          </motion.div>

          {betaCount > 0 && (
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-4 text-[12px] text-[#A0A0A0] font-medium"
            >
              <span className="text-[#0A0A0A] font-bold">{betaCount}+</span> personnes déjà sur la liste
            </motion.p>
          )}
        </div>

        {/* Right — Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <AppMockup />
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#F0F0F0] border-y border-[#E8E8E8] py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <p className="text-[3.5rem] font-extrabold text-[#0A0A0A] leading-none mb-1">
                {s.value}
              </p>
              <p className="text-[13px] font-semibold text-[#0A0A0A] mb-0.5">{s.label}</p>
              <p className="text-[11px] text-[#A0A0A0]">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A0A0A0] text-center mb-3"
        >
          Pourquoi STRYVR
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[2rem] sm:text-[2.5rem] font-extrabold text-center text-[#0A0A0A] mb-12 tracking-[-0.02em]"
        >
          {"L'app qui s'adapte à toi,"}
          <br className="hidden sm:block" />
          {" pas l'inverse."}
        </motion.h2>

        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl bg-white border border-[#E8E8E8] p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1F8A65]/[0.08] text-[#1F8A65] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <p className="text-[14px] font-bold text-[#0A0A0A] mb-2 leading-snug">{f.title}</p>
              <p className="text-[12px] text-[#6B6B6B] leading-[1.65]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── REPEAT FORM ── */}
      <section className="bg-[#0A0A0A] py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F8A65] mb-4"
          >
            {"Tu es encore là ? C'est bon signe."}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[2rem] font-extrabold text-white mb-3 tracking-[-0.02em]"
          >
            Rejoins la liste bêta.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[13px] text-white/50 mb-8"
          >
            Lancement Belgique & France. Places limitées.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="[&_input]:!bg-white/[0.06] [&_input]:!border-white/[0.1] [&_input]:!text-white [&_input]:placeholder:!text-white/30 [&_input:focus]:!border-[#1F8A65]"
          >
            <BetaForm />
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0A0A0A] border-t border-white/[0.06] py-8">
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
