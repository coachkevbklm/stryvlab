import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import { detectMuscleGroups } from "@/lib/client/muscleDetection";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import {
  buildTimeline,
  type TimelineSource,
} from "@/lib/client/smart/timelineBuilder";
import { calculateStreaks } from "@/lib/client/progressTypes";
import ClientTopBar from "@/components/client/ClientTopBar";
import { type Notification } from "@/components/client/smart/NotificationsBar";
import SmartNutritionWidget, {
  type NutritionMacros,
} from "@/components/client/smart/SmartNutritionWidget";
import SmartWorkoutWidget, {
  type SmartWorkoutWidgetProps,
} from "@/components/client/smart/SmartWorkoutWidget";
import SmartAgendaTimeline from "@/components/client/smart/SmartAgendaTimeline";
import DashboardHeroSnapshot from "@/components/client/smart/DashboardHeroSnapshot";
import DashboardAlertsFeed from "@/components/client/smart/DashboardAlertsFeed";
import type { MuscleGroup } from "@/lib/client/muscleDetection";
import type { CheckinData } from "@/lib/client/smart/recoveryAlerts";
import type { GenericAlert } from "@/components/client/smart/SmartAlertsFeed";

function getTodayDow() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function estimateDuration(exercises: any[]): number {
  let totalSec = 0;
  for (const ex of exercises) {
    const sets = ex.sets ?? 3;
    const restSec = ex.rest_sec ?? 90;
    totalSec += sets * 45 + (sets - 1) * restSec;
  }
  return Math.round(totalSec / 60);
}

