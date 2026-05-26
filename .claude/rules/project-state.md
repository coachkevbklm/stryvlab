# STRYVR — État Vivant du Projet

> **Source de vérité tactique.** Lire au début de chaque session.
> **Historique détaillé** → `project-state-archive.md` (sessions antérieures à 2026-04-27)
> **Dernière mise à jour : 2026-05-29****

---

## 🎯 État Stratégique Global

| Métrique | Statut |
|----------|--------|
| Phase | MVP Phase 1 ✅ Complet → Phase 2 Prêt |
| Architecture | Solide (Supabase RLS, Inngest, TypeScript strict) |
| Performance | Excellent (< 300ms API, real-time scoring) |
| Adherence focus | ✅ 5-min client app target atteint |
| Roadmap | Phase 2 Q3 2026 : wearables, export, IA coach |
| Landing STRYVR | ✅ Refonte DA Technogym — `/stryvr` live |

---

## 📦 Modules Core Status

| Module | Statut | Update |
|--------|--------|--------|
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics complet | 2026-04-26 |
| **Client App** | ✅ Chat SP3-A — proactive AI coach (Inngest crons 06:30/21:30), system prompt v2 (coach identity, full bilan history, active program, tone rules), daily brief post-check-in | 2026-05-21 |
| **Nutrition Composer** | ✅ food_items DB, Composer 4 couches, journal éditable, journée physiologique | 2026-05-16 |
| **Nutrition Engine v1** | ✅ Macro matrix, TDEE components, weekly decision matrix, guardrails, real-time triggers | 2026-05-25 |
| **Cycle Sync v2** | ✅ history-based engine, CyclePhasePill, LogPeriodSheet, Profile, ProtocolRationale accordions, Studio | 2026-05-26 |
| **Cycle Sync Activation** | ✅ coach toggle per protocol, runtime macro adjustment, CycleArcIndicator TopBar, CyclePhaseModal (nutrition/training), check-in phase logging | 2026-05-27 |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync | 2026-04-26 |
| **MorphoPro Bridge** | ✅ Phase 1 complet (galerie + canvas + analyse IA structurée) | 2026-04-28 |
| **Design System v2.0** | ✅ Dark flat minimal DS-compliant (coach web) | 2026-04-27 |
| **Design System v4.0** | ✅ Dark gray minimal — zéro accent, zéro border, gray scale #080808→#f2f2f2 | 2026-05-28 ✅ PWA Compliance Complete |
| **Landing STRYVR** | ✅ `/stryvr` — DA Technogym, waitlist Supabase | 2026-05-16 |
| **Coach Dashboard** | ✅ MRR, alerts, client segmentation | 2026-04-13 |
| **Client Onboarding** | ✅ 5-screen tour + guided tooltip tour | 2026-04-27 |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 | — |

---

## 🚀 Dernières Avancées

### 2026-05-29 — Whisper Voice Transcription — Fix Homophone Errors

- `app/api/client/nutrition/voice-transcribe/route.ts` — nouvelle route : auth + rate limit 10/min + FormData parse + `openai.audio.transcriptions.create` (whisper-1, no language → auto-detect FR/EN/ES, `prompt` sports nutrition biaise le vocabulaire)
- `app/api/client/nutrition/voice-parse/route.ts` — suppression `lang` du schema Zod (Whisper gère la langue ; réponse GPT reste FR)
- `components/client/smart/VoiceLogSheet.tsx` — `SpeechRecognition` remplacé par `MediaRecorder` (webm/opus Chrome, mp4 Safari) ; nouveau layer `transcribing` (spinner) entre stop enregistrement et transcript éditable ; live transcript preview supprimé
- Points de vigilance : `recorder.start(250)` chunks toutes les 250ms — requis pour que `ondataavailable` fire ; `recorder.onstop` déclenché après `stop()` une fois tous les chunks reçus ; MediaRecorder requiert iOS 14.5+ ; WHISPER_PROMPT biais lexical fixes "whey"/"Nutri Muscle" homophones

### 2026-05-26 — DS v4.0 Sheets Alignment Complete — Zero Borders, Pure Gray Hierarchy

