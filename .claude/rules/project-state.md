# STRYVR — État Vivant du Projet (Condensé)

> **Source de vérité tactique** sur l'état actuel de STRYVR.
> 
> **STRATEGIC REFERENCE** → `docs/STRYVR_STRATEGIC_VISION_2026.md` (vision, pillars, roadmap)
>
> **Historique détaillé** → voir `project-state-archive.md` (toutes les sessions antérieures à 2026-04-27)

**Dernière mise à jour : 2026-05-19 (Client profil — accordion redesign)**

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
| **Client App** | ✅ Smart Trio refonte + Profil accordion (hero compact, 8 sections, données corporelles) | 2026-05-19 |
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

## 🚀 Dernières Avancées (2026-05-19) — Client Profil Accordion Redesign (COMPLET)

**Fichiers créés :**
- `app/api/client/body-data/route.ts` — GET agrège bilans (poids série, composition, mensurations)
- `components/client/profile/AccordionSection.tsx` — section collapsible Framer Motion (header cliquable + AnimatePresence)
- `components/client/profile/BodyDataSection.tsx` — poids sparkline SVG + composition + mensurations
- `components/client/profile/ProfilAccordion.tsx` — orchestrateur 8 sections, une seule ouverte à la fois

**Fichiers modifiés :**
- `app/client/profil/page.tsx` — refactorisé en Server Component pur (−254 lignes), délègue à ProfilAccordion
- `components/client/profile/ProfilePhotoUpload.tsx` — prop `compact` ajoutée (avatar 56px pour hero)
- `components/client/profile/NotificationsPanel.tsx` — liste capped `max-h-64 overflow-y-auto`
- `lib/i18n/clientTranslations.ts` — 18 nouvelles clés (`profil.body.*`, `profil.section.*`)

**Architecture :**
- Hero compact : avatar 56px + nom + email + badge statut + streak pill jaune
- 8 sections accordion DS v3.0 : `bg-[#161616] rounded-2xl`, chevron animé, badge notifs jaune
- BodyDataSection : fetch `/api/client/body-data` au mount, sparkline SVG bézier, grid comp, rows mesures
- Données corporelles depuis `assessment_submissions + assessment_responses` (field_keys: weight_kg, body_fat_pct, lean_mass_kg, waist_cm, hips_cm, arm_cm, chest_cm)
- Photos morpho : non affichées côté client (RLS morpho_photos = coach uniquement)

**Points de vigilance :**
- `ProfilePhotoUpload` avec `compact=true` : bouton caméra 20px, avatar 56px, pas de liens "Changer/Supprimer" (hero only)
- `ProfilAccordion` est `'use client'` — tous les imports doivent être compatibles client
- `body-data` route : retourne `{ weightSeries: [], composition: null, measures: null, latestWeight: null }` si aucun bilan complété
- Section Ma Progression visible uniquement si `streakData` non null

---

## 🚀 Dernières Avancées (2026-05-18) — Elite Client App Sprint

### Elite Client App — MacroFactor Competitive Sprint (COMPLET)

**Analyse concurrentielle :** MacroFactor (nutrition/workout), WHOOP (recovery), Cronometer (micronutriments), Hoot (AI logging), Atomic Habits (UX)

**Commits :** 12 commits atomiques, 0 nouvelles erreurs TypeScript, 346/353 tests passent (7 failures pré-existantes tempo.test.ts hors scope)

**Sprint 1 — SessionLogger PR + Coaching Cues**
- ✅ `prSets: Set<string>` — PR detection temps réel à chaque set complété (Epley + historique)
- ✅ Flash notification "⚡ Nouveau record — Xkg × N reps" (3s auto-dismiss)
- ✅ Badge PR jaune inline sur set row
- ✅ `getCoachingCue()` — messages contextuels par RIR (0=échec, ≤2=OK, ≥5=trop facile)
- Fichier : `app/client/programme/session/[sessionId]/SessionLogger.tsx`

