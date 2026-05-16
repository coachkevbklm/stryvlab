# STRYVR — État Vivant du Projet (Condensé)

> **Source de vérité tactique** sur l'état actuel de STRYVR.
> 
> **STRATEGIC REFERENCE** → `docs/STRYVR_STRATEGIC_VISION_2026.md` (vision, pillars, roadmap)
>
> **Historique détaillé** → voir `project-state-archive.md` (toutes les sessions antérieures à 2026-04-27)

**Dernière mise à jour : 2026-05-17**

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

| Module | Statut | Dernière Update |
|--------|--------|-----------------|
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics complet | 2026-04-26 |
| **Client App** | ✅ Session logging, PWA, weights, superset UX, tempo display + guide modal | 2026-05-16 |
| **Nutrition Composer** | ✅ food_items DB, Composer 4 couches, journal éditable DA v3.0, journée physiologique | 2026-05-16 |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync | 2026-04-26 |
| **MorphoPro Bridge** | ✅ Phase 1 complet (galerie + canvas + analyse IA structurée) | 2026-04-28 |
| **Design System v2.0** | ✅ Dark flat minimal DS-compliant (coach web) | 2026-04-27 |
| **Design System v3.0** | ✅ DA Technogym — #F5D800 jaune, #0a0a0a fond (STRYVR native + landing) | 2026-05-16 |
| **Landing STRYVR** | ✅ `/stryvr` — DA Technogym, waitlist Supabase, beta_waitlist table | 2026-05-16 |
| **Coach Dashboard** | ✅ MRR, alerts, client segmentation | 2026-04-13 |
| **Client Onboarding** | ✅ 5-screen tour + guided tooltip tour | 2026-04-27 |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 | 2026-04-27 |

---

## 🚀 Dernières Avancées (2026-05-17)

### SessionLogger — Set Recommendation Engine v2 (COMPLET)

- ✅ Path B : branche `belowZone && !rirTooLow` ajoutée — maintien charge, vise `planned_reps` (bug critique)
- ✅ Path A : modulation RIR sur set courant — HOLD (`rir ≤ target-2`) veto overload, BOOST (`rir ≥ target+3`) double incrément
- ✅ Path A : `delta_vs_last → null` quand `targetWeight ≤ prev_set_weight_kg` (badge "+Xkg" trompeur supprimé)
- ✅ Fetch historique `page.tsx` : filtre `.not('client_session_logs.completed_at', 'is', null)` — exclut sessions en cours
- ✅ Display : `formatWeight()` — `47.50 → "47.5"`, `47.00 → "47"`, locale-independent (fin des `"47."` et `"48,"`)
- Tests : 16 tests Vitest, tous PASS

**Fichiers modifiés :**
- `lib/training/setRecommendation.ts`
- `tests/lib/training/setRecommendation.test.ts`
- `app/client/programme/session/[sessionId]/page.tsx`
- `app/client/programme/session/[sessionId]/SessionLogger.tsx`

---

## 🚀 Dernières Avancées (2026-05-16)

### Landing STRYVR — Refonte DA Technogym (COMPLET)

**Fichiers :**
- `app/stryvr/page.tsx` — Server Component, Urbanist via `next/font/google`, `getBetaCount()`
- `app/stryvr/actions.ts` — Server Actions : `joinWaitlist()` + `getBetaCount()` → Supabase `beta_waitlist`
- `app/stryvr/components/BetaLandingClient.tsx` — Landing complète
- `app/stryvr/components/AppMockup.tsx` — Mockups `AgendaScreen` + `TrainingScreen` + `HeroPhoneStack`
- `app/stryvr/components/BetaForm.tsx` — Formulaire prénom + email, jaune CTA
- `supabase/migrations/20260514_beta_waitlist.sql` — Table `beta_waitlist` + RLS (anon INSERT, authenticated SELECT)

**DA Technogym — tokens :**
- Fond `#0a0a0a` noir pur, Card `#161616`, Border `rgba(255,255,255,0.08)`
- Accent `#F5D800` jaune — CTA + marqueurs actifs seulement (usage chirurgical)
- Typo Urbanist, uppercase, weight 800-900, `letterSpacing: '-0.04em'`
- Grille industrielle `gap-1px` avec `backgroundColor: border` comme séparateur
- Boutons secondaires outline blanc, CTA principal fond jaune + texte noir

