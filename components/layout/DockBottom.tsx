"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDockBottom } from "@/components/layout/useDockBottom";
import ClientTabsBar from "@/components/layout/ClientTabsBar";

function usePlusActions(): { label: string; href: string }[] {
  const pathname = usePathname();

  if (pathname === "/coach/clients") {
    return [{ label: "Nouveau client", href: "#nouveau-client" }];
  }
  if (pathname.startsWith("/coach/programs")) {
    return [{ label: "Nouveau template", href: "/coach/programs/templates/new" }];
  }
  if (pathname.startsWith("/coach/assessments")) {
    return [{ label: "Nouveau bilan", href: "/coach/assessments/templates/new" }];
  }
  if (pathname.startsWith("/coach/comptabilite")) {
    return [{ label: "Nouvelle facture", href: "#" }];
  }
  if (pathname.startsWith("/coach/formules")) {
    return [{ label: "Nouvelle formule", href: "#" }];
  }
  return [{ label: "Nouveau", href: "#" }];
}

export default function DockBottom() {
  const pathname = usePathname();
  const items = useDockBottom();
  const plusActions = usePlusActions();
  const [plusOpen, setPlusOpen] = useState(false);

  const leftItems = items.slice(0, Math.floor(items.length / 2));
  const rightItems = items.slice(Math.floor(items.length / 2));

  function isActive(href: string) {
    if (!href || href === "#" || href === "") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <ClientTabsBar />

      <div className="flex items-center gap-1 bg-[#181818] border-[0.3px] border-white/[0.06] rounded-2xl px-3 h-14">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href || "#"}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 h-10 rounded-xl transition-all duration-150 min-w-[52px] ${
                active
                  ? "bg-[#1f8a65]/10 text-[#1f8a65]"
                  : "text-white/40 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {items.length > 0 && <div className="w-px h-6 bg-white/[0.06] mx-1" />}

        <div className="relative">
          <button
            onClick={() => setPlusOpen((v) => !v)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1f8a65] text-white hover:bg-[#217356] active:scale-[0.95] transition-all duration-150"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          <AnimatePresence>
            {plusOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#181818] border-[0.3px] border-white/[0.06] rounded-xl overflow-hidden min-w-[180px]"
              >
                {plusActions.map((action, i) => (
                  <Link
                    key={i}
                    href={action.href}
                    onClick={() => setPlusOpen(false)}
                    className="flex items-center px-4 py-2.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    {action.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && <div className="w-px h-6 bg-white/[0.06] mx-1" />}

        {rightItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href || "#"}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 h-10 rounded-xl transition-all duration-150 min-w-[52px] ${
                active
                  ? "bg-[#1f8a65]/10 text-[#1f8a65]"
                  : "text-white/40 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {items.length === 0 && (
          <span className="text-[9px] text-white/20 px-2">Actions</span>
        )}
      </div>

      {plusOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setPlusOpen(false)} />
      )}
    </div>
  );
}
