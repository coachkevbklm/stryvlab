"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircle, Barbell, ForkKnife, ChartLine, Plus } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";
import dynamic from "next/dynamic";

const QuickLogSheet = dynamic(() => import("@/components/client/QuickLogSheet"), { ssr: false });

const LEFT_NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client",           labelKey: "nav.chat",      Icon: ChatCircle },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
];
const RIGHT_NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/metrics",   labelKey: "nav.metrics",   Icon: ChartLine },
];

export default function BottomNav() {
  const pathname                = usePathname();
  const { t }                   = useClientT();
  const { highlightedNavIndex } = useTour();
  const [logOpen, setLogOpen]   = useState(false);
  const [chatPendingCheckins, setChatPendingCheckins] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/client/chat/today-strip")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.checkin) return;
        const pending = Number(!data.checkin?.morning) + Number(!data.checkin?.evening);
        setChatPendingCheckins(pending);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  function isActive(href: string, idx: number, offset = 0) {
    const navIdx = offset + idx;
    if (highlightedNavIndex === navIdx) return true;
    if (href === "/client") return pathname === "/client";
    return pathname.startsWith(href);
  }

  const navItem = (
    href: string,
    labelKey: ClientDictKey,
    Icon: React.ElementType,
    active: boolean,
  ) => (
    <Link
      key={href}
      href={href}
<<<<<<< ours
      aria-label={t(labelKey)}
      className={`flex items-center justify-center h-[46px] w-[46px] rounded-[14px] border transition-all duration-200 active:scale-[0.9] ${
        active ? "text-[#f2f2f2]" : "text-[#5a5a5a] hover:text-[#808080]"
      }`}
      style={{
        background: active ? "rgba(242,242,242,0.12)" : "rgba(255,255,255,0.04)",
        borderColor: active ? "rgba(242,242,242,0.24)" : "rgba(255,255,255,0.08)",
      }}
||||||| base
      className={`flex flex-col items-center justify-center gap-[5px] flex-1 h-full transition-all duration-200 active:scale-[0.92] ${
        active ? "text-[#f2f2f2]" : "text-[#5a5a5a] hover:text-[#808080]"
      }`}
=======
      className="flex flex-col items-center justify-center gap-[5px] flex-1 h-full"
      style={{ WebkitTapHighlightColor: "transparent" }}
>>>>>>> theirs
    >
<<<<<<< ours
      <div className="relative">
        <Icon size={active ? 30 : 27} weight={active ? "fill" : "bold"} />
||||||| base
      <div className="relative">
        <Icon size={active ? 26 : 23} weight={active ? "fill" : "regular"} />
=======
      {/* Pill active wrapping the icon */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width:        active ? 48 : 36,
          height:       28,
          borderRadius: 14,
          background:   active ? "#f2f2f2" : "transparent",
          transition:   "width 320ms cubic-bezier(0.34,1.56,0.64,1), background 220ms ease",
        }}
      >
        <Icon
          size={active ? 15 : 19}
          weight={active ? "fill" : "regular"}
          style={{
            color:      active ? "#080808" : "#4a4a4a",
            transition: "color 220ms ease",
            display:    "block",
          }}
        />

        {/* Checkin badge */}
>>>>>>> theirs
        {href === "/client" && chatPendingCheckins > 0 && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full text-[8px] leading-[14px] text-center font-bold tabular-nums"
            style={{ background: "#A67C52", color: "#080808" }}
          >
            {chatPendingCheckins}
          </span>
        )}
      </div>
<<<<<<< ours
||||||| base
      <span
        className={`text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] leading-none transition-all duration-200 ${
          active ? "text-[#f2f2f2]" : "text-[#5a5a5a]"
        }`}
      >
        {t(labelKey)}
      </span>
=======

      {/* Label */}
      <span
        className="text-[8.5px] font-barlow-condensed font-bold uppercase tracking-[0.14em] leading-none"
        style={{
          color:      active ? "#c8c8c8" : "#383838",
          transition: "color 220ms ease",
        }}
      >
        {t(labelKey)}
      </span>
