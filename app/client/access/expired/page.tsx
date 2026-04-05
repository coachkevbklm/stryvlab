import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function ExpiredTokenPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-surface rounded-card shadow-soft-out p-8 max-w-sm w-full text-center">
        <Clock size={48} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-primary mb-2">Lien expiré</h2>
        <p className="text-sm text-secondary mb-6">
          Ce lien d'accès a expiré. Demande à ton coach de t'en envoyer un nouveau.
        </p>
        <Link href="/client/login" className="text-sm text-accent font-medium hover:underline">
          Se connecter manuellement
        </Link>
      </div>
    </div>
  )
}