**Sprint 2 — Nutrition Favorites**
- ✅ Table `client_meal_favorites` (JSONB entries, macros, use_count, last_used_at)
- ✅ Migration `20260518_meal_favorites.sql` (⚠️ à appliquer manuellement)
- ✅ API : GET/POST favorites + DELETE + POST /use (quick-log → crée nutrition_meals)
- ✅ "Repas récents" section au top du Layer 1 composer (4 favoris, 1 tap)
- ✅ "⭐ Sauvegarder" button dans footer quand drafts > 0
- Fichiers : `app/api/client/nutrition/favorites/`, `app/client/nutrition/log/NutritionLogContent.tsx`

**Sprint 3 — Exercise Progression Chart**
- ✅ `ExerciseProgressionChart.tsx` — SVG pur, bezier, sélecteur exercice pills
- ✅ Intégré dans Performances tab après PRs
- ✅ Stats : max 1RM, delta progression, session count
- Fichier : `components/client/smart/ExerciseProgressionChart.tsx`

**Sprint 4 — Recovery Correlation Alerts**
- ✅ `lib/client/smart/recoveryAlerts.ts` — pure lib, 10 tests Vitest
- ✅ Alertes : sleep_debt (critical), poor_sleep/high_stress/low_energy (warning), optimal (info)
- ✅ `RecoveryStatusWidget.tsx` — carte avec left-border colorée, dismissible localStorage
- ✅ Intégré home page entre NotificationsBar et grid dashboard
- Fichiers : `lib/client/smart/recoveryAlerts.ts`, `components/client/smart/RecoveryStatusWidget.tsx`

**Sprint 5 — 1RM Auto-Estimation + Deload Detection**
- ✅ `lib/training/oneRepMax.ts` — Epley + Brzycki hybride, RIR adjustment, trends 2w vs 4-6w
- ✅ `lib/training/deloadDetection.ts` — 4 signaux (RIR inflation, completion drop, 1RM decline, volume stagnation)
- ✅ 21 tests Vitest passants
- ✅ `OneRMWidget.tsx` — top 5 exercices, delta pills vert/rouge
- ✅ `DeloadAlertBanner.tsx` — alerte déload en tête onglet Séance
- ✅ APIs : `/api/client/one-rm-trends`, `/api/client/deload-status`
- Fichiers : `lib/training/`, `components/client/smart/`, `app/api/client/`