>>>>>>> theirs
    </Link>
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
<<<<<<< ours
        <div className="mx-auto mb-2 w-[min(340px,calc(100%-40px))] pointer-events-auto">
          <div className="flex items-center justify-center gap-2 h-[68px] px-2 rounded-[22px] border border-white/[0.12] bg-[#0f0f0f] shadow-none">
          {/* Left tabs */}
          {LEFT_NAV.map(({ href, labelKey, Icon }, i) =>
            navItem(href, labelKey, Icon, isActive(href, i, 0))
          )}
||||||| base
        <div className="pointer-events-auto w-full max-w-[520px] px-3 pb-2">
        <div className="flex items-center h-[62px] px-2 rounded-2xl border border-white/[0.08] bg-[#0d0d0d]/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
          {/* Left tabs */}
          {LEFT_NAV.map(({ href, labelKey, Icon }, i) =>
            navItem(href, labelKey, Icon, isActive(href, i, 0))
          )}
=======
        <div className="pointer-events-auto w-full max-w-[520px] px-4 pb-3">
          <div
            className="flex items-center h-[62px] px-1"
            style={{
              background:            "rgba(12,12,12,0.94)",
              backdropFilter:        "blur(28px) saturate(160%)",
              WebkitBackdropFilter:  "blur(28px) saturate(160%)",
              borderRadius:          22,
              border:                "0.5px solid rgba(255,255,255,0.065)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.04) inset, " +
                "0 12px 40px rgba(0,0,0,0.65), " +
                "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {/* Left tabs */}
            {LEFT_NAV.map(({ href, labelKey, Icon }, i) =>
              navItem(href, labelKey, Icon, isActive(href, i, 0))
            )}
>>>>>>> theirs

<<<<<<< ours
          {/* Central FAB */}
          <div className="flex flex-col items-center justify-center h-full">
            <button
              onClick={() => setLogOpen(true)}
              className="w-[48px] h-[48px] rounded-[14px] bg-[#f2f2f2] flex items-center justify-center active:scale-[0.9] transition-transform shadow-[0_7px_18px_rgba(0,0,0,0.45)]"
              aria-label="Logger"
            >
              <Plus size={22} weight="bold" className="text-[#080808]" />
            </button>
          </div>
||||||| base
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
=======
            {/* Central FAB */}
            <div className="flex flex-col items-center justify-center flex-1 h-full">
              <button
                onClick={() => setLogOpen((v) => !v)}
                aria-label="Logger une série"
                style={{
                  width:                  44,
                  height:                 44,
                  borderRadius:           "50%",
                  background:             "#f2f2f2",
                  display:                "flex",
                  alignItems:             "center",
                  justifyContent:         "center",
                  flexShrink:             0,
                  border:                 "0.5px solid rgba(255,255,255,0.10)",
                  boxShadow:
                    "0 2px 14px rgba(0,0,0,0.55), " +
                    "0 1px 0 rgba(255,255,255,0.18) inset",
                  WebkitTapHighlightColor: "transparent",
                  // transition géré inline — voir pointer events
                }}
                onPointerDown={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(0.87)";
                  el.style.boxShadow  = "0 1px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.14) inset";
                }}
                onPointerUp={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(1)";
                  el.style.boxShadow  = "0 2px 14px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.18) inset";
                }}
                onPointerLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(1)";
                  el.style.boxShadow  = "0 2px 14px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.18) inset";
                }}
              >
                <Plus
                  size={17}
                  weight="bold"
                  style={{
                    color:      "#080808",
                    display:    "block",
                    transform:  logOpen ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 320ms cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </button>
            </div>
>>>>>>> theirs

            {/* Right tabs */}
            {RIGHT_NAV.map(({ href, labelKey, Icon }, i) =>
              navItem(href, labelKey, Icon, isActive(href, i, 2))
            )}
          </div>
        </div>
      </nav>

      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
