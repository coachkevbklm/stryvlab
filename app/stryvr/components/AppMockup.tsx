'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function AgendaScreen() {
  return (
    <div className="w-full h-full bg-[#F3F3F3] p-3 flex flex-col gap-2 overflow-hidden" style={{ fontFamily: 'var(--font-urbanist, system-ui, sans-serif)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p style={{ fontSize: 8, color: '#ABABAB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jeudi 15 mai</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#000000', lineHeight: 1.2 }}>Agenda</p>
        </div>
        {/* Arc progression */}
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#EBEBEB" strokeWidth="3" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="#FF6116" strokeWidth="3"
            strokeDasharray="62" strokeDashoffset="20" strokeLinecap="round"
            transform="rotate(-90 18 18)" />
          <text x="18" y="22" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#000000' }}>74%</text>
        </svg>
      </div>

      {/* Targets bar */}
      <div className="bg-white rounded-xl p-2 flex gap-2">
        {[
          { label: 'Kcal', val: '1 840', pct: 0.72, unit: '/ 2 550' },
          { label: 'Prot.', val: '112g', pct: 0.65, unit: '/ 170g' },
          { label: 'Eau', val: '1.4L', pct: 0.58, unit: '/ 2.4L' },
        ].map((item) => (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-0.5">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="11" fill="none" stroke="#EBEBEB" strokeWidth="2.5" />
              <circle cx="14" cy="14" r="11" fill="none" stroke="#FF6116" strokeWidth="2.5"
                strokeDasharray={`${item.pct * 69} 69`} strokeLinecap="round"
                transform="rotate(-90 14 14)" />
            </svg>
            <p style={{ fontSize: 7, fontWeight: 700, color: '#000000' }}>{item.val}</p>
            <p style={{ fontSize: 6, color: '#ABABAB' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Event list */}
      {[
        { icon: '☀️', label: 'Check-in matinal', meta: 'Énergie · Sommeil · Humeur', status: 'done', time: '07:30' },
        { icon: '🥗', label: 'Déjeuner', meta: '620 kcal · 45g P', status: 'done', time: '12:15' },
        { icon: '💪', label: 'Séance Push', meta: '6 exercices · ~55 min', status: 'active', time: '17:30' },
        { icon: '💊', label: 'Compléments soir', meta: 'Magnésium · Oméga-3', status: 'pending', time: '21:00' },
      ].map((ev) => (
        <div key={ev.label} className="bg-white rounded-xl px-2.5 py-2 flex items-center gap-2"
          style={{ borderLeft: ev.status === 'active' ? '3px solid #FF6116' : '3px solid transparent' }}>
          <span style={{ fontSize: 12 }}>{ev.icon}</span>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 10, fontWeight: 600, color: '#000000', lineHeight: 1.2 }}>{ev.label}</p>
            <p style={{ fontSize: 8, color: '#767676' }}>{ev.meta}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p style={{ fontSize: 7, color: '#ABABAB' }}>{ev.time}</p>
            {ev.status === 'done' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {ev.status === 'active' && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6116' }} />
            )}
          </div>
        </div>
      ))}

      {/* Phase badge */}
      <div className="bg-white rounded-xl px-2.5 py-1.5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6116' }} />
          <p style={{ fontSize: 8, fontWeight: 600, color: '#000000' }}>Fat Loss · Sem. 3/8</p>
        </div>
        <p style={{ fontSize: 7, color: '#ABABAB' }}>Déload dans 5 sem.</p>
      </div>
    </div>
  );
}

export function AppMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [16, -16]);

  return (
    <motion.div ref={ref} style={{ y }} className="relative flex items-center justify-center select-none">
      {/* Glow orange subtil */}
      <div aria-hidden className="absolute inset-0 rounded-[3rem] blur-3xl opacity-15"
        style={{ background: 'radial-gradient(ellipse at center, #FF6116 0%, transparent 70%)' }} />
      {/* iPhone frame */}
      <div className="relative w-[220px] h-[460px] rounded-[3rem] bg-[#1A1A1A] p-[9px]"
        style={{
          transform: 'perspective(1000px) rotateY(-6deg) rotateX(3deg)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.1)',
        }}>
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#1A1A1A] rounded-full z-10" />
        {/* Screen */}
        <div className="w-full h-full rounded-[2.25rem] overflow-hidden">
          <AgendaScreen />
        </div>
      </div>
    </motion.div>
  );
}
