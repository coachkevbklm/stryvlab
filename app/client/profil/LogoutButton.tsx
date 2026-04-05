'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ClientLogoutButton() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/client/login')
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-card bg-surface shadow-soft-out text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut size={15} />
        Se déconnecter
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card shadow-[12px_12px_32px_#c8c8c8,-12px_-12px_32px_#ffffff] p-6 w-full max-w-sm">
            <h3 className="font-bold text-primary mb-2">Se déconnecter ?</h3>
            <p className="text-sm text-secondary mb-5">
              Tu seras redirigé vers la page de connexion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-btn bg-surface-light shadow-soft-out text-sm text-secondary hover:text-primary transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 py-2.5 rounded-btn bg-red-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {loading ? 'Déconnexion…' : 'Déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