- **Scope** : Align all logger sheets to QuickWaterModal reference pattern (zero borders, pure gray nuance via `bg-white/[0.XX]` opacity)
- **FreeActivitySheet** — button colors: type selector `bg-[#1a1a1a]` active / `bg-white/[0.03]` inactive, submit button `bg-white/[0.10]` (was `bg-[#f2f2f2]`)
- **MealLogSheet header** — mic button `bg-white/[0.06] text-white/60` (was `style={{ background: '#1a1a1a', color: '#808080' }}`)
- **LogPeriodSheet** — date input removed `border border-white/[0.08]`, button colors: primary `bg-white/[0.10]` text white, secondary `bg-white/[0.03]`, cancel dot `bg-white/[0.30]` (was `#c0392b` hardcode)
- **QuickLogSheet** — header close button `text-white/60` (was `text-[#5a5a5a]`), action items `bg-white/[0.03]` inactive / `bg-white/[0.06]` active (was `bg-white/[0.04]`), action icons `text-white/70` (was `text-[#c0392b]` red for cycle), cycle action `bg-white/[0.06]` no red special styling, secondary text `text-white/40` (was `text-[#5a5a5a]`)
- **Pattern validated** : all sheets now match QuickWaterModal zero-border aesthetic with consistent gray opacity hierarchy across the app
- **Points de vigilance** : QuickWaterModal still uses deprecated button colors (#2e2e2e, #1a1a1a) but user accepts as overall design superior; all other sheets aligned to pure gray token system; no borders anywhere

### 2026-05-29 — Language Selector — First Question After Password Creation

- `app/client/onboarding/page.tsx` — new Step type includes 'language' between 'password' and 'welcome'
- Language selector UI: 3 buttons (FR/ES/EN) with flag emojis (🇫🇷 🇪🇸 🇬🇧), radio-style selection indicator
- `handleLanguageSelect` → calls context's `setLang(langCode)` → atomically updates provider state + localStorage('client_lang')
- `components/client/ClientI18nProvider.tsx` — exposed `setLang()` in context (updates both state + storage); watches localStorage mutations for cross-tab sync
- `lib/i18n/clientTranslations.ts` — keys 'onboarding.language.title' + 'onboarding.language.subtitle' added for FR/EN/ES
- Language preference flows through welcome screens → all content auto-translates via `t()` from context
- Points de vigilance : localStorage key is 'client_lang' (shared with PreferencesForm); setLang() call immediately updates context (no delay), setTimeout(300ms) ensures visual feedback before transition

### 2026-05-28 — DS v4.0 PWA Compliance Complete — Color Audit & Systematic Fixes

- **Audit scope** : 40+ files across `/client`, `/components/client`, `/app/api` routes
- **Critical violations fixed** : colored trend indicators (green #22c55e / red #f59e0b / amber), colored badges (meal/water/checkin: #22c55e / #06b6d4 / #8b5cf6), deload/alerts severity colors (orange/red/purple), voice confidence badges (amber/red), status pills (set types warmup/cooldown/dropset: #7dd3a7/#3b82f6/#9ff45c)
- **High-priority fixes** : interim gray colors (#2a2a2a, #2e2e2e, #404040, #0d1713), accent borders (#1f8a65/25), button hovers (#5dba87), text colors (#7dd3a7, #a0a0a0, #f59e0b/70), colored icons in TrendingUp/TrendingDown
- **Medium-priority fixes** : SmartAgendaTimeline event badges, SetRow type colors, RemainingBreakdown low/high sections, metrics card text contrasts, ChatConversation/ChatPage/ChatTodayStrip/NewProtocolBanner background grays, QuickLogSheet cycle button, OneRMWidget delta badge
- **Data chart tokens verified** : --data-copper (#8c5230), --data-gold (#a89060), --data-petrol (#3d7070) remain chart-only, not used in UI elements. Verified in SmartNutritionHero arc gradients, nutrition studio charts.
- **Files modified (22 components + 4 API routes)** : TdeeChart, OneRMWidget, SmartAlertsFeed, DeloadAlertBanner, VoiceLogSheet (confidence styles), SetRow (TYPE_COLORS), RemainingBreakdown, SmartAgendaTimeline (KIND_CONFIG), 4 metrics components, ChatConversation, ChatPage, ChatTodayStrip, NewProtocolBanner, QuickLogSheet, ProfileForm, ProfilAccordion, AccordionSection, ProgrammeClientPage, SessionLogger, BodyMap, VolumeCoverageWidget, checkin/[moment]/page.tsx, onboarding/page.tsx, login/page.tsx, nutrition/log/* inputs
- **Result** : 100% grayscale compliance. All UI element colors are neutral (white/[0.04-0.10] bg, text-[#b0b0b0], text-[#808080], text-[#e0e0e0])
- **Points de vigilance** : DS v4.0 audit complete; all violations resolved; TypeScript compilation pre-check passed (no new errors introduced by color changes); CHANGELOG updated with comprehensive summary

### 2026-05-27 — Cycle Sync Activation — Macros Ajustées + Arc Gauge + Phase Modal

- `supabase/migrations/20260527_cycle_sync_enabled.sql` — `cycle_sync_enabled BOOLEAN NOT NULL DEFAULT false` sur `nutrition_protocols`; `cycle_phase TEXT CHECK(...)` + `cycle_day INT CHECK(...)` sur `client_daily_checkins` — **appliquer manuellement**
- `lib/nutrition/types.ts` — `NutritionProtocol.cycle_sync_enabled: boolean` ajouté
- `app/api/clients/[clientId]/nutrition-protocols/route.ts` + `[protocolId]/route.ts` — `cycle_sync_enabled` dans schemas Zod + payload Supabase
- `components/nutrition/studio/useNutritionStudio.ts` — `cycleSyncEnabled` state, chargé depuis `existingProtocol`, inclus dans `buildPayload`
- `components/nutrition/studio/CalculationEngine.tsx` — toggle Désactivé/Activé pour Cycle Sync; quand activé : badge Actif (violet `#a855f7`) + CycleSyncPhaseGrid + détails cycleState
- `components/nutrition/studio/NutritionStudio.tsx` — props `cycleSyncEnabled` + `onCycleSyncEnabledChange` passées à CalculationEngine
- `app/client/nutrition/page.tsx` — `cycle_sync_enabled` lu depuis protocole, runtime adjustment APRÈS `getCycleStateFromLogs`: `target` muté avec deltas `getCycleSyncAdjustment(phase)`
- `app/client/nutrition/NutritionClientPage.tsx` — `CyclePhasePill` remplacé par `CycleArcIndicator` + `CyclePhaseModal` (context="nutrition")
- `app/client/programme/ProgrammeClientPage.tsx` — `CyclePhasePill` remplacé par `CycleArcIndicator` + `CyclePhaseModal` (context="training")
- `components/client/cycle/CycleArcIndicator.tsx` — double arc SVG (arc phase + arc cycle complet), clickable, phase color + confidence dot
- `components/client/cycle/CyclePhaseModal.tsx` — bottom sheet Framer Motion `z-[80]`, lit `PHASE_CONTENT[phase][context]`, impact card + bullets
- `lib/client/cycle/phaseContent.ts` — 8 blocs contenu (4 phases × 2 contextes nutrition/training): title, subtitle, bullets×3, impact
- `tests/lib/cycle/phaseContent.test.ts` — 2 tests Vitest PASS (structure + ≥3 bullets)
- `components/client/smart/ProtocolRationale.tsx` — `showCycle` gated sur `cycleSyncEnabled && cycleState.hasActiveCycle`; step cycle avec delta → kcal ajusté, `phaseColor` depuis `PHASE_COLORS`
- `app/api/client/checkin/route.ts` — IIFE best-effort post-checkin: fetch `menstrual_cycle_logs`, `getCycleStateFromLogs`, update `cycle_phase` + `cycle_day` sur le check-in
- Points de vigilance : runtime adjustment DOIT être après `cycleState = getCycleStateFromLogs(...)` dans `page.tsx` (dépendance d'ordre) ; `CycleArcIndicator` utilise `rotate(-90)` sur le SVG pour démarrer arc en haut ; migration `20260527_cycle_sync_enabled` à appliquer manuellement

### 2026-05-26 — Cycle Sync v2 — Système Complet (history-based engine + full PWA integration)

- `supabase/migrations/20260526_menstrual_cycle_logs.sql` — table `menstrual_cycle_logs` (client_id FK coach_clients, UNIQUE period_start+client, RLS client_own ALL + coach_read SELECT) — **appliquer manuellement via Supabase Dashboard**
- `lib/cycle/cycleEngine.ts` — `getCycleStateFromLogs(logs, bilanValue, today?)` : personal avg cycle length (clamp 21–35, fallback 28), `CycleState` (phase, cycleDay, confidence: estimated/learning/calibrated, nextPhaseIn), `CyclePhase` re-exported from cycleSync
- `tests/lib/cycle/cycleEngine.test.ts` — 28 tests Vitest PASS
- `app/api/client/cycle/log/route.ts` — POST type='start'|'end', 3-day conflict guard, computes cycle length from prev log
- `app/api/client/cycle/status/route.ts` — GET female-gated, returns CycleState
- `app/api/clients/[clientId]/cycle/status/route.ts` — GET coach-facing, auth via `coach_clients.coach_id = user.id`
- `components/client/cycle/CyclePhasePill.tsx` — pill with phase color + "Label · Jxx" + ◐ if estimated, size sm|md
- `components/client/cycle/LogPeriodSheet.tsx` — Framer Motion bottom sheet, start/end flow, 409 conflict confirm, z-[80]/[90]
- `app/client/nutrition/page.tsx` — server-side `cycleState` from `menstrual_cycle_logs`, passed to NutritionClientPage
- `app/client/nutrition/NutritionClientPage.tsx` — CyclePhasePill in TopBar right (flex-col with dayTypeBadge)
- `app/client/programme/ProgrammeClientPage.tsx` — client-side fetch `/cycle/status`, CyclePhasePill in TopBar
- `app/client/programme/session/[sessionId]/SessionLogger.tsx` — CyclePhasePill above timer in header
- `components/client/QuickLogSheet.tsx` — Cycle action (red Drop icon) gated on `hasActiveCycle`, LogPeriodSheet sub-sheet
- `app/client/profil/page.tsx` — passes `cycleState` to ProfilAccordion
- `components/client/profile/ProfilAccordion.tsx` — "Mon Cycle" AccordionSection (female): phase pill + stats grid + log button + LogPeriodSheet
- `components/client/smart/ProtocolRationale.tsx` — rewritten: per-day `DayAccordion` with numbered timeline steps (TDEE → calorie target → protein → carbs/fat → cycle adjustment if hasActiveCycle); legacy target prop preserved
- `components/nutrition/studio/useNutritionStudio.ts` — fetches `/api/clients/${clientId}/cycle/status` best-effort; exposes `cycleState` in return
- `components/nutrition/studio/CalculationEngine.tsx` — "Cycle Sync (femme)" section extended: live CycleState (phase pill, avg length, confidence, phase adjustments below CycleSyncPhaseGrid)
- Points de vigilance : migration `20260526_menstrual_cycle_logs` à appliquer manuellement ; `CyclePhase` type vit dans `lib/nutrition/engine/cycleSync.ts` et est re-exporté par `lib/cycle/cycleEngine.ts` — ne pas dupliquer ; confidence='estimated' quand 0 logs (bilan seul), 'learning' 1–3, 'calibrated' 4+

### 2026-05-25 — Cycle Sync — Intégration Complète Client + Coach Studio

- `lib/nutrition/engine/cycleSync.ts` — 4 phases (follicular/ovulatory/luteal/menstrual), `CycleSyncAdjustment` interface, `detectCurrentPhase` (mod 28), `getCycleSyncAdjustment`, `adjustMacrosForPhase` (calories = P×4+C×4+F×9 toujours cohérent), 20 tests Vitest PASS
- `components/client/nutrition/CycleSyncBanner.tsx` — bannière client : phase colors (rouge/vert/amber/violet), macro deltas grid, badge optimal-deficit, première note de guidance
- `app/client/nutrition/page.tsx` — Server Component : calcul `cycleDay` depuis `menstrual_cycle` (ISO date → diff jours → mod 28, ou numeric_value direct), `detectCurrentPhase` + `getCycleSyncAdjustment` server-side, props passées à NutritionClientPage
- `app/client/nutrition/NutritionClientPage.tsx` — accepte `cycleSyncPhase/cycleSyncAdjustment/cycleDay`, rend `<CycleSyncBanner />` dans l'onglet Aujourd'hui (entre SmartAlertsFeed et SmartNutritionHero) si phase non nulle
- `components/nutrition/studio/CycleSyncPhaseGrid.tsx` — grille 2×2 coach studio : 4 phase cards avec deltas (DeltaBadge), badge "Actuelle" si cycleDay connu, optimal-deficit dot, base macros row
- `components/nutrition/studio/CalculationEngine.tsx` — props `isFemale`, `currentCycleDay`, `baseMacrosForCycleSync` ; section "Cycle Sync (femme)" après Hydratation (gated on `isFemale`)
- `components/nutrition/studio/NutritionStudio.tsx` — `isFemale = clientData?.gender === 'female'`, `currentCycleDay` calculé depuis `clientData.menstrual_cycle` (même logique que le Server Component client), `baseMacrosForCycleSync` depuis `macroResult.macros`
- Points de vigilance : `menstrual_cycle` field supporte deux formats (ISO date "2026-05-01" ou numérique "14") — les deux parsés de façon cohérente dans page.tsx ET NutritionStudio.tsx ; cycle sync visible UNIQUEMENT si `gender === 'female'` (côté client et coach) ; CycleSyncBanner n'a aucun impact sur les macros cibles (informatif uniquement — l'ajustement reste la responsabilité du coach via le protocole)

### 2026-05-25 — Nutrition Engine v1 — Moteur Nutritionnel Intelligent

- `lib/nutrition/engine/types.ts` — types partagés : `EngineGoal`, `EngineGender`, `StryvrmMacros`, `CarbCyclingResult`, `TdeeComponents`, `WeeklyCheckinSummary`, `WeeklyAnalysisResult`, `TriggerRecommendation`
- `lib/nutrition/engine/macroMatrix.ts` — matrice macro officielle STRYVR : `PROTEIN_RATIO`/`FAT_RATIO` par objectif, `computeBaseMacros` (poids total, pas LBM), `computeCarbCycling` (P+L stables, seuls glucides flexent)
- `lib/nutrition/engine/tdeeComponents.ts` — TDEE conservateur : `computeBMR` (Mifflin-St Jeor), `computeNEAT` (steps×0.04×weight_factor + occupation bonus), `computeEAT` (4kcal/min, double cap 450/session + 500/j), `computeTEF` (9% BMR)
- `lib/nutrition/engine/guardrails.ts` — `checkAdherenceGuardrail` (bloque si <85%), `checkFatigueGuardrail` (bloque si signal fatigue + ≥3 jours consécutifs), `runGuardrails` (adhérence prioritaire)
- `lib/nutrition/engine/weeklyAnalysis.ts` — `analyzeWeek` : 4 cas (optimal_recomp, behavioral, deficit_aggressive, surplus_real), guardrails en premier, 8 tests Vitest PASS
- `lib/nutrition/engine/triggers.ts` — `computeTriggers` : fatigue (un seul signal), stagnation (RPE+perf+soreness), faim (hunger≥3 sur jour bas), `doNotCutCalories: true` toujours, 9 tests Vitest PASS
- `lib/nutrition/engine/index.ts` — re-exports publics du module
- `supabase/migrations/20260525_nutrition_weekly_reviews.sql` — table `nutrition_weekly_reviews` (RLS: coach CRUD, client SELECT) — **à appliquer manuellement via Supabase Dashboard**
- `app/api/clients/[clientId]/nutrition-engine/weekly-review/route.ts` — POST : agrège 7j de check-ins, exécute `analyzeWeek`, persiste en DB, retourne résultat au coach
- `app/api/client/nutrition-engine/triggers/route.ts` — GET : `computeTriggers` depuis check-ins récents + protocole actif, phase carb cycling, RPE dernière séance
- `app/api/client/nutrition-alerts/route.ts` — étendu : retourne maintenant `{ alerts, triggers }` (triggers best-effort, non-bloquant)
- Points de vigilance : `nutrition_weekly_reviews` migration à appliquer manuellement ; `waistTrend` toujours `null` en v1 (nécessite ≥2 bilans — Phase 2) ; `computeEAT` a deux caps distincts (per-session ET per-day) pour éviter surestimation ; ce moteur est **additif** — `lib/formulas/macros.ts` (LBM-based, studio coach) est conservé intact

### 2026-05-21 — Chat SP3-A — Proactive AI Coach + System Prompt v2

- `lib/client/ai-coach/buildSystemPrompt.ts` — refonte complète : coach identity (`user_profiles.first_name/last_name`), bilan history limit 10 ascending (PROGRESSION TOTALE), programme actif (`programs.frequency/weeks/program_sessions`), hydration depuis `nutrition_protocol_days.hydration_ml`, ton coach strict (2-3 phrases max, pas de conseils génériques, référence au programme du coach)
- `lib/client/ai-coach/buildDailyBrief.ts` — nouveau : structured daily brief post-check-in (séance prévue, macros cibles, eau, 1 phrase LLM coaching max_tokens:40)
- `app/api/client/checkin/route.ts` — insère `daily_brief` message après le closing LLM, best-effort non-bloquant
- `lib/inngest/functions/chat-morning-brief.ts` — cron 06:30 UTC : fan-out tous clients actifs, insère `morning_init` message avec chip `trigger_checkin`, double dedup (checkin already done + message already sent)
- `lib/inngest/functions/chat-evening-brief.ts` — cron 21:30 UTC : même mécanique, `evening_init`
- `app/api/inngest/route.ts` — enregistre les 2 nouvelles fonctions
- `components/client/ChatPage.tsx` — `handleInteract` intercepte `key === 'trigger_checkin'` → marque chip answered + active `handleCheckinClick()`
- Points de vigilance : les messages `morning_init`/`evening_init` sont archivés après 3j par `chat-archive` — normal car check-in doit être fait dans les 3j ; cron UTC (06:30 = 08:30 CEST été) ; `programs.status === 'active'` requis pour la séance prévue

### 2026-05-21 — Metrics Tab Navigation — 3-tab client PWA

- `app/api/client/body-data/route.ts` — extended: `bodyFatSeries`, `leanMassSeries`, `measuresByBilan[]`, `annotations[]` (from `metric_annotations` non-injury)
- `app/api/client/vitality/route.ts` — new: score agrégé check-ins 0-100, trend 30j (energy/sleep/stress/soreness merged morning+evening)
- `components/client/metrics/MetricCard.tsx` — generic card: value + sparkline + expand-inline SVG chart + bilan markers + coach annotations
- `components/client/metrics/MetricExpandedChart.tsx` — full SVG chart, MIN/MOY/MAX stats, annotation vertical lines
- `components/client/metrics/BodyDataTab.tsx` — 3 cards: poids, masse grasse, masse maigre
- `components/client/metrics/BodySilhouette.tsx` — SVG front view (viewBox 280×460) + bilan pills navigator + dashed annotation lines (chest/waist/hips/arm) + deltas vs previous bilan
- `components/client/metrics/MesurationsTab.tsx` — silhouette + 4 measurement cards
- `components/client/metrics/VitalityScoreHero.tsx` — score bar 0-100 + label (Excellent/Bonne forme/Attention/À surveiller)
- `components/client/metrics/VitalityTab.tsx` — hero + 4 vitality cards with 7j avg vs previous 7j delta
- `components/client/MetricsClientPage.tsx` — full refactor: tab bar (Corps/Mensurations/Vitalité) + Promise.all fetch + tab routing
- Score formula: `(energy_norm×1.5 + sleep_norm×1.5 + stress_inv×1 + soreness_inv×0.5) / 4.5 × 100`
- Points de vigilance: BodySilhouette bezier control points are approximate — can be visually tuned; annotations from `metric_annotations` require `event_type != 'injury'` AND `label IS NOT NULL`

### Avancées 2026-04-28 → 2026-05-21 (condensé)

| Date | Feature | Fichiers clés |
|------|---------|---------------|
| 2026-05-21 | Chat SP2 — `client_daily_checkins`, flows morning/evening 4 steps, chips/slider interactifs. `muscle_soreness` conditionnel (`__has_session_today`). Flow messages éphémères — seul closing LLM persisté. | `lib/client/checkin/`, `app/api/client/checkin/route.ts` |
| 2026-05-21 | DS v4.0 — gray scale #080808→#f2f2f2, tokens `--data-copper/gold/petrol`. ⚠️ Recharts : `var(--data-*)` via `style={{ stroke }}` uniquement, pas className. BodyMap primary = `#e0e0e0`. | `app/globals.css`, `tailwind.config.ts` |
| 2026-05-21 | i18n ES/EN — +150 clés, `useClientT()`. `getCoachingCue` reçoit `t as (k: string) => string` (cast TS strict requis). | `lib/i18n/clientTranslations.ts` |
| 2026-05-20 | Chat-First Client App — `chat_messages`+`chat_sessions`, ChatPage home, BottomNav 4 tabs, chat-archive cron 03:00 UTC. | `supabase/migrations/20260520_chat_messages.sql`, `components/client/ChatPage.tsx` |
| 2026-05-20 | Coach IA Chat — `ai_coach_daily_usage` rate limit DB, buildSystemPrompt server-only, GPT-4o mini max_tokens 300. Reset compteur = 04:00 physiologique. | `lib/client/ai-coach/buildSystemPrompt.ts` |
| 2026-05-20 | Voice Nutrition Logger — SpeechRecognition + AnalyserNode + review sheet. ⚠️ Non supporté iOS Safari < 16.4. | `components/client/smart/VoiceLogSheet.tsx`, `lib/nutrition/voice.ts` |
| 2026-05-19 | Smart Workout Redesign — SetRow swipe (valider/supprimer), ExerciseBlock inline sets, SessionLogger −1050 lignes. | `components/client/smart/SetRow.tsx`, `SessionLogger.tsx` |
| 2026-05-19 | Profil Accordion — 8 sections Framer Motion, BodyDataSection sparkline, Server Component pur. | `components/client/profile/ProfilAccordion.tsx` |
| 2026-05-18 | Elite Sprint — PR detection Epley, meal favorites, ExerciseProgressionChart SVG bezier, recoveryAlerts 10 tests. | `lib/training/oneRepMax.ts`, `lib/client/smart/recoveryAlerts.ts` |
| 2026-05-18 | Smart Trio Refonte — 16 composants `smart/`, 4 libs Vitest, 11 API routes. Routes /agenda + /progress → redirect /client. | `components/client/smart/` |
| 2026-05-17 | Tempo v2 + SetRecommendation v2 — triangle fermé, Path B fix, formatWeight locale-independent. | `lib/training/tempo.ts` |
| 2026-05-16 | Landing + Nutrition Composer + Tempo Phase 1 — food_items, nutrition_meals, journée physiologique 04:00. | `app/stryvr/`, `lib/nutrition/` |
| 2026-04-28 | MorphoPro Phase 1 — morpho_photos + morpho_annotations + RLS, GPT-4o structuré, Fabric.js v6. | `components/clients/MorphoAnalysisSection.tsx` |

---

## 🔑 Points de Vigilance (Actuels)

| Problème | Impact | Mitigation |
|----------|--------|-----------|
| Supabase Redirect URLs | Onboarding brisé | Whitelist `/client/onboarding` |
| `three@0.170` requis | Build error si downgrade | Ne pas downgrader — `three-mesh-bvh` peer dep |
| Recharts + data colors | `className` ne marche pas | Toujours `style={{ stroke: 'var(--data-copper)' }}` — pas `stroke-data-copper` |
| Voice logger iOS | Crash silencieux | SpeechRecognition non supporté iOS Safari < 16.4 — fallback affiché |

> ✅ **Migrations vérifiées le 2026-05-21** via `scripts/verify-migrations.sql` — toutes appliquées (sauf `20260526_menstrual_cycle_logs` — à appliquer manuellement).
> Script de vérification réutilisable : `scripts/verify-migrations.sql` → Supabase SQL Editor.

---

## 📅 Next Steps — Phase 2

- [x] Toutes migrations appliquées (vérifié 2026-05-21)
- [x] Chat SP2 : Scripted Flow Engine — flows morning/evening, chips/sliders interactifs, données réelles system prompt
- [x] Chat SP3-A : Proactive AI Coach — system prompt v2, Inngest crons, daily brief
- [x] Nutrition Engine v1 — macro matrix, TDEE, weekly decision matrix, guardrails, triggers (2026-05-25)
- [ ] Nutrition Engine — appliquer migration `20260525_nutrition_weekly_reviews` manuellement via Supabase Dashboard
- [x] Cycle Sync v2 — history-based engine, CyclePhasePill TopBars, LogPeriodSheet FAB, Profile section, ProtocolRationale per-day, Studio second source of truth (2026-05-26)
- [ ] Cycle Sync v2 — appliquer migration `20260526_menstrual_cycle_logs` manuellement via Supabase Dashboard
- [x] Cycle Sync Activation — coach toggle, runtime macro adjustment, CycleArcIndicator, CyclePhaseModal, check-in logging (2026-05-27)
- [x] Cycle Sync Activation — appliquer migration `20260527_cycle_sync_enabled` manuellement via Supabase Dashboard
- [x] DS v4.0 PWA Compliance — systematic color audit & fixes (2026-05-28) — all colored accents/badges/trends eliminated
- [ ] Chat SP3-B : Push Notifications + VAPID, cron par client
- [ ] Chat SP4 : Metrics / Body Evolution avancée — graphiques poids, composition, historique bilans
- [ ] E2E test : invite → onboarding → 5 écrans → dashboard
- [ ] Gamification : points check-ins / séances / bilans
- [ ] Mobile : TopBar buttons responsive, SessionLogger < 480px
- [ ] Wearables : Apple Health, Oura (~6 weeks)
- [ ] Export : PDF/CSV/JSON programme (~4 weeks)
- [ ] IA Coach : bulk protocol generation (~8 weeks)

---

## 🗂️ Architecture Clés

**Database** : Supabase PostgreSQL + Prisma — RLS multi-tenant, migrations, seeds idempotent
**Async Jobs** : Inngest — `morpho/analyze.requested` (OpenAI Vision, retry x3, 5min timeout)
**DS v2.0** (coach) : `#121212` fond, `#1f8a65` accent vert
**DS v3.0** (STRYVR native/landing) : `#0a0a0a` fond, `#F5D800` accent jaune, Urbanist uppercase

## ⚙️ Config Production

| Variable | Statut |
|----------|--------|
| INNGEST_SIGNING_KEY | ✅ Injected (Vercel) |
| INNGEST_EVENT_KEY | ✅ Injected (Vercel) |
| CRON_SECRET | ✅ Configured |
| Supabase RLS | ✅ Enabled |
| PWA Manifest | ✅ Updated (#121212) |
| Service Worker | ✅ v2 (network-first pages) |

## 🎯 Règles Non-Négociables

1. **Data Model First** — schéma avant UI
2. **Zero TypeScript Errors** — `npx tsc --noEmit` obligatoire
3. **CHANGELOG After Every Change** — MANDATORY
4. **DS v2.0 Strict** — `#121212` bg, `#1f8a65` accent (coach web)
5. **DS v3.0 Strict** — `#0d0d0d` bg, `#ffe01e` accent, Barlow (client app)
6. **RLS + Ownership Checks** — API routes sécurisées
7. **Inngest Only** — zéro `setImmediate`, tous jobs async via Inngest
