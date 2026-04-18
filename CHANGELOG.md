## 2026-04-18

FEATURE: Add morpho parsing and stimulus adjustment helper functions (Phase 0 Task 2)
FEATURE: parseMorphoResponses — extract metrics from OpenAI Vision text (body fat %, dimensions, asymmetries)
FEATURE: estimateMuscleFromBiometrics — estimate muscle mass from weight + body fat percentage
FEATURE: calculateStimulusAdjustments — derive per-pattern stimulus coefficients based on asymmetries (0.8–1.2 range)
FEATURE: applyMorphoAdjustment — apply morpho adjustments to base stimulus coefficients
TESTS: 42 tests passing (24 parse + 18 adjustments) covering parsing, estimation, and adjustment logic
SCHEMA: Add morpho_analyses table with RLS + TypeScript types (Phase 0 Task 1)
DOCS: Add MorphoPro bridge design specification (Phase 0)
DOCS: Add studio-lab master plan (Phases 0–4: MorphoPro → UI → Biomechanics → Feedback → Export)
FIX: scoreAlternatives — back muscle sub-groups (grand_dorsal / trapeze_moyen / rhomboides / trapeze_superieur / lombaires) derived from movementPattern, replaces monolithic 'dos' overlap
FIX: scoreAlternatives — deduplicate candidates by name prefix (first 3 words), max 6 results returned
FIX: ExerciseAlternativesDrawer — 'Remplace mécaniquement' label now requires true sub-group overlap, not dos_large-only match
FEATURE: ClientAlternativesSheet + SessionLogger.Indisponible? button — client sees coach-pre-configured alternatives bottom sheet
FEATURE: Session page server fetch — load coach_template_exercise_alternatives, pass clientAlternatives to SessionLogger
FEATURE: Système A client exercise alternatives — coach pre-configures up to 3 per exercise in template builder
SCHEMA: Add coach_template_exercise_alternatives table with RLS for alternatives management
FEATURE: API GET/POST/DELETE /program-templates/[id]/exercises/[id]/alternatives
FEATURE: ExerciseClientAlternatives component — inline coach UI in template builder (edit mode)
FEATURE: Exercise card layout refactored to 2-column grid: image left (constrained 140px square), exercise info right
FIX: Exercise image sizes now constrained to 140×140px square, no longer full column width
FEATURE: Add group_id field to BuilderExercise type for superset grouping
FEATURE: Create superset-scoring.test.ts with group_id acceptance and SRA tests
FEATURE: Template builder pages — remove max-w-3xl, full width layout (px-6)
FEATURE: Intelligence panel width 280px → 420px — uses full right column
FEATURE: ProgramIntelligencePanel — 3-col subscores, 4-col KPIs row, radar+donut side by side
FEATURE: ProgramIntelligencePanel — 2-col internal grid layout: 3-col subscores, 4-col KPIs (1×4), radar+donut side-by-side
FIX: ProgramIntelligencePanel — gate Recharts charts behind mounted state, fixes invisible PieChart/RadarChart
FIX: ProgramIntelligencePanel wrapper — max-h + overflow-y-auto, panel content no longer cut off below viewport
FIX: SessionStats.muscleVolumes — per-session muscle volume map, fixes incorrect bar % in Détail par séance
FIX: Muscle bar % now relative to total session volume — SessionStats.muscleVolumes tracks per-session muscle volumes, bars scale correctly per session
FIX: Intelligence panel wrapper scrollable with max-h — content no longer overflows viewport
FIX: Gate Recharts charts behind mounted state in ProgramIntelligencePanel — fixes invisible PieChart/RadarChart on SSR hydration
FEATURE: ProgramIntelligencePanel — section KPIs globaux (séries/sem, reps est., exercices uniques, moy. exos/séance)
FEATURE: ProgramIntelligencePanel — section Détail par séance avec barres musculaires top-3 et pills patterns
FEATURE: IntelligenceResult.programStats — ProgramStats + SessionStats calculés dans buildIntelligenceResult
FIX: buildIntelligenceResult filters out unnamed placeholder exercises — prevents phantom scores and spurious MISSING_PATTERN alerts on empty templates
FIX: ProgramIntelligencePanel sticky layout — wrapper uses top-[96px] to account for topbar height, panel no longer scrolls behind navbar
FIX: Recharts ResponsiveContainer wrapped in explicit div with fixed dimensions — fixes invisible PieChart/RadarChart in flex column
FIX: Add equipment to PATCH /api/clients/[clientId] allowlist — RestrictionsWidget equipment toggle was silently ignored
FEATURE: scoreSRA uses IntelligenceProfile.fitnessLevel when provided, overriding meta.level for SRA window modulation
SCHEMA: Add coach_custom_exercises table with RLS (per-coach isolation, UNIQUE coach_id+slug)
FEATURE: GET/POST /api/exercises/custom — coach custom exercise persistence with slug derivation + 409 conflict guard
FEATURE: ExercisePicker loads coach custom exercises from API on mount, merges with static catalog, shows Perso badge
FEATURE: ExerciseAlternativesDrawer — tab switcher Alternatives/Créer + inline custom exercise creation form (POST /api/exercises/custom)
FEATURE: ExerciseSwapSheet — client mobile bottom sheet for temporary exercise swap during session (scoreAlternatives, never persisted)
FEATURE: SessionLogger — swap button per exercise, swapped name display, ExerciseSwapSheet integration
FEATURE: ProgramIntelligencePanel onAlertClick prop emits (sessionIndex, exerciseIndex)
FEATURE: ProgramTemplateBuilder alert click scrolls to and highlights target exercise card (2s ring highlight, exerciseRefs map)
SCHEMA: Add body_part/severity to metric_annotations, equipment text[] to coach_clients
FEATURE: GET /api/clients/[clientId]/intelligence-profile — aggregate injuries + equipment into IntelligenceProfile
FEATURE: Extend POST /api/clients/[clientId]/annotations schema with body_part + severity fields
FEATURE: GET/POST /api/client/restrictions — client-authenticated injury restrictions CRUD
FEATURE: DELETE /api/client/restrictions/[annotationId] — client-authenticated restriction delete
FEATURE: scoreSpecificity accepts IntelligenceProfile, emits INJURY_CONFLICT alerts (critical/warning/info) with injury score penalty
FEATURE: scoreCompleteness accepts IntelligenceProfile, emits EQUIPMENT_MISMATCH alerts, filters required patterns by available equipment
FEATURE: buildIntelligenceResult + useProgramIntelligence accept optional IntelligenceProfile param (backward compatible)
FEATURE: components/clients/RestrictionsWidget.tsx — coach-facing restrictions + equipment selector (DS v2.0)
FEATURE: components/client/ClientRestrictionsSection.tsx — client-facing restrictions form with severity radio (DS v2.0)
FEATURE: Wire RestrictionsWidget into /coach/clients/[clientId] Profil tab
FEATURE: Wire ClientRestrictionsSection into /client/profil page
FEATURE: ProgramTemplateBuilder accepts clientId prop, fetches IntelligenceProfile, shows "Profil client appliqué" chip
FEATURE: Program Intelligence Phase 2A Task 2 — InjuryRestriction + IntelligenceProfile types, MUSCLE_TO_BODY_PART mapping, muscleConflictsWithRestriction helper — lib/programs/intelligence/types.ts + catalog-utils.ts (5 tests Vitest passants)
FEATURE: Program Intelligence Phase 1 — moteur scoring 6 sous-moteurs (balance push/pull, SRA, redondance mécanique, progression RIR, spécificité goal, patterns manquants) — lib/programs/intelligence/scoring.ts
FEATURE: lib/programs/intelligence/catalog-utils.ts — normalizeMuscleSlug + getStimulusCoeff + resolveExerciseCoeff (runtime derivation pour exercices custom)
FEATURE: lib/programs/intelligence/types.ts — types centralisés BuilderExercise, BuilderSession, TemplateMeta, IntelligenceResult, IntelligenceAlert
FEATURE: lib/programs/intelligence/alternatives.ts — scoreAlternatives (5 critères, max 8 alternatives scorées)
FEATURE: lib/programs/intelligence/index.ts — useProgramIntelligence hook debounce 400ms + exports publics
FEATURE: components/programs/ProgramIntelligencePanel.tsx — sticky panel 280px avec score animé Framer Motion, radar musculaire, donut patterns, grille subscores, feed alertes (Recharts)
FEATURE: components/programs/IntelligenceAlertBadge.tsx — alertes inline sous chaque exercice avec dismiss local et bouton alternatives
FEATURE: components/programs/ExerciseAlternativesDrawer.tsx — drawer alternatives scorées avec 5 filtres rapides + bouton Remplacer
FEATURE: ProgramTemplateBuilder — is_compound checkbox tri-état (auto/oui/non) + intégration useProgramIntelligence + panel + alertes + alternatives + scapular_elevation dans MOVEMENT_PATTERNS
FEATURE: ExercisePicker — onSelect expose désormais isCompound depuis le catalogue

