# STRYVR — État Vivant du Projet (Condensé)

> **Source de vérité tactique** sur l'état actuel de STRYVR.
> 
> **STRATEGIC REFERENCE** → `docs/STRYVR_STRATEGIC_VISION_2026.md` (vision, pillars, roadmap)
>
> **Historique détaillé** → voir `project-state-archive.md` (toutes les sessions antérieures à 2026-04-27)

**Dernière mise à jour : 2026-04-28**

---

## 🎯 État Stratégique Global

| Métrique | Statut |
|----------|--------|
| Phase | MVP Phase 1 ✅ Complet → Phase 2 Prêt |
| Architecture | Solide (Supabase RLS, Inngest, TypeScript strict) |
| Performance | Excellent (< 300ms API, real-time scoring) |
| Adherence focus | ✅ 5-min client app target atteint |
| Roadmap | Phase 2 Q3 2026 : wearables, export, IA coach |

---

## 📦 Modules Core Status

| Module | Statut | Dernière Update |
|--------|--------|-----------------|
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics complet | 2026-04-26 |
| **Client App** | ✅ Session logging, PWA, weights, superset UX, bug fixes | 2026-04-28 |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync | 2026-04-26 |
| **MorphoPro Bridge** | ✅ Phase 1 complet (galerie + canvas + analyse IA structurée) | 2026-04-28 |
| **Design System v2.0** | ✅ Dark flat minimal DS-compliant | 2026-04-27 |
| **Coach Dashboard** | ✅ MRR, alerts, client segmentation | 2026-04-13 |
| **Client Onboarding** | ✅ 5-screen tour + guided tooltip tour | 2026-04-27 |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 | 2026-04-27 |

---

## 🚀 Dernières Avancées (2026-04-28)

### SessionLogger — 5 Bugs Critiques Corrigés (COMPLET)

**Bugs résolus :**

1. **`parseSetForApi()`** (`SessionLogger.tsx`) — Fix bug `|| null` : `parseFloat("0") → 0 → falsy → null`. Les valeurs 0 sont maintenant correctement persistées.
2. **Home page** (`app/client/page.tsx`) — Fetch `client_session_logs` complétés du jour pour masquer le CTA séance si déjà faite. Affichage "Séance réalisée ✓" avec option "Refaire".
3. **muscleDetection.ts** — `CATALOG_SLUG_MAP` étendu aux slugs FR anatomiques : `trapeze_superieur`, `grand_dorsal`, `trapezes`, `lombaires`, `deltoide_*`, `ischio_jambiers`, etc. Les muscles stockés par l'intelligence engine (FR anatomique) sont maintenant détectés.
4. **Rest timer** (`scheduleModalOpen`) — Délai 3s → 8s, modal bloqué pendant saisie active (`activeInputRef`). Si input focusé, replanifie dans 5s.
5. **Superset UX** — Navigation par groupe (superset ou solo). Exercices d'un même `group_id` affichés en cartes empilées verticalement. Repos déclenché uniquement après le dernier exercice du groupe. Label "Superset · N exercices" + séparateur coloré.

**Points de vigilance :**
- `activeInputRef` est un `useRef` (pas state) pour éviter les re-renders lors de la saisie
- Le repos de superset passe `restSecForToggle = null` pour les exercices non-finaux → pas de timer intermédiaire
- `exerciseGroups` est recalculé à chaque render (stable, exercices ne changent pas)
- Les dots de navigation représentent maintenant des groupes, pas des exercices individuels
- `currentExIndex` est dérivé de `exerciseGroups[currentGroupIndex][0]` — rétrocompatibilité avec les getters lastPerf

