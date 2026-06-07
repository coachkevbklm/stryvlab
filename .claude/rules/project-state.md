# STRYVR — Project State

> État courant du produit. Mettre à jour à chaque feature majeure.

## Modules

| Module | Statut | Dernière MAJ |
|--------|--------|--------------|
| **Nutrition PWA — Macro Header Alignment (Fix)** | ✅ Section en-tête page composition alignée aux jauges Planning ; balanceContext reçoit maintenant effectiveConsumed complet (consumed + preps + drafts) | 2026-06-05 |
| **Nutrition PWA — Planning Tab Gauges (UX)** | ✅ Affichage "Restant" à la place de "Consommé/Objectif" ; dépassement seuil (4 kcal / 1g) en rouge avec "+" | 2026-06-05 |
| **VoiceLogSheet — Quantity = 0 Auto-Delete (Fix)** | ✅ Réduction quantité à 0g → suppression automatique de l'aliment ; condition v >= 0 + logique removeItem | 2026-06-05 |
| **ExercisePicker — Catalogue Avant-bras (Feature)** | ✅ 4 exercices manquants ajoutés (flexion poignet câble, pronation-supination, farmer walk, curl marteau debout) + 4 poignet reclassifiés ; total 13 exercices avant-bras visibles au filtre (alignement schéma-avant-bras.csv) | 2026-06-05 |
| **TDEE Adaptatif Intelligent** | ✅ Sources poids multi-niveaux, fenêtre adaptative, ancrage protocole, toggle actif/auto, Inngest nightly notify-only | 2026-06-04 |
| **PWA Nutrition — Onglet Tendances** | ✅ TdeeVsIntakeChart + KcalVariationChart + TdeeChart, filtre 7j/14j/30j/90j, scrubbing tactile | 2026-06-04 |
| **Nutrition — Unification Parcours Log** | ✅ Smart supprimé, toggle Bilan/Planning, PrepCard inline, MealLogSheet mode guide, QuickLog unifié | 2026-06-04 |
| **Smart Nutrition — Finitions** | ✅ Titre prépa, rename PATCH DB, comparaison tous-preps, rate limit notifs, chat IA aware | 2026-06-03 |
| **Smart Nutrition — Polish Sprint** | ✅ Toasts, rename scénario, sessionStorage, slot reminder, notif coach, tz-safe date | 2026-06-03 |
| **Smart Nutrition — Feature Sprint** | ✅ Slot selector, Valider guard, Scenario comparison, Coach view, i18n | 2026-06-03 |
| **Smart Nutrition — Bug Sprint** | ✅ 22 bugs corrigés (B1–B15 + A1–A4 + Q1–Q2) | 2026-06-03 |

## Dernières avancées — 2026-06-05 Macro Header Alignment + Planning Gauges UX + VoiceLogSheet Quantity Fix

### Composition Page — Macro Header Alignment (Fix)

**Les en-têtes nutritionnels de la page de composition sont maintenant parfaitement alignés aux jauges Planning tab.**

**Problème identifié :** Incohérence de calcul entre les deux sections :
- Jauges Planning tab : 2064 kcal (meals + TOUS les preps planifiés)
- Section macros composition : 1924 kcal (meals + preps actifs du scénario courant)
- Écart : 140 kcal provenant de preps non-actifs

**Root cause :** ComposeClientPage calculait `effectiveConsumed` en utilisant seulement les preps ACTIFS du scénario courant (via `simulation` filtré par `activeScenarioKey`). Mais elle devrait inclure TOUS les preps planifiés du jour (comme le Planning tab).

**Fix appliqué :**
- Créé deux états de simulation distincts :
  - `fullDaySimulationBase` = meals + TOUS les preps du jour (sans drafts) — passé à NutritionLogContent
  - `fullDaySimulationWithDrafts` = meals + TOUS les preps du jour + drafts en temps réel — passé à SmartNutritionHero
- `effectiveConsumed` = `fullDaySimulationWithDrafts.simulatedConsumed` (meals + ALL preps + drafts)
- `effectiveConsumedBase` = `fullDaySimulationBase.simulatedConsumed` (meals + ALL preps, no drafts)
- NutritionLogContent reçoit `effectiveConsumedBase` et ajoute les drafts elle-même (pas de double-count)

