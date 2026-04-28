# CHANGELOG — STRYVR

> **Format court** — entrées de 1 ligne par changement.
> **Archivé** → voir `CHANGELOG.archive.md` pour l'historique complet (< 2026-04)

## 2026-04-27

FEATURE: Client onboarding — 5 écrans swipables (bienvenue personnalisé, programme, séance, progression/nutrition, hub) remplacent la page welcome statique
FEATURE: OnboardingTour — tooltip tour guidé au premier lancement sur le dashboard (5 étapes, non-skippable, persisté en localStorage)
CHORE: Daily Check-ins spec documentée (docs/superpowers/specs/2026-04-27-daily-checkins-spec.md) — DB schema, API routes, gamification, intégration onboarding

FIX: muscleDetection — couverture complète slugs catalogue (rear_delts, levator_scapulae, trapezius, anconeus, adductors, upper_chest, pec_major, quads, calves, shoulders...) + fallback lookup catalogue par nom d'exercice quand primary_muscles[] est vide (exercices créés sans enrichissement biomech)
FIX: muscleDetection — ajout CATALOG_SLUG_MAP pour traduire les slugs catalogue (FR courts: dos/pectoraux/epaules + EN anatomiques: lats/pectoralis_major/anterior_deltoid...) vers les MuscleGroup BodyMap ; les muscles du BodyMap étaient systématiquement faux (seuls biceps/triceps s'allumaient) car isValidMuscleGroup rejetait tous les slugs catalogue
REFACTOR: Client app — DS v2.0 alignment : ClientTopBar flat dark (border-[0.3px] bg-[#121212], no blur/shadow/gradient), BottomNav max-w-[480px] + safe-area-inset-bottom + border-[0.3px], tous les headers hardcodés remplacés par ClientTopBar (home, profil, programme, bilans, progress), ConditionalClientShell padding safe-area aware
FIX: /api/client/restrictions — include coach_id in metric_annotations insert (NOT NULL constraint caused silent insert failure, restrictions added by client never appeared in coach dashboard)

FIX: MetricsSection — annotation emoji icons rendered via foreignObject (SVG <text> ne rend pas les emojis cross-browser)
FIX: sw.js — bump cache v2→v3 pour forcer réinstallation SW (vieux cache servait une page /client périmée après déploiement)
FIX: ConditionalClientShell — ajout /client/onboarding aux AUTH_PATHS (BottomNav ne doit pas s'afficher pendant l'onboarding)
FIX: client/onboarding — setSession() manuel depuis hash (supabase/ssr ne traite pas le hash automatiquement contrairement au SDK browser)
FIX: invite/route — utilise type 'recovery' au lieu de 'invite'/'magiclink' — seul type qui produit un hash #access_token fiable sur mobile Safari
FIX: client/onboarding — polling getSession() toutes les 300ms en fallback si INITIAL_SESSION sans session (mobile Safari ne fire pas SIGNED_IN de façon fiable)
FIX: client/login — forward automatique vers /client/onboarding si hash access_token présent (token d'invitation arrivant sur la mauvaise page)
REFACTOR: Modal création client — suppression des champs objectif, niveau, pratique sportive, fréquence (données recueillies via le bilan)
FIX: invite/route.ts — generateLink utilise 'invite' pour nouveaux comptes, 'magiclink' pour comptes existants (type 'invite' → 422 si email déjà enregistré)
FIX: Client onboarding — suppression du gate hasHashToken (le SDK Supabase consomme le hash avant la lecture) + getSession() immédiat si session déjà active
FIX: Client onboarding — page simplifiée pour gérer uniquement le flow implicit hash (SIGNED_IN) correspondant au type 'invite'
FIX: Email templates — ajout meta color-scheme:dark + prefers-color-scheme media query pour empêcher l'inversion auto des couleurs en mode sombre

FEATURE: ClientAccessToken — bouton "Envoyer un bilan" ouvre modal avec liste des templates à assigner (envoi email immédiat) ou CTA "Créer un bilan" si aucun template
REFACTOR: ClientAccessToken — bouton "Envoyer l'invitation" (client inactif/suspendu) promu en CTA pleine largeur DS v2.0 (h-46, icône droite, uppercase)
REFACTOR: layout [clientId] — skeleton de chargement aligné sur la vraie structure 2 colonnes de la page Profil
REFACTOR: Page Profil client — refonte structure : Informations complémentaires fusionnées dans card Informations, Restrictions + Équipement intégrés dans Profil sportif (ordre : restrictions → paramètres → équipement), Tags isolés en colonne droite, "Fréquence" renommé "Disponibilité"
REFACTOR: RestrictionsWidget — prop section ('all'|'restrictions'|'equipment') pour rendu sélectif

FIX: MetricsSection — chart always extends to today's date (today injected as phantom point in merged + absoluteData useMemos)



FIX: NutritionStudio edit page — suppression du double skeleton (page-level skeleton retiré, NutritionStudio monte immédiatement avec skeletons colonnes intégrés)

FIX: NotificationBell — notification assessment_completed redirige vers /coach/clients/[client_id]/bilans/[submission_id] (était /coach/bilans/[id] → 404)
FIX: Bilan photos — signed URLs générées via service role server-side (/api/assessments/photos/signed-url) au lieu du client Supabase anon (bucket privé, RLS bloquait tout accès direct)
FEATURE: API POST /api/assessments/photos/signed-url — génère une signed URL 1h pour une photo du bucket assessment-photos (auth coach requise)

FIX: Middleware — /client/onboarding ajouté aux routes publiques (cause racine du spinner infini : le middleware redirigait vers /client/login avant que le code PKCE soit échangé)
FIX: Client onboarding — détection immédiate des erreurs Supabase dans l'URL avant toute opération async
FIX: Client onboarding — fail fast si ni ?code= ni #access_token dans l'URL (plus de spinner infini)
FIX: Client onboarding — useRef évite double-résolution onAuthStateChange en StrictMode
FEATURE: Client onboarding — /client/onboarding remplace /client/set-password + /client/auth/callback (0 redirects)
REFACTOR: invite/route.ts — redirectTo pointe vers /client/onboarding
REFACTOR: Suppression de /client/set-password et /client/auth/callback

REFACTOR: NutritionStudio — skeletons des 3 colonnes refaits (structure fidèle au layout réel : composition/métabolisme/TDEE col1, waterfall grille+total col2, jours+éditeur actif col3)
FIX: CalculationEngine — calories cibles affichées = macroResult.calories (après goal + ajustement), plus macroResult.tdee brut
FIX: useNutritionStudio — goalCalories exposé (calories post-goal, pré-calorieAdjustPct) pour delta correct dans le slider
REFACTOR: CalorieAdjustmentDisplay — props tdee→baseCalories+targetCalories, delta et kcal cibles désormais exacts
REFACTOR: CalorieAdjustmentDisplay — slider aligné sur pattern hydratation (thumb coloré dynamique, track fill depuis centre, marqueurs -30/-15/0/+15/+30%, même CSS thumb)
FIX: Hydratation — algorithme recalibré pour athlètes récréatifs (bonus activité 0/150/300/450/700ml vs 0/300/600/900/1200ml, genre en offset plat, cap 6L water loading)
FIX: Hydratation — slider instantané (bypass debounce 300ms, useEffect séparé sur hydrationPhase via baseHydrationLitersRef)
FIX: Hydratation — curseur slider stylé DS v2.0 (thumb couleur dynamique = getPhaseColor, suppression jaune natif browser)
REFACTOR: NutritionProtocolDashboard — MacroDonut SVG supprimé, remplacé par DayMacroRow (nom+kcal en ligne, dots P/L/G + grammes + %, barre segmentée)
FEATURE: Hydratation — slider continu de phase (40–200%, 5 marqueurs indicatifs : pré-compet/sèche/base/sèche int./water load)
FEATURE: Hydratation — multiplicateur de phase appliqué au calcul EFSA en temps réel, couleur et description dynamiques
REFACTOR: CalculationEngine — titre "Calcul nutritionnel" en header fixe aligné sur Col 1 et Col 3 (px-4 pt-4 pb-3, text-[13px] font-semibold)
REFACTOR: ProtocolCanvas — bouton "Tous les calculs" → "Appliquer les paramètres"
REFACTOR: infoModalDefinitions — allCalculations modal mis à jour (titre + description contextualisés)
REFACTOR: Page Profil client — layout 2 colonnes (infos/sport/restrictions à gauche, accès/formules/CRM à droite), élimine espace vide full-width
FIX: RestrictionsWidget — suppression des headers internes dupliqués ("Restrictions physiques" / "Équipement disponible"), renommés en labels courts
FEATURE: Coach clients page — affichage photo de profil client dans les cartes (grille + liste), fallback initiales colorées
FIX: MetricsSection — annotations et phases via AnnotationsLayer (useXAxisScale + usePlotArea Recharts v3 hooks) — résout icônes invisibles sur chart category axis
FIX: MetricsSection — ajout lab_protocol à AnnotationType + ANNOTATION_ICONS (🧪) + ANNOTATION_LABELS
SCHEMA: metric_annotations — ajout colonne source_id UUID nullable + index (migration 20260427_annotation_source_id.sql)
FEATURE: Annotations bidirectionnelles — assign programme crée annotation program_change (source_id=program.id) ; DELETE programme supprime l'annotation liée
FEATURE: Annotations bidirectionnelles — share protocole nutrition stocke source_id=protocolId ; DELETE et unshare suppriment l'annotation liée

REFACTOR: CoachShell TopBar — retrait glassmorphisme (backdrop-blur, shadow, gradient), alignement DS v2.0 strict (bg-[#121212], border-[0.3px] border-white/[0.06]), hauteur réduite h-16→h-14
REFACTOR: NavRowB — retrait glassmorphisme, icônes Lucide→Phosphor Icons (regular/fill selon état), label "Lab"→"Athlètes", boutons sans border individuelle
REFACTOR: NavRowA — retrait backdrop-blur, bg-white/[0.03]→bg-[#121212], alignement DS v2.0
FEATURE: Animation "Entrée dans le Lab" — micro-animation scale+tint vert (#1f8a65/8%) au clic carte client avant navigation (CardGrid + ListView)

FIX: NutritionProtocolDashboard — replace window.confirm() with DS v2.0 DeleteConfirmModal (bg-[#181818], backdrop-blur, rouge)
FIX: Nutrition protocols page — skeleton aligné sur grille 2 colonnes (4 cartes, structure badge+titre+jours)
FIX: NutritionStudio — save/share TopBar closures stale (useMemo + useRef pattern, deps=[])
REFACTOR: NutritionProtocolDashboard — toutes les cartes (actif + brouillons) en grille 2 colonnes, suppression full-width systématique
FIX: MacroPercentageDisplay — progress bars now have mr-4 so they don't bleed to column edge
FIX: MetricsSection overlay chart — annotations non affichées : ifOverflow="visible" sur ReferenceLine (défaut Recharts = "discard" si date hors domaine category)
FIX: MetricsSection overlay chart — labels SVG clips : overflow-hidden retiré du div chart, [&_svg]:overflow-visible sur ChartContainer
FIX: MetricsSection overlay chart — annotations multiples le même jour superposées (stackIndex → décalage vertical 26px par annotation)
FIX: MetricsSection overlay chart — point fantôme +1j injecté quand annotation ≥ dernière date de données (étire le domaine X)
FIX: NutritionStudio save — track savedProtocolId so "Brouillon" PATCHes existing protocol instead of creating duplicates
REFACTOR: CalorieAdjustmentDisplay — move "Calories cibles" inline with % line (removed separate row in CalculationEngine)
REFACTOR: NutritionProtocolDashboard — drafts rendered in 2-column grid instead of full-width stacked cards
FIX: MacroPercentageDisplay — tighten gap and label width (w-20→w-16, gap-3→gap-2) for better alignment
REFACTOR: MacroPercentageDisplay — add colored progress bars per macro row (protein/fat/carbs)
REFACTOR: CalculationEngine — Carb Cycling refactored from text link to proper toggle buttons (Désactivé / Activé) with SectionDivider
FIX: TdeeWaterfall — increase bar thickness 5px → 8px for better visibility
FIX: ProtocolCanvas — remove stale destructured props (clientName, saving, sharing, onSave, onShare, onPreview)
FIX: CoachShell TopBar — supprimé overflow-hidden sur le header pour que les dropdowns (NotificationBell) ne soient plus clippés
REFACTOR: TdeeWaterfall — refonte complète en grille 4 segments (valeur + % + source), suppression légende séparée
FIX: MacroPercentageDisplay — colonnes à largeur fixe (w-20/w-14/w-16), plus aucun troncage du pourcentage
FIX: Override g/kg LBM — déplacé inline sur la ligne Protéines (plus sous Glucides)
FIX: Nutrition Studio — Move "Ajuster les paramètres" button from bottom to header (compact icon button)
FIX: Nutrition Studio — Increase backdrop opacity 40% → 50% for clearer panel visibility
REFACTOR: NotificationBell — polling 30s → 60s, add visibility-change listener
FEATURE: Client onboarding — Single-page refactor (merge set-password + auth/callback into /client/onboarding)
FEATURE: Client onboarding — Unified auth flow (PKCE code + implicit hash), 3-step wizard, timeout 15s
FEATURE: Client onboarding — Session established before form render (zero auth race conditions)

## 2026-04-26

FEATURE: Nutrition Studio — 11-task UX refactor (Tasks 7-10 complete)
FEATURE: Nutrition Studio — Data validation (clamp session_duration, cardio_frequency, cardio_duration)
FEATURE: Nutrition Studio — Col 1-3 refactoring (parameters panel, calculation engine, protocol canvas)
FEATURE: New components — ParameterAdjustmentPanel, InfoModal, TdeeWaterfallLegend, CalorieAdjustmentDisplay
FEATURE: Nutrition Studio — Task 10 (action buttons to TopBar with loading states)

## 2026-04-25

REFACTOR: Migrate n8n → Inngest for all async jobs (retry x3, timeout 5min, Vercel integrated)
FEATURE: Nutrition protocols — CRUD API, dashboard, client page (/client/nutrition)
FEATURE: TopBar coach — context client (photo, name, goal, level, status, page)
FEATURE: Client app — BottomNav → dock flottant (glassmorphism)
FIX: Session logs — live upsert via PATCH /sets (debounce 800ms)

## 2026-04-24

FEATURE: Exercise biomechanics enrichment (Phase 2) — all 458 exercises complete with 14 biomech fields
FEATURE: Smart Fit — volume coverage MEV/MAV/MRV scoring (16 muscle sub-groups, Israetel/RP thresholds)
FEATURE: Program Intelligence Phase 2B — client profile (injuries, equipment) + SRA customization
FEATURE: Phase 3 — PerformanceFeedbackPanel + auto-recommendations (volume/weight/swap/rest)

---

**See CHANGELOG.archive.md for pre-2026-04 history.**
