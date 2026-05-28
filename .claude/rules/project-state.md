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
| **Transformation Score Widget** | ✅ composite 0–100 gauge (4 dimensions), SVG speedometer + Framer Motion, alert list, 7j/30j toggle, coach weight override | 2026-05-29 |
| **Transformation Phase Guide Widget** | ✅ 7-phase cascade algorithm (body fat % + recovery + performance + adherence drivers), matchesCurrent badge, confidence dots, rationale bullets | 2026-05-29 |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync | 2026-04-26 |
| **MorphoPro Bridge** | ✅ Phase 2+4 complet — biomechEngine (Gold Standard matching), evolution tracking (deltas + timeline), 5 routes | 2026-05-29 |
| **Chat Release 1 — Bloc D** | ✅ DB + observabilité — schema, callLLM wrapper, feature flags, coach notifications | 2026-05-29 |
| **Design System v2.0** | ✅ Dark flat minimal DS-compliant (coach web) | 2026-04-27 |
| **Design System v4.0** | ✅ Dark gray minimal — zéro accent, zéro border, gray scale #080808→#f2f2f2 | 2026-05-28 ✅ PWA Compliance Complete |
| **Landing STRYVR** | ✅ `/stryvr` — DA Technogym, waitlist Supabase | 2026-05-16 |
| **Coach Dashboard** | ✅ MRR, alerts, client segmentation | 2026-04-13 |
| **Client Onboarding** | ✅ 5-screen tour + guided tooltip tour | 2026-04-27 |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 | — |

---

## 🚀 Dernières Avancées

### 2026-05-29 — Chat Release 1 Bloc D — Fondation DB + Observabilité

- `supabase/migrations/20260529_chat_release1_bloc_d.sql` — ALTER chat_messages (+5 cols : parent_message_id, requires_coach_response, coach_response_reason, from_coach_human, trace_id), ALTER coach_profiles (+5 cols AI), 4 nouvelles tables (coach_ai_settings_per_client, coach_llm_budget, llm_traces, coach_notifications), RPC `increment_llm_budget` atomique — **appliquer manuellement via Supabase Dashboard**
- `lib/llm/types.ts` — CallLLMParams, LLMResult, ProviderParams, ProviderResult, LLMProvider
- `lib/llm/providers/openai.ts` — provider isolé, timeout 30s, maxRetries 1 (swap futur = 1 fichier)
- `lib/llm/callLLM.ts` — wrapper centralisé : INSERT llm_traces avant appel, UPDATE après, increment_llm_budget RPC, retourne null si erreur (jamais throw)
- `lib/email/mailer.ts` — +`sendCoachAlertEmail` (template Resend, sujet urgent si safety)
- `lib/notifications/sendCoachNotification.ts` — INSERT coach_notifications + email immédiat si category=safety
- `app/api/client/chat/messages/route.ts` — POST refactoré : feature flag check (has_ai_llm + ai_llm_enabled), callLLM, parent_message_id + trace_id sur botMsg, requires_coach_response si LLM désactivé
- `app/api/client/ai-coach/chat/route.ts` — deprecate POST → redirect 308 /chat/messages
- `lib/nutrition/physiological-date.ts` — export PHYSIOLOGICAL_DAY_OFFSET_HOURS = 4
- Points de vigilance : migration à appliquer manuellement ; llm_traces RLS = aucune policy (service_role only) ; race condition consumed_messages documentée (acceptable R1, fix R2) ; message_type CHECK étendu inclut morning_init/evening_init pour cohérence

### 2026-05-29 — Transformation Phase Guide Widget

