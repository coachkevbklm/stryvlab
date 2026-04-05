import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import Link from 'next/link'
import Image from 'next/image'
import { Dumbbell, Clock, RotateCcw, Play } from 'lucide-react'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default async function ClientProgrammePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service, 'id, first_name')

  if (!client) {
    return <NoProgramPage />
  }

  const { data: programs } = await service
    .from('programs')
    .select(`
      id, name, description, weeks, status, created_at,
      program_sessions (
        id, name, day_of_week, position, notes,
        program_exercises (
          id, name, sets, reps, rest_sec, rir, notes, position
        )
      )
    `)
    .eq('client_id', client.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  const program = programs?.[0]

  if (!program) {
    return (
      <div className="min-h-screen bg-surface font-sans">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h1 className="font-bold text-primary">Mon programme</h1>
            <Image src="/images/logo.png" alt="STRYV" width={28} height={28} className="w-7 h-7 object-contain opacity-70" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <Dumbbell size={40} className="text-secondary mx-auto mb-4 opacity-30" />
          <p className="text-sm text-secondary">Ton coach n'a pas encore créé de programme.</p>
          <p className="text-xs text-secondary/60 mt-1">Il sera visible ici dès qu'il sera prêt.</p>
        </div>
      </div>
    )
  }

  const sessions = (program.program_sessions ?? [])
    .sort((a: any, b: any) => a.position - b.position)

  // Current day highlight (1=Mon…7=Sun)
  const jsDay = new Date().getDay() // 0=Sun
  const todayDow = jsDay === 0 ? 7 : jsDay

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-primary">{program.name}</h1>
            <p className="text-xs text-secondary mt-0.5">
              {program.weeks} semaine{program.weeks > 1 ? 's' : ''} · {sessions.length} séance{sessions.length !== 1 ? 's' : ''}
              {program.description && ` · ${program.description}`}
            </p>
          </div>
          <Image src="/images/logo.png" alt="STRYV" width={28} height={28} className="w-7 h-7 object-contain opacity-70" />
        </div>
      </header>

      {/* Day strip */}
      <div className="max-w-lg mx-auto px-6 pt-4">
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => {
            const dow = i + 1
            const hasSession = sessions.some((s: any) => s.day_of_week === dow)
            const isToday = dow === todayDow
            return (
              <div
                key={d}
                className={`flex-1 flex flex-col items-center py-2 rounded-btn text-[10px] font-bold transition-colors ${
                  isToday
                    ? 'bg-accent text-white'
                    : hasSession
                    ? 'bg-surface-light text-primary shadow-soft-in'
                    : 'text-secondary/40'
                }`}
              >
                <span>{d}</span>
                {hasSession && <span className={`w-1 h-1 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-accent'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 py-5 flex flex-col gap-4">
        {sessions.map((session: any) => {
          const exercises = (session.program_exercises ?? [])
            .sort((a: any, b: any) => a.position - b.position)
          const isToday = session.day_of_week === todayDow

          return (
            <div
              key={session.id}
              className={`bg-surface rounded-card shadow-soft-out overflow-hidden ${isToday ? 'ring-2 ring-accent/30' : ''}`}
            >
              {/* Session header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-accent/5' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary text-sm">{session.name}</p>
                    {isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-white">Aujourd'hui</span>
                    )}
                  </div>
                  {session.day_of_week && (
                    <p className="text-[10px] text-secondary mt-0.5">{DAYS[session.day_of_week - 1]}</p>
                  )}
                </div>
                <Link
                  href={`/client/programme/session/${session.id}`}
                  className="flex items-center gap-1.5 bg-accent text-white text-[11px] font-bold px-3 py-1.5 rounded-btn hover:opacity-90 transition-opacity shadow"
                >
                  <Play size={10} fill="white" />
                  Commencer
                </Link>
              </div>

              {/* Exercises */}
              <div className="divide-y divide-white/30">
                {exercises.map((ex: any, i: number) => (
                  <div key={ex.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-surface-light text-secondary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{ex.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold text-accent">
                          {ex.sets} × {ex.reps}
                        </span>
                        {ex.rest_sec && (
                          <span className="flex items-center gap-0.5 text-[10px] text-secondary">
                            <Clock size={9} />{ex.rest_sec}s
                          </span>
                        )}
                        {ex.rir !== null && ex.rir !== undefined && (
                          <span className="flex items-center gap-0.5 text-[10px] text-secondary">
                            <RotateCcw size={9} />RIR {ex.rir}
                          </span>
                        )}
                      </div>
                      {ex.notes && (
                        <p className="text-[10px] text-secondary/70 mt-1 italic">{ex.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}

function NoProgramPage() {
  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-bold text-primary">Mon programme</h1>
          <Image src="/images/logo.png" alt="STRYV" width={28} height={28} className="w-7 h-7 object-contain opacity-70" />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <Dumbbell size={40} className="text-secondary mx-auto mb-4 opacity-30" />
        <p className="text-sm text-secondary">Ton coach n'a pas encore créé de programme.</p>
        <p className="text-xs text-secondary/60 mt-1">Il sera visible ici dès qu'il sera prêt.</p>
      </div>
    </div>
  )
}