**Sections :**
1. Navbar sticky — logo STRYVR + badge BÊTA + CTA desktop
2. Hero — headline massive, geo badge, `BetaForm` + `HeroPhoneStack` (2 phones perspective)
3. Stats bar — 3 colonnes séparées, chiffres 52px weight 900
4. Features — grille 3 colonnes numérotées 01/02/03
5. App Section — mockup training (sinusoïde SVG + barres jaune/gris) + tableau clé/valeur
6. Nutrition Section — 4 couches Composer + mockup agenda
7. Safety Layer — grille 2×2 (TCA / GLP-1 / Cycle / RED-S)
8. CTA final — section pleine largeur jaune avec form dark intégré
9. Footer — 4 colonnes, réseaux sociaux, note légale

**Mockup TrainingScreen :**
- Courbe sinusoïdale SVG bézier sur fond `#0f0f0f`
- Barres verticales jaune (actives) / gris (reste) sans border-radius
- Stats 3 colonnes : REPS jaune, CHARGE blanc, TEMPS blanc
- Données RPE réelles (pas RIR — STRYVR utilise RPE dans les séances)

**Points de vigilance :**
- `beta_waitlist` : unique index sur `lower(email)` — dedup insensible à la casse
- `getBetaCount()` arrondit à la dizaine inférieure (pas de "0 personnes" au lancement)
- Urbanist chargé via `next/font/google` avec `variable` + `font-[family-name:var(--font-urbanist)]` dans le wrapper — les deux sont nécessaires
- `HeroPhoneStack` masqué sur mobile via media query inline `@media (max-width: 768px)`
- `three@0.170` requis (bumped depuis 0.157) — `BatchedMesh` peer dep de `three-mesh-bvh@0.7.8`

**⚠️ Action manuelle requise :** appliquer `supabase/migrations/20260514_beta_waitlist.sql` via Supabase Dashboard SQL Editor si pas encore fait.

---

### Nutrition Composer — Phase 1 (COMPLET — 2026-05-16)

**Fichiers créés :**
- `supabase/migrations/20260516_food_composer.sql` — 3 tables : `food_items`, `nutrition_meals`, `nutrition_entries` + RLS
- `supabase/migrations/20260516_nutrition_meal_editing.sql` — `nutrition_meals.title`, `photo_urls`, index entries
- `scripts/seed-food-items.ts` — ~150 aliments (6 cat × sous-types), idempotent via `ON CONFLICT (item_key)`
- `lib/nutrition/physiological-date.ts` — `computePhysiologicalDate()` (cutoff 04:00) + `inferMealType()`
- `lib/nutrition/food-items.ts` — types `FoodItem`, `NutritionMeal`, `EntryDraft`, `PORTION_SIZES`, `calcEntryMacros()`
- `app/api/client/food-items/route.ts` — GET search aliments par catégorie/sous-type/texte
- `app/api/client/nutrition/meals/route.ts` — POST créer repas + GET liste du jour
- `app/api/client/nutrition/meals/[id]/route.ts` — PATCH titre/type/photo + DELETE repas structuré
- `app/api/client/nutrition/entries/[id]/route.ts` — PATCH quantité + DELETE aliment + recalcul totaux
- `app/client/nutrition/log/page.tsx` — Nutrition Composer 4 couches (catégorie → sous-type → item → quantité)
- `app/client/nutrition/journal/page.tsx` — Journal alimentaire DA v3.0, cartes repas éditables/story-ready

**Fichiers modifiés :**
- `components/client/BottomNavPlusMenu.tsx` — "Ajouter un repas" → `/client/nutrition/log`
- `app/client/nutrition/page.tsx` — lien journal → `/client/nutrition/journal`
- `app/client/agenda/meals/new/page.tsx` — redirect → `/client/nutrition/log`
- `app/client/checkin/meals/page.tsx` — redirect → `/client/nutrition/journal`

**Architecture :**
- `food_items` : base interne ~150 aliments, macros/100g, `item_key` slug stable
- `nutrition_meals` : conteneur repas (meal_type, physiological_date, totaux calculés)
- `nutrition_entries` : items individuels (food_item_id, quantity_g, macros calculées, confidence_score)
- `meal_logs` : conservé pour rétrocompat IA (photo/vocal fallback)
- Journée physiologique : repas < 04:00 → daté de la veille
- Journal éditable : contenu des repas visible, quantité par aliment modifiable, suppression d'aliment/repas, photo et titre personnalisé

**Points de vigilance :**
- Migration `20260516_food_composer.sql` à appliquer manuellement via Supabase Dashboard
- Seed via `npx tsx scripts/seed-food-items.ts` (nécessite SUPABASE_SERVICE_ROLE_KEY en env)
- `pg_trgm` extension requise pour l'index GIN sur `name_fr` (probablement déjà active)
- `nutrition_meals` et `meal_logs` coexistent — `today-progress` agrège les deux

