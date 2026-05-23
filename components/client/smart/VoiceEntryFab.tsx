"use client";

import { useState } from "react";
import { Mic, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const VoiceLogSheet = dynamic(
  () => import("@/components/client/smart/VoiceLogSheet"),
  { ssr: false },
);
const MealLogSheet = dynamic(
  () => import("@/components/client/smart/MealLogSheet"),
  { ssr: false },
);

interface VoiceEntryFabProps {
  lang?: string;
  onSuccess?: () => void;
}

export default function VoiceEntryFab({
  lang = "fr",
  onSuccess,
}: VoiceEntryFabProps) {
  const router = useRouter();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);

  function handleSuccess() {
    onSuccess?.();
    // Delay refresh so AnimatePresence exit animation completes first
    setTimeout(() => router.refresh(), 350);
  }

  return (
    <>
      {/* FAB cluster — stacked vertically above bottom nav */}
      <div
        className="fixed z-50 flex flex-col items-center gap-3"
        style={{
          bottom: "calc(88px + max(env(safe-area-inset-bottom, 0px), 16px))",
          right: "16px",
        }}
      >
        {/* + Repas */}
        <button
          onClick={() => setMealOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: "#f2f2f2", color: "#080808" }}
          aria-label="Ajouter un repas"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {/* Mic vocal */}
        <button
          onClick={() => setVoiceOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all active:scale-[0.93]"
          style={{ background: "#1a1a1a", color: "#808080" }}
          aria-label="Saisie vocale"
        >
          <Mic size={20} />
        </button>
      </div>

      <VoiceLogSheet
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSuccess={() => {
          setVoiceOpen(false);
          handleSuccess();
        }}
        lang={lang}
      />

      <MealLogSheet
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        onSuccess={() => {
          setMealOpen(false);
          handleSuccess();
        }}
      />
    </>
  );
}