## 2026-04-17

REFACTOR: scripts/generate-exercise-catalog.ts — corrections biomécanique v2 : movementPattern (élévations latérales → lateral_raise, tirage menton → vertical_pull, shrug → scapular_elevation, ext jambe → knee_extension), isCompound (hip thrust avec charge externe → true, oiseau-inverse/tirage-menton → false, nordic conservé true), ajout stimulus_coefficient 0.28–0.95 par pattern × compound (Schoenfeld 2010, Maeo 2021, Pedrosa 2022)
CHORE: data/exercise-catalog.json — régénéré, 458 exercices, nouveau champ stimulus_coefficient, 0 anomalie audit post-génération
FEATURE: Client app i18n complet (FR/EN/ES) — lib/i18n/clientTranslations.ts + ClientI18nProvider + useClientT() hook, toutes les pages client traduites
FEATURE: client_preferences.language désormais appliqué live sur toutes les pages au rechargement après sauvegarde

## 2026-04-16

FEATURE: app/client/profil/LogoutButton.tsx — i18n: useClientT() wired, all logout modal strings replaced with t() calls
FEATURE: app/client/profil/page.tsx — i18n: ct() wired, lang/dateLocale derived from preferences, all section labels/status/memberSince translated
FEATURE: app/client/progress/PRsPodium.tsx — i18n: useClientT() imported and wired
FEATURE: app/client/progress/ProgressHeatmap.tsx — i18n: useClientT() wired, MONTHS and DAY_ABBR derived from ta() at runtime
FEATURE: app/client/progress/ProgressClientPage.tsx — i18n: useClientT() wired, PERIODS moved inside component, KPI labels/history title/sets label/empty state translated

FEATURE: app/client/bilans/page.tsx — i18n: StatusBadge accepts lang prop, all FR strings replaced with ct/ctp helpers, lang fetched from client_preferences, dateLocale injected
FEATURE: app/client/programme/session/[sessionId]/SessionLogger.tsx — i18n: useClientT() wired, all FR strings replaced with t() calls (finish, rest, demo, rir, sides, note placeholder)
FEATURE: app/client/programme/recap/[sessionLogId]/page.tsx — i18n: ct() wired, lang fetched from client_preferences, section/stat labels and CTA translated

FEATURE: app/client/programme/page.tsx — i18n: all hardcoded FR strings replaced with ct/cta helpers, lang fetched from client_preferences, DAYS_FR/DAYS_FULL removed, NoProgramPage accepts lang prop

FEATURE: lib/i18n/clientTranslations.ts — FR/EN/ES dictionary for all client pages (nav, home, programme, logger, recap, bilans, progress, profil, common, greetings) with ct/ctp/cta helpers

FEATURE: ProgramEditor — inline muscle picker (primary/secondary chips) per exercise, persists via PUT /api/programs/[programId]/sessions/[sessionId]/exercises
FIX: exercises/route.ts POST+PUT — persist primary_muscles and secondary_muscles columns

