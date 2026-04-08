"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  CreditCard,
  Euro,
  Calculator,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBarProvider, useTopBar } from "@/components/layout/TopBarContext";

// ─── NAV ─────────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
        match: (p: string) => p === "/dashboard",
      },
      {
        icon: Users,
        label: "Clients",
        href: "/coach/clients",
        match: (p: string) => p.startsWith("/coach/clients"),
      },
      {
        icon: ClipboardList,
        label: "Bilans",
        href: "/coach/assessments",
        match: (p: string) => p.startsWith("/coach/assessments"),
      },
      {
        icon: Dumbbell,
        label: "Programmes",
        href: "/coach/programs/templates",
        match: (p: string) => p.startsWith("/coach/programs"),
      },
      {
        icon: CreditCard,
        label: "Formules",
        href: "/coach/formules",
        match: (p: string) => p.startsWith("/coach/formules"),
      },
      {
        icon: Euro,
        label: "Comptabilité",
        href: "/coach/comptabilite",
        match: (p: string) => p.startsWith("/coach/comptabilite"),
      },
      {
        icon: Activity,
        label: "Organisation",
        href: "/coach/organisation",
        match: (p: string) => p.startsWith("/coach/organisation"),
      },
    ],
  },
  {
    label: "Outils",
    items: [
      {
        icon: Calculator,
        label: "Tous les outils",
        href: "/outils",
        match: (p: string) => p === "/outils",
      },
      {
        icon: Dumbbell,
        label: "Macros & Calories",
        href: "/outils/macros",
        match: (p: string) => p.startsWith("/outils/macros"),
      },
      {
        icon: Activity,
        label: "1RM & Force",
        href: "/outils/1rm",
        match: (p: string) => p.startsWith("/outils/1rm"),
      },
      {
        icon: FileText,
        label: "% Masse grasse",
        href: "/outils/body-fat",
        match: (p: string) => p.startsWith("/outils/body-fat"),
      },
      {
        icon: Activity,
        label: "Zones cardio",
        href: "/outils/hr-zones",
        match: (p: string) => p.startsWith("/outils/hr-zones"),
      },
    ],
  },
  {
    label: "Compte",
    items: [
      {
        icon: Settings,
        label: "Mon compte",
        href: "/coach/settings",
        match: (p: string) => p.startsWith("/coach/settings"),
      },
    ],
  },
];

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside
      className={`fixed top-4 left-4 h-[calc(100vh-32px)] bg-[#181818] border-subtle rounded-2xl flex flex-col z-50 transition-all duration-300 ${collapsed ? "w-16" : "w-52"}`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 shrink-0 cursor-pointer ${collapsed ? "justify-center" : ""}`}
        onClick={() => !collapsed && router.push("/dashboard")}
      >
        <Image
          src="/images/logo.png"
          alt="STRYV"
          width={28}
          height={28}
          className="w-7 h-7 object-contain shrink-0"
        />
        {!collapsed && (
          <span className="font-unbounded font-semibold text-white tracking-tight text-[11px] leading-none">
            STRYV <span className="font-light text-white/40">lab</span>
            <br />
            <span
              className="font-normal text-white/35"
              style={{ fontSize: "9px" }}
            >
              Coach
            </span>
          </span>
        )}
      </div>

      <div className="h-px bg-white/[0.07] mx-3 shrink-0" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-5 no-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] px-2 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ icon: Icon, label, href, match }) => {
                const active = match(pathname);
                const disabled = href === "#";
                return (
                  <button
                    key={label}
                    onClick={() => !disabled && router.push(href)}
                    disabled={disabled}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${collapsed ? "justify-center" : "w-full"} ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : disabled
                          ? "text-white/20 cursor-not-allowed"
                          : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={active ? 2.25 : 1.75}
                      className="shrink-0"
                    />
                    {!collapsed && (
                      <>
                        <span className="text-[12px] font-medium truncate flex-1">
                          {label}
                        </span>
                        {active && (
                          <ChevronRight
                            size={11}
                            className="shrink-0 text-white/30"
                          />
                        )}
                        {disabled && (
                          <span className="text-[8px] font-bold text-white/20">
                            Bientôt
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="h-px bg-white/[0.07] mx-3 shrink-0" />

      {/* Footer */}
      <div className="px-2 py-3 shrink-0 flex flex-col gap-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Développer" : "Réduire"}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-white/35 hover:text-white/70 hover:bg-white/[0.05] ${collapsed ? "justify-center" : "w-full"}`}
        >
          <ChevronRight
            size={14}
            strokeWidth={1.75}
            className={`shrink-0 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
          />
          {!collapsed && (
            <span className="text-[12px] font-medium">Réduire</span>
          )}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? "Déconnexion" : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-white/35 hover:text-red-400 hover:bg-red-950/20 ${collapsed ? "justify-center" : "w-full"}`}
        >
          <LogOut size={14} strokeWidth={1.75} className="shrink-0" />
          {!collapsed && (
            <span className="text-[12px] font-medium">Déconnexion</span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

function TopBar({ left: sidebarLeft }: { left: number }) {
  const { content } = useTopBar();
  const pathname = usePathname();

  // Fallback label si la page n'a pas injecté de contenu
  const defaultLabel = (() => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/coach/clients")) return "Clients";
    if (pathname.startsWith("/coach/assessments")) return "Bilans";
    if (pathname.startsWith("/coach/programs")) return "Programmes";
    if (pathname.startsWith("/coach/formules")) return "Formules";
    if (pathname.startsWith("/coach/comptabilite")) return "Comptabilité";
    if (pathname.startsWith("/coach/settings")) return "Mon compte";
    if (pathname.startsWith("/outils")) return "Outils";
    return "Coach";
  })();

  return (
    <header
      className="fixed top-4 right-4 h-16 z-40 bg-[#181818] border-subtle rounded-2xl px-5 flex items-center justify-between gap-4 transition-all duration-300"
      style={{ left: sidebarLeft }}
    >
      <div className="flex-1 min-w-0">
        {content.left ?? (
          <p className="text-[13px] font-semibold text-white/70">
            {defaultLabel}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {content.right}
        <NotificationBell />
      </div>
    </header>
  );
}

// ─── SHELL INNER (needs context) ──────────────────────────────────────────────

function ShellInner({
  children,
  collapsed,
  setCollapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const sidebarWidth = collapsed ? 64 : 208;
  const contentLeft = 16 + sidebarWidth + 16; // left-4 + width + gap-4

  return (
    <div className="min-h-screen bg-[#121212]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <TopBar left={contentLeft} />
      {/* pt = top-4(16) + h-16(64) + gap-4(16) = 96px */}
      <div
        className="min-h-screen bg-[#121212] pt-[96px] transition-all duration-300"
        style={{ paddingLeft: contentLeft }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── SHELL (public export) ────────────────────────────────────────────────────

export default function CoachShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TopBarProvider>
      <ShellInner collapsed={collapsed} setCollapsed={setCollapsed}>
        {children}
      </ShellInner>
    </TopBarProvider>
  );
}
