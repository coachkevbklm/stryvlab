'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useTransition } from 'react';
import { joinWaitlist, WaitlistResult } from '../actions';

type FormState =
  | { type: 'idle' }
  | { type: 'success'; firstName: string; alreadyExists: boolean }
  | { type: 'error'; message: string };

export function BetaForm({ dark = false }: { dark?: boolean }) {
  const [state, setState] = useState<FormState>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get('first_name') as string)?.trim() ?? '';
    startTransition(async () => {
      const result: WaitlistResult = await joinWaitlist(formData);
      if (result.success) {
        setState({ type: 'success', firstName, alreadyExists: result.alreadyExists });
      } else {
        setState({ type: 'error', message: result.error });
      }
    });
  }

  const inputClass = dark
    ? 'flex-1 h-[52px] rounded-xl bg-white/[0.08] border border-white/10 px-4 text-[14px] font-medium text-white placeholder:text-white/30 outline-none focus:border-[#FF6116] transition-colors'
    : 'flex-1 h-[52px] rounded-xl bg-white border border-black/[0.08] px-4 text-[14px] font-medium text-[#000000] placeholder:text-[#ABABAB] outline-none focus:border-[#FF6116] transition-colors';

  if (state.type === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 text-center ${dark ? 'bg-white/[0.06] border border-white/10' : 'bg-[#FF6116]/[0.08] border border-[#FF6116]/20'}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#FF6116]/10 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6116" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className={`text-[15px] font-bold mb-1 ${dark ? 'text-white' : 'text-[#000000]'}`}>
          {state.alreadyExists ? 'Tu es déjà sur la liste ✓' : `Bienvenue ${state.firstName} !`}
        </p>
        <p className={`text-[13px] leading-relaxed ${dark ? 'text-white/50' : 'text-[#767676]'}`}>
          {state.alreadyExists
            ? 'Tu seras parmi les premiers contactés au lancement.'
            : 'Tu es sur la liste. On te contacte en premier pour la bêta.'}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input name="first_name" type="text" required minLength={2} placeholder="Ton prénom" className={inputClass} />
        <input name="email" type="email" required placeholder="Ton email" className={inputClass} />
      </div>
      <AnimatePresence>
        {state.type === 'error' && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[12px] text-[#FF3B30] font-medium px-1">
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" disabled={isPending}
        className="h-[52px] w-full rounded-xl bg-[#FF6116] flex items-center justify-between pl-5 pr-1.5 transition-all hover:bg-[#E5540F] active:scale-[0.99] disabled:opacity-60">
        <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
          {isPending ? 'Inscription...' : 'Rejoindre la liste bêta'}
        </span>
        <div className="w-[42px] h-[42px] rounded-lg bg-black/[0.15] flex items-center justify-center">
          {isPending ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" /><path d="M21 12a9 9 0 00-9-9" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>
      <p className={`text-center text-[11px] ${dark ? 'text-white/30' : 'text-[#ABABAB]'}`}>
        Zéro spam. Désabonnement en 1 clic.
      </p>
    </form>
  );
}