- `lib/coach/transformationScore.ts` — +`TransformationPhase` (7 phases), `PhaseRecommendation`, `GOAL_TO_PHASE`, `computeOptimalPhase(trainingGoal, dims, latestBodyFat, gender)` — cascade: deload override (recovery<30 / both<40) → body_fat % drivers (male/female thresholds) → dimension fallbacks → goal mirror
- `tests/lib/transformationScore.test.ts` — 12 nouveaux tests, total 30 PASS
- `app/api/clients/[clientId]/transformation-score/route.ts` — +`gender` dans select, `latestBodyFat` extrait de `bodyFatSeries`, tous deux passés à `computeTransformationScore`
- `components/coach/TransformationPhaseWidget.tsx` — widget coach : layout mismatch (2 boîtes + flèche) vs match (1 boîte + badge vert), ConfidenceDots, rationale bullets, fetch `?window=30` fixe
- `app/coach/clients/[clientId]/profil/page.tsx` — widget inséré sous `TransformationScoreWidget`
- Points de vigilance : `computeOptimalPhase` utilise `performance.score < 40` comme proxy pour overreaching (pas accès direct à `global_overreaching` dans les dims) ; `gender` castée depuis DB (string | null) — seule valeur `'female'` déclenche les seuils femmes ; `latestBodyFat` = dernier bilan uniquement (pas une moyenne)

### 2026-05-29 — MorphoPro v2 Phase 2+4 — Moteur Biomécanique + Suivi Longitudinal

- `lib/morpho/biomechEngine.ts` — `deriveMorphoFields` : bridge GPT-v2 analysis → proxy numeric fields (arm_span_height_ratio, femur_tibia_ratio, thoracic_kyphosis_deg, glenohumeral_anteversion_deg, shoulder_external_rotation_deg, pelvic_tilt_anterior_deg, lumbar_neutrality_score, ~25 boolean injury flags depuis text-scan flags+attention_points) ; `evaluateTrigger` : évalue conditions Gold Standard DB (OR/AND logic, unknown fields skipped) ; `generateExerciseRecommendations` : 72 slots × 3 passes (red_flag+risk_tag → trigger → pattern_verdict bonus)
- `lib/morpho/evolution.ts` — `computeEvolutionReport` : score delta + 5 asymmetry fields + 3 syndrome ordinals + 2 segment ratios + flag diff + pattern verdict changes ; significance heuristics (asymétry: 0.5/1.5cm, score: 3/8pts, syndrome: ordinal jump) ; confidence gate (low × low → inconclusive) ; overall_trend (improving/mixed/worsening/stable via improved/worsened ratio)
- `app/api/clients/[clientId]/morpho/exercise-map/route.ts` — GET coach-only ; fetch latest v2 analysis ; lazy-compute `generateExerciseRecommendations` + persist dans `exercise_recommendations` ; retourne `{ analysis_id, analysis_date, recommendations, cached }`
- `app/api/clients/[clientId]/morpho/evolution/route.ts` — GET ; check `morpho_evolutions` cache → compute fresh si absent ; upsert via `onConflict: 'previous_analysis_id,current_analysis_id'`
- `app/api/clients/[clientId]/morpho/evolution-timeline/route.ts` — GET ; time-series sur tous analyses v2 du client : `series` (9 métriques avec confidence), `events` (analysis/flag_resolved/flag_appeared/pattern_changed), `last_evolution_report`
- Points de vigilance : `deriveMorphoFields` produit des proxies (GH anteversion depuis upper_crossed severity) — confiance décroît sur fields cliniques ; exercise-map importe le JSON Gold Standard directement (`@/docs/morphopro_gold_standard_v2_complete.json`) — TypeScript cast via `unknown` ; evolution route utilise `onConflict` Supabase sur la paire (previous_analysis_id, current_analysis_id) — migration 20260529_morphopro_v2 doit être appliquée (UNIQUE constraint)

### 2026-05-29 — MorphoPro v2 — Couche Biomécanique Experte