function mealTypeLabel(t: string): string {
  switch (t) {
    case "breakfast":
      return "Petit-déjeuner";
    case "lunch":
      return "Déjeuner";
    case "dinner":
      return "Dîner";
    case "snack":
      return "Collation";
    default:
      return "Repas";
  }
}

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function ClientHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const client = await resolveClientFromUser(
    user.id,
    user.email,
    svc(),
    "id, coach_id",
  );
  if (!client) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] p-4 pt-6 pb-24 max-w-[480px] mx-auto">
        <div className="bg-[#161616] rounded-2xl border border-white/[0.08] p-6 text-center">
          <p className="text-[14px] text-white">Aucun profil client trouvé.</p>
        </div>
      </main>
    );
  }

  const clientId = client.id;
  const todayDow = getTodayDow();
  const date = computePhysiologicalDate(new Date());
  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59Z`;

  // ── Parallel data fetches (all direct Supabase, no loopback HTTP) ──────────
  const [
    notifLegacyResult,
    notifCoachResult,
    protoResult,
    mealsResult,
    waterResult,
    programResult,
    sessionLogResult,
    activitiesResult,
    morningCheckinResult,
    nutritionWeekResult,
    streakResult,
  ] = await Promise.allSettled([
    // Legacy notifications (system + coach via old table)
    svc()
      .from("client_notifications")
      .select("id, type, message, read, created_at")
      .eq("target_user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(10),

    // New coach_client_notifications
    svc()
      .from("coach_client_notifications")
      .select("id, type, title, body, payload, read_at, created_at")
      .eq("client_id", clientId)
      .is("dismissed_at", null)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10),

    // Nutrition protocol target
    svc()
      .from("nutrition_protocols")
      .select(
        "nutrition_protocol_days(calories, protein_g, carbs_g, fat_g, hydration_ml)",
      )
      .eq("client_id", clientId)
      .eq("status", "shared")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Today's meals (exclude drinks — tracked separately in water logs)
    svc()
      .from("nutrition_meals")
      .select(
        "id, meal_type, title, logged_at, total_calories, total_protein_g, total_carbs_g, total_fat_g",
      )
      .eq("client_id", clientId)
      .eq("physiological_date", date)
      .neq("meal_type", "drinks")
      .order("logged_at", { ascending: true }),

    // Today's water
    svc()
      .from("client_water_logs")
      .select("logged_at, amount_ml")
      .eq("client_id", clientId)
      .gte("logged_at", dayStart)
      .lte("logged_at", dayEnd),

    // Active program + sessions
    svc()
      .from("coach_clients")
      .select(
        `
        id,
        programs (
          id, name, status,
          program_sessions (
            id, name, day_of_week,
            program_exercises (
              id, name, sets, rest_sec,
              primary_muscles, secondary_muscles, movement_pattern, is_compound
            )
          )
        )
      `,
      )
      .eq("id", clientId)
      .maybeSingle(),

    // Today's completed session (for timeline)
    svc()
      .from("client_session_logs")
      .select("id, completed_at, program_session_id")
      .eq("client_id", clientId)
      .not("completed_at", "is", null)
      .gte("completed_at", dayStart)
      .lte("completed_at", dayEnd)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Today's activity logs
    svc()
      .from("client_activity_logs")
      .select(
        "id, started_at, activity_type, custom_label, duration_min, intensity",
      )
      .eq("client_id", clientId)
      .gte("started_at", dayStart)
      .lte("started_at", dayEnd),

    // Today's morning check-in
    svc()
      .from("client_checkins")
      .select("responses")
      .eq("client_id", clientId)
      .eq("moment", "morning")
      .eq("date", date)
      .maybeSingle(),

    // Nutrition 7 derniers jours (régularité protéines)
    svc()
      .from("nutrition_meals")
      .select("physiological_date, total_protein_g")
      .eq("client_id", clientId)
      .gte("physiological_date", (() => {
        const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0];
      })())
      .order("physiological_date", { ascending: true }),

    // Session dates pour streak (logged_at uniquement — léger)
    svc()
      .from("client_session_logs")
      .select("logged_at")
      .eq("client_id", clientId)
      .not("completed_at", "is", null)
      .order("logged_at", { ascending: true }),
  ]);

  // ── Notifications ──────────────────────────────────────────────────────────
  const legacyNotifs =
    notifLegacyResult.status === "fulfilled"
      ? (notifLegacyResult.value.data ?? [])
      : [];
  const coachNotifs =
    notifCoachResult.status === "fulfilled"
      ? (notifCoachResult.value.data ?? [])
      : [];

  function normalizeNotificationType(value: unknown): Notification["type"] {
    if (
      value === "coach_note" ||
      value === "bilan_pending" ||
      value === "program_assigned" ||
      value === "system_reminder" ||
      value === "tdee_updated" ||
      value === "coach_feedback"
    ) {
      return value;
    }
    return "system_reminder";
  }

  const notifications: Notification[] = [
    ...legacyNotifs.map((n) => ({
      id: `legacy_${n.id}`,
      type: normalizeNotificationType(n.type),
      title: (n.message ?? "") as string,
      body: null,
      payload: null,
      read_at: n.read ? (n.created_at as string) : null,
      created_at: n.created_at as string,
    })),
    ...coachNotifs.map((n) => ({
      id: n.id as string,
      type: normalizeNotificationType(n.type),
      title: n.title as string,
      body: n.body as string | null,
      payload: n.payload as Record<string, unknown> | null,
      read_at: n.read_at as string | null,
      created_at: n.created_at as string,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  // ── Nutrition ──────────────────────────────────────────────────────────────
  const proto =
    protoResult.status === "fulfilled" ? protoResult.value.data : null;
  const td = (proto?.nutrition_protocol_days as any)?.[0];
  const target: NutritionMacros = {
    kcal: Number(td?.calories ?? 0),
    protein_g: Number(td?.protein_g ?? 0),
    carbs_g: Number(td?.carbs_g ?? 0),
    fat_g: Number(td?.fat_g ?? 0),
    water_ml: Number(td?.hydration_ml ?? 2500),
  };

  const meals =
    mealsResult.status === "fulfilled" ? (mealsResult.value.data ?? []) : [];
  const water =
    waterResult.status === "fulfilled" ? (waterResult.value.data ?? []) : [];

  const consumedBase = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + Number((m as any).total_calories ?? 0),
      protein_g: acc.protein_g + Number((m as any).total_protein_g ?? 0),
      carbs_g: acc.carbs_g + Number((m as any).total_carbs_g ?? 0),
      fat_g: acc.fat_g + Number((m as any).total_fat_g ?? 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  const water_ml = water.reduce((s, w) => s + Number(w.amount_ml ?? 0), 0);
  const consumed: NutritionMacros = { ...consumedBase, water_ml };

  // ── Recovery Status ───────────────────────────────────────────────────────
  const morningCheckinRow =
    morningCheckinResult.status === "fulfilled"
      ? morningCheckinResult.value.data
      : null;
  const morningCheckin: CheckinData | null = morningCheckinRow?.responses ?? null;

  // ── Timeline ───────────────────────────────────────────────────────────────
  const sessionRow =
    sessionLogResult.status === "fulfilled"
      ? sessionLogResult.value.data
      : null;
  const activities =
    activitiesResult.status === "fulfilled"
      ? (activitiesResult.value.data ?? [])
      : [];

  let timelineSession: TimelineSource["session"] = null;
  if (sessionRow) {
    const { count } = await svc()
      .from("client_set_logs")
      .select("exercise_name", { count: "exact", head: true })
      .eq("session_log_id", sessionRow.id);
    timelineSession = {
      id: sessionRow.id,
      completed_at: sessionRow.completed_at as string,
      title: "Séance",
      duration_min: 0,
      exercises_count: count ?? 0,
    };
  }

  const timelineEntries = buildTimeline({
    meals: meals.map((m) => ({
      id: m.id,
      logged_at: m.logged_at,
      title: (m as any).title ?? mealTypeLabel(m.meal_type),
      meal_type: m.meal_type as any,
      kcal: Number((m as any).total_calories ?? 0),
      protein_g: Number((m as any).total_protein_g ?? 0),
      carbs_g: Number((m as any).total_carbs_g ?? 0),
      fat_g: Number((m as any).total_fat_g ?? 0),
    })),
    waterLogs: water.map((w) => ({
      logged_at: w.logged_at,
      amount_ml: Number(w.amount_ml ?? 0),
    })),
    session: timelineSession,
    activities: activities.map((a) => ({
      id: a.id,
      started_at: a.started_at,
      activity_type: a.activity_type as any,
      custom_label: a.custom_label,
      duration_min: a.duration_min,
      intensity: a.intensity,
    })),
    checkins: [],
  });

  // ── Workout widget ─────────────────────────────────────────────────────────
  const programData =
    programResult.status === "fulfilled" ? programResult.value.data : null;
  const programs = ((programData as any)?.programs ?? []).filter(
    (p: any) => p.status === "active",
  );
  const todaysSession = programs[0]?.program_sessions?.find(
    (s: any) => s.day_of_week === todayDow,
  );

  let workoutProps: SmartWorkoutWidgetProps;

  if (!programs[0]) {
    workoutProps = { state: "no_program" };
  } else if (!todaysSession) {
    workoutProps = { state: "rest" };
  } else {
    const exercises = todaysSession.program_exercises ?? [];
    const muscles = detectMuscleGroups(
      exercises.map((e: any) => ({
        id: e.id,
        name: e.name,
        primary_muscles: e.primary_muscles ?? [],
        secondary_muscles: e.secondary_muscles ?? [],
        movement_pattern: e.movement_pattern ?? null,
        is_compound: e.is_compound ?? null,
      })),
    );
    const pills: string[] = Array.from(muscles.primary)
      .slice(0, 3)
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1));

    workoutProps = {
      state: "scheduled",
      session: {
        id: todaysSession.id,
        sessionLogHref: `/client/programme/session/${todaysSession.id}`,
        name: todaysSession.name ?? "Séance",
        exerciseCount: exercises.length,
        estimatedMinutes: estimateDuration(exercises),
        primaryMuscles: Array.from(muscles.primary) as MuscleGroup[],
        secondaryMuscles: Array.from(muscles.secondary) as MuscleGroup[],
        musclePills: pills,
      },
    };
  }

  // ── Session streak ────────────────────────────────────────────────────────
  const streakRows = streakResult.status === "fulfilled"
    ? (streakResult.value.data ?? [])
    : [];
  const sessionDates = Array.from(
    new Set((streakRows as any[]).map((r) => (r.logged_at as string).split("T")[0]))
  ).sort() as string[];
  const { streak } = calculateStreaks(sessionDates);

  // ── Protein regularity streak ─────────────────────────────────────────────
  const nutritionWeekRows = nutritionWeekResult.status === "fulfilled"
    ? (nutritionWeekResult.value.data ?? [])
    : [];

  const proteinByDate: Record<string, number> = {};
  for (const row of nutritionWeekRows as any[]) {
    const d = row.physiological_date as string;
    proteinByDate[d] = (proteinByDate[d] ?? 0) + Number(row.total_protein_g ?? 0);
  }
  const proteinStreakDays = target.protein_g > 0
    ? Object.values(proteinByDate).filter(p => p >= target.protein_g * 0.8).length
    : undefined;

  // ── Hero snapshot data ────────────────────────────────────────────────────
  const kcalRemaining = target.kcal > 0 ? target.kcal - consumed.kcal : null;

  type SessionState = "scheduled" | "completed" | "rest" | "no_program";
  const sessionState: SessionState = (() => {
    if (workoutProps.state === "no_program") return "no_program";
    if (workoutProps.state === "rest") return "rest";
    if (sessionRow) return "completed";
    return "scheduled";
  })();

  const sessionNameForHero =
    sessionState === "scheduled" || sessionState === "completed"
      ? (workoutProps.session?.name ?? null)
      : null;

  const heroDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  // ── Workout alerts placeholder (no HTTP loop) ─────────────────────────────
  const workoutAlerts: GenericAlert[] = [];

  return (
    <>
      <ClientTopBar section="AUJOURD'HUI" title={heroDate} />
      <main className="min-h-screen bg-[#0d0d0d] p-4 pt-[72px] pb-24 max-w-[480px] mx-auto space-y-3">

        {/* Bloc 1 — Hero Snapshot */}
        <DashboardHeroSnapshot
          kcalRemaining={kcalRemaining}
          sessionState={sessionState}
          sessionName={sessionNameForHero}
          waterMl={consumed.water_ml}
          waterTargetMl={target.water_ml}
          streak={streak}
          date={heroDate}
        />

        {/* Bloc 2 — Alertes prioritaires */}
        <DashboardAlertsFeed
          coachNotifications={notifications}
          morningCheckin={morningCheckin}
          workoutAlerts={workoutAlerts}
          consumed={consumed}
          target={target}
          plannedSessionToday={workoutProps.state === "scheduled"}
        />

        {/* Bloc 3 — Séance du jour */}
        <SmartWorkoutWidget {...workoutProps} />

        {/* Bloc 4 — Nutrition */}
        <SmartNutritionWidget
          consumed={consumed}
          target={target}
          proteinStreakDays={proteinStreakDays}
        />

        {/* Bloc 5 — Timeline */}
        <SmartAgendaTimeline entries={timelineEntries} />

      </main>
    </>
  );
}
