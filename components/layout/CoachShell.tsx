"use client";

import { ReactNode } from "react";
import { TopBarProvider, useTopBar } from "@/components/layout/TopBarContext";
import { DockProvider } from "@/components/layout/DockContext";
import DockLeft from "@/components/layout/DockLeft";
import DockBottom from "@/components/layout/DockBottom";
import NotificationBell from "@/components/layout/NotificationBell";

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

function TopBar() {
  const { content } = useTopBar();

  return (
    <header className="fixed top-4 right-4 left-[80px] h-16 z-40 bg-[#181818] border-[0.3px] border-white/[0.06] rounded-2xl px-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        {content.left ?? (
          <p className="text-[13px] font-semibold text-white/70">Coach</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
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
      <DockLeft />
      <TopBar />
      {/* pt = top-4(16) + h-16(64) + gap-4(16) = 96px | pl = left-4(16) + dock(48px) + gap(16) = 80px | pb = bottom-6(24) + dock(56px) + gap(16) = 96px */}
      <div className="min-h-screen bg-[#121212] pt-[96px] pl-[80px] pb-[96px]">
        {children}
      </div>
      <DockBottom />
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