**⚠️ Actions manuelles requises :**
1. Appliquer `20260516_food_composer.sql` via Supabase Dashboard SQL Editor
2. Lancer seed : `npx tsx scripts/seed-food-items.ts`
3. Appliquer `20260516_nutrition_meal_editing.sql` via Supabase Dashboard SQL Editor pour activer photos + titres des repas

---

### Tempo d'Exécution — Phase 1 (COMPLET — 2026-05-16)

- ✅ Migration `20260516_tempo.sql` : `tempo text` (nullable) sur `coach_program_template_exercises` + `program_exercises`, `tempo_used text` sur `client_set_logs`
- ✅ `lib/training/tempo.ts` : `parseTempo`, `formatTempo`, `getDefaultTempo` (table pattern × objectif), `calcTUT` — 33 tests Vitest
- ✅ Assign route : `tempo` propagé de template → `program_exercises` à l'assignation
- ✅ Coach builder : input `tempo` dans `ExerciseCard` (placeholder "3-1-2-0")
- ✅ Template API PATCH + POST (duplicate) + SELECT : `tempo` inclus
- ✅ SessionLogger : badge tempo — `auto` (bg gris) si calculé, `coach` (bg vert) si configuré
- ✅ Sets API : `tempo_used` dans Zod schema + upsert rows
- ✅ `TempoGuideModal` : guide visuel plein écran — SVG sinusoïdal bézier, balle + trail comète, losanges aux transitions, barres reps animées, haptique — bouton ▶ par set dans SessionLogger

**Invariants :**
- `tempo null` → `getDefaultTempo(movement_pattern, goal)` calculé au render-time, jamais persisté
- Non-bloquant : tempo absent ne bloque jamais une séance

**⚠️ Action manuelle requise :** appliquer `supabase/migrations/20260516_tempo.sql` via Supabase Dashboard.

---

### BodyMap — Consolidation Muscles (COMPLET — 2026-05-16)

- ✅ `LEGACY_TO_CANONICAL` : 40+ slugs catalog ajoutés (fessiers, gluteus_*, gastrocnemius, mollets, spine_erectors, etc.)
- ✅ `tryNormalizeMuscle` : tirets → underscores (ischio-jambiers → ischio_jambiers)
- ✅ Enrichissement catalog côté serveur dans `programme/page.tsx` — `getSecondaryMusclesFromCatalog()` ajouté à `catalog-utils`
- ✅ BodyMap pré-séance : fallback sur `primary_muscle` singulier si `primary_muscles[]` vide
- ✅ Recap : `computeMuscleIntensity` normalise les slugs via `LEGACY_TO_CANONICAL` avant lookup

---

### Recommandation Sets — 3 Corrections (COMPLET — 2026-05-15)

- ✅ `inferWeightIncrement` : câble/poulie 5kg→1kg, machine stack 2.5kg
- ✅ `allSetsRirCompliant` : RIR null ignoré (ne bloque plus la progression si client oublie RIR)
- ✅ `roundToIncrement` : floating point corrigé (`32.199999…` → `32.2` via `toFixed(10)`)

---

### SessionLogger — Refonte recommandation + bugs (COMPLET — 2026-05-15)

- ✅ Suppression ↩ Xkg × N redondant dans colonne PRÉVU
- ✅ `getLastPerfLabel` / `getExLastPerfLabel` : match par `set_number` exact
- ✅ `setRecommendation` : refonte Path B (suppression 1RM live instable, règles directes zone/RIR)
- ✅ Import mort `getTrainingZone` supprimé

---

## 🚀 Dernières Avancées (2026-04-28)

### SessionLogger — 5 Bugs Critiques Corrigés (COMPLET)

1. **`parseSetForApi()`** — Fix `parseFloat("0") → null` : valeurs 0 correctement persistées
2. **Home page** — Fetch séances complétées du jour, masque CTA si déjà faite
3. **muscleDetection.ts** — `CATALOG_SLUG_MAP` étendu aux slugs FR anatomiques
4. **Rest timer** — Délai 3s→8s, modal bloqué pendant saisie active
5. **Superset UX** — Navigation par groupe, repos après dernier exercice du groupe

