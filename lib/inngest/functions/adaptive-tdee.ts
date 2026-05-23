import { inngest } from "@/lib/inngest/client";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { calcAdaptiveTdee } from "@/lib/nutrition/adaptiveTdee";
import { selectProtocolDayForDate } from "@/lib/nutrition/selectProtocolDayForDate";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const adaptiveTdeeFunction = inngest.createFunction(
  {
    id: "nutrition-adaptive-tdee-weekly",
    retries: 2,
    triggers: [{ cron: "0 6 * * 1" }],
  },
  async ({ step }: { step: any }) => {
    const protocols = await step.run("fetch-active-protocols", async () => {
      const db = svc();
      const { data, error } = await db
        .from("nutrition_protocols")
        .select(
          "id, client_id, coach_id, created_at, nutrition_protocol_days(id, calories, protein_g, fat_g, carbs_g, position)",
        )
        .eq("status", "shared");
      if (error) throw new Error(`fetch-active-protocols: ${error.message}`);
      return data ?? [];
    });

    const results = await Promise.allSettled(
      (protocols as any[]).map((protocol) =>
        step.run(`process-protocol-${protocol.id}`, async () => {
          const db = svc();
          const clientId: string = protocol.client_id;
          const protocolId: string = protocol.id;
          const coachId: string = protocol.coach_id;
          const days: any[] = protocol.nutrition_protocol_days ?? [];
          const currentProtocolDay = selectProtocolDayForDate(
            protocol as any,
            new Date(),
          );

          const since = new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000,
          ).toISOString();

          const { data: weightRows } = await db
            .from("assessment_responses")
            .select(
              "value_number, assessment_submissions!inner(submitted_at, client_id)",
            )
            .eq("field_key", "weight_kg")
            .eq("assessment_submissions.client_id", clientId)
            .gte("assessment_submissions.submitted_at", since)
            .order("assessment_submissions(submitted_at)", { ascending: true });

          const weightSamples = (weightRows ?? [])
            .filter((r: any) => r.value_number != null)
            .map((r: any) => ({
              date: (r.assessment_submissions as any).submitted_at.slice(0, 10),
              weight_kg: r.value_number as number,
            }));

          if (weightSamples.length < 2) {
            return {
              skipped: true,
              reason: "insufficient_weight_samples",
              protocolId,
            };
          }

          const { data: mealRows } = await db
            .from("nutrition_meals")
            .select("calories")
            .eq("client_id", clientId)
            .gte("physiological_date", since.slice(0, 10));

          let avgIntakeKcal: number;
          let caloriesSource: "logs" | "protocol";

          if (mealRows && mealRows.length > 0) {
            const totalCal = mealRows.reduce(
              (sum: number, m: any) => sum + (m.calories ?? 0),
              0,
            );
            avgIntakeKcal = Math.round(totalCal / 14);
            caloriesSource = "logs";
          } else {
            const todayTarget =
              currentProtocolDay ??
              [...days].sort((a, b) => a.position - b.position)[0];
            avgIntakeKcal = todayTarget?.calories ?? 2000;
            caloriesSource = "protocol";
          }

          const result = calcAdaptiveTdee({
            weightSamples,
            avgIntakeKcal,
            caloriesSource,
            windowDays: 14,
          });

          const formulaTarget =
            currentProtocolDay ??
            [...days].sort((a, b) => a.position - b.position)[0];
          const tdeeFormula = formulaTarget?.calories ?? 2000;
          const deltaKcal = result.tdeeAdaptive - tdeeFormula;
          const protocolUpdated = Math.abs(deltaKcal) >= 150;

          await db.from("nutrition_tdee_history").insert({
            protocol_id: protocolId,
            client_id: clientId,
            tdee_formula: tdeeFormula,
            tdee_adaptive: result.tdeeAdaptive,
            delta_kcal: deltaKcal,
            weight_samples: weightSamples.length,
            calories_source: caloriesSource,
            avg_intake_kcal: avgIntakeKcal,
            weight_delta_kg: result.weightDeltaKg,
            protocol_updated: protocolUpdated,
          });

          if (!protocolUpdated) {
            return {
              skipped: true,
              reason: "delta_below_threshold",
              deltaKcal,
              protocolId,
            };
          }

          const ratio = result.tdeeAdaptive / tdeeFormula;
          for (const day of days) {
            await db
              .from("nutrition_protocol_days")
              .update({
                calories:
                  day.calories != null
                    ? Math.round(day.calories * ratio)
                    : null,
                protein_g:
                  day.protein_g != null
                    ? Math.round(day.protein_g * ratio)
                    : null,
                fat_g: day.fat_g != null ? Math.round(day.fat_g * ratio) : null,
                carbs_g:
                  day.carbs_g != null ? Math.round(day.carbs_g * ratio) : null,
              })
              .eq("id", day.id);
          }

          await db
            .from("nutrition_protocols")
            .update({
              tdee_adaptive: result.tdeeAdaptive,
              tdee_adaptive_at: new Date().toISOString(),
              tdee_data_source:
                caloriesSource === "protocol"
                  ? "formula_proxy"
                  : "weight_delta",
            })
            .eq("id", protocolId);

          const { data: clientRow } = await db
            .from("coach_clients")
            .select("first_name")
            .eq("id", clientId)
            .single();
          const firstName = (clientRow as any)?.first_name ?? "Client";

          await db.from("coach_client_notifications").insert({
            client_id: clientId,
            type: "tdee_updated",
            title: "Objectifs nutritionnels ajustés",
            body: "Ton programme reflète maintenant ta dépense réelle.",
            payload: { action_url: "/client/nutrition" },
          });

          const sign = deltaKcal > 0 ? "+" : "";
          await db.from("coach_client_notifications").insert({
            coach_id: coachId,
            client_id: clientId,
            type: "tdee_coach_alert",
            title: `TDEE ${firstName} recalculé`,
            body: `TDEE : ${tdeeFormula} → ${result.tdeeAdaptive} kcal (${sign}${deltaKcal})`,
            payload: {
              action_url: `/coach/clients/${clientId}/protocoles/nutrition`,
            },
          });

          return {
            updated: true,
            protocolId,
            tdeeAdaptive: result.tdeeAdaptive,
            deltaKcal,
          };
        }),
      ),
    );

    return {
      processed: (protocols as any[]).length,
      results: results.map((r) => r.status),
    };
  },
);
