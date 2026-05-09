# STRYVR — État Vivant du Projet

> **Source de vérité tactique** pour la session actuelle.
>
> **STRATEGIC REFERENCE** → `docs/STRYVR_STRATEGIC_VISION_2026.md` (vision, pillars, roadmap)
>
> **FULL HISTORY** → `.claude/rules/project-state-archive.md` (sessions antérieures, features archivées)

**Dernière mise à jour : 2026-05-09 (Nutrition Studio dataSource + MissingDataPanel refactor)**

---

## 🎯 État Stratégique Global (Snapshot)

| Métrique       | Statut                                             |
| -------------- | -------------------------------------------------- |
| Phase          | MVP Phase 1 ✅ Complet → Phase 2 Prêt              |
| Architecture   | Solide (Supabase RLS, Inngest, TypeScript strict)  |
| Performance    | Excellent (< 300ms API, real-time scoring)         |
| Focus Client   | ✅ 5-min app target atteint                        |
| Data Integrity | ✅ Muscle data consolidated single source of truth |
| Roadmap        | Phase 2 Q3 2026 : wearables, export, IA coach      |

---

## 📦 Modules Core Status

| Module                          | Statut                                                     |
| ------------------------------- | ---------------------------------------------------------- |
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics + muscle consolidation             |
| **Client App**                  | ✅ Smart Agenda, meal AI, macro progress                   |
| **Nutrition Protocols**         | ✅ Macros, carb cycling, cycle sync + intelligent fallback |
| **MorphoPro Bridge**            | ✅ Phase 1 (gallery + canvas + AI analysis)                |
| **Design System v2.0**          | ✅ Dark flat minimal                                       |
| **Coach Dashboard**             | ✅ MRR, alerts, segmentation                               |
| **Client Onboarding**           | ✅ 5-screen tour + tooltip guide                           |
| **Muscle Data**                 | ✅ Single source of truth (normalization layer complete)   |
| **Daily Check-ins**             | 📋 Spec documentée, Phase 2                                |

---

## 🚀 Dernières Avancées (2026-05-09)

### Nutrition Studio — DataSource Tracking + Inline MissingDataPanel (COMPLET)

**Problème :**

- Modal "Données manquantes" non-centrée + données ne persisten pas après Apply
- "Taille manquante" alerté uniquement dans ParameterAdjustmentPanel, pas dans MissingDataAlerts
- BMR from old bilan utilisé silencieusement sans distinction entre stable (height) vs volatile (BMR, weight, bf, steps)
- Pas de logical fallback — if data missing from selected bilan mais existe in older bilan, system ne le reuse pas intelligement

**Solution architecturale :**

1. **dataSource tracking** — API retourne Record<field_key, 'selected' | 'fallback'> pour chaque field
2. **Distinction stable/volatile** :
   - Stable (height): fallback silencieusement, alert uniquement si JAMAIS entré
   - Volatile (bmr, weight, bf, steps, lean_mass, muscle_mass): alert si missing OR from fallback
3. **Inline panel UX** — MissingDataPanel remplace CompleteMissingDataModal
   - Bottom-aligned dans Col 1, ergonomic pour saisie rapide
   - Click alerte → panel opens inline → enter/calculate → Enregistrer → refetch + macro recalc + alert disappears

**Fichiers modifiés :**

- `app/api/clients/[clientId]/nutrition-data/route.ts` : ajout dataSource tracking, fetch ALL submissions (target + older) pour fallback
- `components/nutrition/studio/useNutritionStudio.ts` : ajout dataSource state, extraction from API response, re-export
- `components/nutrition/studio/NutritionStudio.tsx` : pass dataSource prop to ClientIntelligencePanel
- `components/nutrition/studio/ClientIntelligencePanel.tsx` : pass dataSource to MissingDataAlerts, render inline MissingDataPanel
- `components/nutrition/studio/MissingDataAlerts.tsx` : distinction stable/volatile, conditional alerts based on dataSource
- `components/nutrition/studio/MissingDataPanel.tsx` : NEW — inline saisie + BMR calculator
- `components/nutrition/studio/CompleteMissingDataModal.tsx` : z-index raised z-50 → z-[70]

**Résultat :**

- ✅ Volatile data alerts intelligentes : "absent bilan sélectionné" vs "du bilan antérieur (à vérifier)"
- ✅ Stable data fallback silencieuse : height reused sans alert
- ✅ Inline panel UX : click alerte → saisie rapide → save → macros recalc
- ✅ Data persistence fixée : explicit refetch après PATCH
- ✅ All alerts visible : height_cm ajouté to MissingDataAlerts

**Points de vigilance :**