### MorphoPro — Refonte Complète Phase 1 (COMPLET)
- ✅ Tables `morpho_photos` + `morpho_annotations` + RLS
- ✅ Prompt GPT-4o structuré — score 0-100, flags, asymétries, recommandations
- ✅ Galerie + filtres + Canvas Fabric.js v6 (7 outils)
- ✅ Comparaison multi-photos (layouts 1×2 / 2×2 / 1+3)
- ⚠️ Actions manuelles : 2 migrations SQL + bucket `morpho-photos` Supabase Storage

### Client Onboarding — 5-Screen Tour (COMPLET)
- ✅ Flow complet : exchange → password → 5 écrans welcome → dashboard
- ✅ `OnboardingTour.tsx` : 5 étapes, non-skippable, localStorage gate

---

## 🔑 Points de Vigilance (Actuels)

| Problème | Impact | Mitigation |
|----------|--------|-----------|
| `beta_waitlist` non appliquée | Waitlist non fonctionnelle | Appliquer `20260514_beta_waitlist.sql` via Supabase Dashboard |
| `tempo` migration non appliquée | Tempo non persisté | Appliquer `20260516_tempo.sql` via Supabase Dashboard |
| Supabase Redirect URLs | Onboarding brisé si pas whitelisted | Ajouter `/client/onboarding` manuellement |
| `three@0.170` requis | Build error si downgrade | Ne pas downgrader — `three-mesh-bvh` peer dep |
| Data validation 85 anomalies | Calcul macros | Clamping 15–240 en place |

---

## 📅 Next Steps — Phase 2 (Immédiat)

- [ ] Appliquer migrations manuelles : `20260514_beta_waitlist.sql` + `20260516_tempo.sql`
- [ ] E2E test : invite → onboarding → 5 écrans → dashboard → tooltip tour complet
- [ ] Daily Check-ins Phase 2 : DB schema, coach config UI, client time picker, Inngest cron, Web Push
- [ ] Système de points gamification (check-ins, séances, bilans)
- [ ] Mobile : TopBar buttons responsive, SessionLogger < 480px
- [ ] Monitoring : dropoff rates landing `/stryvr` + onboarding par step
- [ ] Wearables : Apple Health, Oura (Phase 2, ~6 weeks)
- [ ] Export : PDF/CSV/JSON programme (Phase 2, ~4 weeks)
- [ ] IA Coach : bulk protocol generation (Phase 2, ~8 weeks)

---

## 🗂️ Architecture Clés

**Database** : Supabase PostgreSQL + Prisma
- RLS multi-tenant, migrations via Prisma, seeds idempotent
- Table `beta_waitlist` : capture email bêta STRYVR native (unique index `lower(email)`)

**Async Jobs** : Inngest
- `morpho/analyze.requested` (OpenAI Vision, retry x3, timeout 5min)

**Real-time Intelligence** : Program builder
- 6 subscores, morpho stimulus adjustments, client profile integration

**Design System** :
- DS v2.0 (coach web) : `#121212` fond, `#1f8a65` accent vert
- DS v3.0 (STRYVR native + landing) : `#0a0a0a` fond, `#F5D800` accent jaune, Urbanist, uppercase

**Landing STRYVR** : `/stryvr` (Next.js route dans STRYVLAB)
- DA Technogym : grille industrielle, tokens jaune/noir, mockup dark

---

## 📊 Métriques Performance

- API response : < 300ms (P95)
- SessionLogger save : live (debounce 800ms)
- Program intelligence : real-time (debounce 300ms)
- Morpho job : 30s avg, 5min timeout

---

## ⚙️ Configuration Production

| Variable | Statut |
|----------|--------|
| INNGEST_SIGNING_KEY | ✅ Injected (Vercel) |
| INNGEST_EVENT_KEY | ✅ Injected (Vercel) |
| CRON_SECRET | ✅ Configured (sub expiry daily) |
| Supabase RLS | ✅ Enabled |
| PWA Manifest | ✅ Updated (#121212) |
| Service Worker | ✅ v2 (network-first pages) |

---

## 🎯 Règles Non-Négociables

1. **Data Model First** — schéma avant UI
2. **Zero TypeScript Errors** — `npx tsc --noEmit` obligatoire
3. **CHANGELOG After Every Change** — MANDATORY
4. **DS v2.0 Strict (coach web)** — `#121212` bg, `#1f8a65` accent
5. **DS v3.0 Strict (STRYVR native/landing)** — `#0a0a0a` bg, `#F5D800` accent, uppercase Urbanist
6. **RLS + Ownership Checks** — API routes securisées
7. **Inngest Only** — zéro `setImmediate`, tous jobs async via Inngest

---

**Voir `.claude/rules/project-state-archive.md` pour l'historique complet.**
