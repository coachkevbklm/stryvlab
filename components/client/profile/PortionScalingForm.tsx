"use client"

import { useEffect, useState } from "react"
import { Check, Ruler, X } from "lucide-react"
import {
  REFERENCE_HAND_CM,
  HEIGHT_TO_HAND_RATIO,
} from "@/lib/nutrition/food-items"

export default function PortionScalingForm() {
  const [handCm, setHandCm] = useState<string>("")
  const [heightCm, setHeightCm] = useState<number | null>(null)
  const [savedHand, setSavedHand] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    fetch("/api/client/profile-scaling")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setSavedHand(d.hand_length_cm ?? null)
        setHeightCm(d.height_cm ?? null)
        if (d.hand_length_cm) setHandCm(String(d.hand_length_cm))
      })
      .finally(() => setLoading(false))
  }, [])

  const derivedFromHeight = heightCm ? Math.round(heightCm * HEIGHT_TO_HAND_RATIO * 10) / 10 : null
  const effective = savedHand ?? derivedFromHeight ?? REFERENCE_HAND_CM
  const factor = effective / REFERENCE_HAND_CM
  const palmGrams = Math.round(100 * factor)

  async function save() {
    setSaving(true)
    const val = handCm.trim() === "" ? null : Number(handCm)
    const res = await fetch("/api/client/profile-scaling", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hand_length_cm: val }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedHand(val)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 1800)
    }
  }

  async function clearOverride() {
    setHandCm("")
    setSaving(true)
    await fetch("/api/client/profile-scaling", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hand_length_cm: null }),
    })
    setSavedHand(null)
    setSaving(false)
  }

  if (loading) {
    return <div className="h-32 bg-white/[0.03] rounded-xl animate-pulse" />
  }

  return (
    <div className="space-y-4">
      {/* Explication */}
      <p className="text-[12px] text-white/50 leading-relaxed">
        Les portions visuelles (paume, poing, pouce) sont calibrées sur une main adulte de référence (18 cm).
        Mesure ta main pour des grammages personnalisés.
      </p>

      {/* Source actuelle */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-bold">
            Main effective
          </span>
          <span className="text-[14px] font-black text-white">
            {effective.toFixed(1)} cm
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-bold">
            1 paume = viande
          </span>
          <span className="text-[14px] font-black text-[#ffe01e]">{palmGrams} g</span>
        </div>
        <p className="text-[10px] text-white/30">
          Source : {savedHand
            ? "ta mesure"
            : derivedFromHeight
              ? `dérivée taille (${heightCm} cm × 0.108)`
              : "référence 18 cm"}
        </p>
      </div>

      {/* Input + guide */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
            Longueur main (cm)
          </label>
          <button
            type="button"
            onClick={() => setShowGuide((s) => !s)}
            className="text-[11px] text-[#ffe01e]/80 hover:text-[#ffe01e] flex items-center gap-1"
          >
            <Ruler size={11} />
            {showGuide ? "Masquer" : "Comment mesurer"}
          </button>
        </div>

        {showGuide && (
          <div className="bg-[#ffe01e]/[0.04] border border-[#ffe01e]/[0.18] rounded-xl p-3 mb-3 space-y-1.5">
            <p className="text-[11px] text-white/70 leading-relaxed">
              <span className="font-bold">1.</span> Pose la main à plat, doigts serrés.
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              <span className="font-bold">2.</span> Mesure du pli du poignet jusqu'au bout du majeur.
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              <span className="font-bold">3.</span> Utilise un mètre ruban ou une règle (pas un téléphone).
            </p>
            <p className="text-[10px] text-white/40 mt-2">
              Réf femme moyenne : 17.2 cm · homme moyen : 18.9 cm
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="10"
            max="28"
            step="0.1"
            value={handCm}
            onChange={(e) => setHandCm(e.target.value)}
            placeholder={derivedFromHeight ? `auto: ${derivedFromHeight}` : "18.0"}
            className="flex-1 h-11 px-3 bg-[#161616] border border-white/[0.08] rounded-xl text-[14px] font-bold text-white outline-none focus:border-[#ffe01e]/40 min-w-0"
          />
          <button
            onClick={save}
            disabled={saving || handCm.trim() === ""}
            className="h-11 px-4 bg-[#ffe01e] text-[#0d0d0d] rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] active:scale-[0.98] disabled:opacity-40"
          >
            {savedToast ? <Check size={15} /> : "Sauver"}
          </button>
          {savedHand !== null && (
            <button
              onClick={clearOverride}
              disabled={saving}
              className="h-11 w-11 flex items-center justify-center bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/40 hover:text-white/70 active:scale-95"
              title="Effacer (revenir à la valeur auto)"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
