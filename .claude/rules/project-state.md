# STRYVR — État Vivant du Projet

> **Source de vérité tactique.** Lire au début de chaque session.
> **Historique détaillé** → `project-state-archive.md` (sessions antérieures à 2026-04-27)
> **Dernière mise à jour : 2026-05-20**

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
| **Client App** | ✅ Smart Trio + Profil accordion + Smart Workout Motra-style + Voice Nutrition Logger | 2026-05-20 |
| **Nutrition Composer** | ✅ food_items DB, Composer 4 couches, journal éditable, journée physiologique | 2026-05-16 |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync | 2026-04-26 |
| **MorphoPro Bridge** | ✅ Phase 1 complet (galerie + canvas + analyse IA structurée) | 2026-04-28 |
| **Design System v2.0** | ✅ Dark flat minimal DS-compliant (coach web) | 2026-04-27 |
| **Design System v3.0** | ✅ DA Technogym — `#F5D800` jaune, `#0a0a0a` fond | 2026-05-16 |
| **Landing STRYVR** | ✅ `/stryvr` — DA Technogym, waitlist Supabase | 2026-05-16 |
| **Coach Dashboard** | ✅ MRR, alerts, client segmentation | 2026-04-13 |
| **Client Onboarding** | ✅ 5-screen tour + guided tooltip tour | 2026-04-27 |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 | — |

---

## 🚀 Dernières Avancées

### 2026-05-20 — Voice Nutrition Logger

- `lib/nutrition/voice.ts` — `cleanTranscript()` (filler words FR/EN/ES, numbers, units), types `VoiceItem` + `VoiceParseResult`
- `app/api/client/nutrition/voice-parse/route.ts` — POST, GPT-4o mini JSON strict, top-20 food_items hint, food_item_id ILIKE matching, rate limit 10/min in-memory
- `components/client/smart/VoiceLogSheet.tsx` — 3-layer sheet DS v3.0 : recording (SpeechRecognition + waveform AnalyserNode), processing (spinner), review (items éditables, quantité avec recalcul macro proportionnel, swipe delete, log)
- `components/client/smart/VoiceEntryFab.tsx` — FAB micro fixe `bottom-[88px] right-4` sur `/client/nutrition`
- `supabase/migrations/20260520_voice_input_mode.sql` — `'voice'` ajouté à l'enum `input_mode` sur `nutrition_entries`, confidence_score 0.70
- Bouton micro dans `MealLogSheet` header et `NutritionLogContent` (embedded, layers category + sub-header)
- Points de vigilance : migration à appliquer manuellement via Supabase Dashboard, `OPENAI_API_KEY` requis, SpeechRecognition non supporté iOS Safari < 16.4 (fallback message affiché)

### 2026-05-19 — Smart Workout Redesign (Motra-style)
- `supabase/migrations/20260519_set_type.sql` — colonne `set_type` sur `client_set_logs` (warmup/working/cooldown/dropset) — **appliquer manuellement**
- `components/client/smart/SetRow.tsx` — row inline-editable, swipe droite=valider, swipe gauche=supprimer, type pill EC/RC/↘
- `components/client/smart/SetTypeSelector.tsx` — bottom sheet type de série
- `components/client/smart/ExerciseBlock.tsx` — card exercice avec sets inline, Add Set, context menu •••
- `components/client/smart/ExerciseContextMenu.tsx` — échange, repos, note, tempo, supprimer exercice
- `components/client/smart/SupersetContextMenu.tsx` — dissocier, repos, supprimer superset
- `app/client/programme/session/[sessionId]/SessionLogger.tsx` — refonte totale vers liste scrollable (−1050 lignes remplacées)
- `components/client/smart/SmartWorkoutHero.tsx` — titre 22px, sans navigation date, muscle pills
- Supprimés : `SetSwipeCard.tsx`, `SetEditSheet.tsx`
- Conservé : live save, PR detection, SetRecommendation, RestTimer, tempo guide, hydration, long press terminer

