"use client";

import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { BackButton } from "@/components/ui/BackButton";
import MacroCalculator from "./MacroCalculator";


export default function MacrosPage() {
  useSetTopBar(useMemo(() => <BackButton label="Retour outils" />, []));
  return <MacroCalculator />;
}
