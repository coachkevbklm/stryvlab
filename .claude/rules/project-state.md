# STRYVR — Project State

> État courant du produit. Mettre à jour à chaque feature majeure.

## Modules

| Module | Statut | Dernière MAJ |
|--------|--------|--------------|
| **Chat/Check-in Coherence** | 🚧 Foundation — registre canonique champs + DailyFacts (source unique) | 2026-06-01 |
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

**Points de vigilance :**
- Incohérence form ↔ config ↔ messages sur les clés champs : DB a `rhr_morning`/`weight_kg`, le form les remplit, mais la config coach ne les exposait pas. Registre canonique = correctif.
- tsc projet a des erreurs pré-existantes (tests session-logs, InfoModal `@testing-library` manquant) non liées à ce travail.

## Dernières avancées — 2026-05-29 Phase Optimization Engine

- **`lib/coach/phaseEngine/`** — `types.ts`, `copy.ts`, `signals.ts` (decay temporel + normalizers), `engine.ts` (scoring vectoriel + safety gates), `prefs.ts` (dérivation depuis `training_goal`)
- **API** — `GET /api/clients/[clientId]/phase-optimization?window=7–90`
- **UI** — `PhaseOptimizationWidget` (quadrant 2D SVG, Framer Motion, micro-copy, decision trace, metric cards)
- **Retrait** — `computeOptimalPhase`, `TransformationPhaseWidget`, `phaseRecommendation` dans transformation score
- **Tests** — `tests/lib/phaseEngine/signals.test.ts`, `engine.test.ts`, `override.test.ts`

## Dernières avancées — 2026-05-30 Phase Optimization v2

- **SCHEMA** — `supabase/migrations/20260530_phase_optimization_v2.sql` (`phase_optimization_history`, `coach_clients.phase_override`, `phase_preferences`)
- **`lib/coach/phaseEngine/override.ts`** — parse prefs/override, `applyManualOverride`, `resolveCoachPhasePreferences`
- **`lib/coach/phaseEngine/history.ts`** — snapshot + parse trail pour le quadrant
- **API** — GET enrichi (`historyTrail`, upsert journalier) ; `PATCH /phase-optimization/override`
- **UI** — trajectoire 30j (polyline), panneau ajustement manuel coach
