import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import ProfilePhotoUpload from "@/components/client/profile/ProfilePhotoUpload";
import ProfileForm from "@/components/client/profile/ProfileForm";
import PreferencesForm from "@/components/client/profile/PreferencesForm";
import NotificationsPanel from "@/components/client/profile/NotificationsPanel";
import PasswordResetButton from "@/components/client/profile/PasswordResetButton";
import ClientLogoutButton from "./LogoutButton";
import ClientRestrictionsSection from "@/components/client/ClientRestrictionsSection";
import ClientTopBar from "@/components/client/ClientTopBar";
import { ct, type ClientLang } from "@/lib/i18n/clientTranslations";

export const metadata = { title: "Mon profil" };

export default async function ClientProfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/client/login");

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const client = (await resolveClientFromUser(
    user.id,
    user.email,
    service,
    "id, first_name, last_name, email, phone, goal, date_of_birth, gender, training_goal, fitness_level, sport_practice, weekly_frequency, status, profile_photo_url, created_at",
  )) as any;

  const [{ data: prefs }, { data: notifData }, { data: streakData }, { data: recentPoints }] = await Promise.all([
    client
      ? service
          .from("client_preferences")
          .select("*")
          .eq("client_id", (client as any).id)
          .single()
      : Promise.resolve({ data: null }),
    service
      .from("client_notifications")
      .select("id, type, message, read, created_at")
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      ? service
          .from("client_streaks")
          .select("current_streak, longest_streak, total_points, level")
          .eq("client_id", (client as any).id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client
      ? service
          .from("client_points")
          .select("action_type, points, earned_at")
          .eq("client_id", (client as any).id)
          .order("earned_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const firstName = client?.first_name ?? "";
  const lastName = client?.last_name ?? "";
  const initials =
    [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || (user.email ?? "Client");

  const preferences = prefs ?? {
    weight_unit: "kg",
    height_unit: "cm",
    language: "fr",
    notif_session_reminder: true,
    notif_bilan_received: true,
    notif_program_updated: true,
  };

  const lang: ClientLang = ['fr', 'en', 'es'].includes(preferences.language as string)
    ? preferences.language as ClientLang
    : 'fr'
  const dateLocale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB'

  const notifications = notifData ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <ClientTopBar
        section={ct(lang, 'profil.section')}
        title={ct(lang, 'profil.title')}
        right={
          <div className="w-8 h-8 rounded-full bg-[#1f8a65]/20 border-[0.3px] border-[#1f8a65]/30 flex items-center justify-center shrink-0 overflow-hidden">
            {client?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.profile_photo_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-[#1f8a65]">{initials}</span>
            )}
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-5 flex flex-col gap-4">
        {/* ── Infos personnelles + photo ── */}
        <Section title={ct(lang, 'profil.section.info')} icon="👤">
          <div className="flex flex-col items-center gap-4 pb-2">
            <ProfilePhotoUpload
              currentUrl={client?.profile_photo_url ?? null}
              initials={initials}
            />
            <div className="text-center">
              <p className="text-[15px] font-bold text-white">{fullName}</p>
              <p className="text-[12px] text-white/40 mt-0.5">{user.email}</p>
              {client?.status && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${
                    client.status === "active"
                      ? "bg-[#1f8a65]/15 text-[#1f8a65]"
                      : "bg-white/[0.06] text-white/40"
                  }`}
                >
                  {client.status === "active" ? ct(lang, 'profil.status.active') : client.status}
                </span>
              )}
            </div>
          </div>
          <div className="border-t-[0.3px] border-white/[0.06] pt-4">
            <ProfileForm
              clientId={client?.id ?? ""}
              initial={{
                first_name: client?.first_name ?? "",
                last_name: client?.last_name ?? "",
                phone: client?.phone ?? "",
                goal: client?.goal ?? "",
                date_of_birth: client?.date_of_birth ?? "",
                gender: client?.gender ?? "",
                training_goal: client?.training_goal ?? "",
                fitness_level: client?.fitness_level ?? "",
                sport_practice: client?.sport_practice ?? "",
                weekly_frequency: client?.weekly_frequency ?? null,
              }}
            />
          </div>
        </Section>

        {/* ── Restrictions physiques ── */}
        <Section title="Restrictions physiques" icon="🚫">
          <ClientRestrictionsSection />
        </Section>

        {/* ── Ma progression ── */}
        {streakData && (
          <Section title="Ma progression" icon="🏆">
            <ProgressionSection streak={streakData} recentPoints={recentPoints ?? []} />
          </Section>
        )}

        {/* ── Notifications ── */}
        <Section
          title={ct(lang, 'profil.section.notif')}
          icon="🔔"
          badge={unreadCount > 0 ? unreadCount : undefined}
        >
          <NotificationsPanel
            notifications={notifications}
            preferences={{
              notif_session_reminder: preferences.notif_session_reminder,
              notif_bilan_received: preferences.notif_bilan_received,
              notif_program_updated: preferences.notif_program_updated,
            }}
          />
        </Section>

        <Link
          href="/client/checkin/schedule"
          className="inline-flex h-9 items-center rounded-lg bg-white/[0.08] px-3 text-[11px] font-semibold text-white/80 hover:bg-white/[0.12]"
        >
          Configurer mes rappels
        </Link>

        {/* ── Préférences ── */}
        <Section title={ct(lang, 'profil.section.prefs')} icon="⚙️">
          <PreferencesForm
            initial={{
              weight_unit: preferences.weight_unit as "kg" | "lbs",
              height_unit: preferences.height_unit as "cm" | "ft",
              language: preferences.language as "fr" | "en" | "es",
            }}
          />
        </Section>

        {/* ── Sécurité ── */}
        <Section title={ct(lang, 'profil.section.security')} icon="🔒">
          <PasswordResetButton email={user.email ?? ""} />
        </Section>

        {/* ── Déconnexion ── */}
        <ClientLogoutButton />

        <p className="text-center text-[10px] text-white/20 pb-2">
          {ct(lang, 'profil.memberSince')}{" "}
          {new Date(client?.created_at ?? Date.now()).toLocaleDateString(
            dateLocale,
            { month: "long", year: "numeric" },
          )}
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon?: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/[0.02] rounded-xl border-[0.3px] border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[13px]">{icon}</span>}
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 flex-1">
          {title}
        </h2>
        {badge !== undefined && (
          <span className="w-[18px] h-[18px] rounded-full bg-[#1f8a65] text-white text-[9px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "text-amber-400" },
  silver: { label: "Argent", color: "text-white/60" },
  gold: { label: "Or", color: "text-yellow-400" },
  platinum: { label: "Platine", color: "text-cyan-400" },
};

const ACTION_LABELS: Record<string, string> = {
  checkin: "Check-in complété",
  checkin_late: "Check-in tardif",
  session: "Séance complétée",
  bilan: "Bilan complété",
  meal: "Repas loggué",
};

function ProgressionSection({
  streak,
  recentPoints,
}: {
  streak: { current_streak: number; longest_streak: number; total_points: number; level: string };
  recentPoints: { action_type: string; points: number; earned_at: string }[];
}) {
  const levelMeta = LEVEL_META[streak.level] ?? LEVEL_META.bronze;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className="text-[20px] font-black text-[#1f8a65] leading-none mb-1">{streak.current_streak}</p>
          <p className="text-[9.5px] font-medium text-white/40">Streak actuel</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className="text-[20px] font-black text-white leading-none mb-1">{streak.total_points}</p>
          <p className="text-[9.5px] font-medium text-white/40">Points total</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <p className={`text-[13px] font-black leading-none mb-1 ${levelMeta.color}`}>{levelMeta.label}</p>
          <p className="text-[9.5px] font-medium text-white/40">Niveau</p>
        </div>
      </div>

      {/* Record streak */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-white/40">Record streak</p>
        <p className="text-[12px] font-bold text-white">{streak.longest_streak} jours</p>
      </div>

      {/* Recent history */}
      {recentPoints.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Historique récent</p>
          {recentPoints.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <p className="text-[12px] text-white/55">{ACTION_LABELS[p.action_type] ?? p.action_type}</p>
              <p className="text-[12px] font-bold text-[#1f8a65]">+{p.points}</p>
            </div>
          ))}
        </div>
      )}

      {/* Configure reminders link */}
      <Link
        href="/client/checkin/schedule"
        className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
      >
        <p className="text-[12px] text-white/60">Configurer mes rappels</p>
        <p className="text-[10px] text-white/30">→</p>
      </Link>
    </div>
  );
}
