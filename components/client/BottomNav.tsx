"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircle, Barbell, ForkKnife, ChartLine } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";

const NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client",           labelKey: "nav.chat",      Icon: ChatCircle },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/metrics",   labelKey: "nav.metrics",   Icon: ChartLine },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useClientT();
  const { highlightedNavIndex } = useTour();

  function isActive(href: string) {
    if (href === "/client") return pathname === "/client";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[62px] px-2">
        {NAV.map(({ href, labelKey, Icon }, i) => {
          const active = isActive(href) || highlightedNavIndex === i;
          return (
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
        })}
      </div>
    </nav>
  );
}
