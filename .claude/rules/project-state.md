# STRYVR — État Vivant du Projet

> Source de vérité sur l'état actuel de STRYVR.
> À lire au début de chaque session. À mettre à jour après chaque feature significative.
> Dernière mise à jour : 2026-04-19 (Phase 2 Biomechanics Engine — Implémentation Complète)

---

## 🚀 VISION : Programme Generation Studio-Lab System

**Goal:** Transform programme builder into an optimal, transparent, morphology-aware tool with rule-based scoring and performance feedback.

**Architecture:**
```
MorphoPro Bridge (Phase 0) [OpenAI Vision → morpho data + stimulus adjustments]
         ↓
Phase 1 UI [Dual-pane studio-lab builder, real-time intelligence, Lab Mode]
         ↓
Phase 2 Biomechanics [Rule-based scoring engine, profile integration, alerts]
         ↓
Phase 3 Feedback Loops [Auto-adjust from client performance, morpho progression tracking]
         ↓
Phase 4 Export/Webhooks [PDF/CSV/JSON export, n8n integration, analytics]
```

**Timeline:** ~9–10 weeks (Phase 0: 1.5–2w, Phase 1: 2–3w, Phase 2: 2–2.5w, Phase 3: 2w, Phase 4: 1.5w)

**Status:** ✅ Phase 0 entièrement implémentée. ✅ Phase 1 UI Studio-Lab entièrement implémentée. ✅ Phase 2 Biomechanics Engine entièrement implémentée. Prête pour Phase 3 (Feedback Loops).

**Master Plan:** `docs/superpowers/plans/2026-04-18-programme-generation-studio-lab-master-plan.md`

**Phase 0 Spec:** `docs/superpowers/specs/2026-04-18-morphopro-bridge-design.md`

**Phase 1 Plan:** `docs/superpowers/plans/2026-04-19-studio-lab-ui-redesign.md`

---

## 2026-04-19 — Shell Refactor Phase 1 Task 1: DockContext

**Ce qui a été fait :**

1. **`components/layout/DockContext.tsx`** — nouveau context React pour la gestion des clients ouverts
   - Type `OpenClient { id, firstName, lastName }`
   - État centralisé : `openClients[]`, `activeClientId`
   - Méthodes : `openClient(client)`, `closeClient(clientId)`, `setActiveClient(clientId)`
   - Provider wrappant la navigation, hook public `useDock()`
   - Logique déduplication : `openClient` ne crée pas de doublon si le client est déjà ouvert
   - Pas d'affichage UI pour la dock elle-même — structure de base pour Task 2-3

**Points de vigilance :**
- `activeClientId` devient `null` quand on ferme le client actif — aucun fallback automatique au premier client
- Le contexte expose `useCallback` stables — OK pour la réactivité perf
- Initialisation provider sans clients ouverts — comportement vide intentionnel (dock vide au démarrage)

**Next Steps — Task 2-3 (Shell UI) :**
- [ ] `components/shell/LeftDock.tsx` — dock vertical permanent gauche (sections: clients, recents, search, settings)
- [ ] `components/shell/BottomDock.tsx` — dock horizontal contextuel bas (tabs: client actif, alternative actions)
- [ ] `app/coach/layout.tsx` — wrapping DockProvider, layouts shell 2-dock

---

## 2026-04-19 — Session & Exercise Reordering

**Ce qui a été fait :**

1. **`supabase/migrations/20260419_template_session_mode.sql`** — colonne `session_mode` sur `coach_program_templates`
   - Type `text CHECK ('day', 'cycle')`, default `'day'`
   - Templates existants non affectés (migration `IF NOT EXISTS`)

2. **`components/programs/ProgramTemplateBuilder.tsx`** — logique de réorganisation centrale
   - `TemplateMeta.session_mode: 'day' | 'cycle'` — persisté dans le payload de save
   - `orderedSessions` (useMemo) : tri automatique lun→dim en mode Jour, ordre libre en mode Cycle
   - `rawSessionIndex(orderedSi)` : traduit l'index d'affichage vers l'index brut pour toutes les mutations
   - `moveSession(fromSi, toSi)` : no-op si `session_mode !== 'cycle'`
   - `moveExercise(fromSi, fromEi, toSi, toEi)` : intra + inter-séance, scroll + highlight post-move
   - `DndContext` (PointerSensor, distance=5) wrapping tout le layout
   - `handleDragEnd` : 3 cas — ex-over-ex, ex-over-session-container, nav-session-over-nav-session

3. **`components/programs/studio/EditorPane.tsx`** — UI d'édition
   - Toggle `Jours | Cycle` dans la meta row
   - Mode Jour : pills jours de semaine visibles, flèches séances masquées
   - Mode Cycle : badge `S{si+1}`, flèches ↑↓ sur chaque séance, pills jours masquées
   - Exercices : `DroppableSession` + `SortableContext` par séance, `dragId` passé à `ExerciseCard`

4. **`components/programs/studio/ExerciseCard.tsx`** — carte exercice
   - `useSortable({ id: dragId })` — drag handle `GripVertical` (toujours visible)
   - Flèches ↑↓ (`onMoveUp`, `onMoveDown`) — désactivées aux bornes absolues (premier/dernier exercice global)
   - Inter-séance : flèche ↑ en haut d'une séance → fin de la séance précédente ; flèche ↓ en bas → début de la séance suivante

5. **`components/programs/studio/NavigatorPane.tsx`** — colonne de navigation
   - `SortableSessionRow` : `useSortable` par séance, drag handle + flèches ↑↓ en mode Cycle
   - `SortableContext` wrapping toutes les séances
   - Synchronisation bidirectionnelle avec EditorPane via state central

**Points de vigilance :**
- `orderedSessions` est en lecture seule pour le rendu — toutes les mutations passent par `rawSessionIndex()` pour retrouver l'index brut dans `sessions`
- `moveSession` contient un guard `if (meta.session_mode !== 'cycle') return` — jamais appelé en mode Jour même si les props sont câblés
- `PointerSensor` avec `activationConstraint: { distance: 5 }` empêche les drags accidentels sur les inputs/boutons dans ExerciseCard
- Le scroll post-move utilise `setTimeout(..., 50)` pour laisser le state React se propager avant de lire les refs DOM
- En mode Jour, changer le `day_of_week` d'une séance la repositionne automatiquement dans `orderedSessions` — pas besoin de drag dans ce mode

**Next Steps — Phase 3 Performance Feedback Loops :**
- [ ] RIR + completion rate tracking depuis `client_set_logs`
- [ ] Auto-recommandations volume ±1 set, intensité ±5%
- [ ] SRA Heatmap semaines réelles (Phase 3)

---

## 2026-04-19 — Phase 2 Biomechanics Engine — Implémentation Complète

**Ce qui a été fait :**

1. **`lib/programs/intelligence/scoring.ts`** — `scoreRedundancy` avec morpho asymmetry bypass
   - Signature étendue : `scoreRedundancy(sessions, morphoStimulusAdjustments?)`
   - `isUnilateral(ex)` helper : détecte pattern `unilateral_*` OU regex `/unilatéral|unilateral|single|1 bras|1 jambe/i`
   - Si morpho a un boost `unilateral_{direction}` > 1.0 et exactement un des deux exercices est unilatéral → pas de redondance (travail asymétrique ciblé)
   - `buildIntelligenceResult` propage `morphoStimulusAdjustments` à `scoreRedundancy`

2. **`lib/programs/intelligence/types.ts`** — nouveau type `SRAHeatmapWeek`
   - `SRAHeatmapWeek { week: number; muscles: { name: string; fatigue: number }[] }`
   - `LabOverrides = Record<string, number>` alias de type
   - `IntelligenceResult.sraHeatmap: SRAHeatmapWeek[]` ajouté

3. **`lib/programs/intelligence/scoring.ts`** — `scoreSRA` exporte `sraHeatmap`
   - Calcul 4 semaines identiques (programme répété) : fatigue = `totalWeightedVolume / (sraWindow × 0.003)` clampé 0–100
   - Facteur empirique 0.003 : ~1 set composé ≈ 0.3% de fatigue normalisée sur la fenêtre SRA

4. **`lib/programs/intelligence/index.ts`** — `useLabOverrides` hook
   - `useLabOverrides()` → `{ overrides, setOverride, resetOverrides }` (useCallback stable)
   - `useProgramIntelligence` 5ème paramètre `labOverrides?` : merge `{ ...morpho, ...lab }` (lab prend priorité)
   - Re-exports : `LabOverrides`, `SRAHeatmapWeek`, `useLabOverrides`

5. **`components/programs/studio/LabModeSection.tsx`** — SRA Heatmap + Lab Overrides UI
   - Section SRA Heatmap : table muscles × S1-S4, couleurs `bg-red-500/25` (>60), `bg-amber-500/20` (>30), `bg-white/[0.03]`
   - Section Lab Overrides : sliders 0.5–1.5 step 0.05 par pattern présent, accent `#8b5cf6` quand ≠ 1.0, bouton Reset

6. **`components/programs/studio/EditorPane.tsx`** + **`ProgramTemplateBuilder.tsx`**
   - Wiring complet : `useLabOverrides` → `useProgramIntelligence` → `EditorPane` → `LabModeSection`
   - `presentPatterns` calculé depuis les sessions avant passage à `LabModeSection`

7. **Alertes enrichies** (Task 5)
   - `PUSH_PULL_IMBALANCE` : affiche `${pushSets} sets push / ${pullSets} sets pull` + suggestion avec delta sets exact
   - `SRA_VIOLATION critical` : muscle capitalisé, `minimum requis : Xh pour niveau ${effectiveLevel}`, suggestion avec heures manquantes
   - `SRA_VIOLATION warning` : ajout `Manque : Xh.` dans l'explication
   - `REDUNDANT_EXERCISES` : affiche `${exA.sets} + ${exB.sets} = ${combinedSets} sets`

8. **`tests/lib/intelligence/biomechanics-phase2.test.ts`** — 9 tests (tous PASS)
   - 4 tests `scoreRedundancy` avec morpho : bypass unilatéral, pas de bypass sans morpho, redondance bilatérale inchangée
   - 5 tests SRA Heatmap : 4 semaines identiques, fatigue > 0, clamp 100, vide sans exercices

**Points de vigilance :**
- Le bypass redondance morpho compare `pA === pB` PUIS vérifie `unilateral_${direction}` — la direction est extraite du suffixe du pattern (`_push`, `_pull`, etc.)
- Facteur 0.003 heatmap est empirique — calibré pour que ~10 sets composés ≈ 30% de fatigue sur une fenêtre SRA typique (48h)
- `LabOverrides` prend toujours la priorité sur `morphoStimulusAdjustments` dans le merge (`{ ...morpho, ...lab }`)
- `SRAHeatmapWeek` représente la même semaine répétée × 4 — pas des semaines de progression distinctes (Phase 3 cible des données hebdomadaires réelles)
- Les alertes enrichies ne changent aucune signature — uniquement les strings de message

**Next Steps — Phase 3 Performance Feedback Loops :**
- [ ] RIR + completion rate tracking depuis `client_set_logs` — détecter stagnation, overtraining, under-stimulation
- [ ] Auto-recommandations : volume ±1 set, intensité ±5%, swap exercice, extension récupération
- [ ] Morpho-performance correlation : delta body comp → program outcome
- [ ] Coach review + approval avant application auto-adjust
- [ ] SRA Heatmap semaines réelles (weeks × sessions) quand le builder supporte les données hebdomadaires distinctes

---

