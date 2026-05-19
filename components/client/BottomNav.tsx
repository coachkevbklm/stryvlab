"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SquaresFour, Barbell, ForkKnife, UserCircle, Drop, PersonSimpleRun, ClipboardText } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import QuickWaterModal from "./QuickWaterModal";
import FreeActivitySheet from "./smart/FreeActivitySheet";
import MealLogSheet from "./smart/MealLogSheet";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";

const NAV: {
  href: string;
  labelKey: ClientDictKey;
  Icon: React.ElementType;
}[] = [
  { href: "/client", labelKey: "nav.home", Icon: SquaresFour },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/profil", labelKey: "nav.profil", Icon: UserCircle },
];

type ActionId = "meal" | "water" | "activity" | "checkin";

const ACTIONS: { id: ActionId; Icon: React.ElementType; labelKey: string }[] = [
  { id: "meal",     Icon: ForkKnife,       labelKey: "smart.radial.meal" },
  { id: "water",    Icon: Drop,            labelKey: "smart.radial.water" },
  { id: "activity", Icon: PersonSimpleRun, labelKey: "smart.radial.activity" },
  { id: "checkin",  Icon: ClipboardText,   labelKey: "smart.radial.checkin" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useClientT();
  const { highlightedNavIndex } = useTour();
  const [radialOpen, setRadialOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);

  useEffect(() => {
    if (!radialOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setRadialOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [radialOpen]);

  function handleAction(id: ActionId) {
    setRadialOpen(false);
    switch (id) {
      case "meal":
        setMealOpen(true);
        break;
      case "water":
        setWaterOpen(true);
        break;
      case "activity":
        setActivityOpen(true);
        break;
      case "checkin": {
        const hour = new Date().getHours();
        router.push(`/client/checkin/${hour < 14 ? "morning" : "evening"}`);
        break;
      }
    }
  }

  return (
    <>
      <QuickWaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
      <FreeActivitySheet open={activityOpen} onClose={() => setActivityOpen(false)} />
      <MealLogSheet
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        onSuccess={() => { setMealOpen(false); router.refresh(); }}
      />

      {/* Backdrop */}
      <AnimatePresence>
        {radialOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setRadialOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto w-full max-w-[480px] px-4">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0d0d0d] backdrop-blur-md shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-2 h-[62px] overflow-hidden">

            {/* Left slot — nav tabs ↔ action buttons */}
            <AnimatePresence mode="wait" initial={false}>
              {!radialOpen ? (
                <motion.div
                  key="nav-left"
                  className="flex flex-1"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {NAV.slice(0, 2).map(({ href, labelKey, Icon }, idx) => {
                    const routeActive = href === "/client" ? pathname === "/client" : pathname.startsWith(href);
                    const active = routeActive || highlightedNavIndex === idx;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-[62px] transition-all duration-200 active:scale-[0.92] ${
                          active ? "text-[#ffe01e]" : "text-white/35 hover:text-white/60"
                        }`}
                      >
                        {active && <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />}
                        <Icon size={24} weight={active ? "fill" : "regular"} className="relative z-10" />
                        <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${active ? "text-[#ffe01e]" : "text-white/30"}`}>
                          {t(labelKey)}
                        </span>
                      </Link>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="action-left"
                  className="flex flex-1 items-center justify-around"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {ACTIONS.slice(0, 2).map(({ id, Icon, labelKey }, i) => (
                    <motion.button
                      key={id}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 420, damping: 26 }}
                      onClick={() => handleAction(id)}
                      aria-label={String(t(labelKey as any))}
                      className="flex flex-col items-center justify-center gap-[3px] flex-1 h-[62px] active:scale-[0.92] transition-transform"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#ffe01e] flex items-center justify-center">
                        <Icon size={22} weight="fill" className="text-[#0d0d0d]" />
                      </div>
                      <span className="text-[9px] font-semibold leading-none tracking-wide text-[#ffe01e]">
                        {String(t(labelKey as any))}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center logo — rotates 45° when open */}
            <div className="flex items-center justify-center px-2 shrink-0">
              <motion.button
                onClick={() => setRadialOpen((v) => !v)}
                aria-label="Logger"
                animate={radialOpen
                  ? { rotate: 180, scale: 0.94, boxShadow: "0 0 24px rgba(255,224,30,0.6)" }
                  : { rotate: 0,   scale: 1,   boxShadow: "0 0 14px rgba(255,224,30,0.3)" }
                }
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="h-12 w-12 rounded-2xl bg-[#ffe01e] flex items-center justify-center text-[#0d0d0d]"
              >
                <Image
                  src="/logo/Logo STRYVR (grey).svg"
                  width={28}
                  height={28}
                  alt="STRYVR"
                  className="relative z-10"
                />
              </motion.button>
            </div>

            {/* Right slot — nav tabs ↔ action buttons */}
            <AnimatePresence mode="wait" initial={false}>
              {!radialOpen ? (
                <motion.div
                  key="nav-right"
                  className="flex flex-1"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {NAV.slice(2).map(({ href, labelKey, Icon }, idx) => {
                    const realIdx = idx + 2;
                    const routeActive = pathname.startsWith(href);
                    const active = routeActive || highlightedNavIndex === realIdx;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-[62px] transition-all duration-200 active:scale-[0.92] ${
                          active ? "text-[#ffe01e]" : "text-white/35 hover:text-white/60"
                        }`}
                      >
                        {active && <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />}
                        <Icon size={24} weight={active ? "fill" : "regular"} className="relative z-10" />
                        <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${active ? "text-[#ffe01e]" : "text-white/30"}`}>
                          {t(labelKey)}
                        </span>
                      </Link>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="action-right"
                  className="flex flex-1 items-center justify-around"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {ACTIONS.slice(2).map(({ id, Icon, labelKey }, i) => (
                    <motion.button
                      key={id}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 420, damping: 26 }}
                      onClick={() => handleAction(id)}
                      aria-label={String(t(labelKey as any))}
                      className="w-12 h-12 rounded-2xl bg-[#ffe01e] flex items-center justify-center active:scale-[0.92] transition-transform"
                    >
                      <Icon size={22} weight="fill" className="text-[#0d0d0d]" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </nav>
    </>
  );
}
