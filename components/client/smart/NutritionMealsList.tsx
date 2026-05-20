"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Coffee, Sun, Moon, Apple, Droplets } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NutritionMeal } from "@/lib/nutrition/food-items"
import { useClientT } from "@/components/client/ClientI18nProvider"
import type { ClientDictKey } from "@/lib/i18n/clientTranslations"
import type { NutritionMacros } from "./SmartNutritionWidget"

const MC = { prot: '#e85d04', carb: '#2d9a4e', fat: '#d4a017' }

const MEAL_TYPE_KEYS: Record<string, ClientDictKey> = {
  breakfast: "meal.type.breakfast",
  lunch:     "meal.type.lunch",
  dinner:    "meal.type.dinner",
  snack:     "meal.type.snack",
}

const MEAL_TYPE_ICON: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch:     Sun,
  dinner:    Moon,
  snack:     Apple,
  drinks:    Droplets,
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })
}

function MacroStrip({ p, g, f }: { p: number; g: number; f: number }) {
  const pK = p * 4, gK = g * 4, fK = f * 9
  const total = pK + gK + fK || 1
  return (
    <div className="flex h-[4px] rounded-full overflow-hidden gap-[2px]">
      <div className="rounded-full" style={{ width: `${(pK / total) * 100}%`, backgroundColor: MC.prot }} />
      <div className="rounded-full" style={{ width: `${(gK / total) * 100}%`, backgroundColor: MC.carb }} />
      <div className="rounded-full" style={{ width: `${(fK / total) * 100}%`, backgroundColor: MC.fat }} />
    </div>
  )
}