## 2026-04-19 — Phase 1 UI Studio-Lab — Implémentation Complète

**Ce qui a été fait :**

1. **`lib/programs/intelligence/index.ts`** — debounce réduit de 400ms → 300ms dans `useProgramIntelligence`

2. **`components/programs/studio/NavigatorPane.tsx`** — arborescence séances/exercices
   - Props : `sessions`, `activeSessionIndex`, `activeExerciseKey`, `onSelectSession`, `onSelectExercise`, `onAddSession`
   - Collapse/expand par session, highlight sur exercice actif
   - DS v2.0 : `bg-[#121212]`, `bg-white/[0.02]` cards, accent `#1f8a65`

3. **`components/programs/studio/ExerciseCard.tsx`** — carte exercice extraite (autoportante)
   - Exporte `ExerciseData` interface
   - Layout `grid-cols-[140px_1fr]` : image 140×140 + pattern/equipment/polyart | nom + sets/reps/RIR + muscles + notes + alertes + alternatives
   - Intègre `IntelligenceAlertBadge` et `ExerciseClientAlternatives`

4. **`components/programs/studio/LabModeSection.tsx`** — mode lab transparent
   - Visible par défaut (toggle), accent violet `#8b5cf6`
   - Debug subscores 2×3 grid, 6 explications règles bioméchaniques
   - Badge connexion morpho (date de la dernière analyse)

5. **`components/programs/studio/IntelligencePanelShell.tsx`** — panel modulaire
   - Modes : `'docked' | 'floating' | 'minimized'`
   - Float : `motion.div` Framer Motion drag libre (`dragMomentum={false}`)
   - Minimized : barre compacte fixe `bottom-6 right-6` avec score colorisé
   - Wraps `ProgramIntelligencePanel` en mode docked

6. **`components/programs/studio/EditorPane.tsx`** — pane éditeur complet
   - Sticky sub-header : nom template + bouton Save + sélects (goal/level/equipment/frequency/weeks)
   - Sessions scrollables avec day picker, `ExerciseCard`, `LabModeSection` par session

7. **`components/programs/ProgramTemplateBuilder.tsx`** — refactorisé vers layout dual-pane
   - `react-resizable-panels` v4 (`Group`/`Panel`/`Separator`) — prop `orientation` (pas `direction`)
   - Layout : `Navigator (16%) | PanelResizeHandle | Editor (54%) | PanelResizeHandle | IntelligencePanelShell (30%)`
   - Fetch unifié `Promise.all([intelligence-profile, morpho/latest])` au mount
   - `morphoAdjustments` passé en 4e param à `useProgramIntelligence`

**Points de vigilance :**
- `react-resizable-panels` v4 : le prop s'appelle `orientation` (pas `direction`) sur `Group`. `id` et `order` sont supprimés des `Panel`. Exports : `Group`, `Panel`, `Separator` (plus `PanelGroup`, `PanelResizeHandle`)
- `LabModeSection` utilise l'accent violet `#8b5cf6` — distinct de l'accent vert coach `#1f8a65`
- `IntelligencePanelShell` mode floating : les coordonnées initiales sont `right:24 top:80` (fixed). Drag Framer Motion avec `dragMomentum={false}` pour précision.
- Les erreurs TS pré-existantes (`stripe/webhook`, `BodyFatCalculator`, `CarbCyclingCalculator`) sont hors périmètre Phase 1
- `EditorPane` reçoit toutes les callbacks d'édition (setMeta, setSessions) depuis le builder parent

**Next Steps — Phase 3 Performance Feedback Loops :**
- [ ] RIR + completion rate tracking depuis `client_set_logs` — détecter stagnation, overtraining, under-stimulation
- [ ] Auto-recommandations : volume ±1 set, intensité ±5%, swap exercice, extension récupération
- [ ] Morpho-performance correlation : delta body comp → program outcome
- [ ] Coach review + approval avant application auto-adjust
- [ ] SRA Heatmap : semaines réelles (weeks × sessions) quand le builder supporte les données hebdomadaires distinctes

---

## 2026-04-18 — Phase 0 MorphoPro Bridge — Implémentation Complète

**Ce qui a été fait :**

1. **`supabase/migrations/20260418_morpho_analyses.sql`** — table morpho_analyses + RLS
   - Colonnes : id, client_id, assessment_submission_id, analysis_date, raw_payload, body_composition, dimensions, asymmetries, stimulus_adjustments, status, job_id, error_message, analyzed_by
   - RLS : coach SELECT/INSERT/UPDATE (via coach_clients.coach_id), client SELECT (via coach_clients.user_id)
   - Indexes : (client_id, analysis_date DESC), (client_id) WHERE status='completed'

2. **`lib/morpho/parse.ts`** — parseMorphoResponses + estimateMuscleFromBiometrics (42 tests)
3. **`lib/morpho/adjustments.ts`** — calculateStimulusAdjustments + applyMorphoAdjustment (règles asymétries bras/épaule/membres)
4. **`lib/morpho/analyze.ts`** — analyzePhotoWithOpenAI (gpt-4o), getPhotoUrlsFromSubmission, getLatestClientBiometrics
5. **`jobs/morpho/analyzeMorphoJob.ts`** — orchestrateur async : photos → Vision → parse → ajustements → DB
6. **4 routes API** :
   - `POST /api/clients/[clientId]/morpho/analyze` — déclenche job, rate limit 1/24h
   - `GET /api/clients/[clientId]/morpho/latest` — dernière analyse complète
   - `GET /api/clients/[clientId]/morpho/analyses` — timeline paginée
   - `POST /api/clients/[clientId]/morpho/job-status` — polling par job_id
7. **Scoring** : `buildIntelligenceResult` accepte `morphoStimulusAdjustments` optionnel → `scoreSpecificity` applique les ajustements morpho au coeff de stimulus
8. **`components/clients/MorphoAnalysisSection.tsx`** — bouton Analyser + polling + affichage body_composition + asymétries (DS v2.0)
9. **`/coach/clients/[clientId]` onglet Profil** intègre MorphoAnalysisSection

**Points de vigilance :**
- Job queue : `setImmediate` (MVP) — remplacer par Inngest ou Bull en production pour la robustesse
- OpenAI Vision : modèle `gpt-4o` (gpt-4-vision est déprécié depuis Dec 2024)
- Rate limit DB-based : pas de Redis — un seul processus à la fois acceptable en Phase 0
- `morphoStimulusAdjustments` pris en compte uniquement dans `scoreSpecificity` — `scoreRedundancy` reste sans ajustement morpho (Phase 2)
- Les erreurs TypeScript existantes (Stripe, BodyFatCalculator) sont pré-existantes, hors périmètre Phase 0

**Next Steps — Phase 1 UI Studio-Lab :**
- [ ] Refactor ProgramTemplateBuilder vers layout dual-pane (Navigator 16% | Editor 54% | Intelligence 30%)
- [ ] Lab Mode visible par défaut (variants, transparence biomécanique, contrôles morpho)
- [ ] Intelligence Panel temps réel (debounce 300ms)
- [ ] MorphoAnalysisSection : connecter stimulus_adjustments → useProgramIntelligence dans ProgramTemplateBuilder

---

## 2026-04-18 — Studio-Lab Redesign — Master Plan Documented

**Ce qui a été fait :**

1. **Brainstorming Phase 0–4** (2026-04-18)
   - Confirmed strategy: **MorphoPro Bridge (backend-only) FIRST** before Phase 1 UI redesign
   - Confirmed OpenAI Vision API (not custom ML) for morpho photo analysis
   - Confirmed rule-based scoring (not generative AI)
   - Confirmed async job queue for MorphoPro (non-blocking coach UX)

2. **Phase 0 Design** (MorphoPro Bridge)
   - `morpho_analyses` table: versioned morpho per client (history timeline)
   - API routes: analyze, latest, analyses timeline, job-status polling
   - Async job: `analyzeMorphoJob()` orchestrates OpenAI Vision → parsing → stimulus adjustments
   - Scoring integration: `buildIntelligenceResult()` accepts morpho + applies stimulus adjustments
   - Coach workflow: Profil tab → `[Analyser Morpho]` button → job queued → results shown (~30s)

3. **Phase 1 Design** (UI Redesign Studio-Lab)
   - Dual-pane layout: Navigator (16%) | Editor (54%) | Intelligence Panel (30%, modular)
   - Lab Mode visible by default (variants, biomechanics debug, rule transparency, morpho controls)
   - Real-time intelligence updates (debounce 300ms as coach edits)
   - Modular Intelligence Panel (dock left/right, float, minimize, fullscreen)
   - DS v2.0 studio-grade (dark theme, tight spacing, accent colors)

4. **Phase 2 Design** (Biomechanics Engine)
   - 6 scoring subscores: SRA, Balance, Specificity, Progression, Redundancy, Completeness
   - Client profile integration: injuries (body_part + severity), equipment, fitness level
   - Morpho integration: stimulus adjustments applied to specificity + redundancy
   - Real-time alerts (critical, warning, info levels)
   - Rule transparency (why each score = X/100)

5. **Phase 3 Design** (Performance Feedback Loops)
   - RIR + completion rate tracking from client logs
   - Auto-recommendations: volume ±1 set, intensity ±5%, exercise swaps, recovery extension
   - Morpho-performance correlation (body comp changes → program outcome)
   - Coach review + approval before applying auto-adjust

6. **Phase 4 Design** (Export & Webhooks)
   - Programme export: PDF, CSV, JSON, app-native format
   - Webhook triggers: programme completed, client performance update, morpho analysis done
   - Analytics dashboard: adherence, performance trends, morpho progression

7. **Documentation**
   - Master plan: `docs/superpowers/plans/2026-04-18-programme-generation-studio-lab-master-plan.md`
   - Phase 0 spec: `docs/superpowers/specs/2026-04-18-morphopro-bridge-design.md`
   - Phase 1 UI design: embedded in master plan + brainstorming output
   - Timeline: ~9–10 weeks total

**Points d'Architecture :**

- **MorphoPro First:** Stimulus adjustments derived from morpho are needed for Phase 1 scoring to be optimal. Do Phase 0 before Phase 1.
- **OpenAI Vision:** Photo analysis via OpenAI API (not custom ML). Parsed into structured metrics (body_fat_pct, dimensions, asymmetries).
- **Async Job Queue:** Coach triggers analysis → job queued → results async (non-blocking). No timeout risk.
- **Stimulus Range:** 0.8–1.2 per pattern. Morpho becomes a modifier on base coefficients (preserves calibration).
- **Real-Time Scoring:** Phase 1 scores update live as coach edits (debounce 300ms). Continuous feedback loop.
- **Lab Mode Visible:** Studio-lab tool should expose internals. Coach can toggle off if distracting.
- **Rule-Based Scoring:** NO generative AI for program logic. Research-backed formulas (SRA windows, stimulus coeff, balance ratios, etc.).

**Next Steps — Phase 0 Implementation:**

- [x] Spawn subagents for Phase 0 tasks (1 per major component)
- [x] Task 1: Database migration + RLS
- [x] Task 2: Helper functions (parsing + stimulus adjustments)
- [ ] Task 3: Async job + OpenAI Vision integration
- [ ] Task 4: Scoring integration (morpho stimulus adjustments)
- [ ] Task 5: Coach UI (Profil tab, [Analyser] button)
- [ ] Test end-to-end: coach analyzes morpho → see results → scores updated
- [ ] Commit + CHANGELOG + project-state update

**Timeline Phase 0:** 1.5–2 weeks (2026-04-18 → ~2026-05-02)