- dataSource initialized all fields 'fallback', only 'selected' after explicit entry or manual override
- BMR calculator requires weight + height for Mifflin, requires lean_mass OR (body_fat + weight) for Katch-McArdle
- Refetch includes submissionId param if selected
- Z-index collision resolved : modal z-[70], panel z-50 (implicit)

**Problème :**
Client terminait une séance → recap affichait volume 0kg, reps 0, sets 0 (sauf durée + notes). Historique montrait 2 séances : une vide, une complète.

**Cause :**

1. SessionLogger.initDraft() créait un nouveau draft au mount
2. Client complétait la séance, submitSession() faisait PATCH /sets + PATCH /[logId] pour marquer completed
3. Client cliquait "Retour" ou revenait à la même séance
4. initDraft() pinguait l'ancien logId, recevait 404 (completed_at IS NOT NULL)
5. **Bug : créait un deuxième draft vide** au lieu de retourner (read-only mode)
6. Récap affichait le deuxième log (vide) au lieu du premier (complète)

**Fix appliqué :**

1. **SessionLogger.tsx** (`initDraft()` ligne 357-361)
   - Si ping retourne 404, clear localStorage et return early (ne pas créer de nouveau draft)
   - Séance terminée = read-only mode, affiche historique seulement

2. **SessionLogger.tsx** (`submitSession()` lignes 599-651)
   - Supprimé fallback POST si PATCH /sets échoue
   - Si erreur : show error banner "Réessayer" au lieu de créer un 2e log

3. **sets/route.ts** (ligne 80)
   - Ensure `completed: false` default si undefined (mineure, par sécurité)

**Résultat :**

- ✅ Client termine séance → recap affiche les vraies données (volume, reps, sets, muscles, notes)
- ✅ Pas de création de log dupliqué
- ✅ Historique affiche 1 séance complète
- ✅ Retour à séance déjà complétée = mode lecture seule, affiche historique

**Fichiers modifiés :**

- `app/client/programme/session/[sessionId]/SessionLogger.tsx`
- `app/api/session-logs/[logId]/sets/route.ts`

---

## 🚀 Dernières Avancées (2026-05-08)

### Muscle Data Consolidation — Single Source of Truth (COMPLET)

**Ce qui a été fait :**

Architecture : Consolidated 5 conflicting muscle data sources (catalog JSON, DB columns, regex detection, volume map, raw display) into single authoritative source with strict validation.

1. **Normalization Layer** (`lib/programs/intelligence/muscle-normalization.ts`)
   - CANONICAL_MUSCLES : 65 FR anatomical muscle slugs (single source of truth)
   - LEGACY_TO_CANONICAL : backward compat mapping (EN → FR, old names)
   - normalizeMuscleSlug() : converts any slug to canonical, throws on invalid
   - validateMuscleArray() : validates + normalizes array, dedupes
   - Zod schemas : CanonicalMuscleSchema, MuscleArraySchema, ExerciseMusclePatchSchema

2. **Resolution Layer** (`lib/programs/intelligence/exercise-resolver.ts`)
   - resolveExerciseMuscleCoverage() : strict resolver, reads from DB only, throws on empty/invalid
   - resolveExercisesMusclesCoverage() : batch resolve, collects errors
   - Zero regex fallback — explicit errors if data incomplete

3. **Database Migration** (`supabase/migrations/20260508_exercise_normalized_muscles.sql`)
   - Added primary_muscles_normalized[] + secondary_muscles_normalized[] to:
     - coach_program_template_exercises
     - program_exercises
     - coach_custom_exercises
   - GIN indexes for fast queries
   - RLS policies maintained
   - **Manual application required** : Supabase Dashboard SQL Editor

4. **Volume Mapping** (`lib/programs/intelligence/catalog-utils.ts`)
   - MUSCLE_TO_VOLUME_GROUP : complete 65-muscle mapping to FR display groups
   - All canonical muscles now have volume groups (zero gaps)
   - getVolumeGroup() : lookup function

5. **Component Synchronization** (`lib/client/muscleDetection.ts`)
   - Removed 350+ lines regex detection (fuzzy matching, fallbacks)
   - getMuscleActivation() now calls resolveExerciseMuscleCoverage()
   - CANONICAL_TO_BODYMAP : 65 muscles → 13 BodyMap groups
   - Legacy detectMuscleGroups() preserved for backward compat

6. **Validation at API Boundary**
   - ExerciseMusclePatchSchema validates all muscle inputs
   - Invalid slugs rejected at POST/PATCH, zero data corruption risk

7. **Tests** (23 tests, all PASS)
   - muscle-normalization.test.ts : 11 tests (normalization, legacy mapping, case-insensitivity)
   - exercise-resolver.test.ts : 8 tests (strict resolution, batch resolution, error collection)
   - muscle-consistency.test.ts : 4 tests (BodyMap ↔ scoring ↔ volume consistency)