function MealTypeChooser({ mealId, current, onChange }: { mealId: string; current: string; onChange: (t: string) => void }) {
  const { t } = useClientT()
  const [open, setOpen] = useState(false)
  const types = ["breakfast", "lunch", "dinner", "snack"] as const

  async function pick(type: string) {
    setOpen(false)
    onChange(type)
    await fetch(`/api/client/nutrition/meals/${mealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal_type: type }),
    })
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 group">
        {(() => { const Icon = MEAL_TYPE_ICON[current] ?? Coffee; return <Icon size={11} className="text-white/50 group-hover:text-white/80 transition-colors" /> })()}
        <span className="text-[11px] font-bold text-white/70 group-hover:text-white transition-colors">
          {MEAL_TYPE_KEYS[current] ? t(MEAL_TYPE_KEYS[current]) : current}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-white/20 group-hover:text-white/50 transition-colors" fill="currentColor"><path d="M4 5L1 2h6L4 5z"/></svg>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-6 z-50 bg-[#111111] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.7)] min-w-[140px]"
            >
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => pick(type)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/[0.06] ${
                    type === current ? "text-[#f2f2f2] font-bold" : "text-white/70"
                  }`}
                >
                  {(() => { const Icon = MEAL_TYPE_ICON[type] ?? Coffee; return <Icon size={12} className="text-white/40" /> })()}
                  {MEAL_TYPE_KEYS[type] ? t(MEAL_TYPE_KEYS[type]) : type}
                  {type === current && <Check size={10} className="ml-auto text-[#f2f2f2]" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function MealCard({
  meal, expanded, onToggle, onDelete, onTypeChange, onAddMore, isDeleting,
}: {
  meal: NutritionMeal
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onTypeChange: (t: string) => void
  onAddMore: () => void
  isDeleting: boolean
}) {
  const { t } = useClientT()
  return (
    <motion.div
      layout
      animate={{ opacity: isDeleting ? 0 : 1 }}
      transition={{ duration: 0.25 }}
      className="bg-[#111111] rounded-2xl overflow-hidden"
    >
      <div className="flex items-center px-4 pt-4 pb-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <MealTypeChooser mealId={meal.id} current={meal.meal_type} onChange={onTypeChange} />
          <p className="text-[10px] text-white/25 mt-0.5">{formatTime(meal.logged_at)}</p>
        </div>
        <div className="text-right mr-3">
          <p className="text-[22px] font-black text-white leading-none">{Math.round(meal.total_calories)}</p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">kcal</p>
        </div>
        <div className="text-white/20 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-3 mb-2">
          <span className="text-[11px] font-semibold" style={{ color: MC.prot }}>P {meal.total_protein_g}g</span>
          <span className="text-[11px] font-semibold" style={{ color: MC.carb }}>G {meal.total_carbs_g}g</span>
          <span className="text-[11px] font-semibold" style={{ color: MC.fat }}>L {meal.total_fat_g}g</span>
        </div>
        <MacroStrip p={meal.total_protein_g} g={meal.total_carbs_g} f={meal.total_fat_g} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-4 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20 pt-3 pb-2">
                {t('journal.ingredients')}
              </p>
              {meal.entries && meal.entries.length > 0 ? (
                <div className="space-y-2">
                  {meal.entries.map(e => {
                    const name = (e as any).food_items?.name_fr ?? "—"
                    return (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                          <span className="text-[12px] text-white/65 truncate">{name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-[11px] text-white/25">{e.quantity_g}g</span>
                          <span className="text-[11px] text-white/40 font-semibold w-14 text-right">
                            {Math.round(e.calories_kcal)} kcal
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-white/20 pb-1">—</p>
              )}
            </div>
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <button
                onClick={onAddMore}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-white/[0.05] rounded-xl text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.08] active:scale-[0.98] transition-all"
              >
                <Plus size={11} />
                {t('journal.addIngredients')}
              </button>
              <button
                onClick={onDelete}
                className="h-8 w-8 flex items-center justify-center bg-red-500/10 border border-red-500/15 rounded-xl text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface Props {
  initialMeals: NutritionMeal[]
  date: string
  target: NutritionMacros
}

export default function NutritionMealsList({ initialMeals, date }: Props) {
  const { t } = useClientT()
  const router = useRouter()
  const [meals, setMeals] = useState<NutritionMeal[]>(initialMeals)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialMeals.map(m => m.id)))
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; label: string } | null>(null)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function executeDelete() {
    if (!confirmTarget) return
    const { id } = confirmTarget
    setConfirmTarget(null)
    setDeletingId(id)
    const res = await fetch(`/api/client/nutrition/meals/${id}`, { method: "DELETE" })
    if (res.ok) {
      setMeals(prev => prev.filter(m => m.id !== id))
      router.refresh()
    }
    setDeletingId(null)
  }

  function updateMealType(id: string, mealType: string) {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, meal_type: mealType as any } : m))
  }

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
          <Coffee size={20} className="text-white/15" />
        </div>
        <p className="text-[13px] text-white/25">{t('journal.noMeals')}</p>
        <button
          onClick={() => router.push("/client/nutrition/log")}
          className="h-10 px-5 bg-[#f2f2f2] text-[#0d0d0d] text-[11px] font-bold uppercase tracking-[0.12em] rounded-xl active:scale-95 transition-all"
        >
          {t('journal.addMeal')}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25 px-1">
          {t('journal.dayBilan')}
        </p>
        <AnimatePresence>
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              expanded={expanded.has(meal.id)}
              onToggle={() => toggleExpand(meal.id)}
              onDelete={() => setConfirmTarget({ id: meal.id, label: MEAL_TYPE_KEYS[meal.meal_type] ? t(MEAL_TYPE_KEYS[meal.meal_type]) : meal.meal_type })}
              onTypeChange={type => updateMealType(meal.id, type)}
              onAddMore={() => router.push(`/client/nutrition/log?meal_id=${meal.id}`)}
              isDeleting={deletingId === meal.id}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmTarget(null)}
              className="fixed inset-0 z-[80] bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-[100px] left-4 right-4 z-[90] max-w-[400px] mx-auto bg-[#111111] rounded-2xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.8)]"
            >
              <p className="text-[14px] font-bold text-white mb-1">{t('journal.deleteTitle')}</p>
              <p className="text-[12px] text-white/40 mb-5">
                {t('journal.deleteDesc', { label: confirmTarget.label })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="flex-1 h-10 rounded-xl bg-white/[0.06] text-[12px] font-semibold text-white/60 hover:text-white active:scale-[0.98] transition-all"
                >
                  {t('journal.cancel')}
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-[12px] font-bold text-white hover:bg-red-600 active:scale-[0.98] transition-all"
                >
                  {t('journal.delete')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
