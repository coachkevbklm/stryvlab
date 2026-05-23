import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import selectProtocolDayForDate from "@/lib/nutrition/selectProtocolDayForDate";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = service();
  const cc = await resolveClientFromUser(user.id, user.email, db, "id");
  if (!cc)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const today = computePhysiologicalDate(new Date());
  const todayDow = new Date(today + "T00:00:00").getDay();

  const nextDay = new Date(today + "T00:00:00");
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split("T")[0];

  const [
    { data: sessions },
    { data: composerMeals },
    { data: legacyMeals },
    { data: waterRows },
    { data: chatSessions },
    { data: protocol },
  ] = await Promise.all([
    db
      .from("program_sessions")
      .select("id, name, programs!inner(status, client_id)")
      .eq("programs.client_id", cc.id)
      .eq("programs.status", "active")
      .eq("day_of_week", todayDow),

    db
      .from("nutrition_meals")
      .select("total_calories")
      .eq("client_id", cc.id)
      .eq("physiological_date", today),

    db
      .from("meal_logs")
      .select("estimated_macros")
      .eq("client_id", cc.id)
      .gte("logged_at", `${today}T04:00:00.000Z`)
      .lt("logged_at", `${nextDayStr}T04:00:00.000Z`)
      .eq("ai_status", "done"),

    db
      .from("client_water_logs")
      .select("amount_ml")
      .eq("client_id", cc.id)
      .gte("logged_at", `${today}T00:00:00Z`)
      .lte("logged_at", `${today}T23:59:59Z`),

    db
      .from("chat_sessions")
      .select("flow_type, completed_at")
      .eq("client_id", cc.id)
      .eq("date", today),

    db
      .from("nutrition_protocols")
      .select("nutrition_protocol_days(calories, hydration_ml)")
      .eq("client_id", cc.id)
      .eq("status", "shared")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const caloriesLogged =
    (composerMeals ?? []).reduce(
      (s: number, m: any) => s + (Number(m.total_calories) || 0),
      0,
    ) +
    (legacyMeals ?? []).reduce((s: number, m: any) => {
      const em = m.estimated_macros as Record<string, number> | null;
      return s + (em?.calories_kcal ?? 0);
    }, 0);

  const waterLogged = (waterRows ?? []).reduce(
    (s: number, r: any) => s + (Number(r.amount_ml) || 0),
    0,
  );

  const td = selectProtocolDayForDate(protocol as any, today);
  const calorieTarget = Number(td?.calories ?? 2000);
  const waterTarget = Number(td?.hydration_ml ?? 2500);

  return NextResponse.json({
    sessions: (sessions ?? []).map((s: any) => ({ id: s.id, name: s.name })),
    calories: { logged: Math.round(caloriesLogged), target: calorieTarget },
    water: { logged: waterLogged, target: waterTarget },
    checkin: {
      morning: (chatSessions ?? []).some(
        (s: any) => s.flow_type === "morning" && s.completed_at,
      ),
      evening: (chatSessions ?? []).some(
        (s: any) => s.flow_type === "evening" && s.completed_at,
      ),
    },
  });
}