**Fichiers modifiés :**
- `app/client/nutrition/compose/ComposeClientPage.tsx` — Séparation calcul fullDaySimulation + passage correcte de balanceContext

**Comportement nouveau :**
- Composition page gauges = meals + TOUS les preps planifiés + drafts en temps réel = IDENTIQUE Planning tab
- Système de compensation (actionableRemaining) appliqué sur tous les calculs
- Utilisateur voit en temps réel l'impact de ce qu'il ajoute sur les macros réelles du jour

### SmartNutritionHero — Compensation system appliquée (Fix)

**SmartNutritionHero affiche maintenant les calories avec le système de compensation (actionableRemaining) au lieu des raw values en mode simulation.**

**Changement :**
- Ligne 220-226 : `remaining = simulationMode ? actionableRemaining.calories : rawRemaining`
- Avant : affichait toujours `balance.remainingCaloriesNet` (raw)
- Après : utilise `actionableRemaining.calories` (compensation appliquée) en mode simulation

**Fichiers modifiés :**
- `components/client/smart/SmartNutritionHero.tsx` — Conditional rendering pour utiliser compensation en simulation

**Impact :** Jauges reflètent maintenant le vrai "reste à consommer" après compensation des macros, aligné avec la base de vérité (page nutrition suivi).

---

### Planning Tab — Gauges Redesigned (SmartNutritionHero)

**Affichage "Restant" à la place de "Consommé/Objectif" avec feedback overflow coloré.**

**Fichiers modifiés :**
- `components/client/smart/SmartNutritionHero.tsx` — Calories section + Macros section

**Changements UI :**
- **Centre (calories)** : Affiche `remaining` (target - consumed) au lieu de consumed
  - Normal : affiche en `kcalStroke` color
  - Overflow : si `remaining < 0 && abs(remaining) >= 4` → affiche `+X` en `#ef4444` (red), label "Dépassé"
- **Macros (P/G/L)** : Affiche `remainingValue` (restant pour atteindre cible) au lieu de "consumed/target"
  - Normal : affiche en `fillColor` (couleur macro ou simulation)
  - Overflow : si `overflowValue >= 1` → affiche `+Xg` en `#ef4444` (red)

**Logique de seuil :**
- Calories : 4 kcal threshold
- Macros (P/G/L) : 1 g threshold

**Impact** : Feedback immédiat sur capacité restante vs surcharge calorique. Clients voient visuellement si planification peut absorber plus de nourriture.

---

### VoiceLogSheet — Quantity = 0 Auto-Delete (Fix)

**Permettre réduction quantité à 0g pour effacer aliment sans "zéro bloqué".**

**Fichiers modifiés :**
- `components/client/smart/VoiceLogSheet.tsx` — ligne 766, condition onBlur

**Changement :**
```typescript
// Avant: if (isFinite(v) && v > 0) { ... }
// Après:
if (isFinite(v) && v >= 0) {
  if (v === 0) removeItem(idx)
  else updateItem(idx, v)
}
```

**Impact** : Users can now fully delete foods by quantifying down without hitting a "0 is blocked" wall.

---

### ExercisePicker — Catalogue Avant-bras Complet (Feature)

**4 exercices manquants ajoutés + alignement complet avec schéma-avant-bras.csv**

**Problème identifié :** Après reclassification des 4 poignets, le catalogue avant-bras avait seulement 9 exercices vs 8 dans le fichier de référence `schéma-avant-bras.csv`.

**Exercices manquants identifiés :**
1. **Flexion poignet cable assis** (FOR-001) — primary_muscle: wrist_flexors
2. **Pronation supination haltère sur banc** (FOR-002) — primary_muscle: pronators_supinators (unilateral: true)
3. **Farmer walk haltères** (FOR-003) — primary_muscle: grip_flexors (pattern: loaded_carry)
4. **Curl marteau debout** (FOR-006) — primary_muscle: brachialis (variante debout vs pupitre assis)

**Fichier modifié :**
- `data/exercise-catalog.json` — 4 entrées d'exercices ajoutées (avant-bras__flexion-poignet-cable-assis, avant-bras__pronation-supination-haltere-sur-banc, avant-bras__farmer-walk-halteres, avant-bras__curl-marteau-debout)

