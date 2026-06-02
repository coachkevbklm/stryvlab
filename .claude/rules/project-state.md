# STRYVR — Project State

> État courant du produit. Mettre à jour à chaque feature majeure.

## Modules

| Module | Statut | Dernière MAJ |
|--------|--------|--------------|
| **PWA Spanish Translation (Deep)** | ✅ Done | 2026-06-02 |
| **Chat/Check-in Coherence** | 🚧 Foundation + Bot quality (greeting live, ton, tips) — reste: closing composer, coach config, bug matin | 2026-06-01 |
| **Phase Optimization Engine** | ✅ v2 — trail 30j, override coach, prefs DB | 2026-05-30 |
| Transformation Score | ✅ Composite 4 dimensions, sans phase recommendation | 2026-05-29 |
| Stryvr Chat Release 1 | 🚧 Blocs A–E en cours | 2026-05-29 |

## Dernières avancées — 2026-06-01 Chat/Check-in Coherence (Foundation)

- **Design** — `docs/design/CHAT_CHECKIN_BOT_COHERENCE_2026-06-01.md` (decisions D1–D16). Règles produit coach IA : jamais de déflection vers le coach humain (→ `coach_notifications` silencieux), jamais toucher la prog, tips lifestyle only, honnêteté factuelle, ton config coach, slider liberté IA.
- **Plan** — `docs/superpowers/plans/2026-06-01-chat-checkin-foundation.md` (Plans 2-4 à suivre : bot quality, coach config, bug matin).
- **`lib/client/checkin/fieldRegistry.ts`** — registre canonique champs (clé/label/colonne DB/ordre-réveil D6). Expose enfin BPM + poids (config coach les omettait).
- **`lib/client/checkin/legacyFieldMap.ts`** + `scripts/migrate-checkin-config-fields.ts` — remap clés legacy→canonique (`mood`→`stress_level`), migration idempotente (à lancer une fois la config coach écrivant les clés canoniques).
- **`lib/client/ai-coach/dailyFacts.ts`** — `computeDailyFacts` (over/under/on_track, day-kind aware) + `computeDayKind` (training/rest/cancelled/skipped). Cores purs, 0 DB, testés (21 tests verts).
- **Bug matin diagnostiqué** : `morning_init` créé paresseusement au GET `/messages` (pas de push fiable) + PWA sans refetch au resume → état de la nuit affiché. Fix prévu Plan 4.

**Bot quality (Plan 2) — fait :**
- `lib/client/ai-coach/resolveTone.ts` (ton + matrice 4 tons), `adviceRules.ts` (tips gated + coach_alerts silencieux), `messageComposer.ts` (clôture faits numérotés + greeting matin/soir + rappel ordre-réveil).
- Greeting LIVE branché : `buildCheckinReadyMetadata` + `routineMessages` via composer ; messages GET fetch ton (per-client+global) + champs config.
- `buildSystemPrompt` : règles d'identité réécrites (IA = le coach, jamais de déflection D10, jamais toucher la prog, pas de fausse louange) + ton câblé. Prompt de clôture durci.

**Plan 2 — FAIT (clôture incluse) :** `loadDailyCoachContext` (loader source unique) + `composeClosingMessage` + `selectAdvice` → clôture déterministe honnête, `coach_notifications` silencieux. ⚠️ catégories advice mappées sur les valeurs CHECK existantes (`out_of_scope`/`weight_off_track`) ; Plan 3 ajoutera `program_signal`/`nutrition_trend`/`recovery_flag` via migration.

