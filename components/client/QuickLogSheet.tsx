"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Drop, ForkKnife, Lightning } from "@phosphor-icons/react";
import dynamic from "next/dynamic";

const QuickWaterModal  = dynamic(() => import("@/components/client/QuickWaterModal"),        { ssr: false });
const FreeActivitySheet = dynamic(() => import("@/components/client/smart/FreeActivitySheet"), { ssr: false });

interface Props {
  open: boolean;
  onClose: () => void;
}

type SubSheet = "water" | "activity" | null;

import { useState } from "react";

export default function QuickLogSheet({ open, onClose }: Props) {
  const router = useRouter();
  const [sub, setSub] = useState<SubSheet>(null);

  function handleClose() {
    setSub(null);
    onClose();
  }

  const ACTIONS = [
    {
      key: "water",
      Icon: Drop,
      label: "Eau",
      sub: "Logger ma consommation d'eau",
      onClick: () => setSub("water"),
    },
    {
      key: "meal",
      Icon: ForkKnife,
      label: "Repas",
      sub: "Ajouter un repas ou aliment",
      onClick: () => { handleClose(); router.push("/client/nutrition?addMeal=1"); },
    },
    {
      key: "activity",
      Icon: Lightning,
      label: "Activité",
      sub: "Course, marche, sport libre…",
      onClick: () => setSub("activity"),
    },
  ] as const;

  return (
    <>
      {/* Main quick-log sheet */}
      <AnimatePresence>
        {open && sub === null && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-[60] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              key="sheet"
              className="fixed left-0 right-0 bottom-0 z-[70] rounded-t-2xl bg-[#111111] pb-safe"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-[3px] rounded-full bg-white/[0.12]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-4">
                <p className="text-[13px] font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[#e0e0e0]">
                  Logger
                </p>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-[#5a5a5a] active:bg-white/[0.08]"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex flex-col gap-2">
                {ACTIONS.map(({ key, Icon, label, sub: subLabel, onClick }) => (
                  <button
                    key={key}
                    onClick={onClick}
                    className="flex items-center gap-4 px-4 h-[60px] rounded-xl bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#e0e0e0]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-barlow font-semibold text-[#e0e0e0] leading-tight">
                        {label}
                      </span>
                      <span className="text-[11px] font-barlow text-[#5a5a5a] leading-tight truncate">
                        {subLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-sheets */}
      <QuickWaterModal
        open={sub === "water"}
        onClose={() => { setSub(null); onClose(); }}
      />
      <FreeActivitySheet
        open={sub === "activity"}
        onClose={() => { setSub(null); onClose(); }}
        onSaved={() => { setSub(null); onClose(); }}
      />
    </>
  );
}