**Comportements :**
- Tous les 8 exercices du CSV référence maintenant présents dans le catalogue JSON
- 13 exercices avant-bras visibles au filtre (5 originaux + 4 reclassifiés poignets + 4 nouveaux)
- Chaque exercice mappé avec :
  - `primaryMuscle` canonique depuis le CSV
  - `movementPattern` standard (wrist_flexion, forearm_rotation, loaded_carry, elbow_flexion)
  - `pattern` adapté (pull, carry)
  - `stimulus_coefficient` et biomech fields (plane, mechanic, unilateral)
  - Images GIF depuis `/public/bibliotheque_exercices/avant-bras/`

**Points de vigilance :**
- Pronation supination haltère est `unilateral: true` (travail unilatéral par bras) contrairement aux autres
- Farmer walk est un `loaded_carry` compound (pattern différent), ne doit pas être filtré comme isolation
- Curl marteau debout utilise la même gifUrl que pupitre (flexion du même mouvement en variant la posture) — OK pour démo

---

## Dernières avancées — 2026-06-04 PWA Nutrition Tendances + TDEE Adaptatif

### PWA Nutrition — Onglet Tendances

**3 nouveaux charts et scrubbing tactile.**

**Fichiers créés :**
- `app/api/client/nutrition/tdee-history/route.ts` — GET historique TDEE client-side (RLS client), param `?days=`
- `components/client/smart/TdeeVsIntakeChart.tsx` — toggle TDEE vs Apport réel (ligne fixe TDEE adaptatif) / Cible vs Consommé ; zone déficit/surplus
- `components/client/smart/KcalVariationChart.tsx` — variation kcal J vs J-1 (barres vert/rouge)
- `components/client/smart/TdeeChart.tsx` — historique TDEE adaptatif (refactorisé, reçoit `days` en prop)
- `hooks/useChartScrubber.ts` — hook partagé scrubbing tactile (touchmove + mousemove → tooltip date + valeurs)

**Fichiers modifiés :**
- `app/api/client/nutrition/weekly-trend/route.ts` — accepte param `?days=` (7 à 90) au lieu du hardcode 7 jours
- Onglet Tendances PWA — filtre période global 7j/14j/30j/90j (même style pill que onglet Séance)
- Suppression section "Idées simples maintenant" (RemainingBreakdown) + prop `onCompose` + import `suggestFoodsFromBalance`

**Comportements nouveaux :**
- TDEE référence dans les charts = `nutrition_protocols.tdee_adaptive` (Studio) — plus le fallback `target` protocole
- Jours partiels (<800 kcal loggés) exclus des charts variation et TDEE vs apport
- Jour J exclu des graphiques, KPIs et insights dans NutritionHub (journée partielle fausse les moyennes) — visible uniquement dans "Journées observées" + badge "Aujourd'hui" + bordure verte
- "Journées observées" triées du plus récent au plus ancien

---

### TDEE Adaptatif Intelligent

**Sources poids multi-niveaux, fenêtre adaptative, ancrage protocole, Inngest notify-only.**

**Fichiers créés :**
- `lib/nutrition/weightSamples.ts` — `resolveProtocolStartDate()` (ancrage sur `metric_annotations`) + `fetchWeightSamples()` (check-ins quotidiens > bilans > manual) + `collectAvgIntake(anchorDate?)`

**Fichiers modifiés :**
- `app/api/clients/[clientId]/nutrition-protocols/[protocolId]/apply-adaptive-tdee/route.ts` — POST calcul (prévisualisation) / PUT application ; rescaling basé sur `tdee_reference` (TDEE coach réel) pas `day1Cal` ; bloqué si < 7 jours depuis début protocole
- `lib/inngest/functions/adaptive-tdee.ts` — ne rescale plus jamais automatiquement ; enregistre snapshot + notifie le coach pour confirmation manuelle
- `components/nutrition/studio/useNutritionStudio.ts` — fix persistance toggles `tdee_auto_enabled`/`tdee_adaptive_active` (sync dans `useEffect` existingProtocol) ; recalcul auto au chargement si `tdee_auto_enabled` actif
- `components/nutrition/studio/CalculationEngine.tsx` — bouton "Calculer TDEE adaptatif" toujours visible (plus de cercle vicieux quand `null`) ; label "Calculer" → "Recalculer" après premier calcul ; toggle "TDEE adaptatif actif" avec affichage sources (apport moy, Δ poids, pesées) ; toggle recalcul automatique nightly ; séparation calcul / application avec prévisualisation avant/après + bouton Confirmer

