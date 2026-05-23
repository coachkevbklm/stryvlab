import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import OpenAI from "openai";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import { buildSystemPrompt } from "@/lib/client/ai-coach/buildSystemPrompt";
import { buildDailyBrief } from "@/lib/client/ai-coach/buildDailyBrief";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import selectProtocolDayForDate from "@/lib/nutrition/selectProtocolDayForDate";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const checkinSchema = z.object({
  flow_type: z.enum(["morning", "evening"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data: z.object({
    sleep_hours: z.number().min(0).max(24).optional(),
    sleep_quality: z.number().int().min(1).max(4).optional(),
    energy_level: z.number().int().min(1).max(5).optional(),
    stress_level: z.number().int().min(1).max(5).optional(),
    weight_kg: z.number().min(20).max(300).optional(),
    hunger_level: z.number().int().min(1).max(4).optional(),
    muscle_soreness: z.number().int().min(1).max(4).optional(),
    notes: z.string().max(500).optional(),
  }),
  summary: z.string().max(500),
});

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = svc();
  const cc = await resolveClientFromUser(
    user.id,
    user.email,
    db,
    "id, first_name",
  );
  if (!cc)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Fetch data for daily brief in parallel with checkin processing (best-effort)
  const briefDataPromise = (async () => {
    try {
      const [programRes, protocolRes] = await Promise.allSettled([
        db
          .from("programs")
          .select(
            "name, frequency, program_sessions(name, day_of_week, days_of_week)",
          )
          .eq("client_id", cc.id as string)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db
          .from("nutrition_protocols")
          .select("nutrition_protocol_days(calories, protein_g, hydration_ml)")
          .eq("client_id", cc.id as string)
          .eq("status", "shared")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const activeProgram =
        programRes.status === "fulfilled"
          ? (programRes.value as any)?.data
          : null;
      const protocol =
        protocolRes.status === "fulfilled"
          ? (protocolRes.value as any)?.data
          : null;
      const protocolDay = selectProtocolDayForDate(protocol as any, date);

      const todayDow = new Date().getDay();
      const sessions: any[] = activeProgram?.program_sessions ?? [];
      const todaySession = sessions.find((s: any) => {
        const dows: number[] =
          Array.isArray(s.days_of_week) && s.days_of_week.length > 0
            ? s.days_of_week
            : s.day_of_week != null
              ? [s.day_of_week]
              : [];
        return dows.includes(todayDow);
      });

      return {
        sessionName: todaySession?.name ?? null,
        targetKcal: protocolDay?.calories ?? 0,
        targetProtein: protocolDay?.protein_g ?? 0,
        targetWaterMl: protocolDay?.hydration_ml ?? 2500,
      };
    } catch {
      return {
        sessionName: null,
        targetKcal: 0,
        targetProtein: 0,
        targetWaterMl: 2500,
      };
    }
  })();

  const parsed = checkinSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error },
      { status: 400 },
    );
  }
  const { flow_type, date, data, summary } = parsed.data;

  // Upsert check-in data
  const { error: checkinError } = await db
    .from("client_daily_checkins")
    .upsert(
      { client_id: cc.id, date, flow_type, ...data },
      { onConflict: "client_id,date,flow_type" },
    );
  if (checkinError) {
    return NextResponse.json(
      { error: "Failed to save check-in" },
      { status: 500 },
    );
  }

  // Mark chat_session completed
  await db
    .from("chat_sessions")
    .upsert(
      {
        client_id: cc.id,
        date,
        flow_type,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "client_id,date,flow_type" },
    );

  // Build system prompt + LLM closing message (non-blocking on failure)
  let closingMessage =
    flow_type === "morning"
      ? "Check-in matin enregistré ✓"
      : "Check-in soir enregistré ✓";

  try {
    const openai = getOpenAIClient()
    const systemPrompt = await buildSystemPrompt(cc.id as string)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${summary}\n\nGénère un message de clôture court (2-3 lignes max) personnalisé basé sur ces données. Sois direct et positif.`,
        },
      ],
    });
    closingMessage = completion.choices[0]?.message?.content ?? closingMessage;
  } catch {
    // Non-blocking — fallback to default message
  }

  // Persist closing message to chat_messages
  const { data: savedMsg } = await db
    .from("chat_messages")
    .insert({
      client_id: cc.id,
      role: "assistant",
      content: closingMessage,
      message_type: "text",
    })
    .select("id, role, content, message_type, metadata, created_at")
    .single();

  // Daily brief — structured day summary after check-in (non-blocking)
  try {
    const briefData = await briefDataPromise;
    const briefContent = await buildDailyBrief({
      flowType: flow_type,
      sessionName: briefData.sessionName,
      targetKcal: briefData.targetKcal,
      targetProtein: briefData.targetProtein,
      targetWaterMl: briefData.targetWaterMl,
      energyLevel: data.energy_level ?? null,
      sleepHours: data.sleep_hours ?? null,
      sleepQuality: data.sleep_quality ?? null,
      muscleSoreness: data.muscle_soreness ?? null,
    });

    await db.from("chat_messages").insert({
      client_id: cc.id,
      role: "assistant",
      content: briefContent,
      message_type: "daily_brief",
    });
  } catch {
    // Non-blocking — brief failure must not affect checkin response
  }

  // Update rate limit counter
  const today = computePhysiologicalDate(new Date());
  const { data: usage } = await db
    .from("ai_coach_daily_usage")
    .select("message_count")
    .eq("client_id", cc.id)
    .eq("date", today)
    .maybeSingle();
  const count = usage?.message_count ?? 0;
  await db
    .from("ai_coach_daily_usage")
    .upsert(
      { client_id: cc.id, date: today, message_count: count + 1 },
      { onConflict: "client_id,date" },
    );

  return NextResponse.json({
    closingMessage,
    botMessage: savedMsg,
    remaining: Math.max(0, 20 - (count + 1)),
  });
}
