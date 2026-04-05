'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Search, X, SlidersHorizontal, Check, ChevronDown } from 'lucide-react'
import exerciseCatalog from '@/data/exercise-catalog.json'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogEntry {
  id: string
  name: string
  slug: string
  gifUrl: string
  muscleGroup: string
  exerciseType: 'exercise' | 'pedagogique'
  pattern: string[]
  movementPattern: string | null
  equipment: string[]
  isCompound: boolean
  muscles: string[]
}

interface Props {
  onSelect: (exercise: { name: string; gifUrl: string; movementPattern: string | null; equipment: string[] }) => void
  onClose: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, string> = {
  abdos: 'Abdos',
  biceps: 'Biceps',
  dos: 'Dos',
  epaules: 'Épaules',
  fessiers: 'Fessiers',
  'ischio-jambiers': 'Ischio-jambiers',
  mollets: 'Mollets',
  pectoraux: 'Pectoraux',
  quadriceps: 'Quadriceps',
  triceps: 'Triceps',
}

const PATTERN_LABELS: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Jambes',
  hinge: 'Charnière (Hinge)',
  carry: 'Porté (Carry)',
  core: 'Gainage (Core)',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  machine: 'Machine',
  cable: 'Poulie',
  bodyweight: 'Poids du corps',
  kettlebell: 'Kettlebell',
  band: 'Élastique',
  smith: 'Smith Machine',
  landmine: 'Landmine',
  trx: 'Sangles/TRX',
  medicine_ball: 'Médecine-ball',
  swiss_ball: 'Swiss Ball',
  trap_bar: 'Trap Bar',
  ez_bar: 'Barre EZ',
  rings: 'Anneaux',
  sled: 'Traîneau',
  sandbag: 'Sandbag',
}