### MorphoPro — Refonte Complète Phase 1 (COMPLET)
- ✅ `morpho_photos` + `morpho_annotations` tables + RLS (migrations `20260428_morpho_photos_annotations.sql` + `20260428_morpho_analyses_extend.sql`)
- ✅ Prompt GPT-4o structuré (`response_format: json_object`) — analyse posturale + asymétries + flags + recommandations + score 0–100
- ✅ Analyse synchrone (plus Inngest) — résultat immédiat avec `maxDuration = 60` sur la route `/api/morpho/analyze`
- ✅ Galerie avec filtres position/source, sélection multi, barre flottante (Comparer/Annoter/Analyser)
- ✅ Upload coach direct (bucket `morpho-photos`) + auto-sync photos des bilans
- ✅ Canvas Fabric.js v6 : 7 outils (select/ligne/crayon/rect/cercle/texte/gomme), undo/redo, zoom, save thumbnail, export PNG
- ✅ Panel résultats : score 0–100, flags zones, attention_points, recommandations, asymétries cm, stimulus chips, évolution chart
- ✅ Comparaison multi-photos : layouts 1×2 / 2×2 / 1+3, overlay opacité
- ✅ `stimulus_adjustments` conservés → scoring programme inchangé
- ⚠️ Actions manuelles requises : appliquer les 2 migrations SQL via Supabase Dashboard + créer bucket `morpho-photos` dans Supabase Storage

### Client Onboarding — 5-Screen Tour + Guided Tooltip (COMPLET)
- ✅ `/app/client/onboarding/page.tsx` : flow complet (exchange → password → 5 écrans welcome)
- ✅ 5 écrans swipables : bienvenue personnalisé (prénom), programme, séance en temps réel, progression/nutrition, hub dashboard
- ✅ Prénom récupéré depuis `user.user_metadata.first_name` après session établie
- ✅ `components/client/OnboardingTour.tsx` : tooltip tour guidé, 5 étapes, non-skippable
- ✅ Tour déclenché au premier load `/client` via `localStorage('onboarding_tour_done')`
- ✅ Tour intégré dans `ConditionalClientShell` — disponible sur toutes les pages authentifiées
- ✅ Placeholder conditionnel prévu pour la feature Daily Check-ins (Phase 2)
- ✅ Spec Daily Check-ins documentée : `docs/superpowers/specs/2026-04-27-daily-checkins-spec.md`

### Nutrition Studio — 11-Task UX Refactor (COMPLET)
- ✅ Tasks 1-10 : info modals, carb cycling toggle, action buttons TopBar
- ✅ Task 10 : TopBar buttons (Eye, Save, Send icons), loading states
- ✅ Résultat : Col 3 ~120px moins scrolling, UX plus claire
- ✅ Tous les commits atomiques, zero TypeScript errors

---

## 🔑 Points de Vigilance (Actuels)

| Problème | Impact | Mitigation |
|----------|--------|-----------|
| Supabase Redirect URLs | Onboarding brisé si pas whitelisted | Ajouter `/client/onboarding` manuellement |
| Client pool auth | Race conditions rares | Session établie AVANT form render |
| Data validation 85 anomalies | Calcul macros | Clamping 15–240 en place |

---

## 📅 Next Steps — Phase 2 (Immédiat)

- [ ] E2E test : invite → onboarding → 5 écrans → dashboard → tooltip tour complet
- [ ] Daily Check-ins Phase 2 : DB schema, coach config UI, client time picker, Inngest cron, Web Push
- [ ] Système de points gamification (check-ins, séances, bilans)
- [ ] Mobile : TopBar buttons responsive, SessionLogger < 480px
- [ ] Monitoring : dropoff rates onboarding par step
- [ ] Optional : profil rapide ou sélection programme dans onboarding
- [ ] Wearables : Apple Health, Oura (Phase 2, ~6 weeks)
- [ ] Export : PDF/CSV/JSON programme (Phase 2, ~4 weeks)
- [ ] IA Coach : bulk protocol generation (Phase 2, ~8 weeks)

---

## 🗂️ Architecture Clés

**Database** : Supabase PostgreSQL + Prisma
- RLS multi-tenant, migrations via Prisma, seeds idempotent

**Async Jobs** : Inngest
- morpho/analyze.requested (OpenAI Vision, retry x3, timeout 5min)

**Real-time Intelligence** : Program builder
- 6 subscores, morpho stimulus adjustments, client profile integration

**Design System** : DS v2.0 (Dark flat minimal)
- Background #121212, cards bg-white/[0.02], accent #1f8a65, borders 0.3px white/[0.06]

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
4. **DS v2.0 Strict** — `#121212` unique, jamais `#181818` en bg
5. **RLS + Ownership Checks** — API routes securisées
6. **Inngest Only** — zéro `setImmediate`, tous jobs async via Inngest

---

**Voir `.claude/rules/project-state-archive.md` pour l'historique complet.**