**Fichiers créés :**

- `lib/programs/intelligence/muscle-normalization.ts`
- `lib/programs/intelligence/exercise-resolver.ts`
- `tests/lib/intelligence/muscle-normalization.test.ts`
- `tests/lib/intelligence/exercise-resolver.test.ts`
- `tests/integration/muscle-consistency.test.ts`
- `docs/architecture/MUSCLE_DATA_CONSOLIDATION.md`
- `supabase/migrations/20260508_exercise_normalized_muscles.sql`

**Fichiers modifiés :**

- `lib/client/muscleDetection.ts` : removed regex fallback, integrated resolver
- `lib/programs/intelligence/catalog-utils.ts` : added complete volume mapping
- `CHANGELOG.md` : 6 entries for 2026-05-08

**Résultat :**

- ✅ Same exercise shows identical muscles everywhere (BodyMap, volume heatmap, scoring alerts, volume distribution)
- ✅ No regex fallback — explicit errors if data incomplete
- ✅ Backward compat with legacy data (EN → FR normalization)
- ✅ Strong typing (CanonicalMuscle enforced at compile time)
- ✅ Validation at API boundary — zero data corruption
- ✅ Complete muscle coverage — all 65 canonical muscles have volume groups

**Points de vigilance :**

- Migration `20260508_exercise_normalized_muscles.sql` requires manual application in Supabase Dashboard
- Seed script to hydrate catalog (458 exercises) blocked on Prisma schema availability
- Component sync (BodyMap, ExerciseCard) pending DB migration application
- Legacy exercises without normalized data fallback to old columns (transparent, no errors)

**Next Steps :**

- [ ] Apply migration manually in Supabase Dashboard SQL Editor
- [ ] Hydrate catalog with normalized muscles (once Prisma schema available or direct SQL)
- [ ] Update components to prefer normalized columns (BodyMap, ExerciseCard, ScoringSection)
- [ ] Verify consistency across all muscle displays (volume heatmap, scoring alerts, BodyMap)
- [ ] Monitor for legacy exercises missing normalized data (apply fallback mechanism)

---

## 🚀 Dernières Avancées (2026-05-06)

### Smart Agenda Phase 1 — COMPLET

**Fichiers clés :**

- `supabase/migrations/20260506_smart_agenda.sql` — `smart_agenda_events` + `meal_logs` extension
- `lib/inngest/functions/meal-analyze.ts` — GPT-4o Vision job (retry x3, timeout 2min)
- `app/api/client/agenda/*` — 3 routes (day, week, today-progress)
- `components/client/AgendaDayView.tsx`, `AgendaWeekView.tsx` — UI jour/semaine
- `app/client/agenda/page.tsx` — page Smart Agenda complète

**Actions manuelles requises :**

- Migration `20260506_smart_agenda.sql` → appliquer via Supabase Dashboard
- Bucket `meal-photos` → créer dans Supabase Storage (10MB max, images only)

**Points critiques :**

- Poll pending meals : 3s interval tant que `ai_status=pending`
- Web Speech API : fallback gracieux si non disponible
- BottomNav : restructuré (2 items | + central | 2 items)

---

## 🔑 Points de Vigilance (Actuels)

| Problème                  | Mitigation                                |
| ------------------------- | ----------------------------------------- |
| Supabase Redirect URLs    | Vérifier `/client/onboarding` whitelisted |
| Client pool auth          | Session établie AVANT form render         |
| Data validation anomalies | Clamping 15–240 en place                  |

---

## 📅 Next Steps — Phase 2

- [ ] E2E test : invite → onboarding → dashboard complet
- [ ] Daily Check-ins : DB schema, coach UI, client time picker, Inngest cron, Web Push
- [ ] Gamification : points système (check-ins, séances, bilans)
- [ ] Mobile optimization : TopBar responsive, SessionLogger < 480px
- [ ] Monitoring : dropoff rates onboarding par step
- [ ] Wearables : Apple Health, Oura (~6 weeks)
- [ ] Export : PDF/CSV/JSON programme (~4 weeks)
- [ ] IA Coach : bulk protocol generation (~8 weeks)

---

## ⚙️ Configuration Production

| Variable            | Statut              |
| ------------------- | ------------------- |
| INNGEST_SIGNING_KEY | ✅ Vercel           |
| INNGEST_EVENT_KEY   | ✅ Vercel           |
| CRON_SECRET         | ✅ Sub expiry daily |
| Supabase RLS        | ✅ Enabled          |
| PWA Manifest        | ✅ #121212          |
| Service Worker      | ✅ v2 network-first |

---

**Full history: `.claude/rules/project-state-archive.md`**
