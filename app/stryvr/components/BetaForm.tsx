// app/stryvr/components/BetaForm.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useTransition } from 'react';
import { joinWaitlist, WaitlistResult } from '../actions';

type FormState =
  | { type: 'idle' }
  | { type: 'success'; firstName: string; alreadyExists: boolean }
  | { type: 'error'; message: string };

export function BetaForm() {
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

  if (state.type === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-[#1F8A65]/[0.08] border border-[#1F8A65]/20 p-6 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-[#1F8A65]/10 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F8A65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[15px] font-bold text-[#0A0A0A] mb-1">
          {state.alreadyExists
            ? `Tu es déjà sur la liste ✓`
            : `Bienvenue ${state.firstName} !`}
        </p>
        <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
          {state.alreadyExists
            ? 'On t\'a déjà enregistré. Tu seras parmi les premiers contactés.'
            : 'Tu es sur la liste. On te contacte en premier pour le lancement bêta.'}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          name="first_name"
          type="text"
          required
          minLength={2}
          placeholder="Ton prénom"
          className="flex-1 h-[52px] rounded-xl bg-white border border-[#E8E8E8] px-4 text-[14px] font-medium text-[#0A0A0A] placeholder:text-[#A0A0A0] outline-none focus:border-[#1F8A65] transition-colors"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Ton email"
          className="flex-1 h-[52px] rounded-xl bg-white border border-[#E8E8E8] px-4 text-[14px] font-medium text-[#0A0A0A] placeholder:text-[#A0A0A0] outline-none focus:border-[#1F8A65] transition-colors"
        />
      </div>

      <AnimatePresence>
        {state.type === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12px] text-red-500 font-medium px-1"
          >
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isPending}
        className="h-[52px] w-full rounded-xl bg-[#1F8A65] flex items-center justify-between pl-5 pr-1.5 transition-all hover:bg-[#217356] active:scale-[0.99] disabled:opacity-60"
      >
        <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
          {isPending ? 'Inscription...' : 'Rejoindre la liste bêta'}
        </span>
        <div className="w-[42px] h-[42px] rounded-lg bg-black/[0.12] flex items-center justify-center">
          {isPending ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.2" />
              <path d="M21 12a9 9 0 00-9-9" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      <p className="text-center text-[11px] text-[#A0A0A0]">
        Zéro spam. Désabonnement en 1 clic.
      </p>
    </form>
  );
}