**Plan 4 — partiel :** refetch ChatPage au `visibilitychange`/`focus` (corrige état matin périmé au resume). ⚠️ RESTE : le cron Inngest `chat-morning-brief` est enregistré mais ne semble pas tirer en fenêtre 06-07 (morning_init d'hier créé à 14:30 = on-demand) → **vérifier dashboard Inngest** (déploiement/scheduling). Le greeting + badge avant ouverture en dépend.

**Plan 3 — FAIT :** migration `supabase/migrations/20260601_chat_coach_freedom_and_alert_categories.sql` (appliquée en prod via MCP : `coaching_freedom` + catégories coach_notifications). Slider liberté dans `AiCoachSettingsWidget`. `CheckinConfigWidget` canonique (BPM+poids) monté dans le profil IA. `loadDailyCoachContext` lit `coaching_freedom`. Closing émet les vraies catégories.

**Follow-ups restants :**
- ✅ Remap données legacy `daily_checkin_configs.moments[].fields` FAIT en prod via MCP (Kev : morning→sleep_hours/sleep_quality/energy_level, evening→energy_level/stress_level). 1 seule ligne config existait.
- **Crons Inngest — RÉSOLU 2026-06-02** : cause = auto-sync visait l'URL preview protégée (Deployment Protection) → "could not reach URL" → app bloquée sur version 2026-04-25 (1 function). Resync manuel sur `www.stryvlab.com` → **9 functions** enregistrées (chat-morning/evening-brief `*/15` actifs). Fix durable = env var `INNGEST_SERVE_ORIGIN=https://www.stryvlab.com` (Prod, ajoutée) → redeploy pour auto-sync pérenne. Détail : `.claude/rules/inngest-patterns.md` (gotcha). Filet : route `app/api/cron/chat-checkin-init` (cron externe possible). ⚠️ RESTE : **redeploy prod** pour activer `INNGEST_SERVE_ORIGIN` ; valider que `morning_init` apparaît demain en fenêtre 06-07.
- ✅ Ancienne page config `check-ins/page.tsx` : champs passés en clés canoniques (anti re-drift) ; config principale = `CheckinConfigWidget` dans le profil.
- Optionnel : couche refine LLM contrainte par-dessus la clôture template (validée contre les faits).

**Points de vigilance :**
- Incohérence form ↔ config ↔ messages sur les clés champs : DB a `rhr_morning`/`weight_kg`, le form les remplit, mais la config coach ne les exposait pas. Registre canonique = correctif (config coach à étendre, Plan 3).
- tsc projet a des erreurs pré-existantes (tests session-logs, InfoModal `@testing-library` manquant) non liées à ce travail.
- `coach_notifications` format : `{ coach_id, client_id, chat_message_id?, category, status:'pending', priority }`. Catégories à ajouter pour advice : `program_signal`/`nutrition_trend`/`recovery_flag`.

## Dernières avancées — 2026-05-29 Phase Optimization Engine

- **`lib/coach/phaseEngine/`** — `types.ts`, `copy.ts`, `signals.ts` (decay temporel + normalizers), `engine.ts` (scoring vectoriel + safety gates), `prefs.ts` (dérivation depuis `training_goal`)
- **API** — `GET /api/clients/[clientId]/phase-optimization?window=7–90`
- **UI** — `PhaseOptimizationWidget` (quadrant 2D SVG, Framer Motion, micro-copy, decision trace, metric cards)
- **Retrait** — `computeOptimalPhase`, `TransformationPhaseWidget`, `phaseRecommendation` dans transformation score
- **Tests** — `tests/lib/phaseEngine/signals.test.ts`, `engine.test.ts`, `override.test.ts`

## Dernières avancées — 2026-06-02 PWA Spanish Translation (Deep)

**Scope:** Full ES coverage for client PWA — UI strings (chat, measurements, cycle), food item database (3230 items), AI coach language config.

**Delivered:**
- **i18n keys:** 60+ new keys (chat greeting/suggestions, measurement labels+guides, cycle toasts) added to `clientTranslations.ts`
- **DB schema:** `food_item_translations` table (pattern-matched to exercises/muscles) with FR backfill via migration
- **API:** food-items GET updated to JOIN translations, localized search+response with fallback to name_fr
- **AI Coach lang config:** `ai_chat_lang` column on `coach_ai_settings_per_client`, widget UI selector (Auto/FR/ES/EN), buildSystemPrompt resolves lang (coach override → client display_lang → FR)
- **Seed script:** LLM batch translator (GPT-4o-mini, 100 items/batch, retry x3) for ~3230 items → ES+EN

**Files:**
- `lib/i18n/clientTranslations.ts` — 60 keys added
- `supabase/migrations/20260602_food_item_translations.sql` — table + FR backfill
- `supabase/migrations/20260602_ai_coach_chat_lang.sql` — colonne added
- `app/api/client/food-items/route.ts` — localized join + search
- `app/api/clients/[clientId]/ai-settings/route.ts` — ai_chat_lang GET/PUT
- `components/coach/AiCoachSettingsWidget.tsx` — lang selector UI
- `lib/client/ai-coach/buildSystemPrompt.ts` — lang directive injection
- `scripts/seed-food-translations.ts` — batch LLM seed runner

**Remaining (user action):**
- Run `seed-food-translations.ts` with OpenAI API to populate ES+EN food names (~15 min)
- Optional: thread `lang` prop through ChatPage/MeasurementsEntrySheet/LogPeriodSheet (cosmetic, defaults work)

**Tech decisions:**
- `food_item_translations` table (not `name_es` column) for consistency with exercise/muscle pattern
- Coach lang override takes precedence over client lang (coach control over bot voice)
- Fallback always to `name_fr` if translation missing (no blanks)

**Dernières avancées — 2026-05-30 Phase Optimization v2

- **SCHEMA** — `supabase/migrations/20260530_phase_optimization_v2.sql` (`phase_optimization_history`, `coach_clients.phase_override`, `phase_preferences`)
- **`lib/coach/phaseEngine/override.ts`** — parse prefs/override, `applyManualOverride`, `resolveCoachPhasePreferences`
- **`lib/coach/phaseEngine/history.ts`** — snapshot + parse trail pour le quadrant
- **API** — GET enrichi (`historyTrail`, upsert journalier) ; `PATCH /phase-optimization/override`
- **UI** — trajectoire 30j (polyline), panneau ajustement manuel coach
