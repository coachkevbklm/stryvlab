"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdAdd,
  MdChat,
  MdFitnessCenter,
  MdRestaurant,
  MdShowChart,
} from "react-icons/md";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";
import dynamic from "next/dynamic";

const QuickLogSheet = dynamic(
  () => import("@/components/client/QuickLogSheet"),
  { ssr: false },
);

const LEFT_NAV: {
  href: string;
  labelKey: ClientDictKey;
  Icon: React.ElementType;
  iconClassName?: string;
}[] = [
  { href: "/client", labelKey: "nav.chat", Icon: MdChat },
  {
    href: "/client/programme",
    labelKey: "nav.programme",
    Icon: MdFitnessCenter,
    iconClassName: "-translate-x-1",
  },
];
const RIGHT_NAV: {
  href: string;
  labelKey: ClientDictKey;
  Icon: React.ElementType;
  iconClassName?: string;
}[] = [
  {
    href: "/client/nutrition",
    labelKey: "nav.nutrition",
    Icon: MdRestaurant,
    iconClassName: "translate-x-1",
  },
  {
    href: "/client/metrics",
    labelKey: "nav.metrics",
    Icon: MdShowChart,
    iconClassName: "translate-x-1",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { highlightedNavIndex } = useTour();
  const [logOpen, setLogOpen] = useState(false);

  function isActive(href: string, idx: number, offset = 0) {
    const navIdx = offset + idx;
    if (highlightedNavIndex === navIdx) return true;
    if (href === "/client") return pathname === "/client";
    return pathname.startsWith(href);
  }

  const navItem = (
    href: string,
    Icon: React.ElementType,
    active: boolean,
    iconClassName?: string,
  ) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center justify-center flex-1 h-full transition-colors duration-200 ease-out active:scale-[0.96] ${
        active ? "text-[#f2f2f2]" : "text-[#8a8a8a] hover:text-[#b2b2b2]"
      }`}
    >
      <Icon size={active ? 30 : 26} className={iconClassName} />
    </Link>
  );

  return (
    <>
      <nav
        className="fixed inset-x-4 z-40"
        style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="relative h-[80px]">
          <div className="absolute inset-0 rounded-[32px] bg-[#0d0d0d]/98 border border-white/10 backdrop-blur-xl shadow-[0_24px_52px_-32px_rgba(0,0,0,0.75)] z-10 pointer-events-none" />
          <div className="relative z-20 flex items-center justify-between h-full px-3">
            {LEFT_NAV.map(({ href, Icon, iconClassName }, i) =>
              navItem(href, Icon, isActive(href, i, 0), iconClassName),
            )}

            <div className="flex-1 flex items-center justify-center h-full">
              <button
                onClick={() => setLogOpen(true)}
                className="relative z-30 inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f8f8f8] via-[#e2e2e2] to-[#c1c1c1] text-[#080808] transition-transform duration-120 ease-out active:scale-[0.96] shadow-[0_8px_18px_-12px_rgba(0,0,0,0.42)]"
                aria-label="Logger"
              >
                <MdAdd size={24} />
              </button>
            </div>

            {RIGHT_NAV.map(({ href, Icon, iconClassName }, i) =>
              navItem(href, Icon, isActive(href, i, 2), iconClassName),
            )}
          </div>
        </div>
      </nav>

      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
