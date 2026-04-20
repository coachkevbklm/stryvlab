"use client";

import { useMemo, useState, useEffect } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientHeader from "@/components/clients/ClientHeader";
import SubmissionsList from "@/components/assessments/dashboard/SubmissionsList";
import { SubmissionWithClient } from "@/types/assessment";

export default function BilansPage() {
  const { client, clientId } = useClient();
  const [submissions, setSubmissions] = useState<SubmissionWithClient[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/assessments/submissions?client_id=${clientId}`).then((r) => r.json()),
      fetch("/api/assessments/templates").then((r) => r.json()),
    ])
      .then(([subsData, templatesData]) => {
        setSubmissions(subsData.submissions ?? []);
        setTemplates(templatesData.templates ?? []);
      })
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
        {loading ? (
          <div className="text-[12px] text-white/30 py-8 text-center">Chargement…</div>
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
