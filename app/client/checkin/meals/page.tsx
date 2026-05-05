"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

type Meal = {
  id: string;
  name: string;
  logged_at: string;
  photo_url: string | null;
  quality_rating: number | null;
  notes: string | null;
  estimated_macros?: {
    calories_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
    fiber_g?: number;
  } | null;
};

function dateIso(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ClientMealsPage() {
  const [selectedDate, setSelectedDate] = useState(dateIso(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    quality_rating: 3,
    notes: "",
    logged_at: new Date().toISOString(),
    photo_url: "" as string,
    calories_kcal: "",
    protein_g: "",
    carbs_g: "",
    fats_g: "",
    fiber_g: "",
  });

  async function loadMeals(date = selectedDate) {
    setLoading(true);
    const res = await fetch(`/api/client/meals?date=${date}&limit=100`);
    const data = await res.json();
    setMeals(data?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMeals(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function createMeal() {
    if (!form.name.trim()) return;
    const res = await fetch("/api/client/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        quality_rating: form.quality_rating ?? null,
        notes: form.notes || null,
        logged_at: form.logged_at,
        photo_url: form.photo_url || null,
        estimated_macros: {
          calories_kcal: form.calories_kcal ? Number(form.calories_kcal) : undefined,
          protein_g: form.protein_g ? Number(form.protein_g) : undefined,
          carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
          fats_g: form.fats_g ? Number(form.fats_g) : undefined,
          fiber_g: form.fiber_g ? Number(form.fiber_g) : undefined,
        },
      }),
    });
    if (res.ok) {
      setAdding(false);
      setForm({
        name: "",
        quality_rating: 3,
        notes: "",
        logged_at: new Date().toISOString(),
        photo_url: "",
        calories_kcal: "",
        protein_g: "",
        carbs_g: "",
        fats_g: "",
        fiber_g: "",
      });
      await loadMeals(selectedDate);
    }
  }

  async function deleteMeal(id: string) {
    const res = await fetch(`/api/client/meals/${id}`, { method: "DELETE" });
    if (res.ok) await loadMeals(selectedDate);
  }

  const sortedMeals = useMemo(
    () =>
      [...meals].sort(
        (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
      ),
    [meals]
  );

  const timelineMeals = sortedMeals.map((meal) => ({
    ...meal,
    timeLabel: new Date(meal.logged_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }));

  async function uploadPhoto(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/client/meals/upload-photo", { method: "POST", body });
    if (!res.ok) return;
    const data = await res.json();
    setForm((f) => ({ ...f, photo_url: data.url ?? "" }));
  }

  function shiftDay(delta: number) {
    const base = new Date(`${selectedDate}T12:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + delta);
    setSelectedDate(base.toISOString().slice(0, 10));
  }

  return (
    <main className="min-h-screen bg-[#121212] px-4 pt-[88px] pb-24">
      <section className="max-w-lg mx-auto space-y-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-2">
            Agenda repas
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDay(-1)} className="h-10 px-3 rounded-xl bg-white/[0.04] text-white/80 text-[12px]">◀</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]"
            />
            <button onClick={() => shiftDay(1)} className="h-10 px-3 rounded-xl bg-white/[0.04] text-white/80 text-[12px]">▶</button>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold mb-4">
            Timeline journalière
          </p>
          {loading ? (
            <p className="text-white/50 text-[12px]">Chargement...</p>
          ) : !timelineMeals.length ? (
            <p className="text-white/35 text-[12px]">Aucun repas loggué.</p>
          ) : (
            <div className="space-y-3">
              {timelineMeals.map((meal) => (
                <div key={meal.id} className="relative pl-14">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-white/[0.08]" />
                  <div className="absolute left-2 top-3 w-6 h-6 rounded-full bg-[#1f8a65]/20 border border-[#1f8a65]/30" />
                  <p className="text-[11px] text-white/45 mb-1">{meal.timeLabel}</p>
                  <div className="relative overflow-hidden rounded-xl">
                    {deletingId === meal.id && (
                      <div className="absolute inset-0 bg-red-500/20 border border-red-500/35 rounded-xl flex items-center justify-end pr-3">
                        <button onClick={() => deleteMeal(meal.id)} className="text-[11px] text-red-200 font-semibold">Confirmer</button>
                      </div>
                    )}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -80, right: 0 }}
                      onDragEnd={(_, info) => setDeletingId(info.offset.x < -50 ? meal.id : null)}
                      className="bg-white/[0.03] rounded-xl p-3 flex items-start gap-3"
                    >
                      {meal.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={meal.photo_url} alt={meal.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white/[0.05]" />
                      )}
                      <div className="flex-1">
                        <p className="text-[13px] text-white font-semibold">{meal.name}</p>
                        <p className="text-[11px] text-white/50">Qualité {meal.quality_rating ?? "-"} / 5</p>
                        {(meal.estimated_macros?.protein_g || meal.estimated_macros?.carbs_g || meal.estimated_macros?.fats_g) ? (
                          <p className="text-[10px] text-white/35 mt-0.5">
                            P {meal.estimated_macros?.protein_g ?? 0}g · G {meal.estimated_macros?.carbs_g ?? 0}g · L {meal.estimated_macros?.fats_g ?? 0}g
                          </p>
                        ) : null}
                        {meal.notes ? <p className="text-[11px] text-white/60 mt-1">{meal.notes}</p> : null}
                      </div>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setAdding(true)}
          className="fixed bottom-24 right-6 h-12 px-4 rounded-full bg-[#1f8a65] text-white text-[12px] font-bold shadow-[0_8px_24px_rgba(31,138,101,0.35)]"
        >
          + Ajouter un repas
        </button>
      </section>

      <AnimatePresence>
        {adding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdding(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.section
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-[#181818] border-t border-white/[0.08] p-4 space-y-3 max-h-[82vh] overflow-y-auto pb-[max(20px,env(safe-area-inset-bottom))]"
            >
              <p className="text-[12px] font-semibold text-white">Ajouter un repas</p>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du repas"
                className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={form.logged_at.slice(0, 10)}
                  onChange={(e) => {
                    const t = form.logged_at.slice(11, 16);
                    setForm((f) => ({ ...f, logged_at: new Date(`${e.target.value}T${t}:00`).toISOString() }));
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]"
                />
                <input
                  type="time"
                  value={form.logged_at.slice(11, 16)}
                  onChange={(e) => {
                    const d = form.logged_at.slice(0, 10);
                    setForm((f) => ({ ...f, logged_at: new Date(`${d}T${e.target.value}:00`).toISOString() }));
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]"
                />
              </div>
              <label className="block rounded-xl border border-dashed border-[#1f8a65]/45 bg-[#1f8a65]/10 p-3 text-center cursor-pointer">
                <span className="text-[12px] font-semibold text-[#66f5c4]">Ajouter une photo</span>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} className="hidden" />
                {form.photo_url ? <p className="text-[10px] text-white/55 mt-1">Photo ajoutée</p> : <p className="text-[10px] text-white/45 mt-1">JPEG/PNG</p>}
              </label>
              <div>
                <p className="text-[11px] text-white/50 mb-1">Qualité estimée: {form.quality_rating}</p>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[form.quality_rating]}
                  onValueChange={(next) =>
                    setForm((f) => ({
                      ...f,
                      quality_rating: typeof next[0] === "number" && Number.isFinite(next[0]) ? Number(next[0]) : f.quality_rating,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.calories_kcal} onChange={(e) => setForm((f) => ({ ...f, calories_kcal: e.target.value }))} placeholder="Calories (kcal)" className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]" />
                <input value={form.protein_g} onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))} placeholder="Protéines (g)" className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]" />
                <input value={form.carbs_g} onChange={(e) => setForm((f) => ({ ...f, carbs_g: e.target.value }))} placeholder="Glucides (g)" className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]" />
                <input value={form.fats_g} onChange={(e) => setForm((f) => ({ ...f, fats_g: e.target.value }))} placeholder="Lipides (g)" className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]" />
                <input value={form.fiber_g} onChange={(e) => setForm((f) => ({ ...f, fiber_g: e.target.value }))} placeholder="Fibres (g)" className="w-full h-10 px-3 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px] col-span-2" />
              </div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optionnel)"
                className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/[0.08] text-white text-[12px]"
              />
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="h-10 px-4 rounded-xl bg-white/[0.08] text-white text-[12px] font-semibold">Annuler</button>
                <button onClick={createMeal} className="flex-1 h-10 px-4 rounded-xl bg-[#1f8a65] text-white text-[12px] font-semibold">Enregistrer</button>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