const catalog = exerciseCatalog as CatalogEntry[]

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<string>('')
  const [filterPattern, setFilterPattern] = useState<string>('')
  const [filterEquipment, setFilterEquipment] = useState<string>('')
  const [filterCompound, setFilterCompound] = useState<'all' | 'compound' | 'isolation'>('all')
  const [filterType, setFilterType] = useState<'all' | 'exercise' | 'pedagogique'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // All unique values for filter dropdowns
  const allPatterns = useMemo(() => {
    const s = new Set<string>()
    catalog.forEach(e => e.pattern.forEach(p => s.add(p)))
    return Array.from(s).sort()
  }, [])

  const allEquipment = useMemo(() => {
    const s = new Set<string>()
    catalog.forEach(e => e.equipment.forEach(eq => s.add(eq)))
    return Array.from(s).sort()
  }, [])

  const filtered = useMemo(() => {
    let results = catalog

    if (search.trim()) {
      const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      results = results.filter(e => {
        const name = e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const slug = e.slug.replace(/-/g, ' ')
        return name.includes(q) || slug.includes(q)
      })
    }

    if (filterMuscle) {
      results = results.filter(e => e.muscleGroup === filterMuscle)
    }

    if (filterPattern) {
      results = results.filter(e => e.pattern.includes(filterPattern))
    }

    if (filterEquipment) {
      results = results.filter(e => e.equipment.includes(filterEquipment))
    }

    if (filterCompound === 'compound') {
      results = results.filter(e => e.isCompound)
    } else if (filterCompound === 'isolation') {
      results = results.filter(e => !e.isCompound)
    }

    // Par défaut ('all') = exercices uniquement. 'pedagogique' = démos uniquement.
    if (filterType === 'pedagogique') {
      results = results.filter(e => e.exerciseType === 'pedagogique')
    } else {
      results = results.filter(e => e.exerciseType === 'exercise')
    }

    return results
  }, [search, filterMuscle, filterPattern, filterEquipment, filterCompound, filterType])

  const activeFiltersCount = [filterMuscle, filterPattern, filterEquipment, filterCompound !== 'all', filterType !== 'all'].filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/20 shrink-0">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un exercice…"
              className="w-full pl-8 pr-3 py-2 bg-surface-light rounded-btn text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40 placeholder-secondary/50"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-accent text-white'
                : 'bg-surface-light text-secondary hover:text-primary'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-secondary hover:text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-white/20 bg-surface-light shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Muscle group */}
              <div>
                <label className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">Muscle</label>
                <div className="relative">
                  <select
                    value={filterMuscle}
                    onChange={e => setFilterMuscle(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-surface rounded text-xs text-primary outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="">Tous</option>
                    {Object.entries(MUSCLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Pattern */}
              <div>
                <label className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">Mouvement</label>
                <div className="relative">
                  <select
                    value={filterPattern}
                    onChange={e => setFilterPattern(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-surface rounded text-xs text-primary outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="">Tous</option>
                    {allPatterns.map(p => (
                      <option key={p} value={p}>{PATTERN_LABELS[p] ?? p}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">Matériel</label>
                <div className="relative">
                  <select
                    value={filterEquipment}
                    onChange={e => setFilterEquipment(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-surface rounded text-xs text-primary outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="">Tous</option>
                    {allEquipment.map(eq => (
                      <option key={eq} value={eq}>{EQUIPMENT_LABELS[eq] ?? eq}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Compound / Isolation */}
              <div>
                <label className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">Articulations</label>
                <div className="relative">
                  <select
                    value={filterCompound}
                    onChange={e => setFilterCompound(e.target.value as 'all' | 'compound' | 'isolation')}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-surface rounded text-xs text-primary outline-none focus:ring-1 focus:ring-accent/40"
                  >
                    <option value="all">Tous</option>
                    <option value="compound">Polyarticulaire</option>
                    <option value="isolation">Isolation</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filtre type pédagogique — ligne séparée */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/20 flex-wrap">
              <span className="text-[9px] font-bold text-secondary uppercase tracking-wider shrink-0">Contenu</span>
              {([
                { value: 'all', label: 'Exercices' },
                { value: 'pedagogique', label: '🎓 Démos pédagogiques' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterType(value)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    filterType === value
                      ? 'bg-accent text-white shadow'
                      : 'bg-surface text-secondary hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
              {filterType === 'pedagogique' && (
                <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  Positions, vues anatomiques, démonstrations techniques
                </span>
              )}
            </div>

            {/* Muscle quick-pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(MUSCLE_LABELS).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilterMuscle(filterMuscle === v ? '' : v)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    filterMuscle === v
                      ? 'bg-accent text-white shadow'
                      : 'bg-surface text-secondary hover:text-primary'
                  }`}
                >
                  {l}
                </button>
              ))}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setFilterMuscle(''); setFilterPattern(''); setFilterEquipment(''); setFilterCompound('all'); setFilterType('all') }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="px-4 py-2 shrink-0">
          <p className="text-[10px] text-secondary font-medium">
            {filtered.length} exercice{filtered.length !== 1 ? 's' : ''}
            {(search || activeFiltersCount > 0) ? ' trouvés' : ' disponibles'}
          </p>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto flex-1 px-3 pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-secondary gap-2">
              <Search size={28} className="opacity-30" />
              <p className="text-sm">Aucun exercice trouvé</p>
              <p className="text-xs opacity-60">Modifie ta recherche ou tes filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(exercise => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onSelect({ name: exercise.name, gifUrl: exercise.gifUrl, movementPattern: exercise.movementPattern ?? null, equipment: exercise.equipment ?? [] })}
                  onMouseEnter={() => setHoveredId(exercise.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative flex flex-col bg-surface-light rounded-card overflow-hidden hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
                >
                  {/* GIF */}
                  <div className="relative w-full aspect-square bg-black/5 overflow-hidden">
                    {hoveredId === exercise.id ? (
                      <Image
                        src={exercise.gifUrl}
                        alt={exercise.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Image
                        src={exercise.gifUrl}
                        alt={exercise.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-white rounded-full p-1.5">
                        <Check size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 flex flex-col gap-1">
                    <p className="text-[11px] font-semibold text-primary leading-tight line-clamp-2">
                      {exercise.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.exerciseType === 'pedagogique' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          🎓 Pédagogique
                        </span>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                            {MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
                          </span>
                          {exercise.isCompound ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              Poly
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              Iso
                            </span>
                          )}
                          {exercise.pattern.slice(0, 1).map(p => (
                            <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface text-secondary">
                              {PATTERN_LABELS[p] ?? p}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
