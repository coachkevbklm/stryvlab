'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-white/30 mb-3">
          Hors ligne
        </p>
        <h1 className="text-[22px] font-black text-white leading-tight mb-2">
          Pas de connexion
        </h1>
        <p className="text-[13px] text-white/40 leading-relaxed max-w-[260px] mx-auto">
          Retrouve ta séance dès que tu es de retour en ligne.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="h-12 px-8 bg-[#f2f2f2] text-[#080808] text-[12px] font-black uppercase tracking-[0.1em] rounded-xl active:scale-[0.98] transition-transform"
      >
        Réessayer
      </button>
    </div>
  )
}
