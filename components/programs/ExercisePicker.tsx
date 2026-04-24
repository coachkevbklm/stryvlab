"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, X, SlidersHorizontal, Check, ChevronDown, Plus } from "lucide-react";
import exerciseCatalog from "@/data/exercise-catalog.json";
import CustomExerciseModal from "@/components/programs/CustomExerciseModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogEntry {
  id: string;
  name: string;
  slug: string;
  gifUrl: string;
  muscleGroup: string;
  exerciseType: "exercise" | "pedagogique";
  pattern: string[];
  movementPattern: string | null;
  equipment: string[];
  isCompound: boolean;
  muscles: string[];
  source?: 'catalog' | 'custom';
}

interface Props {
  onSelect: (exercise: {
    name: string;
    gifUrl: string;
    movementPattern: string | null;
    equipment: string[];
    isCompound: boolean;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    // Biomech fields from enriched catalog
    plane: string | null;
    mechanic: string | null;
    unilateral: boolean;
    primaryMuscle: string | null;
    primaryActivation: number | null;
    secondaryMusclesDetail: string[];
    secondaryActivations: number[];
    stabilizers: string[];
    jointStressSpine: number | null;
    jointStressKnee: number | null;
    jointStressShoulder: number | null;
    globalInstability: number | null;
    coordinationDemand: number | null;
    constraintProfile: string | null;
  }) => void;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, string> = {
  abdos: "Abdos",
  biceps: "Biceps",
  dos: "Dos",
  epaules: "Épaules",
  fessiers: "Fessiers",
  "ischio-jambiers": "Ischio-jambiers",
  mollets: "Mollets",
  pectoraux: "Pectoraux",
  quadriceps: "Quadriceps",
  triceps: "Triceps",
};

const PATTERN_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Jambes",
  hinge: "Charnière (Hinge)",
  carry: "Porté (Carry)",
  core: "Gainage (Core)",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barre",
  dumbbell: "Haltères",
  machine: "Machine",
  cable: "Poulie",
  bodyweight: "Poids du corps",
  kettlebell: "Kettlebell",
  band: "Élastique",
  smith: "Smith Machine",
  landmine: "Landmine",
  trx: "Sangles/TRX",
  medicine_ball: "Médecine-ball",
  swiss_ball: "Swiss Ball",
  trap_bar: "Trap Bar",
  ez_bar: "Barre EZ",
  rings: "Anneaux",
  sled: "Traîneau",
  sandbag: "Sandbag",
};

