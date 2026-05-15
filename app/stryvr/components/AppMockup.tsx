// app/stryvr/components/AppMockup.tsx
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function AppScreen() {
  return (
    <div className="w-full h-full bg-[#121212] rounded-[2rem] p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] text-white/40 uppercase tracking-widest">Aujourd'hui</p>
          <p className="text-[13px] font-bold text-white leading-tight">Séance Push · Jour 3</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#1F8A65]/20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#1F8A65]" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-white/[0.06]">
        <div className="h-full w-2/3 rounded-full bg-[#1F8A65]" />
      </div>

      {/* Exercise card */}
      <div className="rounded-2xl bg-white/[0.04] p-3 flex flex-col gap-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider">Exercice 2 / 5</p>
        <p className="text-[12px] font-semibold text-white">Développé couché</p>
        <div className="grid grid-cols-3 gap-1.5">
          {['Série 1', 'Série 2', 'Série 3'].map((s, i) => (
            <div key={s} className={`rounded-lg p-2 text-center ${i < 2 ? 'bg-[#1F8A65]/10' : 'bg-white/[0.04]'}`}>
              <p className="text-[8px] text-white/40">{s}</p>
              <p className={`text-[11px] font-bold ${i < 2 ? 'text-[#1F8A65]' : 'text-white/30'}`}>
                {i < 2 ? `${80 + i * 2.5}kg` : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.04] p-2.5">
          <p className="text-[7px] text-white/35 uppercase tracking-wider mb-0.5">Charge</p>
          <p className="text-[14px] font-black text-white">82.5<span className="text-[9px] font-normal text-white/40 ml-0.5">kg</span></p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2.5">
          <p className="text-[7px] text-white/35 uppercase tracking-wider mb-0.5">RIR estimé</p>
          <p className="text-[14px] font-black text-[#1F8A65]">2</p>
        </div>
      </div>

      {/* CTA button */}
      <div className="mt-auto rounded-xl bg-[#1F8A65] py-2.5 flex items-center justify-center gap-2">
        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Valider la série</p>
      </div>
    </div>
  );
}

export function AppMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);

  return (
    <motion.div ref={ref} style={{ y }} className="relative flex items-center justify-center select-none">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[3rem] blur-3xl opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, #1F8A65 0%, transparent 70%)' }}
      />

      {/* iPhone frame */}
      <div
        className="relative w-[220px] h-[440px] rounded-[3rem] bg-[#0A0A0A] p-[10px]"
        style={{
          transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#0A0A0A] rounded-full z-10" />
        {/* Screen */}
        <div className="w-full h-full rounded-[2.25rem] overflow-hidden">
          <AppScreen />
        </div>
      </div>
    </motion.div>
  );
}
