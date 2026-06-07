"use client";

import { useState } from "react";
import { Mic, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

<<<<<<< ours
const VoiceLogSheet = dynamic(
  () => import("@/components/client/smart/VoiceLogSheet"),
  { ssr: false },
);
const MealLogSheet = dynamic(
  () => import("@/components/client/smart/MealLogSheet"),
  { ssr: false },
);
||||||| base
const VoiceLogSheet = dynamic(() => import("@/components/client/smart/VoiceLogSheet"), { ssr: false })
const MealLogSheet = dynamic(() => import("@/components/client/smart/MealLogSheet"), { ssr: false })
=======
const VoiceLogSheet = dynamic(() => import("@/components/client/smart/VoiceLogSheet"), { ssr: false })
const MealLogSheet = dynamic(() => import("@/components/client/smart/MealLogSheet"), { ssr: false })
const MealMethodSheet = dynamic(() => import("@/components/client/smart/MealMethodSheet"), { ssr: false })
import type { MealMethodAction } from "@/components/client/smart/MealMethodSheet"
>>>>>>> theirs

interface VoiceEntryFabProps {
<<<<<<< ours
  lang?: string;
  onSuccess?: () => void;
||||||| base
  lang?: string
  onSuccess?: () => void
=======
  lang?: string
  onSuccess?: () => void
  currentDate?: string
>>>>>>> theirs
}

<<<<<<< ours
export default function VoiceEntryFab({
  lang = "fr",
  onSuccess,
}: VoiceEntryFabProps) {
  const router = useRouter();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
||||||| base
export default function VoiceEntryFab({ lang = "fr", onSuccess }: VoiceEntryFabProps) {
  const router = useRouter()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [mealOpen, setMealOpen] = useState(false)
=======
export default function VoiceEntryFab({ lang = "fr", onSuccess, currentDate }: VoiceEntryFabProps) {
  const router = useRouter()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [mealOpen, setMealOpen] = useState(false)
  const [mealMethodOpen, setMealMethodOpen] = useState(false)
  const [quickInputMode, setQuickInputMode] = useState<"voice" | "text">("voice")
  const [mealComposerMode, setMealComposerMode] = useState<"standard" | "guide" | "simulation">("standard")
  const [mealEntryMode, setMealEntryMode] = useState<"default" | "search" | "favorites" | "categories">("default")
>>>>>>> theirs

  function handleSuccess() {
    onSuccess?.();
    // Delay refresh so AnimatePresence exit animation completes first
    setTimeout(() => router.refresh(), 350);
  }

  return (
    <>
      {/* FAB cluster — stacked vertically above bottom nav */}
      <div
<<<<<<< ours
        className="fixed z-50 flex flex-col items-center gap-3"
        style={{
          bottom: "calc(88px + max(env(safe-area-inset-bottom, 0px), 16px))",
          right: "16px",
        }}
||||||| base
        className="fixed z-50 flex flex-col items-center gap-3"
        style={{ bottom: "88px", right: "16px" }}
=======
        className="fixed z-50 flex flex-col items-center gap-2.5"
        style={{ bottom: "82px", right: "12px" }}
>>>>>>> theirs
      >
        <button
          onClick={() => router.push(currentDate ? `/client/nutrition/compose?date=${currentDate}` : "/client/nutrition/compose")}
          className="relative flex items-center justify-center h-11 w-11 rounded-[18px] transition-all active:scale-[0.93] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
          style={{
            backgroundColor: '#111114',
            color: '#818cf8',
            backgroundImage: 'radial-gradient(circle, rgba(129,140,248,0.12) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
          aria-label="Ouvrir Smart Nutrition"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>

        {/* + Repas */}
        <button
<<<<<<< ours
          onClick={() => setMealOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: "#f2f2f2", color: "#080808" }}
          aria-label="Ajouter un repas"
||||||| base
          onClick={() => setMealOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: '#f2f2f2', color: '#080808' }}
          aria-label="Ajouter un repas"
=======
          onClick={() => setMealMethodOpen(true)}
          className="flex items-center justify-center h-11 w-11 rounded-[18px] transition-all active:scale-[0.93] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          style={{ background: '#f2f2f2', color: '#080808' }}
          aria-label={t('ui.add.meal')}
>>>>>>> theirs
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {/* Mic vocal */}
        <button
<<<<<<< ours
          onClick={() => setVoiceOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: "#1a1a1a", color: "#808080" }}
||||||| base
          onClick={() => setVoiceOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: '#1a1a1a', color: '#808080' }}
=======
          onClick={() => { setQuickInputMode("voice"); setVoiceOpen(true) }}
          className="flex items-center justify-center h-11 w-11 rounded-[18px] transition-all active:scale-[0.93] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          style={{ background: '#1a1a1a', color: '#808080' }}
>>>>>>> theirs
          aria-label="Saisie vocale"
        >
          <Mic size={20} />
        </button>
      </div>

      <MealMethodSheet
        open={mealMethodOpen}
        onClose={() => setMealMethodOpen(false)}
        onSelect={(method: MealMethodAction) => {
          setMealMethodOpen(false)
          if (method === "track_voice_text") {
            setQuickInputMode("voice")
            setVoiceOpen(true)
          } else if (method === "compose_guide" || method === "compose_simulation") {
            router.push(currentDate ? `/client/nutrition/compose?date=${currentDate}` : "/client/nutrition/compose")
          } else {
            if (method === "track_search") {
              setMealEntryMode("search")
              setMealComposerMode("standard")
            } else if (method === "track_favorites") {
              setMealEntryMode("favorites")
              setMealComposerMode("standard")
            } else if (method === "track_categories") {
              setMealEntryMode("categories")
              setMealComposerMode("standard")
            } else {
              setMealEntryMode("default")
              setMealComposerMode("standard")
            }
            setMealOpen(true)
          }
        }}
      />

      <VoiceLogSheet
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSuccess={() => {
          setVoiceOpen(false);
          handleSuccess();
        }}
        lang={lang}
        initialInputMode={quickInputMode}
      />

      <MealLogSheet
        open={mealOpen}
<<<<<<< ours
        onClose={() => setMealOpen(false)}
        onSuccess={() => {
          setMealOpen(false);
          handleSuccess();
        }}
||||||| base
        onClose={() => setMealOpen(false)}
        onSuccess={() => { setMealOpen(false); handleSuccess() }}
=======
        composerMode={mealComposerMode}
        entryMode={mealEntryMode}
        intent={mealComposerMode === "standard" ? "track" : "compose"}
        onClose={() => { setMealOpen(false); setMealComposerMode("standard"); setMealEntryMode("default") }}
        onSuccess={() => { setMealOpen(false); setMealComposerMode("standard"); setMealEntryMode("default"); handleSuccess() }}
>>>>>>> theirs
      />
    </>
  );
}