const catalog = exerciseCatalog as CatalogEntry[];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("");
  const [filterPattern, setFilterPattern] = useState<string>("");
  const [filterEquipment, setFilterEquipment] = useState<string>("");
  const [filterCompound, setFilterCompound] = useState<
    "all" | "compound" | "isolation"
  >("all");
  const [filterType, setFilterType] = useState<
    "all" | "exercise" | "pedagogique"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [sourceFilter, setSourceFilter] = useState<'all' | 'stryvr' | 'custom'>('all')
  const [customExercises, setCustomExercises] = useState<CatalogEntry[]>([])
  const [showCustomModal, setShowCustomModal] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    fetch('/api/exercises/custom')
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{
        id: string; name: string; slug: string;
        muscle_group: string | null; movement_pattern: string | null;
        equipment: string[]; is_compound: boolean; muscles: string[];
      }>) => {
        setCustomExercises(data.map(e => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          gifUrl: '',
          muscleGroup: e.muscle_group ?? 'custom',
          exerciseType: 'exercise' as const,
          pattern: e.movement_pattern ? [e.movement_pattern] : [],
          movementPattern: e.movement_pattern,
          equipment: e.equipment,
          isCompound: e.is_compound,
          muscles: e.muscles,
          source: 'custom' as const,
        })))
      })
      .catch(() => {})
  }, [])

  const allExercises = useMemo<CatalogEntry[]>(() => [
    ...catalog.map(e => ({ ...e, source: 'catalog' as const })),
    ...customExercises,
  ], [customExercises])

  // All unique values for filter dropdowns
  const allPatterns = useMemo(() => {
    const s = new Set<string>();
    allExercises.forEach((e) => e.pattern.forEach((p) => s.add(p)));
    return Array.from(s).sort();
  }, [allExercises]);

  const allEquipment = useMemo(() => {
    const s = new Set<string>();
    allExercises.forEach((e) => e.equipment.forEach((eq) => s.add(eq)));
    return Array.from(s).sort();
  }, [allExercises]);

  const filtered = useMemo(() => {
    let results = allExercises;

    if (sourceFilter === 'custom') {
      results = results.filter(e => e.source === 'custom')
    } else if (sourceFilter === 'stryvr') {
      results = results.filter(e => e.source !== 'custom')
    }

    if (search.trim()) {
      const q = search
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      results = results.filter((e) => {
        const name = e.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const slug = e.slug.replace(/-/g, " ");
        return name.includes(q) || slug.includes(q);
      });
    }

    if (filterMuscle) {
      results = results.filter((e) => e.muscleGroup === filterMuscle);
    }

    if (filterPattern) {
      results = results.filter((e) => e.pattern.includes(filterPattern));
    }

    if (filterEquipment) {
      results = results.filter((e) => e.equipment.includes(filterEquipment));
    }

    if (filterCompound === "compound") {
      results = results.filter((e) => e.isCompound);
    } else if (filterCompound === "isolation") {
      results = results.filter((e) => !e.isCompound);
    }

    // Par défaut ('all') = exercices uniquement. 'pedagogique' = démos uniquement.
    if (filterType === "pedagogique") {
      results = results.filter((e) => e.exerciseType === "pedagogique");
    } else {
      results = results.filter((e) => e.exerciseType === "exercise");
    }

    return results;
  }, [
    search,
    sourceFilter,
    filterMuscle,
    filterPattern,
    filterEquipment,
    filterCompound,
    filterType,
    allExercises,
  ]);

  const activeFiltersCount = [
    filterMuscle,
    filterPattern,
    filterEquipment,
    filterCompound !== "all",
    filterType !== "all",
    sourceFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-[#181818] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/20 shrink-0">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un exercice…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0a0a] border-input text-sm text-white outline-none focus:ring-2 focus:ring-[#1f8a65]/40 placeholder:text-white/25 h-10"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((f) => !f)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "bg-[#1f8a65] text-white"
                : "bg-white/[0.03] text-white/70 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1f8a65] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-white/20 bg-[#0a0a0a] shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Muscle group */}
              <div>
                <label className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Muscle
                </label>
                <div className="relative">
                  <select
                    value={filterMuscle}
                    onChange={(e) => setFilterMuscle(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-[#0a0a0a] rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                  >
                    <option value="">Tous</option>
                    {Object.entries(MUSCLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={10}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                </div>
              </div>

              {/* Pattern */}
              <div>
                <label className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Mouvement
                </label>
                <div className="relative">
                  <select
                    value={filterPattern}
                    onChange={(e) => setFilterPattern(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-[#0a0a0a] rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                  >
                    <option value="">Tous</option>
                    {allPatterns.map((p) => (
                      <option key={p} value={p}>
                        {PATTERN_LABELS[p] ?? p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={10}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Matériel
                </label>
                <div className="relative">
                  <select
                    value={filterEquipment}
                    onChange={(e) => setFilterEquipment(e.target.value)}
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-[#0a0a0a] rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                  >
                    <option value="">Tous</option>
                    {allEquipment.map((eq) => (
                      <option key={eq} value={eq}>
                        {EQUIPMENT_LABELS[eq] ?? eq}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={10}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                </div>
              </div>

              {/* Compound / Isolation */}
              <div>
                <label className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Articulations
                </label>
                <div className="relative">
                  <select
                    value={filterCompound}
                    onChange={(e) =>
                      setFilterCompound(
                        e.target.value as "all" | "compound" | "isolation",
                      )
                    }
                    className="w-full appearance-none pl-2 pr-6 py-1.5 bg-[#0a0a0a] rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#1f8a65]/40"
                  >
                    <option value="all">Tous</option>
                    <option value="compound">Polyarticulaire</option>
                    <option value="isolation">Isolation</option>
                  </select>
                  <ChevronDown
                    size={10}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Filtre type pédagogique — ligne séparée */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/20 flex-wrap">
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider shrink-0">
                Contenu
              </span>
              {(
                [
                  { value: "all", label: "Exercices" },
                  { value: "pedagogique", label: "🎓 Démos pédagogiques" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterType(value)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    filterType === value
                      ? "bg-[#1f8a65] text-white"
                      : "bg-[#0a0a0a] text-white/70 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
              {filterType === "pedagogique" && (
                <span className="text-[9px] text-white/70 bg-white/[0.04] px-2 py-0.5 rounded-full font-medium">
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
                  onClick={() => setFilterMuscle(filterMuscle === v ? "" : v)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    filterMuscle === v
                      ? "bg-[#1f8a65] text-white"
                      : "bg-[#0a0a0a] text-white/60 hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMuscle("");
                    setFilterPattern("");
                    setFilterEquipment("");
                    setFilterCompound("all");
                    setFilterType("all");
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/[0.03] text-white/70 hover:bg-white/[0.06] transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        )}

        {/* Source filter pills + Create button */}
        <div className="px-4 pt-2 pb-1 flex items-center gap-2 shrink-0">
          {(
            [
              { value: 'all', label: 'Tous' },
              { value: 'stryvr', label: 'Catalogue STRYVR' },
              { value: 'custom', label: 'Mes exercices' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                sourceFilter === value
                  ? 'bg-[#1f8a65]/10 text-[#1f8a65]'
                  : 'bg-white/[0.02] text-white/35 hover:bg-white/[0.05] hover:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/80 transition-all"
          >
            <Plus size={11} />
            Créer un exercice
          </button>
        </div>

        {/* Results count */}
        <div className="px-4 py-1 shrink-0">
          <p className="text-[10px] text-white/70 font-medium">
            {filtered.length} exercice{filtered.length !== 1 ? "s" : ""}
            {search || activeFiltersCount > 0 ? " trouvés" : " disponibles"}
          </p>
        </div>

        {/* Custom Exercise Modal */}
        {showCustomModal && (
          <CustomExerciseModal
            onClose={() => setShowCustomModal(false)}
            onCreated={(ex) => {
              const newEntry: CatalogEntry = {
                id: `custom-${Date.now()}`,
                name: ex.name,
                slug: ex.name.toLowerCase().replace(/\s+/g, '-'),
                gifUrl: ex.mediaUrl,
                muscleGroup: 'custom',
                exerciseType: 'exercise',
                pattern: ex.movementPattern ? [ex.movementPattern] : [],
                movementPattern: ex.movementPattern || null,
                equipment: ex.equipment,
                isCompound: ex.isCompound,
                muscles: ex.primaryMuscle ? [ex.primaryMuscle] : [],
                source: 'custom',
              }
              setCustomExercises(prev => [...prev, newEntry])
              setSourceFilter('custom')
              setShowCustomModal(false)
            }}
          />
        )}

        {/* Grid */}
        <div className="overflow-y-auto flex-1 px-3 pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/60 gap-2">
              <Search size={28} className="opacity-30" />
              <p className="text-sm">Aucun exercice trouvé</p>
              <p className="text-xs opacity-60">
                Modifie ta recherche ou tes filtres
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    const ex = exercise as unknown as Record<string, unknown>
                    onSelect({
                      name: exercise.name,
                      gifUrl: exercise.gifUrl,
                      movementPattern: exercise.movementPattern ?? null,
                      equipment: exercise.equipment ?? [],
                      isCompound: exercise.isCompound ?? false,
                      primaryMuscles: exercise.muscles ?? [],
                      secondaryMuscles: [],
                      plane: (ex.plane as string | null) ?? null,
                      mechanic: (ex.mechanic as string | null) ?? null,
                      unilateral: (ex.unilateral as boolean) ?? false,
                      primaryMuscle: (ex.primaryMuscle as string | null) ?? null,
                      primaryActivation: (ex.primaryActivation as number | null) ?? null,
                      secondaryMusclesDetail: (ex.secondaryMuscles as string[]) ?? [],
                      secondaryActivations: (ex.secondaryActivations as number[]) ?? [],
                      stabilizers: (ex.stabilizers as string[]) ?? [],
                      jointStressSpine: (ex.jointStressSpine as number | null) ?? null,
                      jointStressKnee: (ex.jointStressKnee as number | null) ?? null,
                      jointStressShoulder: (ex.jointStressShoulder as number | null) ?? null,
                      globalInstability: (ex.globalInstability as number | null) ?? null,
                      coordinationDemand: (ex.coordinationDemand as number | null) ?? null,
                      constraintProfile: (ex.constraintProfile as string | null) ?? null,
                    })
                  }}
                  onMouseEnter={() => setHoveredId(exercise.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative flex flex-col bg-[#0a0a0a] rounded-2xl overflow-hidden hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left"
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
                    <div className="absolute inset-0 bg-[#1f8a65]/0 group-hover:bg-[#1f8a65]/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1f8a65] text-white rounded-full p-1.5">
                        <Check size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 flex flex-col gap-1">
                    <div className="flex items-start gap-1">
                      <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2 flex-1">
                        {exercise.name}
                      </p>
                      {exercise.source === 'custom' && (
                        <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1f8a65]/15 text-[#1f8a65]">
                          Perso
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.exerciseType === "pedagogique" ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/80">
                          🎓 Pédagogique
                        </span>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1f8a65]/10 text-[#1f8a65]">
                            {MUSCLE_LABELS[exercise.muscleGroup] ??
                              exercise.muscleGroup}
                          </span>
                          {exercise.isCompound ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/80">
                              Poly
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/80">
                              Iso
                            </span>
                          )}
                          {exercise.pattern.slice(0, 1).map((p) => (
                            <span
                              key={p}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0a0a0a] text-white/70"
                            >
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
  );
}