### 2026-05-19 — Client Profil Accordion Redesign
- `app/api/client/body-data/route.ts` — agrège bilans (poids série, composition, mensurations)
- `components/client/profile/AccordionSection.tsx` — section collapsible Framer Motion
- `components/client/profile/BodyDataSection.tsx` — sparkline SVG + composition + mensurations
- `components/client/profile/ProfilAccordion.tsx` — orchestrateur 8 sections (une ouverte à la fois)
- `app/client/profil/page.tsx` — Server Component pur (−254 lignes)
- Hero compact : avatar 56px + nom + email + badge statut + streak pill jaune
- Données depuis `assessment_submissions + assessment_responses` (field_keys: weight_kg, body_fat_pct, lean_mass_kg, waist_cm, hips_cm, arm_cm, chest_cm)
- Photos morpho : non affichées côté client (RLS morpho_photos = coach uniquement)

### 2026-05-18 — Elite Client App Sprint
- PR detection temps réel (Epley + historique), flash "⚡ Nouveau record", badge PR jaune
- `getCoachingCue()` — messages contextuels par RIR
- `client_meal_favorites` table + API GET/POST/DELETE/use — repas récents 1 tap
- `ExerciseProgressionChart.tsx` — SVG pur, bezier, sélecteur exercice pills
- `lib/client/smart/recoveryAlerts.ts` — 10 tests Vitest, alertes sleep/stress/energy
- `lib/training/oneRepMax.ts` + `lib/training/deloadDetection.ts` — 21 tests Vitest
- FAB redesign : arc 120°, spring premium, logo 80px
- Bugs résolus : eau 0ml, router.refresh() eau, home grid 2 colonnes

### 2026-05-18 — Smart Trio Refonte App Client
- Smart Agenda (home), Smart Nutrition, Smart Workout, BottomNav 5 slots + RadialActionMenu
- 16 nouveaux composants dans `components/client/smart/`
- 4 libs pures testées Vitest dans `lib/client/smart/`
- 11 API routes, 19 tests Vitest PASS, i18n 48 clés `smart.*`
- Routes supprimées : `/client/agenda` + `/client/progress` → redirect 301 → `/client`

### 2026-05-17 — Tempo Guide Modal v2 + Set Recommendation Engine v2
- TempoGuideModal : circuit triangle fermé, codes couleurs par phase, anticipation isométrique, reps bonus, landscape responsive
- SetRecommendation : Path B corrigé, modulation RIR Path A, formatWeight() locale-independent

### 2026-05-16 — Landing STRYVR + Nutrition Composer + Tempo Phase 1
- Landing DA Technogym : fond `#0a0a0a`, accent `#F5D800`, Urbanist, grille industrielle
- Nutrition Composer 4 couches : `food_items` + `nutrition_meals` + `nutrition_entries`, journée physiologique 04:00
- Tempo Phase 1 : `lib/training/tempo.ts`, badge auto/coach, TempoGuideModal Phase 1
- BodyMap : LEGACY_TO_CANONICAL 40+ slugs, fallback primary_muscle singulier

### 2026-04-28 — MorphoPro Phase 1 + 5 Bugs SessionLogger
- `morpho_photos` + `morpho_annotations` + RLS, GPT-4o structuré, Fabric.js v6 canvas
- SessionLogger : parseFloat("0") fix, home séances du jour, muscleDetection slugs, rest timer 8s, superset UX

---

## 🔑 Points de Vigilance (Actuels)

| Problème | Impact | Mitigation |
|----------|--------|-----------|
| `20260520_voice_input_mode` migration non appliquée | input_mode 'voice' rejeté en DB | `20260520_voice_input_mode.sql` via Supabase Dashboard |
| `20260519_set_type` migration non appliquée | set_type non persisté (default 'working' OK) | `20260519_set_type.sql` via Supabase Dashboard |
| `beta_waitlist` migration non appliquée | Waitlist non fonctionnelle | `20260514_beta_waitlist.sql` via Supabase Dashboard |
| `tempo` migration non appliquée | Tempo non persisté | `20260516_tempo.sql` via Supabase Dashboard |
| `20260518_meal_favorites.sql` non appliquée | Favorites non fonctionnel | Appliquer manuellement |
| Supabase Redirect URLs | Onboarding brisé | Whitelist `/client/onboarding` |
| `three@0.170` requis | Build error si downgrade | Ne pas downgrader — `three-mesh-bvh` peer dep |

---

## 📅 Next Steps — Phase 2

- [ ] Appliquer migrations : `20260514_beta_waitlist.sql` + `20260516_tempo.sql` + `20260518_meal_favorites.sql`
- [ ] E2E test : invite → onboarding → 5 écrans → dashboard
- [ ] Daily Check-ins Phase 2 : DB schema, coach config UI, Inngest cron, Web Push
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
