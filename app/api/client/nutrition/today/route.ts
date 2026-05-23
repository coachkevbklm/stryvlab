import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import { selectProtocolDayForTraining } from "@/lib/nutrition/selectProtocolDayForDate";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cc } = await svc()
    .from("coach_clients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!cc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam ?? computePhysiologicalDate(new Date());

  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59Z`;

  const { data: proto } = await svc()
    .from("nutrition_protocols")
    .select(
      "nutrition_protocol_days(calories, protein_g, carbs_g, fat_g, hydration_ml)",
    )
    .eq("client_id", cc.id)
    .eq("status", "shared")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: trainingToday } = await svc()
    .from("training_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .limit(1);

  const td = selectProtocolDayForTraining(
    proto as any,
    date,
    Boolean(trainingToday?.length),
  );
  const target = {
    kcal: Number(td?.calories ?? 0),
    protein_g: Number(td?.protein_g ?? 0),
    carbs_g: Number(td?.carbs_g ?? 0),
    fat_g: Number(td?.fat_g ?? 0),
    water_ml: Number(td?.hydration_ml ?? 2500),
  };

  const { data: meals } = await svc()
    .from("nutrition_meals")
    .select(
      "id, meal_type, title, logged_at, calories, protein_g, carbs_g, fat_g",
    )
    .eq("client_id", cc.id)
    .eq("physiological_date", date)
    .order("logged_at", { ascending: true });

  const consumed = (meals ?? []).reduce(
    (acc, m) => ({
      kcal: acc.kcal + Number(m.calories ?? 0),
      protein_g: acc.protein_g + Number(m.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(m.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(m.fat_g ?? 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const { data: water } = await svc()
    .from("client_water_logs")
    .select("amount_ml, logged_at")
    .eq("client_id", cc.id)
    .gte("logged_at", dayStart)
    .lte("logged_at", dayEnd);

  const water_ml = (water ?? []).reduce(
    (s, w) => s + Number(w.amount_ml ?? 0),
    0,
  );

  return NextResponse.json({
    date,
    target,
    consumed: { ...consumed, water_ml },
    meals: meals ?? [],
    water_logs: water ?? [],
  });
}
