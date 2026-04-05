# CHANGELOG

## 2026-04-05

REFACTOR: Coach layout architecture — implement Option C design with horizontal top nav + full-width content
- Remove Sidebar from coach/layout.tsx (sidebar remains in dashboard/outils)
- Transform layout from flex row+sidebar to pure flex column: TopBar → SubHeader → Content
- Update coach layout background to bg-background
- Prepare architecture for future right-side floating panels/drawers

REFACTOR: Coach sidebar — transform from fixed full-height to floating design with rounded corners and side margins
- Change `fixed top-0 left-0 h-screen` → `fixed top-4 left-4 h-[calc(100vh-32px)]` — floating with 16px margin
- Add `rounded-card` (16px radius) for modern floating appearance
- Update border colors to `border-subtle` (#BCBCB8) for consistency with STRYVR v2.1 design system
- Update shadow to `shadow-elevated` for proper floating depth
- Remove `pl-56` padding from coach layout since sidebar no longer occupies static space
- Change layout bg from `bg-surface` to `bg-background` for entire page

FIX: coach client page — add protective error handling in rankedTemplates calculation to prevent render crashes if rankTemplatesFull fails; console logs for debugging template scoring
REFACTOR: Coach client page — apply brand design system v2.1 (dark top bar, yellow pills, crème backgrounds) + integrate CoachTopBar and ClientSubHeader components
FEATURE: Create CoachTopBar component — professional top navigation bar with STRYVR branding (#343434 bg, #FCF76E active tabs)
FEATURE: Create ClientSubHeader component — client identity sub-header with avatar, name, back button

REFACTOR: MetricsSection — visual redesign aligned with new design direction: sage green bg (#E8EDE8), alternating white/dark KPI cards, chartreuse (#D4F542) accent badges, pill-shaped bar charts (Recharts BarChart + custom PillBar shape), pill-tab navigation, clean white cards replacing neumorphic shadows
CHORE: tailwind.config.ts — add chartreuse (#D4F542), metrics-bg (#E8EDE8), metrics-dark (#1C1C1C) color tokens

FEATURE: MetricsSection — full redesign of coach metrics tab: KPI cards with delta, interactive data table with expand/collapse, per-category charts (Composition/Mensurations/Bien-être), manual entry modal, compact CSV import button
FEATURE: Add POST /api/clients/[clientId]/metrics — manual measurement entry
FEATURE: Add PATCH /api/clients/[clientId]/metrics/[submissionId] — edit measurement values and date
FEATURE: Add DELETE /api/clients/[clientId]/metrics/[submissionId] — delete a measurement row
REFACTOR: GET /api/clients/[clientId]/metrics now returns both series (for charts) and rows (for table), ordered most-recent-first for table
REFACTOR: CsvImportButton — add compact prop for icon-only button variant
REFACTOR: coach client page — replace CsvImportButton+ClientMetricsDashboard with MetricsSection

FIX: CSV import — autoDetectMappings now deduplicates fieldKey assignments (highest confidence wins, others set to null)
FIX: ClientMetricsDashboard — replace assessment submissions endpoint (which excluded CSV imports) with new /api/clients/[clientId]/metrics route that includes all completed submissions
FEATURE: Add GET /api/clients/[clientId]/metrics — returns all numeric metric series per client in a single query, CSV imports included
FIX: ClientMetricsDashboard — add refreshKey prop so onImported callback forces an immediate reload of charts
FIX: ClientMetricsDashboard — align TRACKED_FIELDS with TARGET_FIELDS (18 fields, including sleep_hours, stress_level, all circumferences; remove non-existent sleep_quality)

## 2026-04-05

FIX: Remove useless back buttons on root coach pages (clients, assessments, comptabilite, formules)

## 2026-04-05 — Templates STRYVR — UX dupliquer & personnaliser

REFACTOR: templates STRYVR — footer carte remplacé par bouton principal "Dupliquer & personnaliser" + message "Modèle STRYVR — dupliquer pour personnaliser" ; bouton Assigner retiré (flux via copie)
REFACTOR: templates coach — footer inchangé (Assigner, Voir, Modifier, Dupliquer, Supprimer)

## 2026-04-05 — Fix templates propriétaires + matching client

FIX: edit/page.tsx — charger avec .or(coach_id,is_system) puis redirect /view si is_system ou non-propriétaire (résout le 404 "Modifier" sur templates système/propriétaires)
FIX: client programme tab — affiche warning fréquence ±1 en orange sous chaque template
FIX: client programme tab — hard stop reason affichée avec ✕ rouge sous le template bloqué
REFACTOR: client programme tab — templates incompatibles opacity 40% au lieu de 50%

## 2026-04-05 — Templates UI complète + matching fréquence assoupli

FEATURE: Page /view lecture seule — visualise tout template (système ou coach) avec GIFs, patterns, équipements, séries totales
FIX: Bouton "Modifier" templates système — redirige vers /view (plus de 404) ; Modifier uniquement pour templates coach
FIX: Matching fréquence — tolérance ±1 (écart=1 → warning, écart>1 → hard stop) ; was exact-only
FEATURE: Template cards — badge équipement archétype + total séries + badge "Système" violet
FEATURE: Bouton "Voir" (eye) sur toutes les cartes templates (nouveau)
FIX: Bouton Supprimer/Modifier masqués pour les templates système sur la liste
FEATURE: seed_system_templates_images.sql — 88 exercices liés aux GIFs du catalog via matching movement_pattern
FEATURE: seed_system_templates_images.sql — correction muscle_tags archétypes 3 & 4 (tags alignés avec MUSCLE_OPTIONS builder)
FIX: MUSCLE_OPTIONS builder étendu — Fessiers, Ischio-jambiers, Quadriceps, Lombaires, Posture ajoutés
FIX: Filtre muscle templates list — même extension que MUSCLE_OPTIONS

## 2026-04-05 — Fix templates système visibles

FIX: /api/program-templates GET — filtre .or(coach_id,is_system) pour inclure les templates système (coach_id=null)
FIX: /api/program-templates/[id] GET + POST (duplication) — même correctif
FIX: /api/program-templates/[id]/assign — même correctif

## 2026-04-05 — Tests API routes

FEATURE: Setup Vitest — vitest.config.ts + tests/setup.ts + mocks next/server + mock Supabase factory
FEATURE: 56 tests API routes — /api/clients (12), /api/session-logs (11), /api/assessments/submissions (14), /api/programs (11) — 4 fichiers, 0 échec
CHORE: package.json — scripts test / test:watch / test:coverage

## 2026-04-04 — Security Hardening

CHORE: Audit complet sécurité — 46 routes API + 16 migrations Supabase vérifiées
SCHEMA: supabase/migrations/20260404_rls_hardening.sql — 9 RLS policies INSERT explicit + client_sees_own_submissions + idempotent ENABLE RLS sur 20 tables
CHORE: project-state.md — correction statut auth (obsolète "coachId stub" → documentation exacte de l'architecture sécurité effective)

## 2026-04-05

FEATURE: ProgressionHistory coach — historique des surcharges par exercice dans l'onglet Performance
FEATURE: GET /api/progression/history — événements groupés par exercice avec charge courante
FEATURE: Champs target_rir + weight_increment_kg dans ProgramEditor (builder exercice coach)
FEATURE: Parsing automatique rep_min/rep_max à l'assignation template (parseRepsRange)
CHORE: PUT /api/programs/.../exercises — passe rep_min, rep_max, target_rir, weight_increment_kg
CHORE: env.production.example — ajout INTERNAL_API_SECRET (server-to-server)
SEED: seed_system_templates_progression.sql — 5 archétypes système avec plages DP complètes
FEATURE: Double Progression + RIR — algorithme activable par programme (lib/progression/double-progression.ts)
FEATURE: API POST /api/progression/evaluate — évaluation automatique fire-and-forget à la fin de chaque séance
FEATURE: SessionLogger — colonne RIR réel, pré-remplissage charge suggérée, hint progression par exercice
FEATURE: ProgressionToggle coach — toggle ON/OFF par programme depuis la page preview
SCHEMA: programs.progressive_overload_enabled, program_exercises.(rep_min, rep_max, target_rir, weight_increment_kg, current_weight_kg), client_set_logs.rir_actual, table progression_events
CHORE: PATCH /api/programs/[programId] — champ progressive_overload_enabled patchable
FEATURE: Seed 5 archétypes fondamentaux système (Full-Body Fondation, PPL Hypertrophie, Force Upper/Lower, Recomposition Circuits, Spécialisation Chaîne Postérieure)
SCHEMA: coach_program_templates — ajout is_system, slug unique, coach_id nullable
SCHEMA: RLS additionnelle — SELECT public is_system=true pour tous les coaches authentifiés, UPDATE/DELETE bloqués sur templates système

## 2026-04-04

FIX: /dashboard — bannière bienvenue noire ne flash plus au chargement (hasClients attend que clientCount soit résolu)

FIX: /coach/clients/[clientId] — onglets role="tablist"/role="tab"/aria-selected + overflow-x-auto whitespace-nowrap (responsive petits écrans)
FIX: /coach/clients — chargement progressif : clients affichés immédiatement, tags+abonnements enrichis en arrière-plan (suppression spinner N+1)
FIX: SessionLogger — empty state si aucun exercice dans la séance

FIX: /coach/assessments — confirm() natif remplacé par modal neumorphique branded (pattern design system)
FIX: /coach/clients, /coach/comptabilite, /coach/formules — bg-[#F2F2F2] → bg-surface (token design system)
FIX: /coach/assessments/templates/[id]/edit — text-[#8A8A8E] → text-secondary, text-[#FF4D6D] → text-red-500, bg-[#F2F2F2] → bg-surface
FIX: /coach/programs/templates — linear-gradient hex hardcodé → bg-accent/60 (token accent STRYVR)
FIX: ExercisePicker — badge compteur filtres bg-red-500 → bg-accent (rouge réservé aux erreurs)

FIX: app/api/stripe/webhook/route.ts — replace Resend with nodemailer SMTP Namecheap for IPT account creation email
FEATURE: app/api/stripe/coaching/webhook/route.ts — webhook Stripe coaching (checkout.session.completed, invoice.payment_succeeded/failed, subscription.deleted/updated)
FEATURE: app/api/stripe/coaching/checkout/route.ts — création Stripe Checkout Session pour formules coaching (subscription + one_time)
FEATURE: lib/stripe/client.ts — singleton Stripe client + BILLING_TO_STRIPE mapping
SCHEMA: supabase/migrations/20260404_stripe_coaching.sql — stripe_customer_id sur coach_clients, stripe_product_id/price_id sur coach_formulas, stripe_subscription_id/checkout_session_id sur client_subscriptions
FEATURE: components/crm/ClientFormulasTab.tsx — bouton "Lien Stripe" pour déclencher checkout coaching depuis le dossier client

FEATURE: /coach/formules — page catalogue formules (créer, éditer, archiver/restaurer, voir clients abonnés par formule avec navigation directe vers dossier)
FEATURE: /api/formulas/[id]/subscribers — liste des abonnements par formule avec infos client
FEATURE: Sidebar — ajout liens Formules (/coach/formules) et Comptabilité (/coach/comptabilite) dans section Principal

FEATURE: lib/email/mailer.ts — sendPaymentReceiptEmail (reçu paiement client avec tableau montant/date/méthode/référence)
FIX: /api/assessments/submissions/[id] PATCH — templateName récupéré depuis la DB au lieu de '' vide lors du renvoi email
FEATURE: /api/payments POST + /api/subscriptions/[id]/payments POST — envoi automatique reçu email client quand status=paid (non-bloquant)
CHORE: env.production.example — Resend remplacé par SMTP Namecheap Private Email

FEATURE: CRM system — coach_formulas, client_subscriptions, subscription_payments, coach_tags, client_tags (migration 20260404_crm_system.sql)
FEATURE: API routes — /api/formulas (CRUD), /api/clients/[id]/subscriptions, /api/subscriptions/[id], /api/subscriptions/[id]/payments, /api/payments, /api/tags, /api/clients/[id]/tags, /api/comptabilite
FEATURE: /coach/clients — vue enrichie avec stats strip (total/actifs/formule), filtres (statut/objectif/tag/formule), toggle grid/liste, tags et formule active sur chaque carte
FEATURE: /coach/clients/[clientId] — 2 nouveaux onglets : CRM (tags, infos contact, urgence, source, notes internes) + Formules (abonnements multi-formules, historique paiements)
FEATURE: /coach/comptabilite — dashboard revenus : MRR, ARR, chart 12 mois, top clients, catalogue formules, tableau paiements filtrable + export CSV
FEATURE: components/crm/ClientCrmTab.tsx — gestion tags (créer/assigner/retirer) + informations CRM enrichies (date naissance, genre, adresse, contact urgence, source acquisition, notes internes)
FEATURE: components/crm/ClientFormulasTab.tsx — abonnements multi-formules par client (assigner/résilier), paiements par abonnement (enregistrer), création de formule inline
SCHEMA: coach_clients — nouveaux champs CRM : date_of_birth, gender, address, city, emergency_contact_name/phone, internal_notes, acquisition_source

FIX: assign/page.tsx — gestion erreur explicite sur handleAssign (message visible si la route échoue)
FIX: template-matcher — session.exercises → coach_program_template_exercises avec fallback (nom Supabase vs nom type)
FIX: ExercisePicker — onSelect transmet désormais movementPattern + equipment[] du catalogue en plus du nom/gif
FIX: ProgramTemplateBuilder — sélection depuis la bibliothèque auto-remplit movement_pattern + equipment_required (matching Phase 3 sans saisie manuelle)

FIX: /coach/clients/[clientId] — onglet Programme branché sur rankTemplates() 3 phases (suppression ancien scoreTemplate() avec fréquence par proximité)
FIX: /coach/clients/[clientId] — champ equipment_category ajouté en lecture + édition dans le formulaire profil
FIX: /api/clients/[clientId] PATCH — equipment_category ajouté dans la liste des champs autorisés

FEATURE: ProgramTemplateBuilder — champ equipment_archetype (6 archétypes) + movement_pattern + equipment_required sur chaque exercice pour le matching Phase 3
FEATURE: Template matching — algorithme 3 phases (lib/matching/template-matcher.ts) : Phase 1 filtre univers équipement, Phase 2 scoring strict fréquence exacte + niveau ±1, Phase 3 substitution zéro tolérance polyarticulaires
SCHEMA: coach_clients.equipment_category + coach_program_templates.equipment_archetype + coach_program_template_exercises.movement_pattern + equipment_required (migration 20260404_template_matching_v2.sql)
FEATURE: assign/page.tsx — rewritten avec rankTemplates() : hard stops visibles, raisons lisibles, substitutions inline, toggle incompatibles
CHORE: API routes program-templates — SELECT + INSERT/UPDATE intègrent equipment_archetype, movement_pattern, equipment_required

FEATURE: ExercisePicker — filtre "Démos pédagogiques" pour accéder aux 7 GIFs de démonstration technique (positions squat, deadlift, fente)
FIX: ExercisePicker — labels mouvements traduits (Legs, Charnière, Porté, Gainage au lieu de Hinge/Carry/Core anglais)
FIX: exercise-catalog — noms régénérés avec accents (Développé, Soulevé, Élévation latérale, haltère, épaule, élastique, etc.)
FIX: exercise-catalog — 7 GIFs pédagogiques exclus du catalogue (vues anatomiques, positions)
FIX: exercise-catalog — slugToName nettoie "shoulder press", "abdos", "dips assistes" redondants en fin de nom
REFACTOR: NotificationBell — retirée des headers de page (dashboard, clients, bilans, templates) — cloche unique dans le Sidebar footer
FIX: NotificationBell coach — filtrage par type (assessment_completed, session_reminder uniquement) pour éviter d'afficher les notifs destinées au client
FIX: Sidebar — move overflow-y-auto from aside to nav child so footer/NotificationBell dropdown is never clipped
FEATURE: NotificationBell — sidebarMode prop: renders as full-width nav row, dropdown opens right with fixed positioning

FEATURE: ExercisePicker — modal bibliothèque avec 458 GIFs, filtres muscle/mouvement/matériel/type, recherche full-text, grid animée
FEATURE: ProgramEditor — bouton "Bibliothèque" sur chaque exercice pour piocher dans la base GIF + auto-remplissage du nom
FEATURE: ProgramTemplateBuilder — idem, bouton "Bibliothèque" sur chaque exercice avec picker
CHORE: generate-exercise-catalog.ts — script de génération du catalogue JSON (458 exercices, inférence équipement/pattern/compound)
CHORE: data/exercise-catalog.json — catalogue statique généré (muscleGroup, pattern, equipment, isCompound, muscles)
FIX: exercise-catalog — extension-lombaire/hanche/hip-thrust pattern corrigé pull→hinge
FIX: exercise-catalog — thruster/overhead-squat ajoutent pattern legs
FIX: exercise-catalog — zercher/jefferson/pin-squat/safety-bar equipment barbell
FIX: exercise-catalog — presse-à-cuisse/belt-squat/pendulum/pec-deck equipment machine
FIX: exercise-catalog — renegade-row/souleve-valise/windmill equipment dumbbell/kettlebell
FIX: exercise-catalog — croix-de-fer/overhead-shrug/pec-deck/nordic isCompound corrigés
FIX: exercise-catalog — marche-avec-elastique pattern pull→legs

FIX: CSV import — support séparateur point-virgule (;) et tabulation en plus de la virgule (CSV Excel/FR)
FIX: CSV import — buildPreview ne bloque plus si aucune colonne date détectée (fallback date du jour)
FIX: CSV import — warning UI affiché quand aucune date détectée dans le fichier
FIX: ClientAccessToken — remplace confirm() natif par modal branded STRYVR (neumorphisme, overlay blur) pour la révocation du lien d'accès
REFACTOR: NotificationBell déplacée dans les headers de page (dashboard, clients, bilans, templates) — position right-0 top-full standard, dropdown toujours visible, suppression CoachHeader intermédiaire qui créait un double header
FEATURE: CoachHeader partagé dans layout coach — titre de page dynamique + NotificationBell en top bar droite (dropdown right-0 top-full, standard pro), cloche retirée du Sidebar
FEATURE: NotificationBell coach dans Sidebar — cloche avec badge rouge (unread count), panel dropdown avec liste notifications + marquer lu/tout lire, polling 30s, intégrée dans le footer du Sidebar coach
FEATURE: Notif coach quand client complète une séance — PATCH /api/session-logs/[logId] insère une notification coach (type session_reminder) avec le nom de la séance et du client dès que completed=true
FEATURE: Notifications in-app client câblées — helper insertClientNotification() avec target_user_id auto-résolu, branché sur POST /api/assessments/submissions (bilan_received), POST /api/programs (program_assigned), POST /api/program-templates/[id]/assign (program_assigned)
REFACTOR: Extraction lib/client/resolve-client.ts — helper resolveClientFromUser() avec fallback email auto-link, appliqué sur toutes les pages client (programme, bilans, bilan detail, session, progress, profil)
FIX: Page /client/programme — 404 quand client non trouvé par user_id, remplacé notFound() par fallback liaison email (même pattern que home), état vide si pas de programme
FEATURE: Page profil client v2 — photo upload (Supabase Storage bucket profile-photos), formulaire identité+objectif+niveau+activité+fréquence, préférences unité poids/taille/langue, panel notifications in-app avec toggles prefs, reset mot de passe par email, modal déconnexion
SCHEMA: Migration 20260404_client_profile_v2 — table client_preferences, colonne profile_photo_url sur coach_clients, extension client_notifications (types + target_user_id + RLS client), bucket profile-photos
FEATURE: Page profil client complète — initiales avatar, stats 30j (séances complétées/démarrées/dernière), programme actif avec lien, raccourci progression, infos personnelles (email/téléphone/objectif), modal confirmation déconnexion branded
CHORE: Capacitor remote-URL mode — capacitor.config.ts avec server.url (prod=CAPACITOR_SERVER_URL, dev=localhost:3000), plugins SplashScreen/StatusBar/Keyboard/Haptics configurés, appId com.stryvlab.client, scripts/build-native.sh (ios|android|sync)
FIX: SessionLogger — gestion d'erreur POST/PATCH avec banner rouge + bouton "Réessayer", PATCH completion best-effort (session sauvegardée même si PATCH échoue), fix bug rest timer useEffect dependency, état saveState ('idle'|'saving'|'error') remplace booléen saving, bouton finish reflète l'état d'erreur
FEATURE: Historique performance client — page /client/progress avec KPIs (séances, sets, volume, durée), area chart volume, courbes progression charge max par exercice ; API GET /api/client/performance ; ProgressCharts (Recharts) ; onglet "Progrès" dans BottomNav
FEATURE: PWA — manifest.json (scope /client, standalone, theme #ededed), service worker (cache-first assets, stale-while-revalidate pages, network-first API), ServiceWorkerRegistrar client component, appleWebApp meta tags
FEATURE: Bouton "Email" sur chaque bilan en attente/en cours — envoie le lien par email au client sans regénérer de token ; feedback "Envoyé !" 2.5s ; masqué si pas d'email client renseigné
FIX: Envoi email bilan depuis dossier client — toggle "Envoyer par email" dans le modal, label du bouton adaptatif ("Créer le lien" vs "Envoyer + email"), email client affiché sous le toggle, message si pas d'email renseigné
FIX: Template __csv_import__ exclu du select "Envoyer un bilan" — GET /api/assessments/templates filtre les templates système
FIX: Submissions import CSV masquées de l'onglet Bilans — GET /api/assessments/submissions filtre les entrées liées au template __csv_import__ ; plus de bouton "Voir" menant en 404
FEATURE: Template assign page — client list ranked by scoring v2 (same algorithm as dossier client picker); badge score + label + profil structuré affiché sur chaque client; "Recommandé" pill sur le top match
SCHEMA: coach_clients — add training_goal, fitness_level, sport_practice, weekly_frequency (structured enum fields for deterministic scoring)
FEATURE: Template compatibility scoring v2 — 4 clean signals (training_goal 45pts, fitness_level 30pts, weekly_frequency 20pts, sport_practice 5pts); no free-text fuzzy matching; signal count hint in picker
FEATURE: Client profile edit form — inline toggle with 4 selects (objectif, niveau, pratique sport, fréquence) + notes textarea, saved via PATCH /api/clients/[id]
FEATURE: Client creation form — 4 structured selects replace free-text goal field

FIX: CSV parser — header multi-ligne fusionné, détection colonne date par meilleur ratio (pas seulement première), fusion date+heure si colonne heure adjacente détectée, dates avec heure intégrée (DD/MM/YYYY HH:MM) parsées avec précision
FEATURE: Template compatibility scoring in client program tab — templates ranked by match score (0–100%) based on client goal + inferred frequency; green/amber/grey badge per template; top match highlighted with "Recommandé" pill and accent ring

FIX: Image containers adapt to intrinsic dimensions — replaced fixed-height `h-28`/`h-32` + `fill` + `object-cover` with `width={0} height={0}` + `w-full h-auto` in ProgramTemplateBuilder, ProgramEditor, and program preview page; GIFs are unoptimized

FEATURE: Import CSV mesures corporelles — bouton "Importer un CSV" dans l'onglet Métriques du dossier client, parse le format tableur coach (poids, % MG, masse musculaire, masse osseuse, graisse viscérale, BMR, tour de taille, âge métabolique), insère dans assessment_submissions + assessment_responses, détecte les doublons
FEATURE: API POST /api/clients/[clientId]/import-csv — parse CSV format spécifique, crée template système __csv_import__ si absent, insère submissions + réponses, idempotent sur (client_id, template_id, submitted_at)
FIX: Email templates — brand colors (#0e8c5b accent, #1A1A1A header), logo URL dynamique via NEXT_PUBLIC_SITE_URL, shared emailTemplate helper
FIX: Modal branded sur suppression template — remplacement confirm() natif par modal neumorphique STRYVR sur /coach/programs/templates
FEATURE: Preview programme coach — page /coach/clients/[id]/programs/[id]/preview, vue identique à la mini-app client, avec images, badge "Vue client", strip jours, bouton retour
FEATURE: Images dans ProgramEditor — upload/affichage/suppression par exercice, même pattern que ProgramTemplateBuilder
FIX: image_url propagée lors de l'assignation template → programme client (assign route + PUT exercises)
SCHEMA: Colonne image_url ajoutée sur program_exercises (migration SQL manuelle)
FIX: Remplacement confirm() natif par modal branded sur suppression programme (dossier client)
CHORE: Règle modale de confirmation ajoutée dans .claude/rules/ui-design-system.md — pattern obligatoire pour toutes les confirmations destructives
FEATURE: Visibilité programme — toggle Eye/EyeOff par programme dans le dossier client, badge "Masqué" sur les programmes archivés, la mini-app client filtre sur status=active
FEATURE: Suppression de programme depuis le dossier client — bouton corbeille avec confirmation, suppression instantanée du state
FIX: ProgramEditor — sessions chargées depuis program_sessions et program_exercises (clés normalisées)
FIX: Nom du programme lors de l'assignation depuis page templates — pré-remplit "Template — Prénom Nom" dès sélection du client, cohérent avec le flow dossier client
FIX: image_url manquante dans SELECT de la page edit template
FEATURE: Assignation template depuis dossier client — bouton "Depuis un template" dans l'onglet Programme, picker avec goal/level/durée, assignation directe sans quitter le dossier
FIX: Mismatch noms de tables — renommer coach_programs/coach_program_sessions/coach_program_exercises → programs/program_sessions/program_exercises dans toutes les routes API et composants
FEATURE: Images exercices dans templates — upload par exercice (Supabase Storage bucket exercise-images), prévisualisation + suppression inline dans ProgramTemplateBuilder
SCHEMA: Colonne image_url text ajoutée sur coach_program_template_exercises (migration SQL manuelle)
FEATURE: API POST /api/program-templates/exercises/upload-image — upload sécurisé (auth, 5 Mo max, jpeg/png/webp/gif)
FEATURE: Lien d'accès client — bouton "Envoyer par email" dans ClientAccessToken (génère + envoie l'email en un clic)
FEATURE: mailer.ts — sendAccessLinkEmail avec nom du coach + template branded
FIX: Emails — nom du coach affiché ("Jean Dupont vous a envoyé un bilan") via user_metadata + sujet personnalisé
FIX: Dossier client — alert() natif remplacé par toast branded (bg-primary, accent, slide-in) après copie du lien bilan
SECURITY: Middleware — /coach/* et /dashboard/* protégés (redirect /auth/login si non authentifié)
SECURITY: .gitignore renforcé — .env*, *.key, credentials, backups, IDE tooling exclus
CHORE: Git repo initialisé — aucun secret tracké, .env.local exclu
REFACTOR: Logo logo.png appliqué partout — client login, home, bilans, programme, SessionLogger, AssessmentForm, Sidebar, page d'accueil, emails
FEATURE: Marque "STRYV lab" ajoutée — header public, page d'accueil, sidebar coach, login coach, login client, footer
FEATURE: Police Unbounded configurée (next/font/local) — variable CSS --font-unbounded, classe Tailwind font-unbounded, appliquée sur tous les logos STRYV lab

## 2026-04-03

REFACTOR: Renommage domaine complet — virtus-smartfit.com → stryvlab.com, contact@virtus → coach@stryvlab.com, noreply → noreply@stryvlab.com, logo3.png partout, package name stryv-coach
FEATURE: Email notifications via Resend — bilan envoyé au client (lien + expiry) + bilan complété notifié au coach
FEATURE: lib/email/resend.ts — sendBilanEmail + sendBilanCompletedEmail avec templates HTML branded
FIX: Remplace console.log stub dans POST /api/assessments/submissions par envoi Resend réel (non-bloquant)
FEATURE: POST /api/assessments/public/[token]/responses — email coach quand client soumet (auth.admin.getUserById pour récupérer email coach)

SCHEMA: assessment_submissions — ajout colonne bilan_date (date choisie par le coach, défaut = today)
FEATURE: Bilans — date picker dans les modals d'envoi (assessments page + SubmissionsList + client dossier)
FEATURE: SubmissionsList — date éditable inline sur chaque ligne (clic → input date → blur/Entrée sauvegarde via PATCH)
FEATURE: PATCH /api/assessments/submissions/[id] — accepte bilan_date pour mise à jour post-création

FEATURE: SubmissionsList — boutons Supprimer, Copier le lien, Renvoyer sur chaque ligne de bilan
FEATURE: DELETE /api/assessments/submissions/[id] — suppression d'une soumission + ses réponses
FEATURE: PATCH /api/assessments/submissions/[id] — option renew_token pour régénérer un lien expiré

FEATURE: Templates d'entraînement — catalogue filtrable (objectif/niveau/fréquence/muscle), builder, édition, duplication, suppression
FEATURE: Assignation template → programme client avec matching score heuristique + nom personnalisable
FEATURE: API CRUD /api/program-templates + /api/program-templates/[id]/assign
SCHEMA: supabase/migrations/20260403_program_templates.sql — coach_program_templates + sessions + exercises + RLS
FEATURE: Sidebar — ajout entrée "Programmes" → /coach/programs/templates
FEATURE: Dashboard Performance — onglet "Performance" dans le dossier client coach
FEATURE: KPIs (séances, volume, sets, reps, durée, RPE moyen), filtres période (7/30/90j/tout), filtres métrique (volume/reps/séries)
FEATURE: Graphique AreaChart évolution temporelle, RadarChart répartition musculaire, BarChart volume par groupe, LineChart progression par exercice, RPE trend
FEATURE: API GET /api/clients/[id]/performance — agrégation complète avec inférence groupe musculaire
FEATURE: Log de séance client — SessionLogger avec chrono, sets à cocher, reps/poids/RPE, repos timer auto
FEATURE: Bouton "Commencer" sur chaque séance dans /client/programme → /client/programme/session/[id]
FEATURE: Onglet "Historique" dans le dossier client coach — séances réalisées, sets, poids max par exercice
FEATURE: API POST/GET /api/session-logs + PATCH /api/session-logs/[id]
SCHEMA: supabase/migrations/20260403_session_logs.sql — client_session_logs + client_set_logs + RLS
CHORE: Renommage tables programs → coach_programs, program_sessions → coach_program_sessions, program_exercises → coach_program_exercises (conflit schéma Prisma existant)
FEATURE: Magic link client — coach génère/copie/révoque/renouvelle un lien d'accès one-click depuis le dossier client
FEATURE: /client/access/[token] — échange token → magic link Supabase → session → /client (liaison user_id auto)
FEATURE: Pages /client/access/invalid et /client/access/expired
SCHEMA: supabase/migrations/20260403_client_access_tokens.sql — table client_access_tokens + RLS coach
FEATURE: API GET/POST/DELETE /api/clients/[id]/access-token — générer, récupérer, révoquer
FEATURE: Programme coach manuel — éditeur séances/exercices dans dossier client (onglet Programme)
FEATURE: PWA client — /client/programme affiche le programme actif avec séances, day strip, highlight aujourd'hui
FEATURE: Bottom nav client — ajout onglet Programme (4 entrées)
SCHEMA: supabase/migrations/20260403_programs.sql — tables programs, program_sessions, program_exercises + RLS coach + client
FEATURE: API CRUD /api/programs, /api/programs/[id], /api/programs/[id]/sessions, /api/programs/[id]/sessions/[id]/exercises
FEATURE: Client bilans — bouton "Remplir" sur les bilans pending/in_progress → /bilan/[token], bouton "Voir" sur completed → détail
FEATURE: Client PWA Phase 2 — bilans list, bilan detail, profil, bottom nav
SCHEMA: supabase/migrations/20260403_client_user_link.sql — user_id sur coach_clients + RLS policies client (profil, submissions, responses)
FEATURE: Client auth Phase 1 — app/client/login (connexion + création compte + liaison userId↔coach_clients)
FEATURE: app/client/page.tsx — home client protégée (programme/bilans/profil placeholders)
FEATURE: app/client/layout.tsx — protection SSR de toutes les routes /client/*
FEATURE: app/client/auth/confirm/route.ts — échange PKCE code → session, redirect /client
FEATURE: Middleware — routes /client/* protégées, /client/login redirige si déjà connecté

FEATURE: Upload photo fonctionnel dans les bilans — widget drag & drop + preview + signed URL Supabase Storage (côté client via token public, côté coach via auth)
FEATURE: API POST /api/assessments/submissions/[id]/upload-url — endpoint upload côté coach
FIX: Biométrie épurée — plis cutanés (4 champs) et IMC déplacés vers mensurations ; biométrie ne contient plus que données balance/DEXA
FEATURE: Sidebar persistante sur dashboard, coach/* et outils/* — composant Sidebar partagé via layouts Next.js
REFACTOR: Sidebar extraite du dashboard vers components/layout/Sidebar.tsx — dashboard nettoyé (sidebar inline supprimée)
FEATURE: Logique conditionnelle sur les champs — show_if (eq, neq, includes, not_empty) avec évaluation runtime dans le formulaire client et le builder coach
FEATURE: Page templates — bouton envoyer (modal sélection client + lien de remplissage) + bouton dupliquer
FEATURE: API POST /api/assessments/templates/[id] — endpoint de duplication
FIX: Mensurations (taille, hanches, ratio, poitrine, cou, poignet) déplacées de biométrie vers le module mensurations
FEATURE: Ajout 3 nouveaux modules coach pro — Lifestyle, Performance & Force, Psychologie & Motivation (13 modules total)
FEATURE: Enrichissement modules existants — chronotype, situation de vie, plis cutanés, tour de poignet, repas extérieurs, budget alimentaire, zone cardio, tracker connecté, caféine, récupération post-séance, tension artérielle, bilan sanguin (ferritine/vitD/TSH/testostérone), antécédents familiaux, matériel préféré, historique coaching, suivi psy
REFACTOR: Refonte complète lib/assessments/modules.ts — 11 modules, sans doublons, catégorisation correcte
FEATURE: Nouveau module "Informations générales" (taille, âge, sexe, occupation, niveau)
FEATURE: Nouveau module "Composition corporelle" (DEXA/impédance — séparé de biométrie)
FEATURE: Nouveau module "Cardio & Activité" (NEAT, VO2max, types cardio — séparé entraînement)
FEATURE: Module "Médical" enrichi (pathologies, traitements, cycle menstruel)
FEATURE: Champ visible/masqué par champ (en plus de requis/optionnel) dans BlockCard
FEATURE: Boutons "Tout afficher" / "Tout masquer" sur chaque bloc du builder
FEATURE: Nouveaux types d'inputs — textarea, date, boolean, multiple_choice
FEATURE: MetricField gère tous les nouveaux types (boolean toggle, multiple_choice, date, textarea)
FEATURE: AssessmentForm filtre les champs non visibles + payload correct par type
REFACTOR: BlockPalette mise à jour avec les 11 modules et icônes correspondantes
FIX: IMC déplacé dans Composition corporelle (valeur calculée, pas mesure directe)
FIX: sport_calories déplacé dans Entraînement (dépense sportive, pas nutrition)
FIX: training_type remplacé par training_types (multiple_choice)

FEATURE: Update dashboard — sidebar + modules + quick actions + stats wired to real data
FEATURE: Stats strip fetches real client count, submission count, unread notifications
FEATURE: Welcome banner hidden once the coach has at least 1 client
FEATURE: Sidebar "Clients" → /coach/clients, "Bilans" replaces "Rapports" → /coach/assessments
FEATURE: Notification bell badge wired to unread notification count
FEATURE: All module cards and quick actions pointing to live routes

## 2026-04-02

FEATURE: Add full assessment/bilan system — template builder, client form, metrics dashboard
FEATURE: Add GET/PATCH /api/clients/[clientId] — single client fetch and update
FEATURE: Add /api/assessments/templates CRUD + /api/assessments/submissions CRUD
FEATURE: Add /api/assessments/public/[token] routes — unauthenticated client form with token validation + expiry
FEATURE: Add /api/assessments/public/[token]/upload-url — signed Supabase Storage URLs for photos
FEATURE: Add /api/assessments/notify — GET + PATCH notifications for coach
FEATURE: Add TemplateBuilder UI with drag & drop block ordering (components/assessments/builder/)
FEATURE: Add AssessmentForm with block navigation, 2s auto-save debounce, submit flow
FEATURE: Add ClientMetricsDashboard with Recharts time series (components/assessments/dashboard/)
FEATURE: Add SubmissionsList with send-bilan modal
FEATURE: Add /coach/assessments pages — template list, new, edit
FEATURE: Add /coach/clients/[clientId] — 3-tab profile (Profil, Bilans, Métriques)
FEATURE: Add /bilan/[token] — public client bilan page (no auth)
FEATURE: Add "Voir le dossier" button on client cards in /coach/clients
SCHEMA: Add supabase/migrations/20260402_assessment_system.sql — 4 tables + RLS + triggers
FEATURE: Add GET + POST /api/clients — list and create clients scoped to authenticated coach
FEATURE: Add /coach/clients page — client list with search, empty state, creation modal
SCHEMA: Add supabase/migrations/20260402_coach_clients.sql — coach_clients table + RLS + updated_at trigger

REFACTOR: Welcome banner moved to top of dashboard content, button now points to /coach/clients (create first client)

FIX: Dashboard bg-bg-color → bg-[#F2F2F2] (token inexistant)
FIX: Sidebar logo now points to /dashboard instead of / (would loop with middleware redirect)
FIX: Sidebar nav items now clickable — Outils → /outils?from=dashboard, unavailable items show cursor-not-allowed
FIX: Quick Action "Calculer" now passes ?from=dashboard
FIX: Quick Actions pointing to # are now disabled visually and functionally
FIX: clientCount mapping corrected to match signup form values (0_5 / 5_15 / 15_30 / 30_plus)

FIX: Middleware now redirects authenticated users visiting / to /dashboard (no more re-login on homepage)

FIX: "Retour au Lab" in /outils now adapts to origin — redirects to /dashboard when coming from dashboard, / otherwise
REFACTOR: Dashboard links to /outils?from=dashboard to carry navigation context

FEATURE: Add /auth/confirm route to exchange Supabase PKCE code for session and redirect to /dashboard
FEATURE: Show email confirmation banner with resend button after successful signup, persisted on login view
FIX: success state preserved across setIsLoginWithReset when keepSuccess=true (post-signup confirmation flow)

FIX: Rebuild FormData from state at signup step 3 — DOM-based FormData only captures visible fields, losing step 1 data
FIX: Add router.push('/dashboard') after successful login
FEATURE: Progress bar moved inside header (relative, not absolute) for stable card dimensions across signup steps
REFACTOR: Card height changed from max-h to fixed h-[calc(100vh-64px)] to prevent layout shift between steps
