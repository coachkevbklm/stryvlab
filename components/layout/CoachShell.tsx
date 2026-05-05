"use client";

import { ReactNode, memo } from "react";
import { TopBarProvider, useTopBarContent } from "@/components/layout/TopBarContext";
import { DockProvider } from "@/components/layout/DockContext";
import { NavDock } from "@/components/layout/NavDock";
import NotificationBell from "@/components/layout/NotificationBell";

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

function TopBar() {
  const { left, right } = useTopBarContent();

  return (
    <header className="fixed top-4 right-4 left-4 h-14 z-40 rounded-2xl px-5 flex items-center justify-between gap-4 border-[0.3px] border-white/[0.06] bg-[#121212]">
      <div className="flex-1 min-w-0">
        {left ?? (
          <p className="text-[13px] font-semibold text-white/70">Coach</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        <NotificationBell />
      </div>
    </header>
  );
}

// ─── CHILDREN WRAPPER ─────────────────────────────────────────────────────────
// Isolated so it does NOT subscribe to TopBarReadContext — only TopBar does.
// This prevents setTopBar calls from re-rendering the page subtree.

const PageContent = memo(function PageContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#121212] pt-[88px] pb-[138px]">
      {children}
    </div>
  );
});

// ─── SHELL INNER ─────────────────────────────────────────────────────────────

function ShellInner({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#121212]">
      <TopBar />
      {/* pt = top-4(16) + h-14(56) + gap-4(16) = 88px | pb = bottom-6(24) + rowB h-14(56) + rowA h-9(36) + gap-1.5(6) + gap(16) = 138px */}
      <PageContent>{children}</PageContent>
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
