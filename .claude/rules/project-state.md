# STRYVR — État Vivant du Projet

> **Source de vérité tactique** pour la session actuelle.
>
> **STRATEGIC REFERENCE** → `docs/STRYVR_STRATEGIC_VISION_2026.md` (vision, pillars, roadmap)
>
> **FULL HISTORY** → `.claude/rules/project-state-archive.md` (sessions antérieures, features archivées)

**Dernière mise à jour : 2026-05-08**

---

## 🎯 État Stratégique Global (Snapshot)

| Métrique | Statut |
|----------|--------|
| Phase | MVP Phase 1 ✅ Complet → Phase 2 Prêt |
| Architecture | Solide (Supabase RLS, Inngest, TypeScript strict) |
| Performance | Excellent (< 300ms API, real-time scoring) |
| Focus Client | ✅ 5-min app target atteint |
| Roadmap | Phase 2 Q3 2026 : wearables, export, IA coach |

---

## 📦 Modules Core Status

| Module | Statut |
|--------|--------|
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics |
| **Client App** | ✅ Smart Agenda, meal AI, macro progress |
| **Nutrition Protocols** | ✅ Macros, carb cycling, cycle sync |
| **MorphoPro Bridge** | ✅ Phase 1 (gallery + canvas + AI analysis) |
| **Design System v2.0** | ✅ Dark flat minimal |
| **Coach Dashboard** | ✅ MRR, alerts, segmentation |
| **Client Onboarding** | ✅ 5-screen tour + tooltip guide |
| **Daily Check-ins** | 📋 Spec documentée, Phase 2 |

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

| Problème | Mitigation |
|----------|-----------|
| Supabase Redirect URLs | Vérifier `/client/onboarding` whitelisted |
| Client pool auth | Session établie AVANT form render |
| Data validation anomalies | Clamping 15–240 en place |

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

| Variable | Statut |
|----------|--------|
| INNGEST_SIGNING_KEY | ✅ Vercel |
| INNGEST_EVENT_KEY | ✅ Vercel |
| CRON_SECRET | ✅ Sub expiry daily |
| Supabase RLS | ✅ Enabled |
| PWA Manifest | ✅ #121212 |
| Service Worker | ✅ v2 network-first |

---

**Full history: `.claude/rules/project-state-archive.md`**