---

## 2026-04-18 — Phase 0 Task 2: Helper Functions

**Ce qui a été fait :**

1. **`lib/morpho/parse.ts`** — parsing OpenAI Vision responses
   - `parseMorphoResponses(visionResults)`: extract metrics from text (body_fat_pct, dimensions, asymmetries)
   - Regex patterns: "18% body fat", "body fat: 22%", "waist: 78cm", "arm difference: 1.2cm", posture notes
   - Handles both "value % metric" and "metric: value %" orderings
   - Multi-line parsing (combines multiple photo angles)
   - `estimateMuscleFromBiometrics(weight, bodyFatPct)`: Katch-McArdle formula (lean × 0.85)

2. **`lib/morpho/adjustments.ts`** — stimulus coefficient adjustments
   - `calculateStimulusAdjustments(morpho, clientMeta)`: returns Record<pattern, coeff> (0.8–1.2)
   - Rules (all verified with tests):
     - Arm asymmetry >2cm → unilateral_push/pull = 1.15
     - Shoulder imbalance >2cm → horizontal_push = 0.90, horizontal_pull = 1.10
     - Long arms (ratio >0.40) → vertical_pull ≥1.12, horizontal_pull ≥1.05
     - Short arms (ratio <0.36) → horizontal_push ≥1.10, vertical_push ≥1.08
   - All coefficients clamped to [0.8, 1.2]
   - Uses `Math.max()` when multiple rules apply (takes highest)
   - `applyMorphoAdjustment(baseCoeff, adjustmentCoeff)`: multiply with clamping [0.4, 1.2]

3. **`tests/lib/morpho/parse.test.ts`** — 24 tests (all PASS)
   - Body fat extraction (%, both orderings, decimals)
   - Dimension extraction (waist, hips, chest, arms, legs, thighs, calves)
   - Asymmetry extraction (arm, leg, shoulder, hip, posture)
   - Multi-response combining
   - Edge cases (missing data, zero weight, negative inputs, body fat >100%)
   - Linear scaling verification
   - Coverage: 7/9 extraction patterns + 4 estimator edge cases + scaling tests

4. **`tests/lib/morpho/adjustments.test.ts`** — 18 tests (all PASS)
   - Base case: 1.0 all patterns (no asymmetry)
   - Threshold tests: >2cm triggers, 2cm exactly doesn't, <2cm doesn't
   - Arm asymmetry boost verification (1.15)
   - Shoulder imbalance dual adjustment (0.9 + 1.1)
   - Long arms ratio detection (>0.40)
   - Short arms ratio detection (<0.36)
   - Exact threshold boundaries (0.40, 0.36)
   - Missing/zero height handling (no crash, stays 1.0)
   - Clamping verification (0.8–1.2 always)
   - Multiple rules interaction (max() application)
   - All patterns returned in output
   - applyMorphoAdjustment tests (multiply, clamp, typical ranges)

**Points de vigilance :**

