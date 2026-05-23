import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import selectProtocolDayForDate from "@/lib/nutrition/selectProtocolDayForDate";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(_req: NextRequest) {
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

  const today = new Date();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(computePhysiologicalDate(d));
  }

  const { data: proto } = await svc()
    .from("nutrition_protocols")
    .select("nutrition_protocol_days(calories)")
    .eq("client_id", cc.id)
    .eq("status", "shared")
    .limit(1)
    .maybeSingle();

  const targetsByDay: Record<string, number> = {};
  for (const d of days) {
    const td = selectProtocolDayForDate(proto as any, d);
    targetsByDay[d] = Number(td?.calories ?? 2400);
  }

  const { data: meals } = await svc()
    .from("nutrition_meals")
    .select("physiological_date, calories")
    .eq("client_id", cc.id)
    .in("physiological_date", days);

  const totals: Record<string, number> = {};
  for (const d of days) totals[d] = 0;
  for (const m of meals ?? []) {
    totals[m.physiological_date] =
      (totals[m.physiological_date] ?? 0) + Number(m.calories ?? 0);
  }

  const trend = days.map((d) => ({
    date: d,
    consumed: totals[d],
    target: targetsByDay[d],
  }));
  return NextResponse.json({ trend });
}
