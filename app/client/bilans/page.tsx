import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Link from 'next/link'
import Image from 'next/image'
import { ClipboardList, ChevronRight, Clock, CheckCircle2, AlertCircle, PenLine } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:     { label: 'En attente',  className: 'bg-amber-100 text-amber-700',  icon: <Clock size={11} /> },
    in_progress: { label: 'En cours',   className: 'bg-blue-100 text-blue-700',    icon: <Clock size={11} /> },
    completed:   { label: 'Complété',   className: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={11} /> },
    expired:     { label: 'Expiré',     className: 'bg-red-100 text-red-500',      icon: <AlertCircle size={11} /> },
  }
  const s = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
      {s.icon}{s.label}
    </span>
  )
}

export default async function ClientBilansPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service)

  const submissions = client ? (await service
    .from('assessment_submissions')
    .select('id, status, created_at, submitted_at, template_snapshot, token, token_expires_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
  ).data ?? [] : []

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-primary">Mes bilans</h1>
            <p className="text-xs text-secondary mt-0.5">{submissions.length} bilan{submissions.length !== 1 ? 's' : ''}</p>
          </div>
          <Image src="/images/logo.png" alt="STRYV" width={28} height={28} className="w-7 h-7 object-contain opacity-70" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {submissions.length === 0 ? (
          <div className="bg-surface rounded-card shadow-soft-out p-8 text-center">
            <ClipboardList size={36} className="text-secondary mx-auto mb-3 opacity-40" />
            <p className="text-sm text-secondary">Aucun bilan pour le moment.</p>
            <p className="text-xs text-secondary/60 mt-1">Ton coach t'enverra un lien quand il en crée un.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((sub: any) => {
              const name = sub.template_snapshot?.name ?? 'Bilan'
              const date = new Date(sub.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              const isFillable = (sub.status === 'pending' || sub.status === 'in_progress') && sub.token
              const isExpired = sub.status === 'expired' || (sub.token_expires_at && new Date(sub.token_expires_at) < new Date())
              const isCompleted = sub.status === 'completed'

              return (
                <div key={sub.id} className="bg-surface rounded-card shadow-soft-out overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardList size={17} className="text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary text-sm">{name}</p>
                        <p className="text-xs text-secondary">{date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={isExpired ? 'expired' : sub.status} />
                      {isFillable && !isExpired && (
                        <Link
                          href={`/bilan/${sub.token}`}
                          className="flex items-center gap-1 bg-accent text-white text-[11px] font-bold px-3 py-1.5 rounded-btn hover:opacity-90 transition-opacity"
                        >
                          <PenLine size={11} />
                          Remplir
                        </Link>
                      )}
                      {isCompleted && (
                        <Link href={`/client/bilans/${sub.id}`} className="text-secondary hover:text-primary">
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
