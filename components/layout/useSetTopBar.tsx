"use client";

import { useEffect, ReactNode } from "react";
import { useTopBar } from "@/components/layout/TopBarContext";

/**
 * Injecte du contenu dans la topbar du CoachShell.
 * IMPORTANT: wrapper left/right avec useMemo dans la page appelante
 * pour éviter une boucle infinie de re-renders.
 *
 * Pas de cleanup — la prochaine page montante écrase le contenu elle-même.
 * Le cleanup vers {} causait des re-renders pendant la navigation qui
 * pouvaient bloquer le routing Next.js.
 */
export function useSetTopBar(left: ReactNode, right?: ReactNode) {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({ left, right });
  }, [left, right, setTopBar]);
}
