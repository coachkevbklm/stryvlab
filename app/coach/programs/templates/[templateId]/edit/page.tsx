import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ProgramTemplateBuilder from '@/components/programs/ProgramTemplateBuilder'

export default async function EditProgramTemplatePage({ params }: { params: { templateId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: template } = await db
    .from('coach_program_templates')
    .select(`
      id, name, description, goal, level, frequency, weeks, muscle_tags, notes,
      equipment_archetype, is_system, coach_id,
      coach_program_template_sessions (
        id, name, day_of_week, position, notes,
        coach_program_template_exercises (
          id, name, sets, reps, rest_sec, rir, notes, position, image_url,
          movement_pattern, equipment_required
        )
      )
    `)
    .eq('id', params.templateId)
    .or(`coach_id.eq.${user.id},is_system.eq.true`)
    .single()

  if (!template) notFound()

  // Système ou non-propriétaire → vue lecture seule
  if ((template as any).is_system || (template as any).coach_id !== user.id) {
    const { redirect } = await import('next/navigation')
    redirect(`/coach/programs/templates/${params.templateId}/view`)
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b border-white/10 px-8 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/coach/programs/templates" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-3 font-medium transition-colors">
            <ChevronLeft size={16} />Templates
          </Link>
          <h1 className="text-xl font-bold text-white">Modifier — {template.name}</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-8 py-6">
        <ProgramTemplateBuilder initial={template} templateId={params.templateId} />
      </main>
    </div>
  )
}
