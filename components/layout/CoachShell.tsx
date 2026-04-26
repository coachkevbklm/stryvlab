"use client";

import { ReactNode } from "react";
import { TopBarProvider, useTopBar } from "@/components/layout/TopBarContext";
import { DockProvider } from "@/components/layout/DockContext";
import { NavDock } from "@/components/layout/NavDock";
import NotificationBell from "@/components/layout/NotificationBell";

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

function TopBar() {
  const { content } = useTopBar();

  return (
    <header className="fixed top-4 right-4 left-4 h-16 z-40 rounded-2xl px-5 flex items-center justify-between gap-4 overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl bg-white/[0.04]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
      <div className="relative z-10 flex-1 min-w-0">
        {content.left ?? (
          <p className="text-[13px] font-semibold text-white/70">Coach</p>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-2 shrink-0">
        {content.right}
        <NotificationBell />
      </div>
    </header>
  );
}

// ─── SHELL INNER ─────────────────────────────────────────────────────────────

function ShellInner({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#121212]">
      <TopBar />
      {/* pt = top-4(16) + h-16(64) + gap-4(16) = 96px | pb = bottom-6(24) + rowB h-14(56) + rowA h-9(36) + gap-1.5(6) + gap(16) = 138px */}
      <div className="min-h-screen bg-[#121212] pt-[96px] pb-[138px]">
        {children}
      </div>
      <NavDock />
    </div>
  );
}

// ─── SHELL (export public) ────────────────────────────────────────────────────

export default function CoachShell({ children }: { children: ReactNode }) {
  return (
    <TopBarProvider>
      <DockProvider>
        <ShellInner>{children}</ShellInner>
      </DockProvider>
    </TopBarProvider>
  );
}
