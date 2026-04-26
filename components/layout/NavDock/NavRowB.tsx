"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Layers,
  Briefcase,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavCTA } from "./NavCTA";
import type { CTAConfig } from "./useNavConfig";

const NAV_ITEMS = [
  {
    id: "accueil",
    label: "Accueil",
    icon: LayoutDashboard,
    href: "/coach/organisation",
    match: (p: string) => p === "/coach/organisation" || p === "/dashboard",
  },
  {
    id: "lab",
    label: "Lab",
    icon: FlaskConical,
    href: "/coach/clients",
    match: (p: string) => p.startsWith("/coach/clients"),
  },
  {
    id: "studio",
    label: "Studio",
    icon: Layers,
    href: "/coach/programs/templates",
    match: (p: string) =>
      p.startsWith("/coach/programs") || p.startsWith("/coach/assessments"),
  },
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
    href: "/coach/comptabilite",
    match: (p: string) =>
      p.startsWith("/coach/comptabilite") || p.startsWith("/coach/formules"),
  },
  {
    id: "compte",
    label: "Mon compte",
    icon: UserCircle,
    href: "/coach/settings",
    match: (p: string) => p.startsWith("/coach/settings"),
  },
] as const;

interface NavRowBProps {
  cta: CTAConfig;
}

export function NavRowB({ cta }: NavRowBProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="relative flex items-center gap-2 rounded-2xl px-3 h-14">
      {/* Background glassmorphism */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
      </div>

      <div className="relative z-10 flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 h-9 transition-all duration-200 hover:scale-105 active:scale-95",
                active
                  ? "border-[#1f8a65]/30 bg-[#1f8a65]/20 text-[#1f8a65]"
                  : "border-white/[0.06] bg-white/[0.06] text-white/40 hover:bg-white/[0.09] hover:text-white/70"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[8px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        {cta.type !== "hidden" && (
          <div className="mx-1 h-6 w-px shrink-0 bg-white/[0.07]" />
        )}

        <NavCTA cta={cta} />
      </div>
    </div>
  );
}
