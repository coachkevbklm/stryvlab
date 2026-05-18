"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { House, Barbell, ForkKnife, UserCircle } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import RadialActionMenu from "./smart/RadialActionMenu";
import QuickWaterModal from "./QuickWaterModal";
import FreeActivitySheet from "./smart/FreeActivitySheet";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";

const NAV: {
  href: string;
  labelKey: ClientDictKey;
  Icon: React.ElementType;
}[] = [
  { href: "/client", labelKey: "nav.home", Icon: House },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/profil", labelKey: "nav.profil", Icon: UserCircle },
];

function StryvrLogo() {
  return (
    <Image
      src="/logo/Logo STRYVR (grey).svg"
      width={33}
      height={33}
      alt="STRYVR"
      className="relative z-10"
    />
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useClientT();
  const { highlightedNavIndex } = useTour();
  const [radialOpen, setRadialOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <>
      <RadialActionMenu
        open={radialOpen}
        onClose={() => setRadialOpen(false)}
        onOpenWater={() => setWaterOpen(true)}
        onOpenActivity={() => setActivityOpen(true)}
      />
      <QuickWaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
      <FreeActivitySheet
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto w-full max-w-[480px] px-4">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0d0d0d] backdrop-blur-md shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-2 h-[62px]">
            {/* Left 2 nav items */}
            {NAV.slice(0, 2).map(({ href, labelKey, Icon }, idx) => {
              const routeActive =
                href === "/client"
                  ? pathname === "/client"
                  : pathname.startsWith(href);
              const active = routeActive || highlightedNavIndex === idx;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-full transition-all duration-200 active:scale-[0.92] ${
                    active
                      ? "text-[#ffe01e]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />
                  )}
                  <Icon
                    size={24}
                    weight={active ? "fill" : "regular"}
                    className="relative z-10"
                  />
                  <span
                    className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${
                      active ? "text-[#ffe01e]" : "text-white/30"
                    }`}
                  >
                    {t(labelKey)}
                  </span>
                </Link>
              );
            })}

            {/* Center STRYVR logo button — scale up + remonte quand radial ouvert */}
            <div className="flex items-center justify-center px-2">
              <motion.button
                onClick={() => setRadialOpen((v) => !v)}
                aria-label="Logger"
                animate={radialOpen
                  ? { scale: 1.18, y: -6, boxShadow: "0 0 28px rgba(255,224,30,0.55)" }
                  : { scale: 1, y: 0, boxShadow: "0 0 16px rgba(255,224,30,0.25)" }
                }
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="h-10 w-10 rounded-xl bg-[#ffe01e] flex items-center justify-center text-[#0d0d0d]"
              >
                <StryvrLogo />
              </motion.button>
            </div>

            {/* Right 2 nav items */}
            {NAV.slice(2).map(({ href, labelKey, Icon }, idx) => {
              const realIdx = idx + 2;
              const routeActive = pathname.startsWith(href);
              const active = routeActive || highlightedNavIndex === realIdx;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-full transition-all duration-200 active:scale-[0.92] ${
                    active
                      ? "text-[#ffe01e]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />
                  )}
                  <Icon
                    size={24}
                    weight={active ? "fill" : "regular"}
                    className="relative z-10"
                  />
                  <span
                    className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${
                      active ? "text-[#ffe01e]" : "text-white/30"
                    }`}
                  >
                    {t(labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