- `lib/morpho/types.ts` — +`Confidence`, `SegmentEstimate`, `BiomechSegments`, `MuscleInsertion`, `PosturalSyndrome`, `BiomechMovementPattern`, `PatternVerdict`, `BiomechProfile`, `MorphoAnalysisResultV2`, `isMorphoV2()` type guard — v1 intact rétrocompat
- `lib/morpho/buildAnalysisPrompt.ts` — prompt v2 complet : rôle biomécanique expert + 6 axes (proportions segmentaires, insertions musculaires, syndromes posturaux, asymétries fines, pattern verdicts ×10, posturale globale) + garde-fous (no diagnostic, unknown si doute, json strict)
- `lib/morpho/adjustments.ts` — `MorphoForAdjustment` étendu avec `biomech?` ; 6 nouvelles règles : trunk_to_femur <0.9 (squat ×0.92), >1.1 (×1.05), arm_to_torso >1.05 (hinge ×1.10), upper_crossed mod/marked (vertical_push ×0.85 + horizontal_pull ×1.15), lower_crossed mod/marked (core_anti_flex ×1.15 + hinge ×0.90), posterior_chain underdeveloped (hinge ×1.10) ; règles 3&4 désormais alimentées depuis `biomech.segments` si disponible
- `app/api/morpho/analyze/route.ts` — v2 aware : `isMorphoV2` détecte format, passe `biomech` à `calculateStimulusAdjustments`, persiste `biomech_profile + prompt_version`, `max_tokens` 1500→3000, retourne `prompt_version` dans le payload
- `supabase/migrations/20260529_morphopro_v2.sql` — `biomech_profile JSONB`, `exercise_recommendations JSONB`, `prompt_version TEXT DEFAULT 'v1'` sur `morpho_analyses` ; backfill v1 ; table `morpho_evolutions` (unique constraint prev+curr analysis, RLS coach_own) — **appliquer manuellement via Supabase Dashboard**
- Points de vigilance : `max_tokens 3000` requis pour le payload v2 complet (segments ×9 + insertions ×5 + syndromes ×3 + verdicts ×10) ; `isMorphoV2` check sur `'biomech' in r && 'meta' in r` — GPT peut retourner v1 si prompt mal reçu, la route gère les deux ; `BiomechMovementPattern` (10 patterns) ≠ `MovementPattern` dans adjustments.ts (10 patterns programme engine) — mapping intentionnel : `anti_rotation` biomech → `core_anti_flex` programme engine

### 2026-05-29 — Transformation Score Widget — Coach Client Profile

- `supabase/migrations/20260529_transformation_score.sql` — `score_weights_config JSONB DEFAULT NULL` ajouté à `coach_clients` — **appliquer manuellement via Supabase Dashboard**
- `lib/coach/transformationScore.ts` — logique pure : 7 `DEFAULT_WEIGHTS` par objectif, `redistributeWeights` (dimensions insuffisantes exclus, poids redistribué proportionnellement), `normalizeRecovery/Adherence/BodyProgress/Performance`, `generateAlerts` (tri high→medium→low), `computeTransformationScore`
- `tests/lib/transformationScore.test.ts` — 18 tests Vitest PASS
- `app/api/clients/[clientId]/transformation-score/route.ts` — 5 requêtes parallèles (checkins, sessions+set_logs, progression_events, assessment_submissions 90j, checkin_configs), construit les 3 inputs, retourne `TransformationScoreResult`
- `components/coach/TransformationScoreWidget.tsx` — jauge SVG arc (START_DEG=225, SWEEP=270), `motion.path` pathLength + `motion.g` rotate, DimensionPills, AlertList, WindowToggle 7j/30j
- `app/coach/clients/[clientId]/profil/page.tsx` — widget inséré full-width avant la grille 2 colonnes
- Points de vigilance : migration `20260529_transformation_score` à appliquer manuellement ; bilans sont mensuels → window=7j aura souvent 0 data pour bodyProgress (poids redistribué automatiquement) ; `score_weights_config` shape : `{"adherence":0.3,"recovery":0.25,"bodyProgress":0.3,"performance":0.15}`

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
- [x] Transformation Score Widget — composite gauge, API route, coach weight override, alert list (2026-05-29)
- [ ] Transformation Score — appliquer migration `20260529_transformation_score` manuellement via Supabase Dashboard
- [x] Transformation Phase Guide Widget — 7-phase cascade algorithm, coach profil integration (2026-05-29)
- [x] Chat Release 1 Bloc D — DB + observabilité (2026-05-29)
- [ ] Chat Release 1 Bloc D — appliquer migration `20260529_chat_release1_bloc_d.sql` manuellement via Supabase Dashboard
- [ ] Chat Release 1 Bloc A — Urgences comportementales (branche séparée)
- [ ] Chat Release 1 Bloc C — Escalade silencieuse (branche séparée)
- [ ] Chat Release 1 Bloc B — Bot scripté enrichi (branche séparée)
- [ ] Chat Release 1 Bloc E — Workspace coach (branche séparée)
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
