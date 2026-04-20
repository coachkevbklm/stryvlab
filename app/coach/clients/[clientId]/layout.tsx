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
      <div className="px-6 pt-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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
