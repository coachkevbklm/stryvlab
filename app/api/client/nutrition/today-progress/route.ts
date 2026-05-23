import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import selectProtocolDayForDate from "@/lib/nutrition/selectProtocolDayForDate";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET /api/client/nutrition/today-progress
export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cc } = await service()
    .from("coach_clients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!cc)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Use local-time physiological date (cutoff 04:00) — avoids UTC timezone offset bug
  const today = computePhysiologicalDate(new Date());

  // Next calendar day at 04:00 = upper bound of physiological day
  const nextDay = new Date(today + "T00:00:00");
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split("T")[0];

  const db = service();

  const [{ data: protocol }, { data: composerMeals }, { data: legacyMeals }] =
    await Promise.all([
      db
        .from("nutrition_protocols")
        .select("id, nutrition_protocol_days(*)")
        .eq("client_id", cc.id)
        .eq("status", "shared")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Composer meals — high confidence (0.85)
      db
        .from("nutrition_meals")
        .select("total_calories, total_protein_g, total_carbs_g, total_fat_g")
        .eq("client_id", cc.id)
        .eq("physiological_date", today),
      // Legacy AI meals — lower confidence (0.55), fallback
      db
        .from("meal_logs")
        .select("estimated_macros, ai_status")
        .eq("client_id", cc.id)
        .gte("logged_at", `${today}T04:00:00.000Z`)
        .lt("logged_at", `${nextDayStr}T04:00:00.000Z`)
        .eq("ai_status", "done"),
    ]);

  const fromComposer = (composerMeals ?? []).reduce(
    (acc, m: any) => ({
      calories: acc.calories + (Number(m.total_calories) || 0),
      protein_g: acc.protein_g + (Number(m.total_protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(m.total_carbs_g) || 0),
      fat_g: acc.fat_g + (Number(m.total_fat_g) || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const fromLegacy = (legacyMeals ?? []).reduce(
    (acc, m: any) => {
      const em = m.estimated_macros as Record<string, number> | null;
      if (!em) return acc;
      return {
        calories: acc.calories + (em.calories_kcal ?? 0),
        protein_g: acc.protein_g + (em.protein_g ?? 0),
        carbs_g: acc.carbs_g + (em.carbs_g ?? 0),
        fat_g: acc.fat_g + (em.fats_g ?? em.fat_g ?? 0),
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const consumed = {
    calories: fromComposer.calories + fromLegacy.calories,
    protein_g: fromComposer.protein_g + fromLegacy.protein_g,
    carbs_g: fromComposer.carbs_g + fromLegacy.carbs_g,
    fat_g: fromComposer.fat_g + fromLegacy.fat_g,
  };

  const targetDay = selectProtocolDayForDate(protocol as any, today);

  const target = targetDay
    ? {
        calories: Number(targetDay.calories ?? 0),
        protein_g: Number(targetDay.protein_g ?? 0),
        carbs_g: Number(targetDay.carbs_g ?? 0),
        fat_g: Number(targetDay.fat_g ?? 0),
      }
    : null;

  return NextResponse.json({
    consumed,
    target,
    hasProtocol: !!protocol,
    mealCount: (composerMeals ?? []).length + (legacyMeals ?? []).length,
  });
}
