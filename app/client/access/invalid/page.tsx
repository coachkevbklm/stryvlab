import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function InvalidTokenPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-surface rounded-card shadow-soft-out p-8 max-w-sm w-full text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-primary mb-2">Lien invalide</h2>
        <p className="text-sm text-secondary mb-6">
          Ce lien d'accès n'existe pas ou a été révoqué par ton coach.
        </p>
        <Link href="/client/login" className="text-sm text-accent font-medium hover:underline">
          Se connecter manuellement
        </Link>
      </div>
    </div>
  )
}
