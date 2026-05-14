import Image from 'next/image'
import { ShieldOff } from 'lucide-react'

export default function AccesSuspenduPage() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/images/logo.png" alt="STRYVR" width={48} height={48} className="w-12 h-12 object-contain" />
        <span className="font-unbounded font-semibold text-base text-white tracking-tight leading-none">
          STRYVR<span className="font-light text-white/40"> lab</span>
        </span>
      </div>

      <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={24} className="text-red-400" />
        </div>
        <h2 className="text-[15px] font-bold text-white mb-2">Accès suspendu</h2>
        <p className="text-[13px] text-white/60 leading-relaxed">
          Ton accès à l'espace STRYVR a été suspendu. Contacte ton coach pour le renouveler.
        </p>
      </div>
    </div>
  )
}
