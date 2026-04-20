"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useDock } from "@/components/layout/DockContext";

export default function ClientTabsBar() {
  const { openClients, activeClientId, closeClient, setActiveClient } = useDock();
  const router = useRouter();

  if (openClients.length === 0) return null;

  function handleSelect(clientId: string) {
    setActiveClient(clientId);
    router.push(`/coach/clients/${clientId}`);
  }

  function handleClose(e: React.MouseEvent, clientId: string) {
    e.stopPropagation();
    closeClient(clientId);
    if (activeClientId === clientId) {
      router.push("/coach/clients");
    }
  }

  return (
    <div className="flex items-center gap-1 px-2 overflow-x-auto no-scrollbar max-w-[640px]">
      {openClients.map((client) => {
        const active = client.id === activeClientId;
        const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
        return (
          <button
            key={client.id}
            onClick={() => handleSelect(client.id)}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
              active
                ? "bg-[#1f8a65]/10 text-[#1f8a65] border-[0.3px] border-[#1f8a65]/20"
                : "bg-white/[0.04] text-white/50 border-[0.3px] border-white/[0.06] hover:text-white/80 hover:bg-white/[0.06]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                active ? "bg-[#1f8a65]/20 text-[#1f8a65]" : "bg-white/[0.08] text-white/40"
              }`}
            >
              {initials}
            </span>
            <span>{client.firstName}</span>
            <span
              role="button"
              onClick={(e) => handleClose(e, client.id)}
              className="ml-0.5 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={10} strokeWidth={2} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
