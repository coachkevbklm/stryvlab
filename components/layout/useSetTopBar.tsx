"use client";

import { useEffect, ReactNode } from "react";
import { useTopBar } from "@/components/layout/TopBarContext";

/**
 * Injecte du contenu dans la topbar du CoachShell.
 * IMPORTANT: wrapper left/right avec useMemo dans la page appelante
 * pour éviter une boucle infinie de re-renders.
 */
export function useSetTopBar(left: ReactNode, right?: ReactNode) {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ left, right });
    return () => setTopBar({});
  }, [left, right, setTopBar]);
}
