"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientProvider, type ClientData } from "@/lib/client-context";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClient = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Client introuvable" : "Erreur serveur");
        return;
      }
      const data = await res.json();
      if (data.client) {
        setClient(data.client);
      } else {
        setError("Client introuvable");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return (
      <div className="px-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {/* Colonne gauche */}
          <div className="flex flex-col gap-4">
            {/* Card Informations */}
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-2.5 w-12" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-px bg-white/[0.05] mt-4" />
              <Skeleton className="h-2.5 w-36 mt-3" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-2.5 w-14" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Card Profil sportif */}
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[1,2,3,4,5].map(i => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
              <div className="h-px bg-white/[0.05] mt-2" />
              <Skeleton className="h-2.5 w-32" />
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-7 w-20 rounded-lg" />)}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="flex flex-col gap-4">
            {/* Card Accès client */}
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="bg-[#181818] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full ml-auto" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-[46px] w-full rounded-xl" />
              </div>
            </div>
            {/* Card Formules */}
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-32" />
              <div className="space-y-2">
                {[1,2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            {/* Card Tags */}
            <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-12" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="px-6 pt-10 text-center">
        <p className="text-[14px] text-white/50">{error || "Client introuvable"}</p>
        <button
          onClick={() => router.push("/coach/clients")}
          className="mt-4 text-[12px] text-[#1f8a65] hover:text-[#1f8a65]/70 transition-colors"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <ClientProvider client={client} clientId={clientId} refetch={fetchClient}>
      {children}
    </ClientProvider>
  );
}
