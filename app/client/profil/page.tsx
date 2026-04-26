import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import ProfilePhotoUpload from "@/components/client/profile/ProfilePhotoUpload";
import ProfileForm from "@/components/client/profile/ProfileForm";
import PreferencesForm from "@/components/client/profile/PreferencesForm";
import NotificationsPanel from "@/components/client/profile/NotificationsPanel";
import PasswordResetButton from "@/components/client/profile/PasswordResetButton";
import ClientLogoutButton from "./LogoutButton";
import ClientRestrictionsSection from "@/components/client/ClientRestrictionsSection";
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
    "id, first_name, last_name, email, phone, goal, training_goal, fitness_level, sport_practice, weekly_frequency, status, profile_photo_url, created_at",
  )) as any;

  const [{ data: prefs }, { data: notifData }] = await Promise.all([
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
      {/* ── Topbar ── */}
      <header className="fixed top-4 left-4 right-4 z-40 h-14 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl bg-white/[0.04]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
        <div className="relative z-10 flex items-center justify-between w-full max-w-lg mx-auto h-full px-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
              {ct(lang, 'profil.section')}
            </p>
            <p className="text-[13px] font-semibold text-white leading-tight">
              {ct(lang, 'profil.title')}
            </p>
          </div>
          {/* Avatar mini */}
          <div className="w-8 h-8 rounded-full bg-[#1f8a65]/20 border-[0.3px] border-[#1f8a65]/30 flex items-center justify-center shrink-0">
            {client?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.profile_photo_url}
                alt={fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-[#1f8a65]">
                {initials}
              </span>
            )}
          </div>
        </div>
      </header>

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
