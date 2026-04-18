import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'

export default function ExpiredTokenPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border-[0.3px] border-white/[0.06] flex items-center justify-center">
          <Image src="/images/logo.png" alt="STRYV" width={28} height={28} className="w-7 h-7 object-contain" />
        </div>
        <p className="font-unbounded font-semibold text-[14px] text-white tracking-tight">
          STRYV<span className="font-light text-white/30"> lab</span>
        </p>
      </div>

      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={24} className="text-amber-400" />
        </div>
        <h2 className="text-[15px] font-bold text-white mb-2">Lien expiré</h2>
        <p className="text-[13px] text-white/50 leading-relaxed mb-6">
          Ce lien d'accès a expiré. Demande à ton coach de t'en envoyer un nouveau.
        </p>
        <Link
          href="/client/login"
          className="inline-flex items-center justify-center w-full h-10 rounded-xl bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors"
        >
          Se connecter manuellement
        </Link>
      </div>
    </div>
  )
}
