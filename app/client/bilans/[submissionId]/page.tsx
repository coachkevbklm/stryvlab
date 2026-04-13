import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock } from "lucide-react";

export default async function BilanDetailPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const client = await resolveClientFromUser(user!.id, user!.email, service);
  if (!client) notFound();

  const { data: submissionData, error } = await service
    .from("assessment_submissions")
    .select("id, status, created_at, submitted_at, template_snapshot")
    .eq("id", params.submissionId)
    .eq("client_id", client.id)
    .single();

  if (error || !submissionData) notFound();

  const { data: responses } = await service
    .from("assessment_responses")
    .select(
      "block_id, field_key, value_text, value_number, value_json, storage_path",
    )
    .eq("submission_id", params.submissionId);

  // Build response map for quick lookup
  const responseMap: Record<string, Record<string, any>> = {};
  for (const r of responses ?? []) {
    if (!responseMap[r.block_id]) responseMap[r.block_id] = {};
    responseMap[r.block_id][r.field_key] =
      r.value_text ?? r.value_number ?? r.value_json ?? r.storage_path;
  }

  const blocks: any[] = submissionData.template_snapshot?.blocks ?? [];
  const templateName = submissionData.template_snapshot?.name ?? "Bilan";
  const date = new Date(submissionData.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/60 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/client/bilans"
            className="text-secondary hover:text-primary"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-primary text-sm">{templateName}</h1>
            <p className="text-xs text-secondary">{date}</p>
          </div>
          <div className="ml-auto">
            {submissionData.status === "completed" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={11} />
                Complété
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <Clock size={11} />
                En cours
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 flex flex-col gap-4">
        {blocks.map((block: any) => {
          const blockResponses = responseMap[block.id] ?? {};
          const filledFields =
            block.fields?.filter(
              (f: any) => blockResponses[f.key] !== undefined,
            ) ?? [];
          if (filledFields.length === 0) return null;

          return (
            <div
              key={block.id}
              className="bg-surface rounded-card shadow-soft-out p-4"
            >
              <h2 className="font-semibold text-primary text-sm mb-3">
                {block.label}
              </h2>
              <div className="flex flex-col gap-2">
                {filledFields.map((field: any) => {
                  const val = blockResponses[field.key];
                  let display = String(val);
                  if (Array.isArray(val)) display = val.join(", ");
                  if (field.input_type === "photo_upload")
                    display = "📷 Photo uploadée";

                  return (
                    <div
                      key={field.key}
                      className="flex justify-between items-start gap-4 py-1.5 border-b border-white/40 last:border-0"
                    >
                      <span className="text-xs text-secondary flex-1">
                        {field.label}
                      </span>
                      <span className="text-xs font-medium text-primary text-right max-w-[55%] break-words">
                        {display}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {blocks.every(
          (b: any) => Object.keys(responseMap[b.id] ?? {}).length === 0,
        ) && (
          <div className="bg-surface rounded-card shadow-soft-out p-8 text-center">
            <p className="text-sm text-secondary">
              Aucune réponse enregistrée pour ce bilan.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
