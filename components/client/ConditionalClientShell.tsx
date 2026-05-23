"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import OnboardingTour from "./OnboardingTour";
import { TourProvider } from "./TourContext";

// Routes that are NOT part of the authenticated client shell
// (login, set-password, auth callbacks, error pages).
// These render without BottomNav and without the pb-20 bottom offset.
const AUTH_PATHS = [
  "/client/login",
  "/client/set-password",
  "/client/auth",
  "/client/access",
  "/client/onboarding",
  "/client/checkin/onboarding",
  "/client/acces-suspendu",
  "/client/programme/session/",
  "/client/nutrition/log",
];

interface Props {
  children: React.ReactNode;
}

export default function ConditionalClientShell({ children }: Props) {
  const pathname = usePathname();
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPath) {
    // Auth pages manage their own layout — no shell, no bottom nav.
    return <>{children}</>;
  }

  const isChatPage = pathname === "/client";

  return (
    <TourProvider>
      {/* pb = BottomNav h-20 (80) + safe-area min 16px + 16px breathing room = ~112px */}
      <div
        className="pb-28"
        style={{
          paddingBottom:
            "max(112px, calc(80px + env(safe-area-inset-bottom) + 16px))",
        }}
      >
        {children}
      </div>
      {!isChatPage && (
        <div
          aria-hidden
          className="fixed left-1/2 z-30 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: "calc(max(16px, env(safe-area-inset-bottom)) + 40px)",
            width: "50%",
            maxWidth: "420px",
            height: "40px",
          }}
        >
          <div className="h-full rounded-[32px] bg-gradient-to-b from-transparent to-[#080808]/100" />
        </div>
      )}
      <BottomNav />
      <OnboardingTour />
    </TourProvider>
  );
}
