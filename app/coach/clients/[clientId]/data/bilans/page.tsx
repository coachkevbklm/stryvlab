"use client";

import { useMemo, useState, useEffect } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import SubmissionsList from "@/components/assessments/dashboard/SubmissionsList";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmissionWithClient } from "@/types/assessment";

export default function BilansPage() {
  const { client, clientId } = useClient();
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      fetch(`/api/assessments/submissions?client_id=${clientId}`).then((r) => { if (!r.ok) throw new Error("submissions"); return r.json(); }),
      fetch("/api/assessments/templates").then((r) => { if (!r.ok) throw new Error("templates"); return r.json(); }),
    ])
      .then(([subsData, templatesData]) => {
        setSubmissions(subsData.submissions ?? []);
        setTemplates(templatesData.templates ?? []);
      })
      .catch(() => setError("Erreur lors du chargement des bilans"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const topBarLeft = useMemo(
    () => (
      <div>
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">Lab · Data</p>
        <p className="text-[13px] font-semibold text-white leading-none">
          {client.first_name} {client.last_name} — Bilans
        </p>
      </div>
    ),
    [client.first_name, client.last_name],
  );
  useSetTopBar(topBarLeft);

  async function handleSend(templateId: string, bilanDate: string, sendEmail: boolean) {
    const res = await fetch("/api/assessments/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        template_id: templateId,
        filled_by: "client",
        send_email: sendEmail,
        bilan_date: bilanDate,
      }),
    });
    const d = await res.json();
    if (d.submission) {
      setSubmissions((prev) => [
        {
          ...d.submission,
          template: templates.find((t) => t.id === templateId),
          client: { id: clientId, first_name: client.first_name, last_name: client.last_name },
        },
        ...prev,
      ] as SubmissionWithClient[]);
    }
  }

  return (
    <main className="min-h-screen bg-[#121212]">
      <ClientHeader />
      <div className="px-6 pb-24">
        {error ? (
          <p className="text-[13px] text-white/40 py-8 text-center">{error}</p>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <SubmissionsList
            submissions={submissions}
            templates={templates}
            clientId={clientId}
            onSend={handleSend}
          />
        )}
      </div>
    </main>
  );
}
