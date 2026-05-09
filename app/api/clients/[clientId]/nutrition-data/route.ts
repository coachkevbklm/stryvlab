import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { NutritionClientData } from "@/lib/nutrition/types";
import { z } from "zod";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function avg(samples: number[]): number | null {
  if (samples.length === 0) return null;
  return (
    Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10
  );
}

const OCCUPATION_MULTIPLIER_MAP: Record<string, number> = {
  "Sédentaire (bureau)": 1.0,
  "Légèrement actif": 1.05,
  "Modérément actif": 1.1,
  "Très actif (travail physique)": 1.18,
};

// Schema for PATCH requests
const nutritionDataPatchSchema = z.object({
  weight_kg: z.number().positive().optional(),
  height_cm: z.number().positive().optional(),
  body_fat_pct: z.number().min(0).max(100).optional(),
  lean_mass_kg: z.number().positive().optional(),
  muscle_mass_kg: z.number().positive().optional(),
  bmr_kcal_measured: z.number().positive().optional(),
  bmr_source: z.enum(["measured", "estimated", "calculated"]).optional(),
  visceral_fat_level: z.number().min(0).optional(),
  daily_steps: z.number().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceClient();
  const { clientId } = params;

  // Ownership check
  const { data: client, error: clientError } = await db
    .from("coach_clients")
    .select(
      "id, first_name, last_name, email, date_of_birth, gender, weekly_frequency, fitness_level, training_goal, sport_practice, equipment_category",
    )
    .eq("id", clientId)
    .eq("coach_id", user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract submissionId from query params (optional)
  const { searchParams } = new URL(req.url);
  const requestedSubmissionId = searchParams.get("submissionId");

  // Fetch all submissions for the bilan selector (no limit)
  const { data: allSubmissions } = await db
    .from("assessment_submissions")
    .select("id, submitted_at, status")
    .eq("client_id", clientId)
    .eq("coach_id", user.id)
    .in("status", ["completed", "in_progress"])
    .order("submitted_at", { ascending: false });

  // Determine which submission to fetch data from
  let selectedSubmissionId = requestedSubmissionId;
  let targetSubmissionId = requestedSubmissionId;

  // If no specific submission requested, use latest
  if (!targetSubmissionId && allSubmissions && allSubmissions.length > 0) {
    targetSubmissionId = allSubmissions[0].id;
    selectedSubmissionId = targetSubmissionId;
  }

  // Fetch assessment data for the selected submission AND all previous submissions (for fallback)
  let submissions: Array<{
    id: string;
    client_id: string;
    submitted_at: string;
    assessment_responses: Array<{
      field_key: string;
      value_number: number | null;
      value_text: string | null;
      value_json: unknown;
    }>;
  }> = [];

  if (targetSubmissionId) {
    // Fetch target submission
    const { data: targetData } = await db
      .from("assessment_submissions")
      .select(
        `
        id,
        client_id,
        submitted_at,
        assessment_responses(field_key, value_number, value_text, value_json)
      `,
      )
      .eq("id", targetSubmissionId)
      .eq("client_id", clientId)
      .eq("coach_id", user.id)
      .single();
    if (targetData) {
      submissions = [targetData];
    }

    // Also fetch ALL older submissions (for fallback values if target has missing data)
    if (allSubmissions && allSubmissions.length > 1) {
      const olderIds = allSubmissions
        .slice(1)
        .map((s: any) => s.id);
      if (olderIds.length > 0) {
        const { data: olderData } = await db
          .from("assessment_submissions")
          .select(
            `
            id,
            client_id,
            submitted_at,
            assessment_responses(field_key, value_number, value_text, value_json)
          `,
          )
          .in("id", olderIds)
          .eq("client_id", clientId)
          .eq("coach_id", user.id)
          .order("submitted_at", { ascending: false });
        if (olderData) {
          submissions = [...submissions, ...olderData];
        }
      }
    }
  }

  const entry = {
    weight_kg: null as number | null,
    body_fat_pct: null as number | null,
    height_cm: null as number | null,
    muscle_mass_kg: null as number | null,
    lean_mass_kg: null as number | null,
    bmr_kcal_measured: null as number | null,
    visceral_fat_level: null as number | null,
    session_duration_min: null as number | null,
    training_calories: null as number | null,
    training_frequency: null as number | null,
    daily_steps: null as number | null,
    cardio_frequency: null as number | null,
    cardio_duration_min: null as number | null,
    caffeine_daily_mg: null as number | null,
    alcohol_weekly: null as number | null,
    work_hours_per_week: null as number | null,
    occupation: null as string | null,
    menstrual_cycle: null as string | null,
    stress_samples: [] as number[],
    sleep_h_samples: [] as number[],
    sleep_q_samples: [] as number[],
    energy_samples: [] as number[],
  };

  // Track data source (selected submission vs fallback)
  const dataSource: Record<string, 'selected' | 'fallback'> = {
    weight_kg: 'fallback',
    body_fat_pct: 'fallback',
    height_cm: 'fallback',
    muscle_mass_kg: 'fallback',
    lean_mass_kg: 'fallback',
    bmr_kcal_measured: 'fallback',
    visceral_fat_level: 'fallback',
    session_duration_min: 'fallback',
    training_calories: 'fallback',
    training_frequency: 'fallback',
    daily_steps: 'fallback',
    cardio_frequency: 'fallback',
    cardio_duration_min: 'fallback',
    caffeine_daily_mg: 'fallback',
    alcohol_weekly: 'fallback',
    work_hours_per_week: 'fallback',
  };

  const BIOMETRIC = [
    "weight_kg",
    "body_fat_pct",
    "height_cm",
    "muscle_mass_kg",
    "lean_mass_kg",
    "bmr_kcal_measured",
    "visceral_fat_level",
  ];
  const TRAINING = [
    "session_duration_min",
    "training_calories",
    "training_frequency",
  ];
  const CARDIO = ["daily_steps", "cardio_frequency", "cardio_duration_min"];
  const LIFESTYLE = [
    "caffeine_daily_mg",
    "alcohol_weekly",
    "work_hours_per_week",
  ];

  for (const sub of submissions ?? []) {
    const responses =
      (sub.assessment_responses as {
        field_key: string;
        value_number: number | null;
        value_text: string | null;
        value_json: unknown;
      }[]) ?? [];
    for (const r of responses) {
      const num = r.value_number;

      if (
        BIOMETRIC.includes(r.field_key) &&
        (entry as Record<string, unknown>)[r.field_key] === null &&
        num !== null
      ) {
        (entry as Record<string, unknown>)[r.field_key] = num;
        dataSource[r.field_key] = sub.id === targetSubmissionId ? 'selected' : 'fallback';
        continue;
      }
      if (
        TRAINING.includes(r.field_key) &&
        (entry as Record<string, unknown>)[r.field_key] === null &&
        num !== null
      ) {
        (entry as Record<string, unknown>)[r.field_key] = num;
        dataSource[r.field_key] = sub.id === targetSubmissionId ? 'selected' : 'fallback';
        continue;
      }
      if (
        CARDIO.includes(r.field_key) &&
        (entry as Record<string, unknown>)[r.field_key] === null &&
        num !== null
      ) {
        (entry as Record<string, unknown>)[r.field_key] = num;
        dataSource[r.field_key] = sub.id === targetSubmissionId ? 'selected' : 'fallback';
        continue;
      }
      if (
        LIFESTYLE.includes(r.field_key) &&
        (entry as Record<string, unknown>)[r.field_key] === null &&
        num !== null
      ) {
        (entry as Record<string, unknown>)[r.field_key] = num;
        dataSource[r.field_key] = sub.id === targetSubmissionId ? 'selected' : 'fallback';
        continue;
      }
      if (
        r.field_key === "stress_level" &&
        num !== null &&
        entry.stress_samples.length < 3
      ) {
        entry.stress_samples.push(num);
        continue;
      }
      if (
        r.field_key === "sleep_duration_h" &&
        num !== null &&
        entry.sleep_h_samples.length < 3
      ) {
        entry.sleep_h_samples.push(num);
        continue;
      }
      if (
        r.field_key === "sleep_quality" &&
        num !== null &&
        entry.sleep_q_samples.length < 3
      ) {
        entry.sleep_q_samples.push(num);
        continue;
      }
      if (
        r.field_key === "energy_level" &&
        num !== null &&
        entry.energy_samples.length < 3
      ) {
        entry.energy_samples.push(num);
        continue;
      }
      if (
        r.field_key === "occupation" &&
        entry.occupation === null &&
        r.value_text
      ) {
        entry.occupation = r.value_text;
        continue;
      }
      if (
        r.field_key === "menstrual_cycle" &&
        entry.menstrual_cycle === null &&
        r.value_text
      ) {
        entry.menstrual_cycle = r.value_text;
        continue;
      }
    }
  }

  // Fetch manual nutrition data overrides
  const { data: manualData } = await db
    .from("coach_client_nutrition_manual_data")
    .select("*")
    .eq("client_id", clientId)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Override with manual data (takes priority)
  if (manualData) {
    for (const field of [
      "weight_kg",
      "height_cm",
      "body_fat_pct",
      "lean_mass_kg",
      "muscle_mass_kg",
      "bmr_kcal_measured",
      "visceral_fat_level",
      "daily_steps",
    ]) {
      const value = (manualData as Record<string, unknown>)[field];
      if (value !== null && value !== undefined) {
        (entry as Record<string, unknown>)[field] = value;
        dataSource[field] = 'selected';
      }
    }
  }

  let age: number | null = null;
  if (client.date_of_birth) {
    const dob = new Date(client.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  }

  // Clamp training fields to sensible ranges
  if (entry.session_duration_min !== null) {
    entry.session_duration_min = Math.max(
      15,
      Math.min(240, entry.session_duration_min),
    );
  }
  if (entry.cardio_frequency !== null) {
    entry.cardio_frequency = Math.max(0, Math.min(14, entry.cardio_frequency));
  }
  if (entry.cardio_duration_min !== null) {
    entry.cardio_duration_min = Math.max(
      0,
      Math.min(180, entry.cardio_duration_min),
    );
  }

  // Validate weekly_frequency bounds (1-7 days/week)
  let validWeeklyFrequency =
    client.weekly_frequency ?? entry.training_frequency;
  if (
    validWeeklyFrequency != null &&
    (validWeeklyFrequency < 1 || validWeeklyFrequency > 7)
  ) {
    validWeeklyFrequency = null;
  }

  const result: NutritionClientData = {
    id: client.id,
    name: [client.first_name, client.last_name].filter(Boolean).join(" "),
    gender: client.gender ?? null,
    age,
    height_cm: entry.height_cm,
    weight_kg: entry.weight_kg,
    body_fat_pct: entry.body_fat_pct,
    muscle_mass_kg: entry.muscle_mass_kg,
    lean_mass_kg: entry.lean_mass_kg,
    bmr_kcal_measured: entry.bmr_kcal_measured,
    visceral_fat_level: entry.visceral_fat_level,
    weekly_frequency: validWeeklyFrequency,
    training_goal: client.training_goal ?? null,
    sport_practice: client.sport_practice ?? null,
    session_duration_min: entry.session_duration_min,
    training_calories_weekly: entry.training_calories,
    cardio_frequency: entry.cardio_frequency,
    cardio_duration_min: entry.cardio_duration_min,
    daily_steps: entry.daily_steps,
    stress_level: avg(entry.stress_samples),
    sleep_duration_h: avg(entry.sleep_h_samples),
    sleep_quality: avg(entry.sleep_q_samples),
    energy_level: avg(entry.energy_samples),
    caffeine_daily_mg: entry.caffeine_daily_mg,
    alcohol_weekly: entry.alcohol_weekly,
    work_hours_per_week: entry.work_hours_per_week,
    menstrual_cycle: entry.menstrual_cycle,
    occupation: entry.occupation,
    occupation_multiplier: entry.occupation
      ? (OCCUPATION_MULTIPLIER_MAP[entry.occupation] ?? null)
      : null,
  };

  return NextResponse.json({
    client: result,
    dataSource,
    allSubmissions: (allSubmissions || []).map((s: any) => ({
      id: s.id,
      date: new Date(s.submitted_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      }),
      status: s.status,
      submitted_at: s.submitted_at,
    })),
    selectedSubmissionId: selectedSubmissionId || null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceClient();
  const { clientId } = params;

  // Ownership check
  const { data: client, error: clientError } = await db
    .from("coach_clients")
    .select("id, coach_id")
    .eq("id", clientId)
    .eq("coach_id", user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validated = nutritionDataPatchSchema.parse(body);

    // Insert or upsert into manual data table
    const { error: upsertError } = await db
      .from("coach_client_nutrition_manual_data")
      .upsert(
        {
          client_id: clientId,
          coach_id: user.id,
          ...validated,
        },
        { onConflict: "client_id" },
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to update nutrition data" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Données mises à jour" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    console.error("PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
