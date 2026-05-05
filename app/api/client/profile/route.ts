import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";

const patchSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  training_goal: z
    .enum([
      "hypertrophy",
      "strength",
      "fat_loss",
      "endurance",
      "recomp",
      "maintenance",
      "athletic",
    ])
    .nullable()
    .optional(),
  fitness_level: z
    .enum(["beginner", "intermediate", "advanced", "elite"])
    .nullable()
    .optional(),
  sport_practice: z
    .enum(["sedentary", "light", "moderate", "active", "athlete"])
    .nullable()
    .optional(),
  weekly_frequency: z.number().int().min(1).max(7).nullable().optional(),
  profile_photo_url: z.string().url().nullable().optional(),
});

async function resolveClient(
  userId: string,
  service: ReturnType<typeof createServiceClient>,
) {
  const { data } = await service
    .from("coach_clients")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data as { id: string } | null;
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: client } = await service
    .from("coach_clients")
    .select(
      "id, first_name, last_name, email, phone, goal, date_of_birth, gender, training_goal, fitness_level, sport_practice, weekly_frequency, status, profile_photo_url, created_at",
    )
    .eq("user_id", user.id)
    .single();

  if (!client)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  return NextResponse.json({ client, email: user.email });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = patchSchema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: body.error }, { status: 400 });

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ) as any;

  const client = await resolveClient(user.id, service);
  if (!client)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data, error } = await service
    .from("coach_clients")
    .update({ ...body.data, updated_at: new Date().toISOString() })
    .eq("id", client.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client: data });
}
