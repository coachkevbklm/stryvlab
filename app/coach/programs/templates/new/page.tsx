import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ProgramTemplateBuilder from '@/components/programs/ProgramTemplateBuilder'

export default function NewProgramTemplatePage() {
  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-8 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/coach/programs/templates" className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-3 font-medium transition-colors">
            <ChevronLeft size={16} />Templates
          </Link>
          <h1 className="text-xl font-bold text-primary">Nouveau template</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-8 py-6">
        <ProgramTemplateBuilder />
      </main>
    </div>
  )
}