- `parseMorphoResponses` uses alternation regex `(regex1|regex2)` with two capture groups — uses `|| operator to fall back from group 1 to group 2
- Threshold boundaries are strict: `>2` not `>=2`, `<0.36` not `<=0.36` — matches Phase 0 spec asymmetry thresholds
- `Math.max()` is used to prevent lower adjustments when multiple rules match (e.g., long arms boosts pull to 1.12, unilateral rule would be 1.0 max, so pull stays 1.12)
- Clamping happens AFTER all rule application (not per-rule) to allow interaction
- `estimateMuscleFromBiometrics` returns 0 for invalid inputs (weight ≤0, body_fat outside [0,100]) — safer than throwing
- All tests verify both positive and edge case behavior (exact threshold, just inside/outside, extreme values)

**Commit:**
- feat(morpho): add parsing and stimulus adjustment helper functions
- 42 tests passing (parse 24 + adjustments 18)
- Zero TypeScript errors
- Atomic commit with full explanation

**Next Steps — Task 3 (Async Job + OpenAI Vision Integration) :**
- [ ] `lib/morpho/job.ts` — async analyzeMorphoJob() function
- [ ] `lib/openai/vision.ts` — OpenAI Vision API client
- [ ] `app/api/morpho/analyze/route.ts` — POST trigger (coach initiates)
- [ ] `app/api/morpho/status/[analysisId]/route.ts` — GET job status (polling)
- [ ] `app/api/morpho/callback/route.ts` — webhook receiver from n8n
- [ ] Tests: 6 job orchestration tests + 4 OpenAI integration tests

---

## 2026-04-18 — MorphoPro Bridge Phase 0 Task 1 — Database Migration

**Ce qui a été fait :**

1. **`supabase/migrations/20260418_morpho_analyses.sql`** — migration appliquée
   - Table `morpho_analyses` : versioned client morphology + OpenAI Vision payloads
   - Colonnes : id (UUID PK), client_id (FK), assessment_submission_id (nullable FK), created_at, updated_at, analysis_date (DATE)
   - JSONB fields : raw_payload (unprocessed OpenAI), body_composition, dimensions, asymmetries, stimulus_adjustments
   - Job tracking : status (pending/completed/failed), job_id (n8n), error_message, analyzed_by (UUID)
   - Indexes : (client_id, analysis_date DESC), (client_id) WHERE status='completed', (status)
   - Constraint UNIQUE : (assessment_submission_id, analysis_date)
   - Trigger : set_updated_at() on UPDATE

2. **RLS Policies** :
   - Coach SELECT/INSERT/UPDATE : `client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())`
   - Client SELECT : `client_id IN (SELECT id FROM coach_clients WHERE user_id = auth.uid())`
   - Isolation multi-tenant complète

3. **`lib/morphology/types.ts`** — TypeScript types
   - `MorphoAnalysis` : database row interface
   - `MorphoRawPayload` : OpenAI Vision output structure (body_fat_pct, dimensions, asymmetries, etc.)
   - `MorphoStimulusAdjustments` : pattern → coefficient multiplier (0.8–1.2)
   - `MorphoJobStatus`, `MorphoAnalysisRequest`, `MorphoAnalysisResponse`, `MorphoTimelineEntry` : API contracts

4. **`lib/morphology/index.ts`** — public API export
   - Export all types for use in API routes + scoring integration

**Points d'Architecture :**

- JSONB fields are untyped at DB level — validation happens at app layer (Zod) or via OpenAI contract
- `assessment_submission_id` est nullable — analysis peut être indépendante ou liée à un bilan
- `job_id` stocke le n8n job ID — polling depuis coach UI pour l'async job tracking
- Stimulus adjustments : Range 0.8–1.2 par pattern, appliquées en multiplicateur sur base coefficients (préserve calibration)
- L'updated_at trigger nécessite la fonction `set_updated_at()` créée dans une migration antérieure (20260402_assessment_system.sql)

**Points de Vigilance :**

- La migration utilise `IF NOT EXISTS` — idempotent, safe sur redéploiement
- RLS policies usent `auth.uid()` — nécessite Supabase authenticated context (role `authenticated`)
- L'index partiel `(client_id) WHERE status='completed'` accélère les queries "latest analysis" pour le coach
- UNIQUE constraint sur `(assessment_submission_id, analysis_date)` : permet un seul morpho par bilan/date combo (NULL assessment_submission_id ne viole pas UNIQUE)
- Le trigger `DROP TRIGGER IF EXISTS` avant CREATE est safe pour les reruns

**Next Steps — Phase 0 Task 2 (API Routes) :**

- [ ] POST `/api/clients/[clientId]/morpho/analyze` — créer morpho_analyses row, queue n8n job
- [ ] GET `/api/clients/[clientId]/morpho/latest` — latest completed analysis + body_composition
- [ ] GET `/api/clients/[clientId]/morpho/analyses` — timeline complète (pagination)
- [ ] GET `/api/morpho/job-status?job_id=...` — poll async job completion
- [ ] Validation Zod sur payloads, gestion d'erreur explicite

---

## 2026-04-18 — Alternatives Scoring Refactor — Back Sub-Groups & Deduplication (Tasks 1-5)

## 2026-04-18 — Alternatives Scoring Refactor — Back Sub-Groups & Deduplication (Tasks 1-5)

**Ce qui a été fait :**

1. **`lib/programs/intelligence/catalog-utils.ts`** — back muscle sub-group expansion
   - Ajout `DOS_SUBGROUPS_BY_PATTERN: Record<string, string[]>` constant
     - `vertical_pull` → `['grand_dorsal', 'dos_large']`
     - `horizontal_pull` → `['trapeze_moyen', 'rhomboides', 'dos_large']`
     - `scapular_elevation` → `['trapeze_superieur', 'dos_large']`
     - `hip_hinge` → `['lombaires', 'erecteurs_spinaux', 'dos_large']`
     - `core_anti_flex` → `['lombaires', 'erecteurs_spinaux', 'dos_large']`
     - `carry` → `['trapeze_superieur', 'dos_large']`
     - default (unknown) → `['dos_large']` (generic same-group marker)
   - Export `expandMusclesForScoring(muscles: string[], movementPattern: string | null): string[]`
   - Remplace `'dos'` par sub-groups sans régénérer le catalogue (runtime expansion)
   - `dos_large` agit comme marqueur "même groupe large" — deux exercices avec ONLY `dos_large` overlap reçoivent un score partiel (8 pts) au lieu de 30 pts

2. **`lib/programs/intelligence/alternatives.ts`** — refactor scoreAlternatives
   - Import `expandMusclesForScoring` depuis catalog-utils
   - Remplace `originalMuscles = new Set(primary_muscles.map(normalizeMuscleSlug))` par `originalMusclesExpanded = new Set(expandMusclesForScoring(primary_muscles, pattern))`
   - Même refactor pour candidats : `candidateMusclesExpanded = expandMusclesForScoring(candidate.muscles, candidate.movementPattern)`
   - Overlap computation uses expanded muscles sets
   - Détection `hasOnlyDosLarge = overlap.length > 0 && overlap.every(m === 'dos_large')`
   - Si `hasOnlyDosLarge` : score += 8 (crédit partiel), sinon score += min(30, overlap.length * 15)
   - Label `'Remplace mécaniquement'` et `'Angle complémentaire'` nécessitent maintenant `hasRealOverlap = overlap.length > 0 && !hasOnlyDosLarge`
   - Déduplication par prefix nom : boucle sur résultats triés, garde les 3 premiers mots en lowercase comme clé
   - Limite max 6 résultats (au lieu de 8) après dédup

3. **`tests/lib/intelligence/catalog-utils.test.ts`** — ajout 8 tests pour expandMusclesForScoring
   - `vertical_pull + dos` → contains `grand_dorsal, dos_large`, not `dos`
   - `horizontal_pull + dos` → contains `trapeze_moyen, rhomboides, dos_large`
   - `scapular_elevation + dos` → contains `trapeze_superieur, dos_large`
   - `hip_hinge + dos` → contains `lombaires, erecteurs_spinaux, dos_large`
   - `null pattern + dos` → fallback `['dos_large']`
   - Non-back muscles pass through unchanged
   - Empty array returns empty
   - Total : 22 tests (7 existants + 8 nouveaux) tous PASS

4. **`tests/lib/intelligence/alternatives.test.ts`** — création fichier
   - 4 tests scoreAlternatives avec back sub-groups
   - Test 1 : traction (vertical_pull) n'étiquète pas shrug (scapular_elevation) comme "Remplace mécaniquement"
   - Test 2 : traction vs traction > traction vs row (pattern bonus + overlap bonus)
   - Test 3 : max 6 alternatives par exercice
   - Test 4 : pas de doublons name prefix dans résultats
   - Tous PASS

5. **`CHANGELOG.md`** — mise à jour
   - FIX: scoreAlternatives — back muscle sub-groups derived from movementPattern
   - FIX: scoreAlternatives — deduplicate by name prefix, max 6 results
   - FIX: ExerciseAlternativesDrawer — label requires true sub-group overlap

**Points de vigilance :**
- `dos_large` est utilisé dans 2 contextes : (1) fallback quand pattern unknown, (2) marqueur "même groupe musculaire large mais fonctionnellement différent"
- Overlap avec ONLY `dos_large` = 8 pts (crédit partiel). Ex: traction (grand_dorsal) vs shrug (trapeze_superieur) → overlap = `[dos_large]` → score += 8
- Deux exercices avec grand_dorsal + dos_large vs un avec trapeze_moyen + dos_large → overlap sur grand_dorsal = `[grand_dorsal, dos_large]` → score += 30 (pas juste 8)
- `expandMusclesForScoring` n'affecte que les muscles avec slug `'dos'` — tous les autres muscles passe à travers inchangés (biceps, triceps, lombaires restent comme-est)
- Déduplication par "first 3 words" de nom en lowercase — "Tirage Vertical Poulie" et "Tirage Vertical Poulie Haute" sont dédoublés (prefix = "tirage vertical poulie"), keeper = le plus haut score
- Max 6 au lieu de 8 : acceptable car dédup élimine bruit de variantes, conserve les meilleurs candidats

**Next Steps — Program Intelligence Phase 3 :**
- [ ] Supersets — détecter paires superset avec même group_id, scorer SRA/imbalance
- [ ] Prédictions sets/reps/RIR depuis historique client_set_logs
- [ ] Timeline RIR par semaine quand builder supporte données hebdomadaires
- [ ] Afficher label qualitatif avec badge couleur (95+ vert, 85-94 vert clair, 75-84 jaune, <75 gris)

---

## 2026-04-18 — Client Exercise Alternatives (Système A) — Tasks 5-7 Client-Side Integration

**Ce qui a été fait :**

1. **`app/client/programme/session/[sessionId]/page.tsx`** — fetch alternatives côté serveur
   - Récupère `template_id` depuis `program_sessions → programs`
   - Fetch `coach_program_template_exercises` avec nested `coach_template_exercise_alternatives`
   - Construite `alternativesMap: Record<string, string[]>` (name → alternatives)
   - Ajoute `clientAlternatives: []` à chaque exercice avant passage à SessionLogger

2. **`app/client/programme/session/[sessionId]/SessionLogger.tsx`** — intégration client
   - `Exercise` interface reçoit `clientAlternatives?: string[]`
   - Nouveau state : `altSheetTarget: number | null` (index exercice sélectionné)
   - Bouton "Indisponible ?" rendu après bouton swap si `currentEx.clientAlternatives?.length > 0 && !swappedNames[id]`
   - Click → `setAltSheetTarget(currentExIndex)`
   - Alternative selection → `setSwappedNames({ ...prev, [exId]: name })` (state local seulement)
   - Swap est temporaire (jamais persisté, réinitialisé au rechargement)

3. **`components/client/ClientAlternativesSheet.tsx`** — nouveau composant bottom sheet
   - Props : `exerciseName`, `alternatives: string[]`, `onSelect`, `onClose`
   - Overlay noir 60% transparent, sheet arrondie en haut `rounded-t-2xl`
   - Header : zone "Alternatives à {exerciseName}" + bouton fermeture
   - Description : "Exercice indisponible ? Choisissez une alternative préparée par votre coach."
   - Buttons : alternatives listées comme boutons `.bg-white/[0.04] hover:bg-white/[0.08]` avec "Choisir →" label vert
   - Active: `scale-[0.98]` feedback
   - Design : DS v2.0 (#181818 background, white/40 text, #1f8a65 accent)

**Points de vigilance :**
- Query fetch alternatives utilise `eq('template_session_id', templateId)` — ATTENTION : vérifier le nom exact de la colonne en DB (peut être `session_id`)
- Alternatives matchées par `exercise.name` (string comparison) — si coach renomme exercice post-configuration, lien rompu
- Swap name est stocké dans `swappedNames[exerciseId]` — l'ID est l'UUID de `program_exercises` (pas template_id)
- Le bouton "Indisponible ?" apparaît UNIQUEMENT si alternatives existent ET aucun swap n'a déjà été fait pour cet exercice
- `ClientAlternativesSheet` renderée conditionnellement : `altSheetTarget !== null && exercises[altSheetTarget]?.clientAlternatives?.length`
- Alternatives sont temporaires : aucune persistance, réinitialisées au reload/retour à la page list

**Next Steps — Client Alternatives Phase 3 (Future) :**
- [ ] Coach alternatives UI dans template builder (déjà Tasks 1-4)
- [ ] Afficher indication "Vous avez remplacé cet exercice par…" dans le header après swap
- [ ] Analytics : tracker quels alternatives sont choisies en session (add to `client_set_logs`)
- [ ] Système B : dynamique alternatives scoring depuis le catalogue (non implémenté)

---

## 2026-04-18 — Client Exercise Alternatives (Système A) — Coach Pre-Config Infrastructure

**Ce qui a été fait :**

1. **`supabase/migrations/20260418_template_exercise_alternatives.sql`** — migration appliquée
   - Table `coach_template_exercise_alternatives` : id, exercise_id (FK), name, notes, position, created_at
   - Index sur (exercise_id, position) pour recherche rapide
   - RLS: coach peut gérer alternatives pour ses propres exercices, client peut lire alternatives assignées

2. **`app/api/program-templates/[templateId]/exercises/[exerciseId]/alternatives/route.ts`** — API complète
   - GET : liste alternatives par exercice, triées par position
   - POST : ajoute alternative (max 3 enforced), auto-assign position
   - DELETE : supprime alternative spécifique
   - Auth: coach ownership check sur toutes les opérations

3. **`components/programs/ExerciseClientAlternatives.tsx`** — composant builder
   - Affiche alternatives existantes comme chips avec boutons supprimer
   - Input + Save pour ajouter alternatives
   - Max 3 enforced côté client (bouton "Ajouter" caché au seuil)
   - Gère son propre fetch/state, toast errors

4. **`components/programs/ProgramTemplateBuilder.tsx`** — intégration et infrastructure
   - `Exercise.dbId` ajouté (stocke l'UUID de saved exercise)
   - `Exercise.group_id` inclus dans mapping (pour supersets)
   - ExerciseClientAlternatives rendu en edit mode si templateId + ex.dbId présent
   - Exercices chargés depuis `initial` reçoivent now dbId + group_id

**Points de vigilance :**
- `ExerciseClientAlternatives` rendu UNIQUEMENT en mode édition (quand templateId existe) — en création de template, exercice n'a pas d'id DB
- Alternatives sont temps réel : fetch au mount, POST/DELETE au changement
- Max 3 enforced côté API + client (defense in depth)
- RLS sur la table allows coach full access + client SELECT (simplified, no complex join required)

---

## 2026-04-18 — Template Builder Image Layout Refactor — 2-Column Grid

**Ce qui a été fait :**

1. **`components/programs/ProgramTemplateBuilder.tsx`** — exercise card layout refactor
   - Exercise card restructured from single-column full-width layout to `grid grid-cols-[140px_1fr] gap-4`
   - Left column (140px): Image (constrained 140×140px square) + add/import buttons + pattern select + equipment pills + poly-articulaire toggle
   - Right column (flex 1): Exercise name + delete button, sets/reps/rest/RIR grid, primary/secondary muscles, notes textarea, intelligence alerts + alternatives button
   - Image now uses `w-[140px] h-[140px]` with `object-cover` — maintains aspect ratio and eliminates full-width rendering
   - Placeholder image area shows image icon + "Ajouter image" text when no image_url
   - Equipment pills on left abbreviated (3-char labels: "bar" for barbell, etc.)
   - Poly-articulaire label abbreviated to "Polyart." on left column

**Points de vigilance :**
- Image width constrained to 140px (left column explicit width) prevents full-width sprawl
- `object-cover` on Image ensures square aspect ratio regardless of source dimensions
- Left column metadata (pattern, equipment, polyart) now stacked vertically in constrained space
- Music/muscles remain on right column for maximum readability
- Grid gap `gap-4` ensures breathing room between left/right sections

**Next Steps — Template Builder Phase 2B :**
- [ ] Client Alternatives (Système A) — 7 tasks
- [ ] Alternatives Scoring Refactor — 5 tasks

---

## 2026-04-18 — Program Intelligence Phase 2B — Custom Exercises, SRA fitnessLevel, Swap, Alert Navigation

**Ce qui a été fait :**

1. **`app/api/clients/[clientId]/route.ts`** — fix PATCH allowlist
   - `'equipment'` ajouté au tableau `allowed` — le toggle équipement du `RestrictionsWidget` était silencieusement ignoré

2. **`lib/programs/intelligence/scoring.ts`** — scoreSRA fitnessLevel
   - `scoreSRA(sessions, meta, profile?)` accepte un troisième argument `IntelligenceProfile`
   - `effectiveLevel = profile?.fitnessLevel ?? meta.level` — le profil client prime sur le niveau du template
   - `buildIntelligenceResult` passe `profile` à `scoreSRA`
   - 2 tests Vitest ajoutés dans `profile-scoring.test.ts` (7 tests total dans ce fichier)

3. **`supabase/migrations/20260418_coach_custom_exercises.sql`** — migration appliquée
   - Table `coach_custom_exercises` : id, coach_id (FK auth.users), name, slug, movement_pattern, is_compound, equipment[], muscles[], muscle_group, stimulus_coefficient, notes, created_at
   - RLS : `coach_id = auth.uid()`
   - UNIQUE constraint `(coach_id, slug)` — slug dérivé du nom (slugify)

4. **`app/api/exercises/custom/route.ts`** — GET/POST exercices custom coach
   - GET : liste tous les exercices custom du coach connecté, triés par nom
   - POST : crée un exercice custom avec slug auto-dérivé, retourne 409 si slug déjà existant (même nom)

5. **`components/programs/ExercisePicker.tsx`** — badge Perso + custom exercises
   - `CatalogEntry.source?: 'catalog' | 'custom'`
   - `allExercises` = fusion catalog statique + custom fetch on mount
   - Badge "Perso" (vert) sur les exercices custom dans la grille

6. **`components/programs/ExerciseAlternativesDrawer.tsx`** — onglet Créer
   - Tab switcher Alternatives / + Créer
   - Formulaire création : nom, pattern (select), muscles (chips), toggle composé
   - Submit → `POST /api/exercises/custom` + `onReplace` avec le nom créé + fermeture drawer
   - `MOVEMENT_PATTERNS` et `MUSCLE_OPTIONS` définis localement dans le composant

7. **`app/client/programme/session/[sessionId]/ExerciseSwapSheet.tsx`** — nouveau composant
   - Bottom sheet mobile (z-50, rounded-t-2xl)
   - Réutilise `scoreAlternatives()` avec `BuilderExercise` à muscles vides (swap name-only)
   - Max 3 alternatives, labels qualitatifs (Recommandé / Similaire / Alternative)
   - Temporaire : jamais persisté en DB

8. **`app/client/programme/session/[sessionId]/SessionLogger.tsx`** — intégration swap
   - `swapTarget`, `swappedNames` states
   - Bouton `ArrowLeftRight` per exercice dans l'en-tête de la card
   - Nom swappé affiché à la place du nom original (state local)
   - `ExerciseSwapSheet` rendu conditionnellement

9. **`components/programs/ProgramIntelligencePanel.tsx`** — onAlertClick prop
   - `onAlertClick?: (sessionIndex: number, exerciseIndex: number) => void`
   - Click sur alerte → extrait `alert.sessionIndex` + `alert.exerciseIndex` → appelle le callback

10. **`components/programs/ProgramTemplateBuilder.tsx`** — scroll + highlight exercice
    - `highlightKey: string | null` state (format `${si}-${ei}`)
    - `exerciseRefs: Record<string, HTMLDivElement | null>` ref map
    - `handleAlertClick(si, ei)` → scrollIntoView + ring highlight 2s timeout
    - `<ProgramIntelligencePanel onAlertClick={handleAlertClick} />`
    - `ref` et `ring-1 ring-[#1f8a65]/60` conditionnels sur chaque exercise card

**Points de vigilance :**
- `equipment` PATCH était un bug silencieux depuis la Phase 2A — corrigé en Prerequisite
- `ExerciseSwapSheet` reçoit `primary_muscles: []` intentionnellement — le swap est name-only, le scoring alternatives dégrade gracieusement sans muscles
- Slug derivation : `Hip Thrust Barre Surélevée → hip-thrust-barre-surelevee` — côté serveur, pas côté client
- `ExercisePicker` fetche `/api/exercises/custom` à chaque ouverture du picker (pas de cache global) — acceptable car la liste est courte
- La fusion `allExercises = [...catalog, ...customExercises]` se fait dans un `useMemo([customExercises])` — les filtres sont recalculés automatiquement
- `ProgramIntelligencePanel.onAlertClick` ne fire que si `alert.sessionIndex !== undefined && alert.exerciseIndex !== undefined` — les alertes sans coordonnées (ex: PUSH_PULL_IMBALANCE global) ne scrollent pas

**Next Steps — Program Intelligence Phase 3 :**
- [ ] Supersets — détecter et scorer les paires superset (plan séparé requis)
- [ ] Prédictions sets/reps/RIR depuis l'historique `client_set_logs` (plan séparé requis)
- [ ] Timeline RIR par semaine (LineChart) quand le builder supportera les données hebdomadaires distinctes
- [ ] Mini bar chart volume par session (`patternDistribution` par session)

---

## 2026-04-18 — Program Intelligence Phase 2A — Client Profile Integration

**Ce qui a été fait :**

1. **`supabase/migrations/20260418_intelligence_profile.sql`** — migration DB appliquée
   - `metric_annotations.body_part text` — zone anatomique de la restriction
   - `metric_annotations.severity text CHECK ('avoid'|'limit'|'monitor')` — niveau de restriction
   - `coach_clients.equipment text[] DEFAULT '{}'` — équipement disponible client

2. **`lib/programs/intelligence/types.ts`** — 2 nouveaux types
   - `InjuryRestriction { bodyPart, severity }` — restriction par zone + sévérité
   - `IntelligenceProfile { injuries, equipment, fitnessLevel?, goal? }` — profil complet pour le moteur

3. **`lib/programs/intelligence/catalog-utils.ts`** — mapping anatomique
   - `MUSCLE_TO_BODY_PART` — map slug FR → `body_part[]` (ex: `deltoide_anterieur` → `['shoulder_right', 'shoulder_left']`)
   - `muscleConflictsWithRestriction(slug, restrictions)` — retourne le conflit le plus sévère ou null
   - `pectoraux` et `abdos` mappent `[]` — pas de body_part dans le vocabulaire standard

4. **`lib/programs/intelligence/scoring.ts`** — 2 nouveaux sous-moteurs
   - `scoreSpecificity(..., profile?)` — émet `INJURY_CONFLICT` (critical=avoid, warning=limit, info=monitor) + pénalité score (−30 pts/avoid, −15 pts/limit, plafonnée à −40)
   - `scoreCompleteness(..., profile?)` — émet `EQUIPMENT_MISMATCH` pour exercices sans équipement compatible ; filtre les patterns requis par équipement disponible
   - `buildIntelligenceResult(..., profile?)` — passe le profil aux deux sous-moteurs (backward compatible)

5. **`lib/programs/intelligence/index.ts`** — `useProgramIntelligence(sessions, meta, profile?)` — exporte `IntelligenceProfile`

6. **`app/api/clients/[clientId]/intelligence-profile/route.ts`** — nouveau endpoint GET
   - Agrège `coach_clients.equipment` + `metric_annotations` (event_type=injury, body_part IS NOT NULL)
   - Retourne `IntelligenceProfile` sérialisé

7. **`app/api/clients/[clientId]/annotations/route.ts`** — schema Zod étendu avec `body_part` + `severity`

8. **`app/api/client/restrictions/route.ts`** — GET + POST pour le client authentifié
9. **`app/api/client/restrictions/[annotationId]/route.ts`** — DELETE sécurisé par `user_id`

10. **`components/clients/RestrictionsWidget.tsx`** — widget coach
    - Liste des restrictions par zone (rouge/ambre/gris selon severity)
    - Formulaire inline : zone (select), niveau (boutons), label, date, note
    - Grille d'équipement disponible (pills toggle → PATCH /api/clients/[clientId])

11. **`components/client/ClientRestrictionsSection.tsx`** — section client (profil)
    - UX client-friendly : radio "Je ne peux pas faire…" / "J'ai des douleurs à…" / "Je surveille…"
    - Label auto-généré depuis la zone + situation

12. **Intégrations pages :**
    - `/coach/clients/[clientId]` onglet Profil → `<RestrictionsWidget clientId={clientId} />`
    - `/client/profil` → section "Restrictions physiques" avec `<ClientRestrictionsSection />`
    - `ProgramTemplateBuilder` → prop `clientId?`, fetch profile au mount, chip "Profil client appliqué"

**Points de vigilance :**
- `RestrictionsWidget` charge les annotations via `/api/clients/${clientId}/annotations` (filtre event_type=injury+body_part) et l'équipement via `/api/clients/${clientId}/intelligence-profile` — deux fetches distincts
- `EQUIPMENT_MISMATCH` n'est émis que si `profile.equipment.length > 0` — si le coach n'a pas configuré l'équipement, aucune alerte equipment
- `pectoraux` et `abdos` → `MUSCLE_TO_BODY_PART` retourne `[]` → jamais de conflit blessure pour ces groupes (chest/abs hors vocabulaire body_part)
- La sévérité `'monitor'` émet un alert `info` (non bloquant) — visible mais n'impacte pas le score
- `intelligence-profile` endpoint : `eq('coach_id', user.id)` sur `coach_clients` — le coach ne peut lire que ses propres clients
- `client/restrictions` endpoint : résolution `user_id → client_id` via `coach_clients.user_id` — le client doit avoir son compte Supabase lié

**Next Steps — Program Intelligence Phase 2B :**
- [ ] Supersets — détecter et scorer les paires superset (même exercice groupe agoniste/antagoniste)
- [ ] Prédictions automatiques sets/reps/RIR depuis l'historique client (`client_set_logs`)
- [ ] Timeline RIR par semaine (LineChart) quand le builder supporte les données hebdomadaires distinctes
- [ ] Exercices custom coach persistés en DB (POST /api/exercises/custom) + badge "Perso" dans ExercisePicker
- [ ] Intégration `fitnessLevel` du profil dans `scoreSRA` (multiplier déjà présent, mais non connecté au profil client)

---

## 2026-04-18 — Program Intelligence Phase 1

**Ce qui a été fait :**

1. **`lib/programs/intelligence/types.ts`** — types centralisés du moteur
   - `BuilderExercise`, `BuilderSession`, `TemplateMeta`, `IntelligenceResult`, `IntelligenceAlert`, `SRAPoint`, `RedundantPair`, `MuscleDistribution`, `PatternDistribution`
   - `BuilderExercise.is_compound: boolean | undefined` — tri-état : true (composé), false (isolation), undefined (auto-dérivé)

2. **`lib/programs/intelligence/catalog-utils.ts`** — utilitaires catalogue
   - `normalizeMuscleSlug()` — normalise les slugs EN → FR (backward compat)
   - `getStimulusCoeff(slug, pattern, isCompound)` — dérivation runtime identique au script de génération
   - `resolveExerciseCoeff()` — chaîne priorité : catalogue JSON → is_compound coach → auto depuis muscles
   - 15 tests Vitest passants

3. **`lib/programs/intelligence/scoring.ts`** — 6 sous-moteurs de scoring
   - `scoreBalance()` — ratio push/pull (seuils par goal, alertes critical/warning)
   - `scoreSRA()` — fenêtres récupération musculaire (SRA_WINDOWS + modulation level), alertes critical ≤50% fenêtre, warning ≤80%
   - `scoreRedundancy()` — paires redondantes (même pattern + mêmes muscles + coeff similaire <0.20 d'écart)
   - `scoreProgression()` — RIR initial : critical si RIR=0 semaine 1, info si trop élevé
   - `scoreSpecificity()` — score pondéré par stimCoeff, alerte GOAL_MISMATCH si <0.5
   - `scoreCompleteness()` — patterns requis par goal (REQUIRED_PATTERNS), alerte MISSING_PATTERN
   - `buildIntelligenceResult()` — agrégation + globalScore pondéré + narrative + distribution musculaire + patternDistribution
   - 17 tests Vitest passants

4. **`lib/programs/intelligence/alternatives.ts`** — moteur alternatives
   - `scoreAlternatives()` — score 5 critères (pattern +40, muscles +30, équipement +20, non-redondant +10, pénalité stimCoeff -15)
   - Filtre équipement par archétype (`ARCHETYPE_EQUIPMENT`)
   - Retourne max 8 alternatives triées avec label qualitatif

5. **`lib/programs/intelligence/index.ts`** — API publique
   - `useProgramIntelligence(sessions, meta)` — hook React, debounce 400ms, retourne `{ result, alertsFor(si, ei) }`
   - Re-export de tous les types et fonctions utiles

6. **`components/programs/ProgramIntelligencePanel.tsx`** — panel sticky 280px
   - Score global animé Framer Motion, barre segmentée subscores
   - Radar musculaire (Recharts RadarChart, 10 axes)
   - Donut patterns Push/Pull/Jambes/Core (Recharts PieChart)
   - Grille 2×3 subscores avec couleurs dynamiques
   - Feed alertes (max 3 visibles, expand)
   - Collapsible

7. **`components/programs/IntelligenceAlertBadge.tsx`** — alertes inline
   - Max 2 alertes visibles sous chaque exercice, expand au clic
   - Dismiss local (state, non persisté)
   - Bouton "Voir les alternatives" → ouvre le drawer

8. **`components/programs/ExerciseAlternativesDrawer.tsx`** — drawer alternatives
   - 5 filtres : Toutes, Même équipement, Autre équipement, Plus simple, Plus difficile
   - GIF thumbnail, label qualitatif, score stimulus, muscles ciblés
   - Bouton "Remplacer" → patch exercice + fermeture drawer

9. **`components/programs/ProgramTemplateBuilder.tsx`** — intégration
   - `is_compound: boolean | undefined` ajouté à `Exercise` interface et `emptyExercise()`
   - Checkbox tri-état inline (auto ↔ composé ↔ isolation) après les metadata
   - `scapular_elevation` ajouté à `MOVEMENT_PATTERNS`
   - `useProgramIntelligence` câblé, panel + badge + drawer intégrés
   - `is_compound` persisté depuis `initial` data (load template existant)

10. **`components/programs/ExercisePicker.tsx`** — `onSelect` transmet `isCompound`

**Points de vigilance :**
- `useProgramIntelligence` est dans `index.ts` avec directive `'use client'` — ne pas l'importer depuis un Server Component
- La directive `'use client'` sur `index.ts` force tout le moteur en mode client — les fonctions pures de `scoring.ts` et `catalog-utils.ts` restent importables côté serveur si importées directement (pas via index)
- SRA boundaries : `hours <= window * 0.5` (critical) et `hours <= window * 0.8` (warning) — les bornes sont inclusives
- `scoreRedundancy` : threshold `0.20` (pas 0.15) pour capturer les variations machine vs. barre libre d'un même pattern
- Timeline RIR par semaine (LineChart) et bar chart volume par session hors scope Phase 1 — données insuffisantes dans le builder actuel
- `is_compound: undefined` dans le drawer `onReplace` — reset intentionnel pour que le coeff soit recalculé depuis le nouveau nom d'exercice

**Next Steps — Program Intelligence Phase 2 :**
- [ ] Intégration profil client (blessures, préférences) dans le moteur de scoring
- [ ] Timeline RIR par semaine (LineChart) quand le builder supportera les données hebdomadaires distinctes
- [ ] Mini bar chart volume par session (`patternDistribution` par session)
- [ ] Exercices custom coach persistés en DB (POST /api/exercises/custom) + badge "Perso" dans ExercisePicker
- [ ] Supersets — détecter et scorer les paires superset
- [ ] Prédictions automatiques sets/reps/RIR depuis l'historique client

---

## 2026-04-17 — i18n client app complet (FR/EN/ES)

**Ce qui a été fait :**

1. **`lib/i18n/clientTranslations.ts`** — dictionnaire centralisé
   - 3 fonctions : `ct(lang, key, vars?)`, `ctp(lang, key, n)` (pluriel), `cta(lang, key)` (arrays)
   - Couverture complète : BottomNav, Home, Programme, SessionLogger, Recap, Bilans, Progress, Profil, Logout

2. **`components/client/ClientI18nProvider.tsx`** — provider React `'use client'`
   - Charge depuis `localStorage` (instant, 0 flash) puis sync depuis `/api/client/preferences` (authoritative)
   - Expose `useClientT()` → `{ lang, t, tp, ta }`

3. **`app/client/layout.tsx`** — wrappé par `<ClientI18nProvider>`, toutes les routes `/client/` ont le contexte

4. **Pages Server Components** (Home, Programme, Bilans, Recap, Profil) :
   - Fetch `client_preferences.language` au render → appel `ct()` direct
   - `dateLocale` adapté selon langue pour `.toLocaleDateString()`

5. **Composants Client** (BottomNav, ContextualGreeting, SessionLogger, LogoutButton, ProgressClientPage, ProgressHeatmap, PRsPodium) :
   - `useClientT()` → `t()` / `ta()` / `tp()`

6. **`components/client/profile/PreferencesForm.tsx`** — après save :
   - `localStorage.setItem('client_lang', lang)` + `window.location.reload()` → applique immédiatement

**Points de vigilance :**
- Pages Server Component fetchent la langue à chaque requête (pas de cache stale)
- Premier rendu client : flash potentiel 'fr' → langue réelle, atténué par localStorage
- `cta()` obligatoire pour les clés array (jours, mois) — `ct()` castrait en string et planterait
- Erreurs TS pré-existantes dans `stripe/webhook` et `BodyFatCalculator` hors périmètre i18n

**Next Steps :**
- [ ] Traduire les labels du `ProfileForm` et `NotificationsPanel` (actuellement hardcodés FR)
- [ ] Traduire les messages d'erreur des API routes côté client

---

## 2026-04-16 — Muscles primaires/secondaires + BodyMap 3 états

**Ce qui a été fait :**

1. **`supabase/migrations/20260416_exercise_muscles.sql`** — migration DB
   - `coach_program_template_exercises.primary_muscles text[] default '{}'`
   - `coach_program_template_exercises.secondary_muscles text[] default '{}'`
   - `program_exercises.primary_muscles text[] default '{}'`
   - `program_exercises.secondary_muscles text[] default '{}'`

2. **`lib/client/muscleDetection.ts`** — refonte complète
   - `ExerciseInput` : `{ name, primary_muscles?, secondary_muscles? }`
   - `MuscleActivation` : `{ primary: Set<MuscleGroup>, secondary: Set<MuscleGroup> }`
   - Priorité : colonnes DB → fallback regex (legacy préservé)
   - Primaire prime toujours sur secondaire

3. **`components/client/BodyMap.tsx`** — 3 états visuels
   - Props : `primaryGroups` + `secondaryGroups`
   - Primaire `#1f8a65` / Secondaire `rgba(31,138,101,0.28)` / Inactif gris

4. **`app/client/programme/page.tsx`** + **`recap/[sessionLogId]/page.tsx`** mis à jour

5. **`components/programs/ProgramTemplateBuilder.tsx`** — chips inline par exercice

6. **API routes** — persist + propagation à l'assignation

**Points de vigilance :**
- Exercices existants avec `primary_muscles = []` → fallback regex (rétrocompatible)
- Fallback regex = tout en primaire, jamais de secondaires automatiques

**Next Steps :**
- [ ] UI coach muscles sur programmes assignés directs (pas seulement templates)
- [ ] Afficher légende primaire/secondaire sous le BodyMap côté client

---

## 2026-04-14 — BioNorms : valeur de vérité par métrique + badge source

**Ce qui a été fait :**

1. **`lib/health/healthMath.ts`** — constante `DERIVED_FORMULAS`
   - Map `field_key → formule lisible` pour toutes les métriques dérivées (bmi, lean_mass_kg, etc.)

2. **`lib/health/useBiometrics.ts`** — refonte agrégation
   - Accepte `clientId` au lieu de `submissionId`
   - Fetch toutes les `assessment_submissions` completed du client (order ASC par bilan_date)
   - Construit `latestMeasured: Record<field_key, { value, date }>` — la valeur la plus récente par métrique, toutes sources confondues (bilan, saisie manuelle, CSV import)
   - `deriveMetrics` ne calcule que les métriques absentes de `latestMeasured`
   - Expose `metricSources: Record<string, MetricSource>` avec `type: 'measured' | 'derived'`, `date`, et `formula?`

3. **`components/health/BioNormsGauge.tsx`** — badge source
   - `SourceBadge` : puce verte "Mesuré le JJ/MM" ou puce grise "Calculé le JJ/MM" cliquable → tooltip formule (font-mono)

4. **`components/health/BioNormsPanel.tsx`** — signature mise à jour
   - Accepte `clientId` (plus de `submissionId` ni `bilanDate`)
   - Passe `metricSources[ev.metric_key]` à chaque `BioNormsGauge`
   - Skeleton mis à jour avec ligne source badge

5. **`components/clients/MetricsSection.tsx`** — appel mis à jour
   - `<BioNormsPanel clientId={clientId} ...>`

**Points de vigilance :**
- `normsSubmissionId` dans MetricsSection est conservé comme gate (désactive l'onglet Normes si aucune submission avec poids+taille) — il ne sert plus au fetch
- La Navy suggestion est no-op en mode multi-submission (applyNavySuggestion = vide) — cas marginal acceptable Phase 1
- `lean_mass_kg` est cherché dans `latestMeasured` comme field_key direct — si un coach entre cette valeur via saisie manuelle, elle prime sur le calcul bidirectionnel
- Une valeur saisie manuellement le 12/04 pour `lean_mass_kg` prend la priorité même si un bilan plus récent du 14/04 ne contient pas ce champ

---

## 2026-04-14 — SessionLogger V2 — Refonte complète

**Ce qui a été fait :**

1. **`supabase/migrations/20260414_session_logger_v2.sql`** — migration DB
   - `program_exercises.image_url text` — URL image/GIF de l'exercice
   - `program_exercises.is_unilateral boolean default false` — flag exercice unilatéral
   - `client_session_logs.exercise_notes jsonb default '{}'` — notes de ressenti client par exercice
   - `client_set_logs.side text check (left/right/bilateral)` — côté pour les exercices unilatéraux

2. **`app/api/session-logs/route.ts`** — fix FK constraint critique
   - Vérification existence `program_session_id` via `.maybeSingle()` avant l'insert
   - Si la session n'existe plus → `resolvedSessionId = null` (évite le crash FK)
   - `rir_actual` et `side` désormais inclus dans le mapping `client_set_logs`
   - `exercise_notes` (JSONB) sauvegardé dans `client_session_logs`

3. **`app/client/programme/session/[sessionId]/page.tsx`** — enrichissement server-side
   - Fetch `image_url` et `is_unilateral` depuis `program_exercises`
   - Détection unilatéral hybride : flag DB OU regex sur le nom (unilateral/single/alterné/1 bras...)
   - Fetch historique `client_set_logs` dernière séance → `lastPerformance` passé au SessionLogger

4. **`app/client/programme/session/[sessionId]/SessionLogger.tsx`** — refonte totale
   - DS v2.0 dark : fond `#121212`, bordures `border-white/[0.06]`, accent `#1f8a65`
   - Vue focalisée : un exercice à la fois, navigation dots + flèches prev/next
   - Image/GIF : collapsible (80px réduit → 240px ouvert), gradient overlay, bouton "Voir la démo"
   - RIR cible affiché dans le header ; RIR ressenti saissable sur **tous** les sets (pas seulement double progression)
   - Exercices unilatéraux : génère des sous-sets L (Gauche, bleu) et R (Droite, violet) par série
   - Historique dernière perf : affiché en placeholder `↩ 80kg × 8` sous "Prévu"
   - Chrono repos : modal plein écran avec barre de progression animée + bouton "Passer le repos"
   - Note de ressenti : textarea par exercice, toggle via icône MessageSquare, sauvegardée en JSONB
   - Bouton "Terminer" : DS v2.0 (icône droite, bg accent, style TopBar boutons)

5. **`app/client/layout.tsx`** — PWA complète
   - `export const metadata` avec `appleWebApp` (capable, statusBarStyle, title)
   - `export const viewport` avec `themeColor: '#121212'`, `userScalable: false`

6. **`public/manifest.json`** — couleurs DS v2.0
   - `background_color` et `theme_color` mis à jour de `#0e0e0e` → `#121212`

**Points de vigilance :**
- `image_url` sur `program_exercises` est NULL par défaut — les exercices sans image n'affichent pas de section image (conditionnel `currentEx.image_url &&`)
- Les GIF ne passent pas par Next.js Image optimization (`unoptimized` prop conditionnelle sur `.gif`)
- La note de ressenti est stockée en JSONB `{ "<exercise_id>": "texte" }` dans `client_session_logs` — pas de table séparée (extensible Phase 2 : rating/emoji)
- `lastPerformance` est construit server-side par un fetch unique — si le client a >200 sets récents, la limite peut tronquer certains exercices (acceptable Phase 1)
- Le `sw.js` était déjà fonctionnel (stale-while-revalidate pages client, cache-first assets statiques) — seules les couleurs manifest ont été mises à jour

**Next Steps — SessionLogger Phase 2 :**
- [ ] Afficher `image_url` dans le formulaire de création d'exercice coach (interface pour uploader ou lier une image)
- [ ] Flag `is_unilateral` dans l'UI coach lors de la création d'exercice (checkbox)
- [ ] Notification push (Web Push API) quand le repos est terminé — requires VAPID keys
- [ ] Vue récap post-séance : résumé des sets avec delta vs dernière fois
- [ ] Note de ressenti globale (pas par exercice) — champ texte libre en fin de séance

---

## 2026-04-13 — Système d'accès client unifié

**Ce qui a été fait :**

1. **`app/api/clients/[clientId]/invite/route.ts`** — logique unifiée
   - Nouveau compte : `admin.createUser` + `admin.generateLink({ type: 'recovery' })` → email Namecheap
   - Compte existant : `admin.updateUserById({ ban_duration: 'none' })` + email "accès restauré"
   - Plus aucun appel à `generateLink({ type: 'invite' })` — évite l'email Supabase built-in parallèle

2. **`app/api/clients/[clientId]/access/route.ts`** — suspension via ban Supabase
   - `admin.updateUserById({ ban_duration: '87600h' })` + `status = 'suspended'`

3. **`app/api/client/welcome/route.ts`** — nouveau endpoint
   - Appelé depuis `/client/set-password` après création du mot de passe
   - Envoie `sendWelcomeEmail` avec lien `/client/login`

4. **`lib/email/mailer.ts`** — 2 nouvelles fonctions
   - `sendReactivationEmail` — email coach restaure accès
   - `sendWelcomeEmail` — email bienvenue après set-password

5. **`components/clients/ClientAccessToken.tsx`** — UI mise à jour
   - Badge "Suspendu" (amber) distinct de "Inactif"
   - Bouton "Restaurer l'accès" pour les clients suspendus

6. **`utils/supabase/middleware.ts`** — vérification `status=suspended` (au lieu de `inactive`)

7. **System B supprimé** — `access-token/route.ts` + `client/access/[token]/route.ts`

**Points de vigilance :**
- `generateLink({ type: 'recovery' })` ne déclenche pas d'email Supabase — c'est intentionnel
- La suspension utilise `ban_duration: '87600h'` (10 ans) car Supabase n'a pas de "permanent ban"
- La réactivation utilise `ban_duration: 'none'` pour débannir
- `listUsers()` est appelé à chaque invitation pour détecter si le compte existe — acceptable < 1000 users
- L'email de bienvenue est non-bloquant dans `/client/set-password` (fire and forget)
- La table `client_access_tokens` est conservée en DB mais n'est plus alimentée
- Les clients avec `status='active'` sans compte Supabase → "Renvoyer l'invitation" les crée via le path `existingUser=false`

---

## 2026-04-13 — Suppression / Archivage Client

**Ce qui a été fait :**

1. **`app/api/clients/[clientId]/route.ts`** — nouveau handler `DELETE`
   - `?mode=archive` : révoque les `client_access_tokens` + passe `status='archived'`
   - `?mode=delete` : cascade FK-safe (assessment_responses → assessment_submissions → client_access_tokens → client_subscriptions → metric_annotations → coach_clients) puis supprime le compte auth Supabase
   - Ownership check avant toute mutation

2. **`components/clients/DeleteClientModal.tsx`** — nouveau composant modal
   - 3 steps : choice / confirming_delete / loading
   - Archive : confirmation simple (1 clic)
   - Hard delete : saisie du nom complet (case-insensitive) requise pour débloquer le bouton
   - Affichage des erreurs API dans les deux steps

3. **`app/coach/clients/[clientId]/page.tsx`** — intégration
   - Bouton "Zone dangereuse" en bas de l'onglet Profil
   - Redirect vers `/coach/clients` après succès

**Points de vigilance :**
- La colonne auth user dans `coach_clients` est `user_id` (pas `auth_user_id`)
- La table annotations s'appelle `metric_annotations` (pas `coach_client_annotations`)
- La suppression n'est pas atomique (pas de transaction Supabase REST) — si le process crash à mi-chemin, les données peuvent être partiellement nettoyées
- Les clients archivés restent en DB avec `status='archived'` — s'assurer que la liste coach filtre ce statut

---

## 2026-04-13 — Superpower Coach Dashboard

**Ce qui a été fait :**

1. **`components/dashboard/types.ts`** — types partagés dashboard
   - `DashboardCoachData`, `DashboardHero`, `DashboardAlert`, `DashboardClient`, `DashboardFinancial`, `ClientMetrics`, `WeightPoint`

2. **`app/api/dashboard/coach/route.ts`** — endpoint agrégé unique
   - Toutes les données en 2 `Promise.all` parallèles (pas de N+1)
   - MRR calculé depuis subscriptions actives × `billingToMonthly` factor
   - 4 types d'alertes : overdue payments (critical), cancelled subscriptions (critical), bilans sans réponse >5j (urgent), clients inactifs >14j (urgent)
   - Clients triés par activité décroissante AVANT slice(0,8)
   - Segmentation statut client : inactive >45j, stagnant >30j, progressing sinon

3. **`components/dashboard/HeroSummary.tsx`** — phrase narrative + command bar 5 stats
4. **`components/dashboard/AlertsFeed.tsx`** — fil d'alertes (max 5, conditionnel)
5. **`components/dashboard/QuickActions.tsx`** — 6 actions fixes + CTA contextuel (toujours visible, fallback "Nouveau client")
6. **`components/dashboard/ClientsSection.tsx`** — segmentation 3 filtres + cards avec sparklines SVG inline + delta poids
7. **`components/dashboard/FinancialStrip.tsx`** — 4 stat cards MRR/mois/pending/overdue
8. **`app/dashboard/page.tsx`** — remplacé intégralement, orchestrateur léger

**Points de vigilance :**
- `last_activity_at` sur `coach_clients` est la source pour la segmentation — si ce champ n'est pas mis à jour côté application, les clients seront tous classés selon leur `created_at`
- Segmentation `progressing` = recency seulement (pas de vérification metric trajectory) — limitation connue Phase 1
- Delta coloring : négatif (perte de poids) = vert `#1f8a65`, positif (prise) = rouge — convention sport/fitness, non littérale
- Le fetch `/api/dashboard/coach` échoue silencieusement — pas d'état d'erreur UI en Phase 1

**Next Steps — Dashboard Phase 2 :**
- [ ] Améliorer segmentation `progressing` : vérifier trajectory métriques (delta poids sur 30j)
- [ ] Ajouter état d'erreur UI si fetch `/api/dashboard/coach` échoue
- [ ] Badge abonnement en pill distinct sur les cards clients
- [ ] Relier les annotations `lab_protocol` comme marqueurs sur les graphiques MetricsSection
- [ ] Mise à jour automatique de `last_activity_at` sur coach_clients après chaque interaction

---

## 2026-04-12 — Cron expiration abonnements + configuration Vercel

**Ce qui a été fait :**

1. **`app/api/cron/expire-subscriptions/route.ts`** — nouveau endpoint cron POST
   - Authentification : header `x-cron-secret` (variable d'environnement `CRON_SECRET`)
   - Logique :
     - Récupère tous les `client_subscriptions` avec `status='active'` et `end_date < today`
     - Passe ces abonnements au status `'expired'`
     - Pour chaque client affecté, vérifie s'il reste des abonnements actifs
     - Si zéro abonnements actifs restants : passe le client à `status='inactive'`
     - Révoque les access tokens du client via `client_access_tokens.update({ revoked: true })`
   - Retour JSON : `{ processed: N, deactivated: M }`
   - Gestion d'erreur : logs console + réponse 500 si Supabase error

2. **`vercel.json`** — configuration Vercel Cron
   - Chemin : `/api/cron/expire-subscriptions`
   - Schedule : `0 0 * * *` (00:00 UTC quotidien)
   - Format suivant [Vercel Cron documentation](https://vercel.com/docs/cron-jobs)

**Points de vigilance :**
- `CRON_SECRET` doit être défini en `.env.local` ET dans les variables d'environnement Vercel (dashboard)
- Génération : `openssl rand -hex 32`
- Timezone : schedule `0 0 * * *` interprété en UTC par Vercel
- Les clients passent à status `'inactive'` UNIQUEMENT si aucun abonnement actif ne subsiste
- Idempotent : réexécution sur le même jour n'affecte que les abonnements non déjà expirés

**Next Steps :**
- [ ] Tester en dev : POST `/api/cron/expire-subscriptions` avec header valide
- [ ] Configurer `CRON_SECRET` dans Vercel dashboard (Projet → Settings → Environment Variables)
- [ ] Surveiller logs (Vercel Deployments tab) lors du premier cron nightly

---

## 2026-04-12 — Route API d'invitation client

**Ce qui a été fait :**

1. **`app/api/clients/[clientId]/invite/route.ts`** — nouvelle route POST
   - Authentification coach requis (session cookie)
   - Vérification ownership : client appartient au coach courant
   - Récupération email + métadonnées client (`first_name`, `last_name`)
   - Génération lien password setup via `db.auth.admin.generateLink({ type: 'recovery' })` — crée le compte s'inexistant
   - Envoi email invitation via `sendInvitationEmail` (SMTP Namecheap)
   - Passage du client à status `active` (invitation envoyée)
   - Gestion d'erreur explicite : client absent (404), email absent (422), generateLink error (500), email send error (500)

**Points de vigilance :**
- `db.auth.admin.generateLink` requiert le service role key — accès admin API Supabase
- Le lien `action_link` est valable 1h (défaut Supabase recovery)
- `redirectTo` pointe vers `/client/set-password` — cette route doit exister et gérer le hash Supabase
- `coach_clients.status` est mis à jour à `active` — la DB doit supporter cette colonne + valeur

**Next Steps :**
- [ ] Route GET `/client/set-password` pour consommer le lien + poser le mot de passe (client side)
- [ ] Tests unitaires sur `POST /api/clients/[clientId]/invite`
- [ ] Workflow n8n (non configuré) : éventuellement audit des invitations via webhook

---

## 2026-04-11 — Normes : waist_height_ratio + âge métabolique

**Ce qui a été fait :**

1. **`lib/health/healthMath.ts`** — nouvelles fonctions et types
   - `calculateWaistHeightRatio(waist_cm, height_cm)` — ratio arrondi 3 décimales
   - `estimateMetabolicAge(bmrActual, sex)` — résolution linéaire 10–90 ans vs BMR référence
   - BMR : Katch-McArdle si `lean_mass_kg` dispo, sinon Mifflin-St Jeor fallback
   - `BiometricInputs.metabolic_age?` (valeur mesurée balance)
   - `DerivedMetrics` : `waist_height_ratio`, `metabolic_age_estimated`, `metabolic_age_source`

2. **`lib/health/bioNorms.ts`** — 2 nouvelles normes (11 métriques au total)
   - `waist_height_ratio` : seuil 0.5 universel, Savva et al. 2010
   - `metabolic_age_delta` : zones basées sur delta (métabolique - chronologique)
   - `evaluateAll` étendu : affiche valeur absolue + delta dans le label zone

3. **`lib/assessments/modules.ts`** — champ `metabolic_age` (visible si balance à impédance)

4. **`lib/health/useBiometrics.ts`** + **`recalculate/route.ts`** — intégration end-to-end

**Points de vigilance :**
- `metabolic_age_source` expose la source (`measured` / `estimated_katch` / `estimated_mifflin`) — badge UI à ajouter en Phase 2
- `waist_height_ratio` calculé dans `deriveMetrics` ET upserted en recalculate (idempotent)
- Estimation âge métabolique nécessite `age_at_measurement` — null si date de naissance absente

**Next Steps :**
- [ ] Badge "mesuré" / "estimé (Katch-McArdle)" sur jauge âge métabolique dans BioNormsPanel
- [ ] `waist_height_ratio` dans FIELD_MAP MetricsSection pour les graphiques

---

## 2026-04-11 — Système Bilan bout-en-bout

**Ce qui a été fait :**

1. **`app/coach/clients/[clientId]/bilans/[submissionId]/page.tsx`** — nouvelle page vue bilan coach
   - Affichage complet des réponses groupées par bloc (template_snapshot + assessment_responses)
   - Photos : thumbnails cliquables + viewer modal (signed URL Supabase)
   - Bouton "Modifier" : mode édition inline avec `AssessmentForm` pré-rempli
   - Bouton "Réouvrir" : remet le status `in_progress` + regénère le token
   - Skeleton loading, état d'erreur, gestion statut non-complété

2. **`components/assessments/form/AssessmentForm.tsx`** — enrichissements
   - Props `initialResponses` (pré-remplissage mode édition coach) + `onSaved` (callback post-save)
   - Calculs auto bidirectionnels au changement de valeur numérique :
     - `body_fat_pct` ↔ `fat_mass_kg` (via `weight_kg`)
     - `muscle_mass_kg` ↔ `muscle_mass_pct` (via `weight_kg`)
     - `lean_mass_kg` = `weight_kg × (1 - body_fat_pct/100)`
     - `bmi` = `weight_kg / (height_cm/100)²`

3. **`components/assessments/form/MetricField.tsx`** — guide photos accordion
   - Détection automatique si `helper` commence par "📸"
   - Accordion collapsé par défaut, expand au clic
   - Parsing bullet-points avec emphase sur le label avant ":"

4. **`lib/assessments/modules.ts`** — corrections cohérence
   - Module Photos : helper guide complet (angle, distance, lumière, fond, tenue, pose, respiration, résolution) sur les 6 champs photo
   - `hip_cm` renommé `hips_cm` (alignement avec MetricsSection)
   - Ajout `arm_cm`, `thigh_cm`, `calf_cm` (mesures agrégées visibles — cohérence avec MetricsSection FIELDS)

5. **`app/api/assessments/public/[token]/responses/route.ts`**
   - Email de notification coach : `dashboardUrl` pointe désormais vers `/coach/clients/${clientId}/bilans/${submissionId}`

6. **`app/client/bilans/[submissionId]/page.tsx`**
   - Fix bug : `submission.status` → `submissionData.status` (variable non définie)

**Points de vigilance :**
- Les données existantes en DB avec la clé `hip_cm` restent stockées sous cette clé — les nouveaux bilans utiliseront `hips_cm`. Les deux seront affichés dans MetricsSection si présents.
- Le mode édition coach via `AssessmentForm` (isCoach=true) ne revalide pas les champs required — le coach peut sauvegarder partiellement. C'est intentionnel.
- Les calculs auto bidirectionnels s'appliquent uniquement sur les champs numériques. Si les champs source/cible ne sont pas dans le template du bilan courant, `findBlockId` retourne null silencieusement.

**Next Steps — Bilan Phase 2 :**
- [ ] Lien "Voir le bilan" dans SubmissionsList : déjà corrigé (redirige vers `/coach/clients/${clientId}/bilans/${s.id}`)
- [ ] Page client `/client/bilans/[submissionId]` : affichage complet + bouton "Demander modification" (envoyer message au coach)
- [ ] Afficher indicateur "calculé automatiquement" sur les champs dérivés dans le formulaire
- [ ] Déclencher recalculate automatiquement après save d'une response biométrique

---

## 2026-04-11 — Moteur Physiologique : healthMath + bioNorms + BioNormsPanel

**Ce qui a été fait :**

1. **`lib/health/healthMath.ts`** — nouveau module pur (zéro dépendances)
   - Source de vérité mathématique pour toutes les métriques biométriques
   - Types : `BiometricInputs`, `DerivedMetrics`, `NavySuggestion`, `Sex`
   - Calculs bi-directionnels : `body_fat_pct` ↔ `fat_mass_kg`, `muscle_mass_kg` ↔ `muscle_mass_pct`
   - `deriveMetrics()` — orchestrateur avec chaîne de priorité : valeur mesurée → calcul bi-directionnel → suggestion Navy (jamais auto-appliquée)
   - Gardes : division par zéro, log10(<=0), lean_mass négatif, arrondis systématiques
   - `navyBodyFatPct()` — Hodgdon & Beckett 1984 + Siri 1961, citée NHRC Report 84-29

2. **`lib/health/bioNorms.ts`** — module de normes physiologiques
   - 9 métriques : bmi, body_fat_pct, visceral_fat_level, body_water_pct, muscle_mass_pct, bone_mass_kg, waist_cm, waist_hip_ratio, lean_mass_kg
   - Normes croisées Âge × Sexe (tranches 18-29, 30-39, 40-49, 50-59, 60+)
   - 5 zones : optimal → good → average → poor → high_risk
   - Sources : OMS, ACE, EFSA, IOF, IDF, Janssen 2000, Kyle 2003, Tanita
   - Tooltips scientifiques : source, année, note physiologique, lien externe

3. **`lib/health/useBiometrics.ts`** — hook React pont DB ↔ healthMath
   - Charge assessment_responses depuis Supabase, appelle `deriveMetrics` + `evaluateAll`
   - Expose : derived, evaluations, criticalAlerts, navySuggestion, applyNavySuggestion, refetch
   - `applyNavySuggestion` : POST responses + POST recalculate + refetch

4. **`app/api/assessments/submissions/[submissionId]/recalculate/route.ts`**
   - POST endpoint scopé à une submission_id (isolation temporelle garantie)
   - Recalcule BMI, fat_mass_kg, lean_mass_kg, body_fat_pct, muscle_mass_pct, muscle_mass_kg
   - Âge au moment de la saisie calculé depuis `bilan_date - date_of_birth`

5. **`components/health/BioNormsGauge.tsx`** — jauge individuelle DS v2.0
   - Barre segmentée 5 zones, ZoneBadge couleur dynamique, InfoTooltip scientifique
   - Bordure rouge si `is_critical`

6. **`components/health/BioNormsPanel.tsx`** — panel complet
   - Alertes critiques en tête, bandeau Navy, 3 sections groupées
   - Loading skeleton, état vide

7. **`components/health/NavySuggestionBanner.tsx`** — bandeau suggestion Navy
   - État `applying` + `dismissed`, suggestion non auto-appliquée

8. **`components/clients/MetricsSection.tsx`** — intégration
   - Nouveau mode vue "Normes" (4ème onglet, toujours actif)
   - `BioNormsPanel` affiché pour la submission la plus récente du client

9. **`lib/assessments/modules.ts`** — ajout champ `muscle_mass_pct`
   - Champ dérivé automatiquement depuis `muscle_mass_kg / weight_kg × 100`

10. **`lib/formulas/bodyFat.ts`** — refactoring
    - `navyBodyFat()` délègue à `healthMath.navyBodyFatPct` (zéro duplication)

**Points de vigilance :**
- `muscle_mass_pct` est dans les assessment modules mais PAS dans une migration DB — il est stocké comme `value_number` dans `assessment_responses` (même table, champ dynamique JSONB-like)
- Le recalcul rétroactif est scopé par `submission_id` — impossible de contaminer d'autres dates
- La suggestion Navy est JAMAIS auto-appliquée — toujours via bandeau explicite
- `body_fat_source` n'a que 2 valeurs : `'measured' | 'unavailable'` — `'navy_estimated'` a été supprimé (dead code)

**Next Steps — Moteur Physiologique Phase 2 :**
- [ ] Déclencher `recalculate` automatiquement après save d'une response biométrique (actuellement appel manuel ou via applyNavySuggestion)
- [ ] Afficher `muscle_mass_pct` dans les graphiques MetricsSection (actuellement pas dans FIELD_MAP)
- [ ] Étendre `BioNormsPanel` à la vue client (/client/bilans/[submissionId])
- [ ] Connecter Lab → BioNormsPanel (annotations `lab_protocol` comme marqueurs)

---

## 2026-04-11 — Lab Evolution Phase 1 : Mode Client & Validation Protocole

**Ce qui a été fait :**

1. **`app/outils/macros/MacroCalculator.tsx`** — refonte complète
   - Mode switcher 3 positions : Manuel / Semi-Auto (actif) / Full-Auto (locked, bientôt)
   - En mode Semi-Auto : barre de recherche client dynamique (debounce 300ms) + injection auto des données biométriques (poids, BF%, âge, taille, sexe, fréquence, objectif)
   - Panneau ajustements avancés (visible après calcul) : slider calorique -30/+30%, bascule grammes/%, ancrage protéines (lock), bouton "Standard Lab"
   - Ancrage protéines : quand actif, l'ajustement calorique ne touche que les glucides
   - Modal de validation : diff automatique vs. protocole précédent, badge "Majeur" si delta > seuil (5% calories/protéines, 10% lipides), cases à cocher par changement, champ contexte libre
   - Actions modal : "Valider sans annotation" (données seules) ou "Valider & Ancrer" (données + annotation `lab_protocol` sur timeline client)
   - Design DS v2.0 — fond `#121212`, cards `bg-white/[0.02]`, accent `#1f8a65`

2. **`lib/lab/useLabClientSearch.ts`** — nouveau hook
   - Recherche client par nom/email via `GET /api/lab/client-search`
   - Debounce 300ms, état : query / results / loading / selected
   - API : `search(q)`, `select(client)`, `clear()`

3. **`app/api/lab/client-search/route.ts`** — nouveau endpoint
   - `GET /api/lab/client-search?q=...` — authentifié coach
   - Recherche dans `coach_clients` par `name.ilike` ou `email.ilike`
   - Enrichit avec les dernières valeurs `weight_kg` et `body_fat_pct` depuis `assessment_submissions → assessment_responses`
   - Limité à 8 résultats

4. **`app/api/clients/[clientId]/annotations/route.ts`**
   - Ajout de `'lab_protocol'` dans l'enum `event_type` du schema Zod

**Points de vigilance :**
- Le modal de validation nécessite un client sélectionné (mode Semi-Auto) — le bouton "Valider le Protocole" n'apparaît pas en mode Manuel
- Le diff compare avec `prevProtocol` (state local) — réinitialisé à chaque nouveau client sélectionné ou rechargement de page
- `getLabStandard()` est défini dans le composant mais le bouton "Standard Lab" fait pour l'instant un recalc à 0% d'ajustement — logique d'application complète à connecter en Phase 2
- L'event_type `lab_protocol` est ajouté côté validation Zod uniquement — la DB Supabase supporte les strings libres (pas d'enum SQL), donc pas de migration nécessaire

**Next Steps — Lab Phase 2 :**
- [ ] Connexion Lab → MetricsSection : afficher les annotations `lab_protocol` sur les graphiques (marqueurs verticaux)
- [ ] Filtres Métriques : "Événements Coach" vs "Événements Client"
- [ ] Full-Auto : algorithme de recommandation basé sur `ClientTargetPriority` + historique métriques
- [ ] Étendre le mode Semi-Auto aux autres outils (Body Fat, 1RM, etc.)
- [ ] Protocol Canvas : builder drag & drop de blocs (Phase 3)

---

## Process de mise à jour

Mettre à jour après :

- Toute feature significative → "Dernières avancées" + "État des modules"
- Bug critique résolu → section module concerné
- Changement architectural → "Points de vigilance"
- Nouveaux next steps → liste ci-dessus

Format : toujours dater les sections avec `## YYYY-MM-DD — [Nom]`.