REFACTOR: client/login — DS v2.0 dark, card bg-white/[0.02], inputs bg-[#0a0a0a], CTA bouton accent DS, tokens legacy supprimés
REFACTOR: client/access/invalid + expired — DS v2.0, logo centré, card dark, bouton neutre
REFACTOR: client/bilans/[submissionId] — DS v2.0, ClientTopBar, blocs divide-y, badge status inline
FEATURE: components/client/ClientTopBar — composant topbar réutilisable (section + title + backHref + right slot)
FEATURE: client/page — état vide "Pas encore de programme" avec card Sparkles accent
FEATURE: client/progress — ajout card "Message du coach" (dernière annotation) au-dessus de la heatmap
CHORE: GenesisAssistant — désactivé temporairement (retiré du root layout)
REFACTOR: client/bilans/page — DS v2.0, deux sections "À remplir" (amber, CTA) + "Historique" (liste compacte), tokens legacy supprimés
FEATURE: client/page — dashboard accueil : hero séance du jour (CTA commencer), prochaine séance si repos, stats hebdo dots, message coach (dernière annotation), bilans en attente
FEATURE: components/client/ContextualGreeting — salutation contextuelle selon heure et présence de séance aujourd'hui
REFACTOR: BottomNav — structure uniforme icône+label, actif en #1f8a65, inactif text-white/35, suppression pill dynamique
REFACTOR: ClientProfilPage — topbar DS v2.0 + avatar mini initiales, cards bg-white/[0.02], labels section uppercase, hero supprimé
REFACTOR: ClientLogoutButton — tokens legacy remplacés, modal confirmation DS v2.0 (bg-[#181818], bordures white/[0.06])

SCHEMA: coach_program_template_exercises + program_exercises — add primary_muscles text[] + secondary_muscles text[]
FEATURE: muscleDetection — primary/secondary split, DB columns priority over regex fallback, ExerciseInput interface
FEATURE: BodyMap — 3-state visual: primary (#1f8a65 full) / secondary (#1f8a65 28% opacity) / inactive (grey)
FEATURE: ProgramTemplateBuilder — inline muscle picker chips per exercise (primary + secondary rows)
FEATURE: api/program-templates — persist + propagate primary_muscles + secondary_muscles on save and assign
FEATURE: ProgramTemplateBuilder — inline muscle picker (primary/secondary) per exercise with 12 MUSCLE_GROUPS slugs
FEATURE: api/program-templates POST — persist primary_muscles + secondary_muscles in template exercises
FEATURE: api/program-templates/[templateId] PATCH + duplicate — persist + propagate primary_muscles + secondary_muscles
FEATURE: api/program-templates/[templateId]/assign — propagate primary_muscles + secondary_muscles to program_exercises on assignment

REFACTOR: lib/client/muscleDetection — primary/secondary split, ExerciseInput interface, DB source priority over regex fallback
FEATURE: components/client/BodyMap — 3-state visual (primary green / secondary pale green / inactive grey), new props primaryGroups + secondaryGroups
FEATURE: app/client/programme/page — pass primary_muscles/secondary_muscles from DB to detectMuscleGroups, forward primaryGroups/secondaryGroups to BodyMap
FEATURE: app/client/programme/recap — same primary/secondary pattern applied to BodyMap in session recap page

REFACTOR: BodyMap — remplacement SVG artisanal par paths anatomiques professionnels (react-muscle-highlighter MIT) — 23 groupes musculaires, silhouette précise vue front + dos, coloration dynamique DS v2.0 (#1f8a65 actif / rgba neutre inactif)

FIX: client/progress/ProgressHeatmap — cases carrées taille fixe (11px), grid inline-style au lieu de flex/aspect-square, labels jours alignés, fond transparent sur padding cells
FIX: client/progress/ProgressClientPage — streak hero : état 0 (quiet Zap + encouragement) vs actif (grand chiffre, gradient vert, barre progression vs record) vs on fire (glow radial, icône Flame, label contextuel)
FEATURE: client/progress/ProgressClientPage — micro-insight contextuel sous KPIs (meilleure séance, volume moyen par séance)
FEATURE: client/progress — refonte complète page progression : streak counter, heatmap 12 semaines, PRs podium top 3, sélecteur période 7j/30j/90j/tout, volume chart DS v2.0
FEATURE: client/progress/ProgressHeatmap — heatmap GitHub-style 84 jours, 5 niveaux d'intensité vert, labels mois
FEATURE: client/progress/PRsPodium — podium médailles top 3 PRs par charge max, delta % vs PR précédent, liste expandable exercices restants
FEATURE: client/progress/ProgressVolumeChart — area chart accent #1f8a65, tooltip dark DS v2.0, activeDot animé
FEATURE: client/progress/ProgressClientPage — shell client-side avec filtrage période réactif sur rawLogs pré-chargés, badge PR dans historique séances

FIX: api/session-logs — Zod validation on POST body (session_name, set_logs shape)
FIX: api/session-logs/[logId] — Zod validation on PATCH body (duration_min, set_logs side enum)
REFACTOR: api/session-logs/[logId] — set_logs update now uses single upsert instead of N queries (eliminates N+1)
CHORE: tests/mocks/supabase — add maybeSingle, is, gte, lte, contains to mock chain methods
FIX: session/[sessionId]/page — lastPerformance query now scoped to client via client_session_logs!inner join (security: prevent cross-client data leak)
REFACTOR: lib/client/resolve-client — typed return as ResolvedClient, fixes GenericStringError on .id across all programme pages
FIX: SessionLogger — rest timer double-trigger on checkbox: skip startRest if already tracking same set
FIX: SessionLogger — rest modal circle proportions: enlarged SVG to w-48, fixed formatTime double-negative bug
FIX: SessionLogger — "Terminer" button overlap on scroll: added solid bg-[#121212] to fixed wrapper
FIX: SessionLogger — missing header label on validation column: added ✓
FIX: SessionLogger — rest timer invisible when modal closed: mini-badge in header shows remaining time
REFACTOR: Programme home — exercise list collapsible by default (ChevronDown disclosure row)
REFACTOR: Programme home — vertical stack layout: BodyMap centered full-width, stat pills row, full exercise list (no truncation)
REFACTOR: BodyMap — rewritten with organic anatomical SVG paths (front + back), improved visual fidelity

SCHEMA: client_set_logs — add rest_sec_actual int column (effective rest time captured by inverted timer)
FEATURE: SessionLogger — image open by default in square 1:1 format, explicit "Réduire" button
FEATURE: SessionLogger — inverted rest timer: triggers on input or validation, 3s inactivity delay before modal, overtime countdown in red with negative time, mini-badge in header during overtime
FEATURE: SessionLogger — rest_sec_actual recorded per set (stops when next set interaction detected)
FEATURE: SessionLogger — finish button: long press 3s with fill gauge when session incomplete, simple click when all sets done, confirmation modal with remaining sets count
FEATURE: Programme home — full refonte: session card with body map SVG, data points (duration, sets, exercises, rest avg, RIR), exercise preview, rest day state with next session
FEATURE: BodyMap component — SVG front/back human body with muscle groups highlighted in accent green based on exercise name keywords
FEATURE: Session recap page (/client/programme/recap/[id]) — post-session summary with stats, body map, per-exercise performance delta vs last session, exercise notes
FEATURE: Progress page — enriched with session history list (clickable → recap), DS v2.0 tokens applied
FIX: BodyMap — extract detectMuscleGroups and MuscleGroup type to lib/client/muscleDetection.ts (pure module, no 'use client') to fix "m.n0 is not a function" crash on /client/programme Server Component
FIX: session-logs route — double fallback on program_session_id FK violation; retries insert with null if first attempt fails (race condition or deleted session)

## 2026-04-14

FIX: MetricsSection — annotation ReferenceLine no longer cuts metric lines (added connectNulls on Line components)
FIX: BioNormsPanel — metabolic age norm now only shown when measured by impedance scale, not when auto-estimated from BMR
FIX: bioNorms — evaluateAll now accepts metabolic_age_source and skips estimated_katch/estimated_mifflin values

FEATURE: BioNorms — Normes view now displays the most recent directly-entered value per metric across all submissions (bilans + saisies manuelles), not just one bilan
FEATURE: BioNorms — Each gauge now shows a "Mesuré le JJ/MM" (green) or "Calculé le JJ/MM · formule cliquable" (grey) source badge
REFACTOR: useBiometrics — now accepts clientId and aggregates latest value per field_key across all completed submissions

FIX: MetricsSection SliderBlock — "Du" and "Au" date inputs were bound to wrong array indices (timeRangeDays[0]=Au, [1]=Du); swap fixes both the inverted display and the "Au snaps to today" bug

FIX: MetricsSection TimeRangeSlider — date inputs "Du/Au" no longer collapse range to zero (inverted Math.min/max constraint corrected)
FIX: MetricsSection TimeRangeSlider — isoDateToDays now parses dates as local time to avoid off-by-one timezone shift

REFACTOR: MetricsSection overlay — move "Ajouter une note" button out of chart canvas into a dedicated header bar above the chart
FEATURE: MetricsSection — SliderBlock and TimeRangeSlider now include date inputs (Du / Au) synced bidirectionally with the slider
FIX: MetricsSection overlay — annotations/phases filtered to visible time window before being passed to MultiSeriesChart (out-of-window annotations were injecting phantom x-axis points, distorting chart)
FIX: MetricsSection overlay — TimeRangeSlider now uses fixed left/right date labels (same pattern as SliderBlock, no more collision)
FIX: MetricsSection overlay — inject annotation/phase dates into merged dataset so ReferenceLine always finds an x= match (annotations were visible in list but invisible on chart when no measurement existed on that date)
FIX: metrics API — normalize all dates to YYYY-MM-DD (submitted_at was ISO timestamp, causing ReferenceLine x= mismatch — annotations invisible on chart)
FIX: annotations POST route — body field now accepts null (z.nullable) — was rejecting null with "Expected string, received null"
FIX: annotations routes — Zod error serialized as string (not ZodError object) to avoid React "Objects are not valid as a React child" crash
FIX: annotations PATCH route — add lab_protocol to event_type enum (was missing, caused silent 400 on edit)
SCHEMA: program_exercises — add image_url (text) and is_unilateral (boolean) columns
SCHEMA: client_session_logs — add exercise_notes (jsonb) column for per-exercise client feedback
SCHEMA: client_set_logs — add side (left/right/bilateral) column for unilateral exercise tracking
FIX: /api/session-logs POST — verify program_session_id exists before insert to prevent FK constraint violation crash
FEATURE: SessionLogger — full DS v2.0 dark redesign (#121212 background, white/[0.06] borders, accent #1f8a65)
FEATURE: SessionLogger — focused one-exercise-at-a-time view with dot navigation and prev/next buttons
FEATURE: SessionLogger — exercise image/GIF display with collapsible demo (supports .gif unoptimized)
FEATURE: SessionLogger — RIR target shown inline on all exercises; RIR actual input available on all sets (not just double-progression)
FEATURE: SessionLogger — unilateral exercise support: auto-detects via is_unilateral flag or name keywords, creates L/R sub-sets per series
FEATURE: SessionLogger — last performance displayed per set in placeholder ("↩ 80kg × 8") fetched server-side
FEATURE: SessionLogger — rest timer full-screen modal with animated countdown and skip button
FEATURE: SessionLogger — per-exercise client feeling note (textarea, persisted in exercise_notes JSONB)
FEATURE: session/[sessionId]/page.tsx — fetch last set_logs server-side for previous performance hints
CHORE: client/layout.tsx — add Next.js metadata for PWA (appleWebApp, manifest link, viewport)
CHORE: public/manifest.json — update background_color and theme_color to #121212 (DS v2.0)

FEATURE: MetricsSection — add bar/line chart type toggle per category (composition/mensurations/bien-être) with localStorage persistence
FIX: MetricsSection — norms tab now finds most recent submission with both weight_kg and height_cm instead of using rows[0] blindly; tab is disabled with tooltip when no valid submission exists
FIX: MetricsSection — overlay annotation save now shows API error message inline in form when save fails (was silently swallowing non-ok responses)
FIX: MetricsSection — slider date labels replaced with fixed left/right layout, no more collision when cursors are close
FIX: MetricsSection — getDelta now computes first→last value over the full visible window (was computing last minus second-to-last, giving single-step delta)
FIX: MetricsSection — slider right thumb date no longer hidden when cursors are close — label moves above the track instead of disappearing (both TimeRangeSlider and SliderBlock)
FIX: /client/auth/callback — handle INITIAL_SESSION with session → done(true) immediately (was falling through to 8s timeout)
FIX: /client/auth/callback — detect Supabase error params (?error_code / ?error) at mount and redirect immediately with reason param
FIX: /client/auth/callback — add reason param to all done(false) calls (timeout / no_token / code_exchange_failed) for easier diagnosis in login page URL
FIX: invite route — use coach_clients.status === 'suspended' instead of last_sign_in_at to decide reactivation vs fresh invite (last_sign_in_at is unreliable — set by OTP verification even when user never completed set-password)

## 2026-04-12

FEATURE: Add FinancialStrip component — MRR, monthly revenue, pending & overdue payments with EUR formatting
FEATURE: Add ClientsSection component for coach dashboard — client cards with status segmentation, weight trends, sparklines
FEATURE: Add HeroSummary component for coach dashboard — greeting, narrative alerts, KPI command bar
FIX: Sort active clients by last_activity_at before slice(0,8) in dashboard coach endpoint

## 2026-04-13

FIX: /client/auth/callback — don't error on INITIAL_SESSION without session when recovery hash is present (PASSWORD_RECOVERY fires after INITIAL_SESSION in implicit flow — premature done(false) was causing link_expired redirect)
REFACTOR: /client/auth/callback — replace Route Handler (server-side, can't read hash fragments) with client-side page that handles both PKCE (?code=) and implicit flow (#access_token=) — exchanges code or listens for PASSWORD_RECOVERY event then redirects to /client/set-password
FIX: app/client/layout.tsx — remove auth redirect that caused ERR_TOO_MANY_REDIRECTS on /client/login (layout applies to all /client/\* routes including login/set-password; middleware handles protection)
FIX: Add ConditionalClientShell component — renders BottomNav + pb-20 only on authenticated client pages, not on login/set-password/auth routes
FIX: /client/login — detect implicit flow recovery token (#access_token=...&type=recovery) sent by Supabase to site URL; wait for PASSWORD_RECOVERY event then redirect to /client/set-password
FIX: /client/set-password — on INITIAL_SESSION without session, don't immediately error if a recovery hash is present (implicit flow delivers PASSWORD_RECOVERY after INITIAL_SESSION)
FIX: /client/auth/callback — complete rewrite: exchange PKCE code server-side via exchangeCodeForSession, set session cookies on redirect response, forward to /client/set-password; redirect to /client/login?error=link_expired on failure
FIX: /client/set-password — handle INITIAL_SESSION event in onAuthStateChange (session from server-side cookie exchange); detect ?error=link_expired query param for instant error display; guard SIGNED_OUT against firing after successful update
FIX: /client/login — handle ?error=link_expired query param from callback route (in addition to existing Supabase hash fragment error handling)
FIX: invite route — set coach_clients.user_id after createUser (was never set, breaking ban/unban); existing users with last_sign_in_at=null get fresh recovery link instead of broken reactivation email; fix listUsers pagination (perPage: 1000, was truncating at 50)
FIX: access route — select user_id on coach_clients and use it directly for ban; fall back to email-based lookup with perPage: 1000 to avoid 50-user truncation
FIX: Add 'suspended' to coach_clients_status_check constraint — was blocking client suspension
FIX: Client invitation flow — redirectTo now points to /auth/confirm?next=/client/set-password for proper PKCE server-side exchange
FIX: set-password page — replace exchangeCodeForSession (client-side) with getSession check (session already set by /auth/confirm)
FIX: Middleware — authenticated clients redirected to /client instead of /dashboard when hitting / or /auth routes
FIX: /auth/confirm — session cookies now correctly attached to redirect response (were lost on NextResponse.redirect)
FIX: Client invite — redirectTo now points to /client/auth/callback (dedicated route) — Supabase drops query params from redirectTo, breaking ?next= pattern
FIX: Add /client/auth/callback route — PKCE exchange server-side with cookies properly attached to redirect response
FIX: set-password — use onAuthStateChange(PASSWORD_RECOVERY) to detect hash-based recovery session (Supabase implicit flow, not PKCE)
FIX: /client/auth/callback — simplified to pass-through redirect, hash tokens handled client-side

FEATURE: Client profile identity editing — first_name, last_name, email, phone, date_of_birth editable inline in Profil tab
FEATURE: Missing email banner on legacy client profiles with Ajouter un email CTA
FEATURE: Email sync to Supabase Auth on PATCH /api/clients/[clientId] when user_id exists
FIX: Email required validation on POST /api/clients (API + frontend form)
FEATURE: Unified client auth — createUser + generateLink recovery, no dual system
FEATURE: Client suspension via Supabase ban_duration on access revoke
FEATURE: sendReactivationEmail — coach restores access, client gets login link
FEATURE: sendWelcomeEmail — sent after client sets password for the first time
FEATURE: POST /api/client/welcome — welcome email endpoint called after set-password
FIX: Remove generateLink type 'invite' — was triggering Supabase built-in email in parallel
FIX: Create client with status 'inactive' instead of 'active' — prevents false active state before invitation
FIX: Handle Supabase hash error (otp_expired) in /client/login with user-friendly message
CHORE: Remove System B — access-token route and magic link internal (/client/access/[token])
FEATURE: Add email confirmation field at signup step 3 — double-entry prevents typos, validated client-side and server-side
FEATURE: Implement inline email change flow in coach settings — coach enters new email twice, confirmation link sent to new address
FIX: Rename "Profil" section to "Profil pro" in coach settings for clarity
FEATURE: Add client archive and hard delete from client detail page
FEATURE: Superpower Coach Dashboard — hero summary narratif, fil d'alertes priorisées (critical/urgent/info), actions rapides contextuelles, clients segmentés avec sparklines, financier condensé (MRR + revenus + impayés)
FIX: QuickActions — CTA contextuel toujours visible (fallback "Nouveau client" quand aucune urgence)
FIX: FinancialStrip — valeurs en text-3xl conforme spec DS v2.0
FIX: HeroSummary — séparateur command bar · (interpunct) au lieu de |

FEATURE: Add DELETE /api/clients/[clientId] — archive mode (revoke tokens + status archived) and hard delete mode (cascade FK-safe delete + auth user removal)
FEATURE: Superpower Coach Dashboard — hero summary, alertes priorisées, clients segmentés avec sparklines, financier condensé
FEATURE: Client invitation — flux email avec définition de mot de passe (remplace magic link OTP fragile)
FEATURE: POST /api/clients/[clientId]/invite — génère lien recovery Supabase + envoie email SMTP
FEATURE: Page /client/set-password — premier accès client, définition du mot de passe
FEATURE: Coupure d'accès manuelle coach — DELETE /api/clients/[clientId]/access
FEATURE: Page /client/acces-suspendu — redirection si status = inactive
FEATURE: Middleware — vérification coach_clients.status sur routes client protégées
FEATURE: Cron nightly /api/cron/expire-subscriptions — expire abonnements + désactive clients
REFACTOR: /client/login — retrait signup (client toujours invité par coach)
REFACTOR: ClientAccessToken — refonte UX invitation/actif/suspendu

## 2026-04-12

FEATURE: Add POST /api/cron/expire-subscriptions — nightly cron to expire subscriptions and deactivate clients
FEATURE: Add vercel.json — configure Vercel Cron for subscription expiry (0 0 \* \* \* UTC)
FEATURE: Add DELETE /api/clients/[clientId]/access — revoke client access (status inactive + token revoked)
FEATURE: Add /client/acces-suspendu page — suspended access screen (DS v2.0)
FEATURE: Middleware status check — redirect inactive clients to /client/acces-suspendu

FEATURE: Refonte ClientAccessToken — invitation email + coupure d'accès (props clientStatus + clientEmail)

FEATURE: Add /client/set-password page — PKCE code exchange + updateUser flow for first-time password setup
FIX: middleware — exclude /client/set-password and /client/acces-suspendu from client auth guard

FEATURE: POST /api/clients/[clientId]/invite — route API pour envoyer l'invitation email au client (password setup)
FEATURE: sendInvitationEmail — function mailer pour invitation client à définir son mot de passe (Supabase recovery link)
FIX: Client access — remplace magic link OTP (fragile, usage unique) par signInWithPassword avec mot de passe temporaire généré côté serveur
CHORE: Supprime app/client/auth/confirm page (plus nécessaire — session créée côté serveur)
CHORE: middleware matcher — retire exclusion /client/access (signInWithPassword est idempotent)
FIX: /client/access/[token] — utilise magic_url stocké en DB au lieu de régénérer un OTP à chaque clic (évite double consommation Vercel Edge)
FIX: middleware matcher — exclure /client/access
FIX: /client/auth/confirm — remplace la route handler par un Client Component qui lit le hash Supabase Implicit Flow côté browser
FIX: Accès client — redirectTo pointe vers /client/auth/confirm pour la session magic link

FIX: Add force-dynamic to /api/calculator-results/query and /api/dashboard routes to fix Vercel static rendering errors
FEATURE: modules.ts — ajout champ bmr_kcal_measured dans le module biometrics (visible si Balance à impédance)
REFACTOR: MacroCalculator — suppression champ Multiplicateur occupation (auto-calculé depuis occupation), suppression du toggle Manuel/Avec client (barre de recherche toujours visible), suppression du verrou protéines (bouton lock inutile)

FIX: client/access/[token] route — magic link regénéré à la volée au clic (plus de magic_url stale en DB), redirectTo dérivé du request origin
FIX: access-token route — URL construite depuis req.nextUrl.origin (plus de localhost hardcodé en prod), redirectTo magic link corrigé

FIX: MetricsSection — drag handle graphique sorti du bloc à hauteur fixe, redesigné en pill fine (3px) sans superposition

FEATURE: lib/formulas/macros.ts — refonte moteur v2 : Mifflin fallback, EAT cardio séparé (Swain & Franklin), alcool (7 kcal/g Lieber 1991), caféine +BMR (Dulloo 1989), phase lutéale +175 kcal (Webb 1986), visceral fat stratification (IDF 2006), SmartProtocol 12 suggestions scientifiques, ContextFlags, ratiosByBW, tdeeGross, corrections[]
FEATURE: app/api/lab/client-search/route.ts — 12 nouveaux champs : bmr_kcal_measured, visceral_fat_level, waist_cm, perceived_intensity, cardio_frequency, cardio_duration_min, cardio_types, sleep_quality, post_session_recovery, caffeine_daily_mg, alcohol_weekly, work_hours_per_week, menstrual_cycle
FEATURE: lib/lab/useLabClientSearch.ts — type LabClient étendu 15 nouveaux champs cardio/wellness/lifestyle/biométrie
FEATURE: app/outils/macros/MacroCalculator.tsx — refonte complète : layout 2 colonnes, injection client 20+ champs, section avancée bien-être/lifestyle, TDEE breakdown visuel flow + barres, macros ratios g/kg LBM et g/kg PC, Smart Protocol panel prioritisé avec boutons application, Context Flags provenance, slider calorique + override protéines g/kg PC

FIX: modules.ts — restore muscle_mass_kg label to "Masse musculaire" (kg, all muscle types), muscle_mass_pct to "Masse musculaire (%)" (direct from device, not computed), add skeletal_muscle_pct field "Masse musculaire squelettique (%)" as separate field
FIX: MetricsSection.tsx — align FIELD_MAP: muscle_mass_kg="Masse musculaire", muscle_mass_pct="Masse musculaire %", add skeletal_muscle_pct="Musc. squelettique %"; add to body_ratios group + METRIC_COLORS + PLATEAU_THRESHOLDS
FIX: healthMath.ts — deriveMetrics now preserves both muscle_mass_kg and muscle_mass_pct when both provided directly (no overwrite); add skeletal_muscle_pct to BiometricInputs + DerivedMetrics (pass-through, never computed)
FIX: useBiometrics.ts — load skeletal_muscle_pct from fieldMap and pass to deriveMetrics inputs
FEATURE: MetricsSection.tsx — vue superposée plein écran : bouton Maximize2 dans header, modal 95vw×92vh avec fermeture ✕ / Escape / click-outside, state isFullscreen dans MultiSeriesChart (même series/visibleSeries partagés)
REFACTOR: MetricsSection.tsx — palette couleurs métriques unifiée : suppression doublons (vert×3, orange×2, bleu×2), familles sémantiques (graisse=orange/rouge, muscle=3 verts distincts, structure=teal/bleu, mensurations=spectre froid, bien-être=indigo/jaune); suppression champ color de FieldDef + FIELDS (METRIC_COLORS source unique); chips overlay : point coloré toujours visible (opacity réduite si inactif); boutons groupe : micro-palette 3 points + style border DS v2.0
FIX: MetricsSection.tsx — lean_mass_kg réintégré dans groupe Recomposition (était absent de DEFAULT_OVERLAY_METRICS → chip cliquable mais Line non rendue); waist_hip_ratio category corrigée "composition"→"measurements"; waist_cm ajouté dans groupe Risque métabolique (waist_hip_ratio absent si hips non renseigné)
REFACTOR: MetricsSection.tsx — OVERLAY_GROUPS : retrait lean_mass_kg du groupe Recomposition (redondant avec weight+fat), retrait waist_cm du groupe Risque métabolique (dupliqué avec Mensurations tronc), textes interprétation mis à jour avec sources; explication ligne plate ajoutée dans commentaire graphique
FIX: AssessmentForm.tsx — supprimer le calcul bidirectionnel automatique muscle_mass_kg ↔ muscle_mass_pct (les deux sont des valeurs directes de balance, indépendantes)
FIX: recalculate/route.ts — ajouter skeletal_muscle_pct dans fieldMap et BiometricInputs
REFACTOR: MetricsSection.tsx — redesign OVERLAY_GROUPS: 4→6 groupes scientifiquement cohérents (Recomposition, Ratios corporels, Risque métabolique, Mensurations membres, Mensurations tronc, Récupération); add waist_hip_ratio to FIELD_MAP + METRIC_COLORS; textes d'interprétation avec sources (Schoenfeld 2010, Spiegel 2010, IDF 2006, OMS, ACE)

FIX: MacroCalculator.tsx — client injection now uses sport_practice (daily activity level) instead of fitness_level (training expertise) for NEAT/activity mapping; remove FITNESS_ACTIVITY_MAP which wrongly mapped training level to NEAT steps
FEATURE: MacroCalculator.tsx — protein override input now accepts g/kg bodyweight ratio (e.g. 1.8) instead of absolute grams; placeholder shows algo ratio, conversion ratio × weight_kg done in effect
FIX: MacroCalculator.tsx — remove unused Search import from lucide-react

## 2026-04-11

FIX: lab/client-search/route.ts — align field_key with modules.ts ground truth: remove phantom skeletal_muscle_mass_kg/bmr_kcal, remove sleep_hours legacy fallback, fix training_calories_weekly→training_calories
FIX: MetricsSection.tsx — rename muscle_mass_kg/pct labels to "Masse musc. squelettique" to match modules.ts ground truth (label was "Masse musculaire" but field stores skeletal muscle from InBody/Tanita)
FEATURE: MetricsSection.tsx — add lean_mass_kg (masse maigre) to FIELDS, OVERLAY_GROUPS, PLATEAU_THRESHOLDS and METRIC_COLORS
FIX: MetricsSection.tsx — align FIELDS field_key with actual assessment modules: sleep_hours→sleep_duration_h, remove phantom skeletal_muscle_mass_kg and bmr_kcal (never stored by bilan)
FIX: metrics/[submissionId]/route.ts PATCH — resolve block_id from existing responses before upsert to prevent cross-block duplicates when editing bilan submissions
FIX: recalculate/route.ts — delete stale derived responses in wrong block_id before upsert to prevent cross-block duplicates in metric charts
REFACTOR: lib/health/bioNorms.ts — système de tooltips entièrement revu : NormReference sans URL (source bibliographique DOI uniquement), ZoneInsights par zone × sexe pour 11 métriques, resolveInsight() intégré dans evaluateMetric
REFACTOR: components/health/BioNormsGauge.tsx — tooltip affiche zone_insight contextualisé en premier, référence scientifique en footer discret ; suppression du lien URL et de la note physiologique générique
FIX: lib/health/useBiometrics.ts — fallback 'hip_cm' → 'hips_cm' pour les bilans créés avant le renommage (RTH et Navy invisibles pour ces clients)
FIX: lib/health/bioNorms.ts — MUSCLE_MASS_RANGES recalibrés pour impédancemétrie (masse totale ~60-75%) — anciens ranges basés DXA/squelettique provoquaient des faux high_risk ; suppression zone "Hypertrophie extrême" sans plafond
FIX: lib/health/healthMath.ts — seuil MUSCLE_PCT_MAX_PHYSIOLOGICAL relevé 60% → 75% (balances Tanita/InBody mesurent masse musculaire totale, pas squelettique seule)
REFACTOR: app/coach/clients/[clientId]/bilans/[submissionId]/page.tsx — bouton retour déplacé dans la TopBar (pattern interpage standard) au lieu du contenu inline
FIX: app/outils/macros/MacroCalculator.tsx — clientSearch.clear extrait comme variable stable avant useMemo(topRight) ; évite boucle infinie de re-renders qui bloquait la navigation sidebar
FIX: components/layout/useSetTopBar.tsx — suppression du cleanup setTopBar({}) qui causait des re-renders pendant la navigation
FIX: app/outils/ToolsGrid.tsx — topBarRight wrappé dans useMemo(searchQuery) pour éviter les re-renders en cascade du TopBarProvider
REFRACTOR: app/outils/body-fat/BodyFatCalculator.tsx — page réorganisée au DS v2.0 avec layout colonne, inputs stylés, cartes de résultat et FAQ alignés sur le modèle macros

REFACTOR: components/health/BioNormsPanel.tsx — skeleton adapté à la structure réelle (GaugeSkeleton par section, 3 sections avec nombre de jauges correct, barre 5 segments, header/valeur/badge) ; waist_height_ratio et metabolic_age_delta ajoutés dans les sections
FEATURE: lib/health/healthMath.ts — ajout calculateWaistHeightRatio (Savva 2010), estimateMetabolicAge (Katch-McArdle + Mifflin-St Jeor fallback), champ metabolic_age dans BiometricInputs + DerivedMetrics
FEATURE: lib/health/bioNorms.ts — normes waist_height_ratio (seuil 0.5 universel) et metabolic_age_delta (delta vs âge réel) + evaluateAll étendu
FEATURE: lib/assessments/modules.ts — champ metabolic_age (optionnel, visible si balance à impédance)
REFACTOR: lib/health/useBiometrics.ts — passage metabolic_age dans inputs + waist_height_ratio/metabolic_age_estimated dans evaluateAll
REFACTOR: app/api/assessments/submissions/[submissionId]/recalculate/route.ts — calcul et upsert waist_height_ratio + metabolic_age_estimated

FIX: components/layout/useSetTopBar.tsx — suppression du cleanup setTopBar({}) qui causait des re-renders pendant la navigation et bloquait le routing depuis certaines pages
FIX: app/outils/ToolsGrid.tsx — topBarRight wrappé dans useMemo (dépendance searchQuery) pour éviter les re-renders en cascade du TopBarProvider

REFACTOR: lib/email/mailer.ts — refonte complète du template email DS v2.0 (fond #121212, card #181818, accent #1f8a65, texte rgba white) ; ajout sendPaymentReminderEmail + sendInvoiceEmail ; transport nodemailer centralisé et exporté
CHORE: lib/email/resend.ts — suppression (dead code, jamais utilisé)
REFACTOR: app/api/payments/[paymentId]/remind/route.ts — suppression transport nodemailer inline, délègue à sendPaymentReminderEmail
REFACTOR: app/api/payments/[paymentId]/invoice/route.ts — suppression transport nodemailer inline, délègue à sendInvoiceEmail
REFACTOR: app/api/cron/payment-reminders/route.ts — suppression transport nodemailer inline, délègue à sendPaymentReminderEmail

FIX: components/assessments/form/MetricField.tsx — fix scroll sur inputs numériques (onWheel → blur) ; ajout accordion guide mesuration (📏) pour tous les champs de mensuration
FEATURE: lib/assessments/modules.ts — ajout arm_left_contracted_cm + forearm_left_cm (champs manquants pour symétrie) ; shoulder_width_cm renommé shoulder_circumference_cm (tour d'épaules, min/max corrigés) ; guides de prise de mesure (accordion 📏) sur tous les champs mensurations
FEATURE: components/assessments/form/AssessmentForm.tsx — calculs auto waist_hip_ratio (waist/hips) ; calories_target calculées en lecture seule depuis macros (P×4 + C×4 + F×9) ; agrégats mensurations arm_cm/thigh_cm/calf_cm depuis max(droit, gauche)

FEATURE: app/coach/clients/[clientId]/bilans/[submissionId]/page.tsx — nouvelle page vue bilan coach : affichage complet des réponses groupées par bloc, photos cliquables avec viewer, bouton Modifier (mode édition inline AssessmentForm), bouton Réouvrir avec regénération token
FIX: components/assessments/form/AssessmentForm.tsx — props initialResponses + onSaved pour mode édition coach ; calculs auto bidirectionnels weight_kg ↔ body_fat_pct ↔ fat_mass_kg ↔ lean_mass_kg, muscle_mass_kg ↔ muscle_mass_pct, BMI depuis weight + height
FIX: components/assessments/form/MetricField.tsx — guide photos accordion (collapsé par défaut) avec parsing bullet-points pour les champs photo_upload
FIX: lib/assessments/modules.ts — module Photos : helper guide photo sur tous les champs photo ; hip_cm renommé hips_cm (cohérence MetricsSection) ; ajout champs arm_cm, thigh_cm, calf_cm (mesures agrégées visibles)
FIX: app/api/assessments/public/[token]/responses/route.ts — email notification coach redirige vers /coach/clients/[clientId]/bilans/[submissionId]
FIX: app/client/bilans/[submissionId]/page.tsx — référence submission.status remplacée par submissionData.status

FIX: lib/health/healthMath.ts — guard physiologique muscle_mass_pct > 60% : valeur rejetée (null) si seuil dépassé, évite les fausses alertes "hypertrophie extrême" causées par confusion lean_mass / muscle_mass
FIX: lib/csv-import/detect.ts — synonyms CSV corrigés : "lean mass"/"masse maigre"/"lbm" retirés de muscle_mass_kg, mappés vers lean_mass_kg ; ajout TARGET_FIELDS lean_mass_kg et muscle_mass_pct ; visceral_fat renommé visceral_fat_level
FIX: components/clients/MetricsSection.tsx — clés standardisées muscle_pct → muscle_mass_pct, visceral_fat → visceral_fat_level (cohérence DB)
FIX: components/assessments/dashboard/ClientMetricsDashboard.tsx — clés standardisées muscle_pct → muscle_mass_pct, visceral_fat → visceral_fat_level
FIX: lib/assessments/modules.ts — height_cm required: true ; helpers améliorés pour body_fat_pct, lean_mass_kg, muscle_mass_kg

FIX: components/health/BioNormsGauge.tsx — remplacement Tooltip base-ui par tooltip custom (useState + positionnement absolu) : rendu entièrement contrôlé, fond #0e0e0e, box-shadow, bordures rgba, fermeture au clic extérieur
FIX: components/health/BioNormsPanel.tsx — alerte critique redessinée avec header groupé, lignes séparées, badge zone à droite

FEATURE: components/clients/MetricsSection.tsx — integrate BioNormsPanel as "Normes" view mode (4th toggle option, always active)

FEATURE: components/health/BioNormsPanel.tsx — panel complet normes biométriques avec alertes critiques, bandeau Navy, et jauges groupées par section
FEATURE: components/health/NavySuggestionBanner.tsx — bandeau suggestion méthode Navy avec apply/dismiss et état disabled

FEATURE: components/health/BioNormsGauge.tsx — visual gauge component for biometric norms display with segmented bar, zone badge, info tooltip, and critical indicator

REFACTOR: lib/formulas/bodyFat.ts — navyBodyFat delegates to healthMath.navyBodyFatPct (removes inline density formula duplication)
FEATURE: lib/health/useBiometrics.ts — hook React client qui charge assessment_responses depuis Supabase, appelle deriveMetrics + evaluateAll, expose criticalAlerts, navySuggestion, applyNavySuggestion et refetch
FEATURE: app/api/assessments/submissions/[submissionId]/recalculate/route.ts — POST endpoint to recalculate derived biometric metrics (BMI, lean mass, fat mass) from existing assessment_responses and upsert results
FEATURE: lib/assessments/modules.ts — add muscle_mass_pct field after muscle_mass_kg in body composition module
FEATURE: lib/health/bioNorms.ts — module de normes physiologiques (9 métriques, sources OMS/ACE/EFSA/IOF/IDF/Janssen/Kyle/Tanita) avec evaluateMetric et evaluateAll
FIX: lib/health/healthMath.ts — gardes division par zéro dans calculateBMI, bodyFatPctFromMass, musclePctFromKg, muscleKgFromPct (return NaN si weight/height <= 0)
FIX: lib/health/healthMath.ts — garde log10(<=0) dans navyBodyFatPct pour homme (waist-neck<=0) et femme (waist+hips-neck<=0)
FIX: lib/health/healthMath.ts — navyBodyFatPct retourne maintenant round1() avant le return final
FIX: lib/health/healthMath.ts — deriveMetrics vérifie isFinite(navyResult) en plus de isNaN pour le navy_suggestion
FIX: lib/health/healthMath.ts — lean_mass_kg = null si fat_mass_kg > weight_kg (inputs physiologiquement impossibles)
REFACTOR: lib/health/healthMath.ts — suppression de 'navy_estimated' du type body_fat_source (dead code — Navy = suggestion uniquement)
REFACTOR: lib/health/healthMath.ts — age_at_measurement rendu optionnel dans BiometricInputs
REFACTOR: lib/health/healthMath.ts — round1 exportée
CHORE: lib/health/healthMath.ts — ajout citation "Coefficients from NHRC Report 84-29, Table 2, p.14" dans JSDoc navyBodyFatPct

FEATURE: lib/health/healthMath.ts — nouveau module pur (zéro dépendances) — source de vérité mathématique pour BMI, masse grasse bi-directionnelle, masse musculaire bi-directionnelle, méthode Navy (Hodgdon & Beckett 1984 + Siri 1961), deriveMetrics() avec fallback Navy suggestion non auto-appliqué

## 2026-04-11

FIX: app/outils/macros/MacroCalculator.tsx — fitness_level (niveau sportif) ne mappe plus vers activityLevel — seul daily_steps bilan ou choix manuel du coach détermine le niveau d'activité quotidienne
FIX: app/api/lab/client-search/route.ts — field_key mismatch : ajout skeletal_muscle_mass_kg comme fallback de muscle_mass_kg, sleep_hours accepté en plus de sleep_duration_h
FEATURE: lib/formulas/macros.ts — nouveaux inputs optionnels : muscleMassKg, bmrKcalMeasured (priorité balance avec validation plage), sessionDurationMin + trainingTypes (EAT via MET×durée), trainingCaloriesWeekly (tracker si delta >20%), occupationMultiplier (NEAT pondéré par occupation), stressLevel + sleepDurationH (suggestion récupération)
FEATURE: lib/formulas/macros.ts — NEAT pondéré par poids (pas × 0.0005 × kg) + coefficient occupation + dataProvenance flags + recoveryAdaptation suggestion
FEATURE: app/api/lab/client-search/route.ts — enrichissement complet : 10+ field_keys bilan récupérés (muscle_mass_kg, bmr_kcal, session_duration_min, training_calories, training_types, daily_steps, stress_level, sleep_duration_h, energy_level, recovery_score, occupation) — stratégie hybride biométrie=plus récent / wellness=moyenne 3 derniers
FEATURE: lib/lab/useLabClientSearch.ts — type LabClient enrichi avec tous les nouveaux champs
FEATURE: app/outils/macros/MacroCalculator.tsx — injection des données bilan enrichies, daily_steps → activityLevel auto-mapping, bouton "Adapter au profil de récupération" interactif, badges de provenance BMR/LBM/EAT/NEAT dans breakdown
REFACTOR: app/outils/macros/MacroCalculator.tsx — Full-Auto applique maintenant le Standard Lab automatiquement (ratios optimaux protéines/lipides/glucides selon l'objectif) sans interaction coach — vraie différence vs Semi-Auto qui injecte les données et laisse le coach calculer
FIX: app/outils/macros/MacroCalculator.tsx — injection client : guards if(x) → != null (évite de bloquer les valeurs 0), activityLevel injecté depuis fitness_level via FITNESS_ACTIVITY_MAP, triggerCalculate full-auto utilise le bon activityLevel mappé
FIX: app/outils/macros/MacroCalculator.tsx — anchor protéines : recalcul toujours depuis baseResult (évite la dérive), calorieDelta basé sur baseResult.tdee, lipides et protéines correctement fixes quand anchor actif
FIX: app/api/lab/client-search/route.ts — colonnes inexistantes retirées (name, age, height_cm) : first_name+last_name pour le nom, age dérivé de date_of_birth, height_cm extrait des assessment_responses
REFACTOR: app/outils/macros/MacroCalculator.tsx — refonte layout inputs : 3 blocs distincts (Biométrie / Activité+Séances / Objectif+CTA), barre d'ajustements horizontale dans la zone résultats, suppression colonne 4 ajustements (trop dense)
REFACTOR: app/outils/macros/MacroCalculator.tsx — refonte complète layout full-width (inputs horizontaux en haut, résultats en bas), breakdown TDEE visuel (BMR→NEAT→EAT→TEF→TDEE→Target), macros en cartes hero, Full-Auto débloqué (inject + calcul auto au select), panneau Standard Lab inline avec rationale par objectif, ajustements dans colonne 4 de la grille inputs

FIX: app/outils/macros/MacroCalculator.tsx + ToolsGrid.tsx — correction opacités bordures : border-white/[0.013/016/02] → border-white/[0.06] (valeur standard DS confirmée sur coach/organisation)
FIX: app/api/lab/client-search/route.ts — suppression await sur createServerClient() (sync), !inner → left join sur assessment_responses, logs d'erreur explicites
DOCS: docs/DESIGN_SYSTEM_V2.0_REFERENCE.md + .claude/rules/ui-design-system.md — token bordure standard documenté : border-[0.3px] border-white/[0.06], interdiction des opacités < 0.04
FIX: lib/lab/useLabClientSearch.ts + app/api/lab/client-search/route.ts — seuil de recherche abaissé de 2 à 1 caractère minimum pour déclencher la recherche client
FIX: components/layout/CoachShell.tsx — remplacement des button+router.push() par des Link natifs dans la nav sidebar — élimine les navigations multiples/aléatoires au clic
FIX: app/outils/macros/page.tsx — suppression du useSetTopBar redondant qui écrasait le topBar de MacroCalculator (mode switcher Manuel/Semi-Auto/Full-Auto + bouton retour DS v2.0 n'apparaissaient plus)

REFACTOR: app/outils/macros/MacroCalculator.tsx — bordures DS v2.0 appliquées partout : blocs border-[0.3px] border-white/[0.013], inputs border-[0.3px] border-white/[0.016], boutons border-[0.3px] border-white/[0.02], modal border-[0.3px] border-white/[0.013], séparateurs border-t-[0.3px] border-white/[0.06]
REFACTOR: app/outils/ToolsGrid.tsx — refonte complète DS v2.0 : bordures ultra-fines border-[0.3px] border-white/[0.013], suppression Card shadcn, cards active/dev avec bg-white/[0.02] et hover, section labels, topBar search inline, empty state, footer
REFACTOR: app/outils/macros/MacroCalculator.tsx — alignement strict DS v2.0 : inputs h-[52px] rounded-xl, bouton CTA pattern exact (pl-5 pr-1.5 + icone div), bordures ultra-fines sur tous les blocs et modals, suppression header redondant (topBar gère le retour), font-mono sur données numériques

FEATURE: app/outils/macros/MacroCalculator.tsx — refonte complète avec mode switcher 3 positions (Manuel / Semi-Auto / Full-Auto), barre de recherche client dynamique avec injection automatique des données biométriques
FEATURE: app/outils/macros/MacroCalculator.tsx — panneau ajustements avancés : slider calorique -30/+30%, switch grammes/%, ancrage protéines, bouton Standard Lab
FEATURE: app/outils/macros/MacroCalculator.tsx — modal de validation protocole : diff automatique ancien/nouveau, cases à cocher par changement, badge majeur/mineur, champ contexte, action "Valider & Ancrer" → annotation timeline
FEATURE: lib/lab/useLabClientSearch.ts — hook de recherche client pour le mode Semi-Auto des outils Lab (debounce 300ms)
FEATURE: app/api/lab/client-search/route.ts — endpoint GET de recherche client par nom/email avec injection des dernières métriques (weight_kg, body_fat_pct)
FEATURE: app/api/clients/[clientId]/annotations/route.ts — ajout event_type 'lab_protocol' pour les annotations générées depuis le Lab