**Schéma — colonnes ajoutées :**
- `nutrition_protocols.tdee_reference` (integer) — TDEE coach au moment de la création
- `nutrition_protocols.tdee_adaptive_active` (boolean) — utiliser TDEE adaptatif comme source de vérité dans tous les calculs
- `nutrition_protocols.tdee_auto_enabled` (boolean) — recalcul nightly Inngest
- `nutrition_protocols.deficit_surplus_pct` (numeric) — pourcentage déficit/surplus explicite
- `nutrition_tdee_history.confidence` + `.confidence_score` + `.confidence_reasons` — score et détail confiance

**Comportements :**
- Fenêtre adaptative : 14j → 21j → 30j selon disponibilité données (min 7j sinon bloqué)
- Ancrage sur date de partage protocole (`metric_annotations`) — évite de mélanger données pré/post-régime
- `tdee_adaptive_active` = true → remplace le TDEE estimé comme source de vérité dans macros, déficit, protocole ; recalcul automatique dès activation
- Inngest nightly = snapshot + notification coach (jamais de rescaling auto)
- Recherche aliments : filtre ilike par token côté DB (`name_fr ilike '%riz%' AND name_fr ilike '%basmati%'`) — plus de chargement 5000 items en mémoire

---

### Nutrition — Unification Parcours Log (2026-06-04)

**Smart supprimé comme onglet séparé, tout le log passe par MealLogSheet unifié.**

**Comportements :**
- Onglet Smart remplacé par toggle Bilan/Planning intégré dans `NutritionMealsList`
- Vue Planning = `PrepCard` miroir de `MealCard` : expand/collapse, entries inline éditables, "Ajouter des aliments" via MealLogSheet, "Valider — logger ce repas" avec animation fade
- `MealLogSheet` mode guide : slot selector + toggle "Pour demain" + boutons Sauver/Valider inline (sans redirect vers `/compose`)
- `QuickLogSheet` : bouton "Repas" ouvre directement MealLogSheet standard (MealMethodSheet retiré du flux FAB)
- `NutritionLogContent` : bouton "Terminer le repas" → 2 boutons universels "Planifier" (→ prep Planning) + "Logger" (→ Bilan), présents sur toutes les routes de log
- `VoiceEntryFab` : bouton violet Smart Nutrition supprimé ; FAB réduit à 2 boutons (+ Repas + Mic)
- Jauges live arc kcal + 3 barres macro P/G/L dans MealLogSheet (surface plein écran 100vh) mis à jour en temps réel via `onDraftsChange`

**Points de vigilance :**
- `tdee_reference` doit être renseigné à la création du protocole (sinon rescaling impossible) — à câbler dans le flow de création protocole
- Ancrage `metric_annotations` : si aucune annotation de type `protocol_shared` pour le client, `resolveProtocolStartDate()` tombe sur la date de création du protocole (fallback sûr)
- Inngest `adaptive-tdee` nightly : vérifie que la function est enregistrée dans `app/api/inngest/route.ts` + visible sur le dashboard après deploy
- Recherche aliments : le tri pertinence reste côté JS sur les résultats DB (résultats limités à 200 lignes max — acceptable)
- `NutritionHub` exclut le jour J des KPIs → ne pas utiliser ce widget pour afficher les données du jour en cours (utiliser `NutritionMealsList` à la place)

## Dernières avancées — 2026-06-03 Smart Nutrition Feature Sprint

**5 features livrées pour rendre le flux opérationnel.**

**Fichiers créés :**
- `app/api/clients/[clientId]/nutrition-preps/route.ts` — GET prépas J0→J+3 pour la vue coach
- `components/coach/ClientNutritionPrepsWidget.tsx` — widget coach: prépas planifiées + validées groupées par date

