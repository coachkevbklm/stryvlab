"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircle, Barbell, ForkKnife, ChartLine, Plus } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";
import dynamic from "next/dynamic";

const QuickLogSheet = dynamic(() => import("@/components/client/QuickLogSheet"), { ssr: false });

const LEFT_NAV:  { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client",           labelKey: "nav.chat",      Icon: ChatCircle },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
];
const RIGHT_NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/metrics",   labelKey: "nav.metrics",   Icon: ChartLine },
];

export default function BottomNav() {
  const pathname             = usePathname();
  const { t }                = useClientT();
  const { highlightedNavIndex } = useTour();
  const [logOpen, setLogOpen] = useState(false);

  function isActive(href: string, idx: number, offset = 0) {
    const navIdx = offset + idx;
    if (highlightedNavIndex === navIdx) return true;
    if (href === "/client") return pathname === "/client";
    return pathname.startsWith(href);
  }

  const navItem = (href: string, labelKey: ClientDictKey, Icon: React.ElementType, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`flex flex-col items-center justify-center gap-[5px] flex-1 h-full transition-all duration-200 active:scale-[0.92] ${
        active ? "text-[#f2f2f2]" : "text-[#5a5a5a] hover:text-[#808080]"
      }`}
    >
      <Icon size={active ? 26 : 23} weight={active ? "fill" : "regular"} />
      <span
        className={`text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] leading-none transition-all duration-200 ${
          active ? "text-[#f2f2f2]" : "text-[#5a5a5a]"
        }`}
      >
        {t(labelKey)}
      </span>
    </Link>
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center h-[62px] px-2">
          {/* Left tabs */}
          {LEFT_NAV.map(({ href, labelKey, Icon }, i) =>
            navItem(href, labelKey, Icon, isActive(href, i, 0))
          )}

          {/* Central FAB */}
          <div className="flex flex-col items-center justify-center flex-1 h-full">
            <button
              onClick={() => setLogOpen(true)}
              className="w-[50px] h-[50px] rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-[0.92] transition-transform shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              aria-label="Logger"
            >
              <Plus size={22} weight="bold" className="text-[#080808]" />
            </button>
          </div>

          {/* Right tabs */}
          {RIGHT_NAV.map(({ href, labelKey, Icon }, i) =>
            navItem(href, labelKey, Icon, isActive(href, i, 2))
          )}
        </div>
      </nav>

      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