**FAB Redesign (session même jour)**
- ✅ Arc 120°, boutons cercles jaunes, spring premium (stiffness 420/damping 26)
- ✅ `MealLogSheet` bottom sheet height fixe 88vh
- ✅ Logo FAB 2× plus grand (80px), remonte au tap (-8px spring)
- ✅ Anchor w-0 h-0 pour centrage parfait des boutons radial
- ✅ Check-in → morning/evening selon heure (plus d'onboarding en boucle)

**Bugs critiques résolus**
- ✅ Eau 0ml : sync `client_water_logs` depuis API hydratation
- ✅ `router.refresh()` après log eau → widget home mis à jour
- ✅ Home dashboard grid 2 colonnes (nutrition | workout) visible sans scroll

**⚠️ Actions manuelles requises**
1. Appliquer migrations dans Supabase Dashboard SQL Editor (ordre) :
   - `20260516_food_composer.sql`
   - `20260516_nutrition_meal_editing.sql`
   - `20260517_client_activity_logs.sql`
   - `20260517_coach_client_notifications.sql`
   - `20260518_nutrition_meals_drinks.sql`
   - `20260518_portion_scaling_and_plantains.sql`
   - `20260518_meal_favorites.sql` ← nouveau
2. Lancer seed : `npx tsx scripts/seed-food-items.ts`

---

## 🚀 Dernières Avancées (2026-05-18)

### Smart Trio — Refonte App Client (COMPLET)

**Spec :** `docs/superpowers/specs/2026-05-17-smart-trio-client-app-redesign.md`
**Plan :** `docs/superpowers/plans/2026-05-17-smart-trio-client-app-redesign.md`

**Fichiers principaux :**
- `app/client/page.tsx` — Smart Agenda (4 sections)
- `app/client/nutrition/page.tsx` — Smart Nutrition (5 sections + alertes IA)
- `app/client/programme/ProgrammeClientPage.tsx` — Smart Workout (alertes + volume + récent)
- `components/client/BottomNav.tsx` — 5 slots + logo STRYVR central
- `components/client/smart/` — 16 nouveaux composants
- `lib/client/smart/` — 4 libs pures (nutritionAlerts, workoutAlerts, waterAggregation, timelineBuilder)
- `supabase/migrations/20260517_coach_client_notifications.sql` + `20260517_client_activity_logs.sql`

**Changements :**
- ✅ Accueil = Smart Agenda : notifs → nutrition widget (demi-cercle MacroFactor) → workout widget → timeline
- ✅ /client/nutrition = Smart Nutrition : héro demi-cercle + 4 alertes IA + protocole coach + restant + trend 7j
- ✅ /client/programme = Smart Workout : alertes RIR/stagnation + volume coverage MEV/MAV/MRV + dernières séances
- ✅ BottomNav : logo STRYVR central → RadialActionMenu arc (repas/eau/activité/check-in)
- ✅ FreeActivitySheet : logger activité libre → `client_activity_logs`
- ✅ Routes supprimées : /client/agenda + /client/progress → redirect 301 → /client
- ✅ 11 API routes nouvelles fonctionnelles
- ✅ 19 tests Vitest PASS (libs pures)
- ✅ i18n FR/EN/ES : 48 nouvelles clés `smart.*`

**⚠️ Actions manuelles requises :**
1. Appliquer `20260517_coach_client_notifications.sql` via Supabase Dashboard SQL Editor
2. Appliquer `20260517_client_activity_logs.sql` via Supabase Dashboard SQL Editor

**Invariants respectés :**
- DS v3.0 strict : `#0d0d0d` bg, `#161616` surfaces, `#ffe01e` accent, radius hiérarchie
- Libs pures testées Vitest — aucune logique métier dans les composants React
- API routes : auth → client_id → query pattern cohérent

---

## 🚀 Dernières Avancées (2026-05-17)

### Tempo Guide Modal v2 + Hydratation (COMPLET — session 2)

**Fichiers modifiés :**
- `components/client/TempoGuideModal.tsx` — refonte complète
- `app/client/programme/session/[sessionId]/SessionLogger.tsx` — sync IA, bonus reps, hydratation
- `app/client/programme/session/[sessionId]/page.tsx` — fetch clientWeight

**Changements :**
- ✅ Circuit triangle fermé : balle trace C→A→B→C en continu, zéro snap entre phases
- ✅ Codes couleurs par phase : CONTRACTER #22c55e / FREINER #f97316 / TENIR #ef4444 / PAUSE #ef4444 — labels `font-barlow-condensed bold uppercase`
- ✅ Anticipation isométrique multi-canal : décélération balle + clignotement label orange→rouge + haptic 10ms à 0.8s avant ISO
- ✅ Reps bonus mode relais : tempo continu au-delà des reps planifiées, barres bonus `rgba(255,255,255,0.3)`, `onClose` enrichi `{ plannedReps, bonusReps, totalReps }`
- ✅ Layout landscape responsive : triangle gauche, contrôles droite, hook `useIsLandscape` (resize listener)
- ✅ Sync IA↔tempo : `rec?.reps ?? resolveReps(ex)` au tap ▶ (sets solo + superset)
- ✅ Feed bonusReps → `actual_reps` du set si `bonusReps > 0`
- ✅ Rappel hydratation : calcul EFSA `poids × 35ml + durée × 8ml`, timer 15min, bottom sheet DS v3.0 "J'ai bu" / "Ignorer"

**Invariants respectés :**
- `lib/training/tempo.ts` inchangé
- `TempoCloseResult` exporté — SessionLogger consomme le type
- Erreurs TS pré-existantes (stripe, dashboard, BodyFatCalculator) hors périmètre — nos 3 fichiers = 0 erreurs

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