**Fichiers modifiés :**
- `app/client/nutrition/compose/ComposeClientPage.tsx` — slot picker, Valider guard, i18n, comparison card
- `app/client/nutrition/log/NutritionLogContent.tsx` — prop prepMealSlot + inclus dans savePrep body
- `components/client/smart/SmartNutritionPrepList.tsx` — i18n complet + slotLabels dynamiques
- `components/clients/NutritionHub.tsx` — import + render ClientNutritionPrepsWidget
- `lib/i18n/clientTranslations.ts` — 50+ clés compose.* + prep.*

**Comportements nouveaux :**
- Slot picker (P.Déj/Déjeuner/Dîner/Collation) avant de sauver — résout le bug d'inférence par heure courante
- "Valider" (jaune) masqué pour J+1/J+2/J+3 — grille 2 cols (Annuler/Sauver) pour jours futurs
- Quand ≥2 scénarios : tableau comparatif kcal+P+G+L dans le prep panel, clic pour switcher
- Coach voit les prépas planifiées J0→J+3 dans `NutritionHub` (planned/logged, expandable)
- i18n FR/EN/ES complet sur toute la surface compose
| **PWA Spanish Translation (Deep)** | ✅ Done | 2026-06-02 |
| **Chat/Check-in Coherence** | 🚧 Foundation + Bot quality (greeting live, ton, tips) — reste: closing composer, coach config, bug matin | 2026-06-01 |
| **Phase Optimization Engine** | ✅ v2 — trail 30j, override coach, prefs DB | 2026-05-30 |
| Transformation Score | ✅ Composite 4 dimensions, sans phase recommendation | 2026-05-29 |
| Stryvr Chat Release 1 | 🚧 Blocs A–E en cours | 2026-05-29 |

## Dernières avancées — 2026-06-03 Smart Nutrition Bug Sprint

**22 bugs corrigés — le contrat de simulation est maintenant réel.**

**Fichiers modifiés :**
- `app/client/nutrition/compose/ComposeClientPage.tsx` — B2/B8/B12/B13/B15 + pass prepDate
- `app/client/nutrition/compose/page.tsx` — import shiftIsoDate partagé
- `app/client/nutrition/log/NutritionLogContent.tsx` — B1/B2/B4/B5/B7/B10/B11/B14/A4
- `app/api/client/nutrition/preps/route.ts` — import preps-service
- `app/api/client/nutrition/preps/[id]/route.ts` — import preps-service
- `app/api/client/nutrition/preps/[id]/log/route.ts` — B3 idempotency + erreurs side-effects
- `components/client/smart/SmartNutritionHero.tsx` — B9 overflow rouge en simulation
- `components/client/smart/SmartNutritionPrepList.tsx` — B6 scenario_key optimistic update
- `lib/nutrition/compose-advisor.ts` — A1 fat threshold 40g + A2 clampGrams foodProfile.min
- `lib/nutrition/actionable-remaining.ts` — A3 fat floor cappé à 85% du target
- `lib/nutrition/preps-service.ts` — NOUVEAU, service partagé (Q1)
- `lib/utils/date.ts` — NOUVEAU, shiftIsoDate partagé (Q2)

**Bugs critiques résolus :**
- B1 : prépas J+1/J+2/J+3 sauvegardées à la bonne date (planned_for transmis depuis ComposeClientPage)
- B2 : handleSavePrep/handleSaveMeal vérifient le succès avant de clear/naviguer
- B3 : route /log idempotente — guard consumed_meal_id évite les doublons sur retry
- B4 : quickLogFavorite en mode simulation → ajoute aux drafts, ne log plus pour de vrai

**Points de vigilance :**
- `handleSaveMeal` log les preps actifs via Promise.allSettled — erreurs loggées mais non bloquantes
- La navigation de date est bloquée si des drafts existent (flèches disabled + hint "Sauve d'abord")
- `inferCategoryFromMacros` est une heuristique (P/G/L dominant) — pas parfait mais bien meilleur qu'`"extras"` systématique
- Les meals loggés via "Valider" utilisent toujours la date physiologique du jour courant (bug de date côté meals non adressé — next step)

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
