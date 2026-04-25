## 2026-04-25

REFACTOR: Redirect /outils/macros to /coach/clients — macro tool now only accessible via client context
FEATURE: Nutrition protocol dashboard page — active protocol card + history with share/unshare/delete
FEATURE: Add nutrition protocol CRUD API — list, create, update, delete, share (with annotation), unshare
FEATURE: Add GET /api/clients/[clientId]/nutrition-data — enriched biometric data for nutrition tool pre-fill
SCHEMA: Add nutrition_protocols and nutrition_protocol_days tables with RLS
FIX: ClientTopBarLeft — suppression de useClient() dans le composant (rendu hors ClientProvider dans la TopBar), client passé en prop via useClientTopBar
FIX: client_set_logs — migration 20260425_set_logs_unique_fix.sql : side NOT NULL DEFAULT 'bilateral' + contrainte unique (session_log_id, exercise_name, set_number, side) pour activer le upsert live des sets (migration précédente jamais appliquée)
FEATURE: TopBar coach — contexte client injecté sur toutes les pages /coach/clients/[clientId]/* (photo/initiales + nom + objectif + niveau + statut + page active)
FEATURE: ClientData type — ajout profile_photo_url pour affichage photo client dans TopBar et composants
REFACTOR: Pages client coach — suppression ClientHeader inline, remplacé par useClientTopBar hook (performances, métriques, bilans, morpho, profil, nutrition, entraînement, cardio, composition)
CHORE: Nouveaux composants — ClientTopBarLeft.tsx, useClientTopBar.tsx

REFACTOR: Client app — BottomNav remplacé par dock flottant pill (glassmorphism, centré, identique au NavDock coach)
REFACTOR: Client app — tous les headers inline sticky remplacés par glassmorphism flottant (fixed top-4, backdrop-blur-2xl, shadow, gradient)
REFACTOR: ClientTopBar — glassmorphism flottant aligné sur CoachShell TopBar
REFACTOR: Home hero card séance du jour — traitement accent fort (border accent, gradient vert, shadow, icône agrandie, CTA avec glow)
REFACTOR: SessionLogger — bouton coche set avec feedback visuel (bg accent au complet, active:scale-90, shadow glow), fond ligne complétée renforcé
FIX: morpho/analyze — remplace rate limit 24h par blocage par bilan déjà analysé (status=completed), sans limite de temps
REFACTOR: TopBar coach — style glassmorphism aligné sur NavDock (backdrop-blur-2xl, shadow, gradient, border white/[0.08])


FIX: /api/clients/[clientId]/performance — sets comptés si completed=true OU actual_reps not null (corrige Volume=0/Sets=0 pour séances historiques où completed était false en DB)
FIX: morpho/analyze route — cherche maintenant le bilan complété le plus récent AVEC photos (pas juste le plus récent) — corrige le cas où le dernier bilan est sans photos

FIX: SessionLogger — convertir actual_reps/actual_weight_kg/rir_actual en nombres avant PATCH (fix critique : stats volume/reps = 0 en recap et progrès)
FIX: SessionLogger + recap — primary_muscles/secondary_muscles persistés dans client_set_logs (option B) pour un BodyMap précis sans re-join program_exercises
FIX: recap/[sessionLogId] — BodyMap utilise les muscles des set_logs (plus de fallback regex uniquement par nom d'exercice)
FIX: ExerciseSwapSheet — primary_muscles/secondary_muscles transmis au scoring d'alternatives (les alternatives étaient basées sur le pattern seul)
FIX: session/[sessionId]/page.tsx — regex unilatéral élargie (kick.?back, extension.?hanche, fente, split.?squat, bulgarian) pour détecter les exercices non-flaggés en DB
FIX: programme/page.tsx — bouton Commencer remplacé par badge "Séance réalisée ✓" si completed_at exists today (vérifié via client_session_logs)
FEATURE: programme/page.tsx — navigation calendrier : pills de jours cliquables (?dow=N query param), prévisualisation des séances des autres jours sans démarrer une séance, label "Aperçu" sur les séances non-aujourd'hui
SCHEMA: client_set_logs — ajout colonnes primary_muscles text[] et secondary_muscles text[] (migration 20260425_set_logs_muscles.sql, à appliquer via Supabase SQL Editor)

FIX: NotificationBell — session_reminder redirige vers /coach/clients/{clientId}/data/performances au lieu de ne rien faire
FEATURE: Smart Fit — LOW_INTENSITY alert (warning) when a muscle group is both under-MEV and avg RIR > 3 (RP threshold for effective sets) — volume and intensity double-problem
FIX: NavDock CTA — supprime les boutons d'action non-wired sur toutes les pages sauf /coach/clients (NEW_CLIENT seul actif car enregistré via useDockActions)
FIX: MorphoAnalysisSection — affiche le message d'erreur si le job échoue (au lieu de rester silencieux) + logs poll status
FIX: lib/morpho/analyze.ts — signed URL TTL augmenté de 5min à 10min pour éviter expiration avant analyse OpenAI

FEATURE: Smart Fit — MEV/MAV/MRV volume coverage indicator: new `scoreVolumeCoverage` subscore (20% of global), weighted sets × activation per muscle sub-group, Israetel/RP thresholds scaled by goal + level, segmented gauge bars in Intelligence Panel
FEATURE: Smart Fit — `lib/programs/intelligence/volume-targets.ts`: 60+ EN→FR sub-group mappings, BASE_TARGETS (16 groups), `getVolumeTargets(group, goal, level)`, `VOLUME_SEGMENTS`, `VOLUME_GROUP_LABELS`
FEATURE: Smart Fit — UNDER_MEV (warning), OVER_MAV (info), OVER_MRV (critical) alerts with exact set counts
FEATURE: ProgramIntelligencePanel — new "Volume hebdomadaire" section with animated MEV/MAV/MRV gauge bars per sub-group, segmented by body region (Jambes / Push / Pull / Core)
CHORE: Exercise catalog — enrich all 95 missing exercises with complete biomech data (primaryMuscle, primaryActivation, secondaryMuscles, secondaryActivations, stabilizers, jointStress×3, globalInstability, coordinationDemand, constraintProfile) — 458/458 complete

CHORE: Exercise catalog — enrich all 95 missing exercises with complete biomech data (primaryMuscle, primaryActivation, secondaryMuscles, secondaryActivations, stabilizers, jointStress×3, globalInstability, coordinationDemand, constraintProfile) — 458/458 complete

FIX: ExercisePicker — filtre Faisceau affiche uniquement les faisceaux anatomiques du groupe sélectionné (map statique FIBERS_BY_GROUP), plus de sangle/obliques/érecteurs dans "Épaules" ou "Fessiers"
FIX: Smart Fit — radar "Distribution musculaire" : fallback catalogue au chargement du template (getMusclesFromCatalog) quand primary_muscles[] est vide en DB ; BIOMECH_TO_GROUP conservé comme fallback secondaire dans scoring.ts
FIX: Smart Fit — "Patterns de mouvement" affiche un cercle stylisé au lieu d'un PieChart invisible quand une seule catégorie (ex: 100% Jambes)

FIX: Inngest morpho-analyze function — wrong signature (triggers inside config object); now uses correct 3-argument form (config, trigger, handler)

REFACTOR: ExercisePicker — filtres adaptatifs en cascade : changer "Groupe musculaire" restreint "Faisceau" aux muscles du groupe, puis "Faisceau" restreint "Mouvement" aux patterns disponibles — reset automatique des filtres enfants
REFACTOR: ExercisePicker — selects avec chevron ChevronDown visible, couleur accent vert quand actif, labels adaptatifs ("Faisceau — Fessiers" selon contexte)
FEATURE: ExercisePicker — filtre "Faisceau musculaire" : sélectionne exercices dont le muscle apparaît en primaire, secondaire OU stabilisateur (pas uniquement primaire)
FEATURE: ExercisePicker — barre de recherche étendue : lombaires, moyen fessier, adducteur, deltoïde, etc. désormais retrouvés via SEARCH_MUSCLE_ALIASES (FR→EN biomech slugs) + labels FIBER_LABELS + groupe musculaire + pattern + équipement
FIX: ExercisePicker — activeFiltersCount inclut maintenant filterFiber dans le compteur


FIX: morpho/analyze route — photo detection used non-existent field_type column; now uses field_key LIKE 'photo_%' + storage_path NOT NULL
FIX: lib/morpho/analyze.ts — getPhotoUrlsFromSubmission read value_text (always null); now reads storage_path and generates signed URLs from assessment-photos bucket
CHORE: Retrait de n8n du stack — remplacé par Inngest pour tous les jobs async, documentation mise à jour
CHORE: .claude/rules/n8n-boundary.md — marqué retiré, redirect vers inngest-patterns.md
CHORE: .claude/rules/inngest-patterns.md — nouveau fichier de référence patterns Inngest
CHORE: .claude/skills/morphology-rules — mis à jour (flow Inngest, plus de n8n)
CHORE: CLAUDE.md — stack mis à jour (Inngest remplace n8n)
CHORE: master-plan — Phase 4 mise à jour (Inngest remplace webhooks n8n)

FIX: catalog-utils — catalogBySlug résolution doublons : privilégie l'entrée la plus enrichie (primaryMuscle > jointStressSpine) au lieu du premier match, corrige ex. Soulevé de terre sumo landmine
FIX: Intelligence scoring — BIOMECH_TO_FR complété (14 entrées manquantes) : lats, quadriceps, anterior/medial/posterior_deltoid, pectoralis_major_upper/lower, traps, upper_traps, upper_back, lower_abs, core_global, rotator_cuff, subscapularis — couverture 100% des 363 exercices enrichis
FIX: Intelligence scoring — getCoeff() transmet maintenant primaryActivation à resolveExerciseCoeff() (priorité 1 biomech activée au runtime)
FIX: ProgramIntelligencePanel — FIBER_LABEL_FR synchronisé avec BIOMECH_TO_FR : +12 nouvelles clés (grand_pectoral_sup/inf, dos_superieur, coiffe_rotateurs, subscapulaire, droit_abdominal_inf, etc.)
FIX: catalog-utils — getPrimaryMuscleFromCatalog() sans contrainte jointStressSpine, utilisé dans fiberVolumes pour résoudre le primaryMuscle de tous les exercices catalogue (enrichis ou non)
FIX: Intelligence scoring — fiberVolumes fallback au catalogue par nom d'exercice via getPrimaryMuscleFromCatalog, résout barres manquantes pour exercices ajoutés avant patch biomech et exercices sans jointStress
FIX: ExercisePicker — muscle pills générées dynamiquement depuis muscleGroup réellement présents (availableMuscleGroups), élimine Lombaires/Avant-bras/Adducteurs/Abducteurs vides
FIX: Intelligence scoring — BIOMECH_TO_FR ne mappe plus les slugs FR grossiers (fessiers→grand_fessier retiré) : le fallback conserve fessiers/quadriceps/dos lisibles dans les barres de faisceau
FIX: Intelligence scoring — isSpecialized détecte maintenant les séances legs-only (squat/hinge/knee/hip) pour abaisser les alertes MISSING_PATTERN en info et floorer le score Couverture à 50 même sur programmes 1-séance haute fréquence
FIX: ProgramIntelligencePanel — FIBER_LABEL_FR: suppression doublons quadriceps/ischio_jambiers; ajout 'ischio-jambiers' (avec tiret) comme alias



FEATURE: Phase 3 — PerformanceFeedbackPanel coach avec recommandations programme (increase/decrease volume, increase weight, swap exercise, add rest day) — approval explicite avant application
FEATURE: lib/performance/analyzer.ts — logique pure completion_rate, avg_rir, rir_trend, stagnation, overreaching, global_overreaching
FEATURE: lib/performance/recommendations.ts — moteur de recommandations rule-based, max 1 recommandation par exercice
SCHEMA: Add program_adjustment_proposals table (pending/approved/rejected workflow)
FEATURE: GET /api/clients/[clientId]/performance-summary — analyse + recommandations sur N semaines
FEATURE: GET+POST /api/clients/[clientId]/program-adjustments — liste proposals + approve/reject avec apply automatique
CHORE: Remplacer setImmediate par Inngest event dispatch dans morpho/analyze route (robustesse prod)

## 2026-04-24

FIX: ExercisePicker — custom exercises: all biomech fields (plane, mechanic, primaryMuscle, jointStress*, etc.) now mapped from API and CatalogEntry interface; onSelect uses typed fields instead of unsafe cast; gifUrl/muscleGroup/filters corrected on creation
FIX: Intelligence scoring — ischio-jambiers duplicate bars eliminated: BIOMECH_TO_FR now maps 'ischio-jambiers' (dash) → 'ischio_jambiers' (underscore); fallback fiberVolumes path uses normalizeFiberSlug; normalizeFiberSlug normalizes remaining dashes to underscores; fessiers/dos/pectoraux/epaules/mollets/abdos added to BIOMECH_TO_FR
FIX: ExercisePicker — custom exercises now appear immediately after creation (gifUrl mapped from media_url, muscleGroup passed from form, filters cleared on creation); PATTERN_LABELS expanded to all movement pattern slugs (hip_abduction → "Abduction hanche", etc.); MUSCLE_LABELS expanded with ischio_jambiers/lombaires/adducteurs/abducteurs; broken image replaced by name placeholder when gifUrl is empty
FIX: CustomExerciseModal — muscleGroup added to CreatedExercise interface and onCreated callback so ExercisePicker receives correct group instead of hardcoded 'custom'

FIX: Intelligence — normaliser slugs biomech EN dans fiberVolumes (gluteus_medius→moyen_fessier, hamstrings→ischio_jambiers) pour éliminer doublons dans les barres par faisceau
FIX: Intelligence — MISSING_PATTERN: labels FR dans les titres d'alertes; sévérité info (au lieu de warning) pour programmes spécialisés ≤2 séances; score Couverture plafonné à min 50 pour séances ciblées
FEATURE: Intelligence panel — répartition volume par faisceau musculaire précis (gluteus_medius, deltoid_posterior, etc.) avec barres horizontales animées par séance; radar agrandi (200px) + normalisation sur max; donut patterns revu avec légende inline; fiberVolumes ajouté dans SessionStats (scoring engine + types)
FIX: ExerciseAlternativesDrawer — convert MOVEMENT_PATTERNS from raw slugs to {value, label} objects with French labels (was displaying "hip abduction", "scapular retraction" in English)
FIX: view/page.tsx — add 6 missing patterns (scapular_elevation + 5 new) to MOVEMENT_LABELS map
FIX: CustomExerciseModal — replace latin/slug muscle names with natural French labels in primary muscle select, secondary muscle chips, and muscle group select (values unchanged, labels only)
FEATURE: Add 5 movement patterns — hip_abduction, hip_adduction, shoulder_rotation, scapular_retraction, scapular_protraction — to scoring engine (LEGS_PATTERNS, PULL_PATTERNS, PATTERN_EQUIPMENT_REQUIREMENTS, PATTERN_EXAMPLES), catalog-utils getStimulusCoeff, MOVEMENT_PATTERNS arrays in ProgramTemplateBuilder/ExerciseCard/ExerciseAlternativesDrawer/CustomExerciseModal, PATTERN_LABEL_FR in ProgramIntelligencePanel, and inferMovementPattern in generate-exercise-catalog script
FEATURE: Phase 3 Performance Feedback Loops — detectPerformanceTrend pure function (8 unit tests), GET /api/clients/[clientId]/performance/[exerciseName] endpoint, performance trend badges (↗/→/↘) on ExerciseCard when clientId context is active
FEATURE: CustomExerciseModal — 6-step modal (Média, Identité, Classification, Muscles, Biomécanique, Confirmation) with Framer Motion transitions, media upload preview, full biomech sliders, DS v2.0 compliant
FEATURE: ExercisePicker — wire CustomExerciseModal with "Créer un exercice" button; created exercise auto-added to custom list and selected
FIX: intelligence/alternatives.ts and scoring.ts — remove invalid Record<string,unknown> casts; use typed property access on BuilderExercise directly (0 new TS errors)
FEATURE: Display jointLoad and coordination subscores in ProgramIntelligencePanel — amber/orange theme for jointLoad, purple for coordination, with matching labels in LabModeSection debug view and rule transparency section
FEATURE: Extend POST /api/exercises/custom Zod schema with full biomech fields — description, media_url, media_type, plane, mechanic, unilateral, primary_muscle, primary_activation, secondary_muscles_detail, secondary_activations, stabilizers, joint_stress_spine, joint_stress_knee, joint_stress_shoulder, global_instability, coordination_demand, constraint_profile; all fields now persisted in DB insert

FEATURE: Add custom exercise media upload endpoint — POST /api/exercises/custom/upload-media, supports JPG/PNG/WebP/GIF/MP4/WebM up to 50MB, uploads to Supabase Storage exercise-media bucket, returns public URL and mediaType

FEATURE: programs/[programId] API — persist and return 14 biomech fields (plane, mechanic, unilateral, joint stress, etc.) in program_exercises insert and SELECT
FEATURE: program-templates/[templateId] API — persist and return 14 biomech fields in coach_program_template_exercises insert, update, and duplicate POST
FEATURE: programs/route GET — extend program_exercises SELECT to include all 14 biomech columns

REFACTOR: ExerciseCard — remove manual movement pattern select, equipment pills, compound toggle, and primary muscles selector from JSX (auto-populated from catalog)
REFACTOR: EditorPane — remove equipment_archetype select from meta row (field retained in TemplateMeta and intelligence engine)

FEATURE: ExercisePicker — extend onSelect callback type with biomech fields (plane, mechanic, unilateral, joint stress, etc.) and primaryMuscles/secondaryMuscles
FEATURE: ExercisePicker — add sourceFilter state and pills UI (Tous / Catalogue STRYVR / Mes exercices) using DS v2.0 active/inactive styles
FEATURE: ExercisePicker — pass all biomech fields from enriched catalog entries via unknown cast in onSelect handler
FEATURE: ProgramTemplateBuilder — extend local Exercise interface with 14 optional biomech fields
FEATURE: ProgramTemplateBuilder — update emptyExercise() with null biomech defaults
FEATURE: ProgramTemplateBuilder — wire biomech fields through onSelect handler, load-from-initial, intelligenceSessions, and handleSave payload (snake_case keys for API)

FEATURE: scoring.ts — add scoreJointLoad() with BODY_PART_TO_JOINT mapping, emits JOINT_OVERLOAD critical/warning based on weighted stress vs injury severity
FEATURE: scoring.ts — add scoreCoordination() for beginner detection, emits COORDINATION_MISMATCH critical (avg > 7.5) or warning (avg > 6)
FEATURE: scoring.ts — wire jointLoad (0.10) and coordination (0.05) into buildIntelligenceResult with real SUBSCORE_WEIGHTS
FEATURE: tests/lib/intelligence/biomech-scoring.test.ts — 6 new tests for scoreJointLoad and scoreCoordination (all passing)
FEATURE: intelligence/types.ts — add BiomechData interface with plane, mechanic, joint stress, instability, coordination, and constraint profile fields
FEATURE: BuilderExercise — extend with optional biomech fields (plane, mechanic, unilateral, primaryMuscle, jointStress*, globalInstability, coordinationDemand, constraintProfile)
FEATURE: IntelligenceResult.subscores — add jointLoad and coordination fields (defaulting to 100, weighted 0 until Phase 4 scorers are implemented)

## 2026-04-23

FEATURE: PWA — replace stale-while-revalidate with network-first + 3s timeout for client pages, auto-reload SW on controllerchange unless draft session active
FEATURE: ServiceWorkerRegistrar — add hasActiveDraft() check before SW reload, detect draft_session_log_id_* keys from SessionLogger localStorage
FIX: SessionLogger — add cancelled guard on initDraft useEffect to prevent StrictMode double-invoke, cleanup saveDebounceRef on unmount, flush exerciseNotes on submitSession via notes field, add comment on ping validation
FEATURE: SessionLogger — live save (draft created at mount, set-by-set upsert via PATCH /sets, flush+complete at submit, localStorage draft recovery, fallback POST if no network at start)
REFACTOR: SessionLogger — remove back button from header (replaced by spacer), sessionId prop added, patchSets fire-and-forget, updateSet debounce 800ms, toggleSet immediate patch
FIX: /api/session-logs/[logId]/sets — improve FK error handling (catch 23503, return 409) and type safety on Supabase .single() responses
FEATURE: PATCH /api/session-logs/[logId]/sets — live upsert endpoint for client_set_logs during session (key: session_log_id, exercise_name, set_number, side) with auth check and empty array ping support
SCHEMA: client_set_logs — add UNIQUE constraint on (session_log_id, exercise_name, set_number, side) to support live upsert operations

## 2026-04-20

SCHEMA: programs — add goal, level, frequency, muscle_tags, equipment_archetype, session_mode columns (align with coach_program_templates)
SCHEMA: program_exercises — add movement_pattern, equipment_required, group_id, is_compound, target_rir, weight_increment_kg, primary_muscles, secondary_muscles columns
FEATURE: ProgramTemplateBuilder — add programId prop + program mode: loads program_sessions/program_exercises, saves to PATCH /api/programs/[id], calls onSaved callback instead of router.push
FEATURE: PATCH /api/programs/[programId] — full atomic session/exercise rebuild (mirrors template PATCH logic) + simple field toggle support (is_client_visible etc.)
CHORE: GET /api/programs — include all new program and exercise fields in select
FEATURE: /protocoles/entrainement — uses ProgramTemplateBuilder (full studio-lab) instead of ProgramEditor when editing a client program

FIX: assign/page — redirect after template assignment now points to /coach/clients/[clientId]/protocoles/entrainement instead of client root
SCHEMA: programs — add is_client_visible boolean column (default false) to independently control app-client visibility per program
FEATURE: ClientProgramsList — new component listing all assigned programs with toggle app-client visibility, open editor, create empty, assign template, delete
FEATURE: /protocoles/entrainement — refactored from single ProgramEditor to list-first view with inline editor (back button in topbar)
CHORE: GET /api/programs — now returns is_client_visible in select
CHORE: PATCH /api/programs/[programId] — now accepts is_client_visible in patch payload

FIX: profil/page — save() now checks res.ok and surfaces error, redirects to /coach/clients after delete/archive
FIX: bilans/page — fetch ok-check on both submissions and templates fetches to trigger error state on HTTP failures

FEATURE: Phase 2A — replace /coach/clients/[clientId] monolith with routed Lab sub-pages (profil, data/*, protocoles/*)
FEATURE: ClientHeader — reusable client identity header with automatic dock tab registration and safe initials
FEATURE: Client layout — loads client data once in layout, exposes via ClientProvider to all sub-pages
FEATURE: /profil page — client info, sport profile inline edit, restrictions, access tokens, formulas, CRM, danger zone
FEATURE: /data/metriques page — MetricsSection in Lab routing structure
FEATURE: /data/bilans page — SubmissionsList with fetch, skeleton loading, error handling
FEATURE: /data/performances page — PerformanceDashboard + SessionHistory + ProgressionHistory
FEATURE: /data/morphopro page — MorphoAnalysisSection moved from Profil tab to Lab Data
FEATURE: /protocoles/nutrition page — 4 nutrition tool links (Macros, Carb Cycling, Hydratation, Cycle Sync)
FEATURE: /protocoles/entrainement page — ProgramEditor embedded in Lab routing
FEATURE: /protocoles/cardio page — HR Zones tool link
FEATURE: /protocoles/composition page — Body Fat % tool link
FEATURE: useDockBottom — client sub-page aware (data/*, protocoles/*, profil root contexts)
FEATURE: Client list — openClient() called on card click to register tab in dock
REFACTOR: /coach/clients/[clientId]/page.tsx — server-side redirect to /profil (monolith removed)
FEATURE: Add ClientContext — shared client data (ClientData type, ClientProvider, useClient hook) for Lab sub-pages
FEATURE: Refactor CoachShell — replace 200px sidebar with double dock (DockLeft + DockBottom)
FIX: DockBottom overlay z-index corrected from z-[-1] to z-40 — click-outside now closes + menu
FEATURE: Add DockBottom — floating horizontal dock with contextual items and + action menu
FEATURE: Add ClientTabsBar — scrollable Chrome-style tabs for open clients, integrated above bottom dock
FEATURE: Add DockLeft — permanent vertical dock with 5 global entries (Dashboard, Lab, Templates, Business, Mon compte)
FEATURE: Add useDockBottom hook — contextual dock items per pathname (Lab Data, Lab Protocoles, Business, Templates, Settings)
FIX: PATCH /api/program-templates/[id] — session_mode now persisted on save (was silently dropped from update payload)
FIX: PATCH /api/program-templates/[id] — alternatives now preserved on save — exercises matched by dbId are updated in-place instead of deleted+recreated with new UUIDs
FIX: POST /api/program-templates — session_mode now saved on template creation
FIX: edit/page.tsx — session_mode fetched from DB so toggle initialises correctly on page load

## 2026-04-19

FEATURE: Add DockContext for shell refactor — manage open clients and active client state
FIX: POST alternatives route returned 401 Unauthorized — Supabase many-to-one relation is object not array, removed erroneous [0] index access in getCoachAndVerifyOwnership
FIX: Movement pattern dropdown labels truncated — restored full French labels in ExerciseCard (e.g. 'Poussée horizontale' instead of 'Poussée horiz.')
SCHEMA: Add session_mode column to coach_program_templates (day | cycle)
FEATURE: Add Jours/Cycle session mode toggle in EditorPane header
FEATURE: Auto-sort sessions by day_of_week in day mode (orderedSessions derived value)
FEATURE: Drag-and-drop exercises intra + inter session via @dnd-kit in EditorPane
FEATURE: Drag-and-drop session reordering in NavigatorPane (cycle mode only)
FEATURE: Up/down arrows on sessions (cycle mode) and exercises (all modes, intra + inter session)
FEATURE: Scroll-to + highlight on destination element after any reorder action
FEATURE: Auto-scroll + highlight on element reorder — moveExercise scrolls to destination with smooth behavior, highlights for 1.2s; moveSession scrolls to first exercise of moved session
FEATURE: NavigatorPane — sortable session rows via SortableContext + useSortable in cycle mode; up/down arrow buttons per session; handleDragEnd in ProgramTemplateBuilder handles nav-session-* ids; onMoveSession + sessionMode props wired

FEATURE: Drag-and-drop exercise reordering via @dnd-kit — intra-session + inter-session; GripVertical handle in ExerciseCard; DroppableSession + SortableContext in EditorPane; DndContext + sensors in ProgramTemplateBuilder

FEATURE: ProgramTemplateBuilder — session_mode ('day'|'cycle') added to TemplateMeta + initial state; orderedSessions sorts by day_of_week in day mode; rawSessionIndex maps ordered→raw indices; moveSession + moveExercise functions added
FEATURE: EditorPane — Jours/Cycle toggle in meta row; day-of-week pills conditionalized on day mode; cycle badge (S1, S2…) in cycle mode; up/down arrow buttons in cycle mode session headers for manual reordering

FEATURE: ExerciseCard — "Catalogue" button always visible in name row (was hidden Tag icon); empty image zone opens catalogue as primary CTA
FEATURE: ExerciseCard — superset toggle button (Link2/Link2Off) + colored left border + SUPERSET badge when exercise has group_id
FEATURE: ProgramTemplateBuilder — toggleSuperset() pairs exercise with next via shared group_id, color-coded per group
FEATURE: ExerciseClientAlternatives — "Ajouter depuis le catalogue" opens ExercisePicker (was free-text input); uses forwardRef+useImperativeHandle to call addAlternative after pick
FIX: ExerciseCard — exercise name input no longer truncate in edit mode
FIX: ExerciseCard — image 120×120 (was 140), grid-cols-[120px_1fr], gap-1 on sets grid, "Repos" label (was "Repos (s)"), min-w-0 on all flex children
FIX: ProgramIntelligencePanel — Volume KPIs grid-cols-2 (was 4), Radar+Donut stacked (was side-by-side grid-cols-2), session name flex-1 truncate
FIX: LabModeSection — subscores grid-cols-2 inline (was 3), pattern label w-32 (was 28)
FIX: NavigatorPane — add title tooltip on truncated session/exercise names
FIX: EditorPane — meta row gap-2, min-w-0 on selects, max-w-[160px] on equipment, whitespace-nowrap on labels, shrink-0 on number groups
FIX: ProgramTemplateBuilder — navWidth 16% (was 14%), intelWidth 30% (was 32%), minWidth 160px nav / 260px intel, drag clamps corrected
REFACTOR: IntelligencePanelShell + ProgramIntelligencePanel — rename "Intelligence" → "SMART FIT" in all panel headers
REFACTOR: ProgramTemplateBuilder — replace react-resizable-panels with native CSS drag-split (mousedown/mousemove/mouseup) — eliminates re-render layout reset bug
REFACTOR: IntelligencePanelShell — move LabModeSection from EditorPane into Intelligence Panel (better UX, removes 4 lab props from EditorPane)
FIX: ExerciseCard — full French labels for equipment (Élastique, Haltère, Machine) and muscles (Pectoraux, Ischios, Dos haut, Quadriceps, Poly-articulaire)
FIX: IntelligencePanelShell — add px-3 py-3 padding on docked scroll area, remove forbidden shadow-lg/shadow-2xl
FIX: ProgramTemplateBuilder — startNavRef aligned to 14 (was 16, caused jump on first drag)
FIX: ProgramIntelligencePanel — subscores grid-cols-2 (was grid-cols-3, too narrow in docked panel)
FIX: ProgramTemplateBuilder — nav 14%, intel 32% default widths for better proportions
FIX: ProgramTemplateBuilder — h-[calc(100vh-96px)] so dual-pane layout fills viewport correctly (react-resizable-panels needs fixed height)
FIX: new/edit template pages — remove wrapping padding/min-h-screen that broke PanelGroup height
REFACTOR: scoreBalance — enrich PUSH_PULL_IMBALANCE alerts with pushSets/pullSets counts and set-delta suggestions
REFACTOR: scoreSRA — enrich SRA_VIOLATION alerts with capitalized muscle name, exact missing hours, and effectiveLevel
REFACTOR: scoreRedundancy — enrich REDUNDANT_EXERCISES alert with combinedSets breakdown (exA.sets + exB.sets)
FEATURE: LabModeSection — SRA heatmap table (muscles × 4 weeks, color-coded fatigue)
FEATURE: LabModeSection — Lab overrides sliders per movement pattern (0.5–1.5 range)
FEATURE: EditorPane + ProgramTemplateBuilder — wire useLabOverrides into studio
FEATURE: useLabOverrides hook — coach can override stimulus coefficients per pattern in Lab Mode
FEATURE: useProgramIntelligence — accepts labOverrides (5th param), merged with morpho adjustments
FEATURE: scoreSRA — export sraHeatmap (SRAHeatmapWeek[]) with 4-week fatigue per muscle (0–100, empirical factor 0.003)
FEATURE: types.ts — add SRAHeatmapWeek interface + sraHeatmap field to IntelligenceResult
FEATURE: buildIntelligenceResult — propagate sraHeatmap from scoreSRA result
FEATURE: scoreRedundancy — skip bilateral+unilateral pairs when morpho has unilateral boost (arm asymmetry targeting)
FEATURE: scoreRedundancy — add optional morphoStimulusAdjustments param + isUnilateral helper
FEATURE: buildIntelligenceResult — pass morphoStimulusAdjustments to scoreRedundancy

REFACTOR: ProgramTemplateBuilder — refactor vers layout dual-pane (Navigator 16% | Editor 54% | Intelligence 30%) via react-resizable-panels v4
FEATURE: EditorPane — pane éditeur avec sticky meta-header, sessions scrollables, ExerciseCard + LabModeSection par session
FEATURE: IntelligencePanelShell — panel modulaire dock/float/minimize avec Framer Motion drag
FEATURE: LabModeSection — rule transparency + subscore debug + morpho status badge
FEATURE: ExerciseCard — extract exercise card into standalone component at components/programs/studio/ExerciseCard.tsx (2-column layout, self-contained)
FEATURE: NavigatorPane — composant arborescence séances/exercices avec collapse/expand et state activeSessionIndex/activeExerciseKey
REFACTOR: ProgramTemplateBuilder — merge clientId useEffects into single Promise.all fetch
FEATURE: intelligence debounce réduit 400ms → 300ms dans useProgramIntelligence
FEATURE: ProgramTemplateBuilder — fetch morpho/latest au mount + morphoAdjustments passé à useProgramIntelligence

## 2026-04-18

FEATURE: Phase 0 MorphoPro Bridge — implémentation complète (Tasks 3–9)
FEATURE: lib/morpho/analyze.ts — analyzePhotoWithOpenAI (gpt-4o), getPhotoUrlsFromSubmission, getLatestClientBiometrics
FEATURE: jobs/morpho/analyzeMorphoJob.ts — orchestrateur async (photos → Vision → parse → ajustements → DB)
FEATURE: API POST /api/clients/[clientId]/morpho/analyze — déclenche job, rate limit 1/24h, 202 Accepted
FEATURE: API GET /api/clients/[clientId]/morpho/latest — dernière analyse complète (coach + client auth)
FEATURE: API GET /api/clients/[clientId]/morpho/analyses — timeline paginée (coach only)
FEATURE: API POST /api/clients/[clientId]/morpho/job-status — polling statut job par job_id
FEATURE: scoring.ts buildIntelligenceResult accepte morphoStimulusAdjustments (4e param optionnel)
FEATURE: scoreSpecificity applique ajustements morpho au coefficient de stimulus par pattern
FEATURE: useProgramIntelligence hook accepte morphoStimulusAdjustments (4e param optionnel, backward compatible)
FEATURE: MorphoAnalysisSection — composant UI coach avec bouton Analyser + polling + affichage résultats DS v2.0
FEATURE: Page /coach/clients/[clientId] onglet Profil intègre MorphoAnalysisSection
FEATURE: Add morpho parsing and stimulus adjustment helper functions (Phase 0 Task 2)
FEATURE: parseMorphoResponses — extract metrics from OpenAI Vision text (body fat %, dimensions, asymmetries)
FEATURE: estimateMuscleFromBiometrics — estimate muscle mass from weight + body fat percentage
FEATURE: calculateStimulusAdjustments — derive per-pattern stimulus coefficients based on asymmetries (0.8–1.2 range)
FEATURE: applyMorphoAdjustment — apply morpho adjustments to base stimulus coefficients
TESTS: 42 tests passing (24 parse + 18 adjustments) covering parsing, estimation, and adjustment logic
SCHEMA: Add morpho_analyses table with RLS + TypeScript types (Phase 0 Task 1)
DOCS: Add MorphoPro bridge design specification (Phase 0)
DOCS: Add studio-lab master plan (Phases 0–4: MorphoPro → UI → Biomechanics → Feedback → Export)
FIX: scoreAlternatives — back muscle sub-groups (grand_dorsal / trapeze_moyen / rhomboides / trapeze_superieur / lombaires) derived from movementPattern, replaces monolithic 'dos' overlap
FIX: scoreAlternatives — deduplicate candidates by name prefix (first 3 words), max 6 results returned
FIX: ExerciseAlternativesDrawer — 'Remplace mécaniquement' label now requires true sub-group overlap, not dos_large-only match
FEATURE: ClientAlternativesSheet + SessionLogger.Indisponible? button — client sees coach-pre-configured alternatives bottom sheet
FEATURE: Session page server fetch — load coach_template_exercise_alternatives, pass clientAlternatives to SessionLogger
FEATURE: Système A client exercise alternatives — coach pre-configures up to 3 per exercise in template builder
SCHEMA: Add coach_template_exercise_alternatives table with RLS for alternatives management
FEATURE: API GET/POST/DELETE /program-templates/[id]/exercises/[id]/alternatives
FEATURE: ExerciseClientAlternatives component — inline coach UI in template builder (edit mode)
FEATURE: Exercise card layout refactored to 2-column grid: image left (constrained 140px square), exercise info right
FIX: Exercise image sizes now constrained to 140×140px square, no longer full column width
FEATURE: Add group_id field to BuilderExercise type for superset grouping
FEATURE: Create superset-scoring.test.ts with group_id acceptance and SRA tests
FEATURE: Template builder pages — remove max-w-3xl, full width layout (px-6)
FEATURE: Intelligence panel width 280px → 420px — uses full right column
FEATURE: ProgramIntelligencePanel — 3-col subscores, 4-col KPIs row, radar+donut side by side
FEATURE: ProgramIntelligencePanel — 2-col internal grid layout: 3-col subscores, 4-col KPIs (1×4), radar+donut side-by-side
FIX: ProgramIntelligencePanel — gate Recharts charts behind mounted state, fixes invisible PieChart/RadarChart
FIX: ProgramIntelligencePanel wrapper — max-h + overflow-y-auto, panel content no longer cut off below viewport
FIX: SessionStats.muscleVolumes — per-session muscle volume map, fixes incorrect bar % in Détail par séance
FIX: Muscle bar % now relative to total session volume — SessionStats.muscleVolumes tracks per-session muscle volumes, bars scale correctly per session
FIX: Intelligence panel wrapper scrollable with max-h — content no longer overflows viewport
FIX: Gate Recharts charts behind mounted state in ProgramIntelligencePanel — fixes invisible PieChart/RadarChart on SSR hydration
FEATURE: ProgramIntelligencePanel — section KPIs globaux (séries/sem, reps est., exercices uniques, moy. exos/séance)
FEATURE: ProgramIntelligencePanel — section Détail par séance avec barres musculaires top-3 et pills patterns
FEATURE: IntelligenceResult.programStats — ProgramStats + SessionStats calculés dans buildIntelligenceResult
FIX: buildIntelligenceResult filters out unnamed placeholder exercises — prevents phantom scores and spurious MISSING_PATTERN alerts on empty templates
FIX: ProgramIntelligencePanel sticky layout — wrapper uses top-[96px] to account for topbar height, panel no longer scrolls behind navbar
FIX: Recharts ResponsiveContainer wrapped in explicit div with fixed dimensions — fixes invisible PieChart/RadarChart in flex column
FIX: Add equipment to PATCH /api/clients/[clientId] allowlist — RestrictionsWidget equipment toggle was silently ignored
FEATURE: scoreSRA uses IntelligenceProfile.fitnessLevel when provided, overriding meta.level for SRA window modulation
SCHEMA: Add coach_custom_exercises table with RLS (per-coach isolation, UNIQUE coach_id+slug)
FEATURE: GET/POST /api/exercises/custom — coach custom exercise persistence with slug derivation + 409 conflict guard
FEATURE: ExercisePicker loads coach custom exercises from API on mount, merges with static catalog, shows Perso badge
FEATURE: ExerciseAlternativesDrawer — tab switcher Alternatives/Créer + inline custom exercise creation form (POST /api/exercises/custom)
FEATURE: ExerciseSwapSheet — client mobile bottom sheet for temporary exercise swap during session (scoreAlternatives, never persisted)
FEATURE: SessionLogger — swap button per exercise, swapped name display, ExerciseSwapSheet integration
FEATURE: ProgramIntelligencePanel onAlertClick prop emits (sessionIndex, exerciseIndex)
FEATURE: ProgramTemplateBuilder alert click scrolls to and highlights target exercise card (2s ring highlight, exerciseRefs map)
SCHEMA: Add body_part/severity to metric_annotations, equipment text[] to coach_clients
FEATURE: GET /api/clients/[clientId]/intelligence-profile — aggregate injuries + equipment into IntelligenceProfile
FEATURE: Extend POST /api/clients/[clientId]/annotations schema with body_part + severity fields
FEATURE: GET/POST /api/client/restrictions — client-authenticated injury restrictions CRUD
FEATURE: DELETE /api/client/restrictions/[annotationId] — client-authenticated restriction delete
FEATURE: scoreSpecificity accepts IntelligenceProfile, emits INJURY_CONFLICT alerts (critical/warning/info) with injury score penalty
FEATURE: scoreCompleteness accepts IntelligenceProfile, emits EQUIPMENT_MISMATCH alerts, filters required patterns by available equipment
FEATURE: buildIntelligenceResult + useProgramIntelligence accept optional IntelligenceProfile param (backward compatible)
FEATURE: components/clients/RestrictionsWidget.tsx — coach-facing restrictions + equipment selector (DS v2.0)
FEATURE: components/client/ClientRestrictionsSection.tsx — client-facing restrictions form with severity radio (DS v2.0)
FEATURE: Wire RestrictionsWidget into /coach/clients/[clientId] Profil tab
FEATURE: Wire ClientRestrictionsSection into /client/profil page
FEATURE: ProgramTemplateBuilder accepts clientId prop, fetches IntelligenceProfile, shows "Profil client appliqué" chip
FEATURE: Program Intelligence Phase 2A Task 2 — InjuryRestriction + IntelligenceProfile types, MUSCLE_TO_BODY_PART mapping, muscleConflictsWithRestriction helper — lib/programs/intelligence/types.ts + catalog-utils.ts (5 tests Vitest passants)
FEATURE: Program Intelligence Phase 1 — moteur scoring 6 sous-moteurs (balance push/pull, SRA, redondance mécanique, progression RIR, spécificité goal, patterns manquants) — lib/programs/intelligence/scoring.ts
FEATURE: lib/programs/intelligence/catalog-utils.ts — normalizeMuscleSlug + getStimulusCoeff + resolveExerciseCoeff (runtime derivation pour exercices custom)
FEATURE: lib/programs/intelligence/types.ts — types centralisés BuilderExercise, BuilderSession, TemplateMeta, IntelligenceResult, IntelligenceAlert
FEATURE: lib/programs/intelligence/alternatives.ts — scoreAlternatives (5 critères, max 8 alternatives scorées)
FEATURE: lib/programs/intelligence/index.ts — useProgramIntelligence hook debounce 400ms + exports publics
FEATURE: components/programs/ProgramIntelligencePanel.tsx — sticky panel 280px avec score animé Framer Motion, radar musculaire, donut patterns, grille subscores, feed alertes (Recharts)
FEATURE: components/programs/IntelligenceAlertBadge.tsx — alertes inline sous chaque exercice avec dismiss local et bouton alternatives
FEATURE: components/programs/ExerciseAlternativesDrawer.tsx — drawer alternatives scorées avec 5 filtres rapides + bouton Remplacer
FEATURE: ProgramTemplateBuilder — is_compound checkbox tri-état (auto/oui/non) + intégration useProgramIntelligence + panel + alertes + alternatives + scapular_elevation dans MOVEMENT_PATTERNS
FEATURE: ExercisePicker — onSelect expose désormais isCompound depuis le catalogue

## 2026-04-17

REFACTOR: scripts/generate-exercise-catalog.ts — corrections biomécanique v2 : movementPattern (élévations latérales → lateral_raise, tirage menton → vertical_pull, shrug → scapular_elevation, ext jambe → knee_extension), isCompound (hip thrust avec charge externe → true, oiseau-inverse/tirage-menton → false, nordic conservé true), ajout stimulus_coefficient 0.28–0.95 par pattern × compound (Schoenfeld 2010, Maeo 2021, Pedrosa 2022)
CHORE: data/exercise-catalog.json — régénéré, 458 exercices, nouveau champ stimulus_coefficient, 0 anomalie audit post-génération
FEATURE: Client app i18n complet (FR/EN/ES) — lib/i18n/clientTranslations.ts + ClientI18nProvider + useClientT() hook, toutes les pages client traduites
FEATURE: client_preferences.language désormais appliqué live sur toutes les pages au rechargement après sauvegarde

## 2026-04-16

FEATURE: app/client/profil/LogoutButton.tsx — i18n: useClientT() wired, all logout modal strings replaced with t() calls
FEATURE: app/client/profil/page.tsx — i18n: ct() wired, lang/dateLocale derived from preferences, all section labels/status/memberSince translated
FEATURE: app/client/progress/PRsPodium.tsx — i18n: useClientT() imported and wired
FEATURE: app/client/progress/ProgressHeatmap.tsx — i18n: useClientT() wired, MONTHS and DAY_ABBR derived from ta() at runtime
FEATURE: app/client/progress/ProgressClientPage.tsx — i18n: useClientT() wired, PERIODS moved inside component, KPI labels/history title/sets label/empty state translated

FEATURE: app/client/bilans/page.tsx — i18n: StatusBadge accepts lang prop, all FR strings replaced with ct/ctp helpers, lang fetched from client_preferences, dateLocale injected
FEATURE: app/client/programme/session/[sessionId]/SessionLogger.tsx — i18n: useClientT() wired, all FR strings replaced with t() calls (finish, rest, demo, rir, sides, note placeholder)
FEATURE: app/client/programme/recap/[sessionLogId]/page.tsx — i18n: ct() wired, lang fetched from client_preferences, section/stat labels and CTA translated

FEATURE: app/client/programme/page.tsx — i18n: all hardcoded FR strings replaced with ct/cta helpers, lang fetched from client_preferences, DAYS_FR/DAYS_FULL removed, NoProgramPage accepts lang prop

FEATURE: lib/i18n/clientTranslations.ts — FR/EN/ES dictionary for all client pages (nav, home, programme, logger, recap, bilans, progress, profil, common, greetings) with ct/ctp/cta helpers

FEATURE: ProgramEditor — inline muscle picker (primary/secondary chips) per exercise, persists via PUT /api/programs/[programId]/sessions/[sessionId]/exercises
FIX: exercises/route.ts POST+PUT — persist primary_muscles and secondary_muscles columns

REFACTOR: client/login — DS v2.0 dark, card bg-white/[0.02], inputs bg-[#0a0a0a], CTA bouton accent DS, tokens legacy supprimés
REFACTOR: client/access/invalid + expired — DS v2.0, logo centré, card dark, bouton neutre
REFACTOR: client/bilans/[submissionId] — DS v2.0, ClientTopBar, blocs divide-y, badge status inline
FEATURE: components/client/ClientTopBar — composant topbar réutilisable (section + title + backHref + right slot)
FEATURE: client/page — état vide "Pas encore de programme" avec card Sparkles accent
FEATURE: client/progress — ajout card "Message du coach" (dernière annotation) au-dessus de la heatmap
CHORE: GenesisAssistant — désactivé temporairement (retiré du root layout)
REFACTOR: client/bilans/page — DS v2.0, deux sections "À remplir" (amber, CTA) + "Historique" (liste compacte), tokens legacy supprimés
FEATURE: client/page — dashboard accueil : hero séance du jour (CTA commencer), prochaine séance si repos, stats hebdo dots, message coach (dernière annotation), bilans en attente
FEATURE: components/client/ContextualGreeting — salutation contextuelle selon heure et présence de séance aujourd'hui
REFACTOR: BottomNav — structure uniforme icône+label, actif en #1f8a65, inactif text-white/35, suppression pill dynamique
REFACTOR: ClientProfilPage — topbar DS v2.0 + avatar mini initiales, cards bg-white/[0.02], labels section uppercase, hero supprimé
REFACTOR: ClientLogoutButton — tokens legacy remplacés, modal confirmation DS v2.0 (bg-[#181818], bordures white/[0.06])

SCHEMA: coach_program_template_exercises + program_exercises — add primary_muscles text[] + secondary_muscles text[]
FEATURE: muscleDetection — primary/secondary split, DB columns priority over regex fallback, ExerciseInput interface
FEATURE: BodyMap — 3-state visual: primary (#1f8a65 full) / secondary (#1f8a65 28% opacity) / inactive (grey)
FEATURE: ProgramTemplateBuilder — inline muscle picker chips per exercise (primary + secondary rows)
FEATURE: api/program-templates — persist + propagate primary_muscles + secondary_muscles on save and assign
FEATURE: ProgramTemplateBuilder — inline muscle picker (primary/secondary) per exercise with 12 MUSCLE_GROUPS slugs
FEATURE: api/program-templates POST — persist primary_muscles + secondary_muscles in template exercises
FEATURE: api/program-templates/[templateId] PATCH + duplicate — persist + propagate primary_muscles + secondary_muscles
FEATURE: api/program-templates/[templateId]/assign — propagate primary_muscles + secondary_muscles to program_exercises on assignment

REFACTOR: lib/client/muscleDetection — primary/secondary split, ExerciseInput interface, DB source priority over regex fallback
FEATURE: components/client/BodyMap — 3-state visual (primary green / secondary pale green / inactive grey), new props primaryGroups + secondaryGroups
FEATURE: app/client/programme/page — pass primary_muscles/secondary_muscles from DB to detectMuscleGroups, forward primaryGroups/secondaryGroups to BodyMap
FEATURE: app/client/programme/recap — same primary/secondary pattern applied to BodyMap in session recap page

REFACTOR: BodyMap — remplacement SVG artisanal par paths anatomiques professionnels (react-muscle-highlighter MIT) — 23 groupes musculaires, silhouette précise vue front + dos, coloration dynamique DS v2.0 (#1f8a65 actif / rgba neutre inactif)

FIX: client/progress/ProgressHeatmap — cases carrées taille fixe (11px), grid inline-style au lieu de flex/aspect-square, labels jours alignés, fond transparent sur padding cells
FIX: client/progress/ProgressClientPage — streak hero : état 0 (quiet Zap + encouragement) vs actif (grand chiffre, gradient vert, barre progression vs record) vs on fire (glow radial, icône Flame, label contextuel)
FEATURE: client/progress/ProgressClientPage — micro-insight contextuel sous KPIs (meilleure séance, volume moyen par séance)
FEATURE: client/progress — refonte complète page progression : streak counter, heatmap 12 semaines, PRs podium top 3, sélecteur période 7j/30j/90j/tout, volume chart DS v2.0
FEATURE: client/progress/ProgressHeatmap — heatmap GitHub-style 84 jours, 5 niveaux d'intensité vert, labels mois
FEATURE: client/progress/PRsPodium — podium médailles top 3 PRs par charge max, delta % vs PR précédent, liste expandable exercices restants
FEATURE: client/progress/ProgressVolumeChart — area chart accent #1f8a65, tooltip dark DS v2.0, activeDot animé
FEATURE: client/progress/ProgressClientPage — shell client-side avec filtrage période réactif sur rawLogs pré-chargés, badge PR dans historique séances

FIX: api/session-logs — Zod validation on POST body (session_name, set_logs shape)
FIX: api/session-logs/[logId] — Zod validation on PATCH body (duration_min, set_logs side enum)
REFACTOR: api/session-logs/[logId] — set_logs update now uses single upsert instead of N queries (eliminates N+1)
CHORE: tests/mocks/supabase — add maybeSingle, is, gte, lte, contains to mock chain methods
FIX: session/[sessionId]/page — lastPerformance query now scoped to client via client_session_logs!inner join (security: prevent cross-client data leak)
REFACTOR: lib/client/resolve-client — typed return as ResolvedClient, fixes GenericStringError on .id across all programme pages
FIX: SessionLogger — rest timer double-trigger on checkbox: skip startRest if already tracking same set
FIX: SessionLogger — rest modal circle proportions: enlarged SVG to w-48, fixed formatTime double-negative bug
FIX: SessionLogger — "Terminer" button overlap on scroll: added solid bg-[#121212] to fixed wrapper
FIX: SessionLogger — missing header label on validation column: added ✓
FIX: SessionLogger — rest timer invisible when modal closed: mini-badge in header shows remaining time
REFACTOR: Programme home — exercise list collapsible by default (ChevronDown disclosure row)
REFACTOR: Programme home — vertical stack layout: BodyMap centered full-width, stat pills row, full exercise list (no truncation)
REFACTOR: BodyMap — rewritten with organic anatomical SVG paths (front + back), improved visual fidelity

SCHEMA: client_set_logs — add rest_sec_actual int column (effective rest time captured by inverted timer)
FEATURE: SessionLogger — image open by default in square 1:1 format, explicit "Réduire" button
FEATURE: SessionLogger — inverted rest timer: triggers on input or validation, 3s inactivity delay before modal, overtime countdown in red with negative time, mini-badge in header during overtime
FEATURE: SessionLogger — rest_sec_actual recorded per set (stops when next set interaction detected)
FEATURE: SessionLogger — finish button: long press 3s with fill gauge when session incomplete, simple click when all sets done, confirmation modal with remaining sets count
FEATURE: Programme home — full refonte: session card with body map SVG, data points (duration, sets, exercises, rest avg, RIR), exercise preview, rest day state with next session
FEATURE: BodyMap component — SVG front/back human body with muscle groups highlighted in accent green based on exercise name keywords
FEATURE: Session recap page (/client/programme/recap/[id]) — post-session summary with stats, body map, per-exercise performance delta vs last session, exercise notes
FEATURE: Progress page — enriched with session history list (clickable → recap), DS v2.0 tokens applied
FIX: BodyMap — extract detectMuscleGroups and MuscleGroup type to lib/client/muscleDetection.ts (pure module, no 'use client') to fix "m.n0 is not a function" crash on /client/programme Server Component
FIX: session-logs route — double fallback on program_session_id FK violation; retries insert with null if first attempt fails (race condition or deleted session)

## 2026-04-14

FIX: MetricsSection — annotation ReferenceLine no longer cuts metric lines (added connectNulls on Line components)
FIX: BioNormsPanel — metabolic age norm now only shown when measured by impedance scale, not when auto-estimated from BMR
FIX: bioNorms — evaluateAll now accepts metabolic_age_source and skips estimated_katch/estimated_mifflin values

FEATURE: BioNorms — Normes view now displays the most recent directly-entered value per metric across all submissions (bilans + saisies manuelles), not just one bilan
FEATURE: BioNorms — Each gauge now shows a "Mesuré le JJ/MM" (green) or "Calculé le JJ/MM · formule cliquable" (grey) source badge
REFACTOR: useBiometrics — now accepts clientId and aggregates latest value per field_key across all completed submissions

FIX: MetricsSection SliderBlock — "Du" and "Au" date inputs were bound to wrong array indices (timeRangeDays[0]=Au, [1]=Du); swap fixes both the inverted display and the "Au snaps to today" bug

FIX: MetricsSection TimeRangeSlider — date inputs "Du/Au" no longer collapse range to zero (inverted Math.min/max constraint corrected)
FIX: MetricsSection TimeRangeSlider — isoDateToDays now parses dates as local time to avoid off-by-one timezone shift

REFACTOR: MetricsSection overlay — move "Ajouter une note" button out of chart canvas into a dedicated header bar above the chart
FEATURE: MetricsSection — SliderBlock and TimeRangeSlider now include date inputs (Du / Au) synced bidirectionally with the slider
FIX: MetricsSection overlay — annotations/phases filtered to visible time window before being passed to MultiSeriesChart (out-of-window annotations were injecting phantom x-axis points, distorting chart)
FIX: MetricsSection overlay — TimeRangeSlider now uses fixed left/right date labels (same pattern as SliderBlock, no more collision)
FIX: MetricsSection overlay — inject annotation/phase dates into merged dataset so ReferenceLine always finds an x= match (annotations were visible in list but invisible on chart when no measurement existed on that date)
FIX: metrics API — normalize all dates to YYYY-MM-DD (submitted_at was ISO timestamp, causing ReferenceLine x= mismatch — annotations invisible on chart)
FIX: annotations POST route — body field now accepts null (z.nullable) — was rejecting null with "Expected string, received null"
FIX: annotations routes — Zod error serialized as string (not ZodError object) to avoid React "Objects are not valid as a React child" crash
FIX: annotations PATCH route — add lab_protocol to event_type enum (was missing, caused silent 400 on edit)
SCHEMA: program_exercises — add image_url (text) and is_unilateral (boolean) columns
SCHEMA: client_session_logs — add exercise_notes (jsonb) column for per-exercise client feedback
SCHEMA: client_set_logs — add side (left/right/bilateral) column for unilateral exercise tracking
FIX: /api/session-logs POST — verify program_session_id exists before insert to prevent FK constraint violation crash
FEATURE: SessionLogger — full DS v2.0 dark redesign (#121212 background, white/[0.06] borders, accent #1f8a65)
FEATURE: SessionLogger — focused one-exercise-at-a-time view with dot navigation and prev/next buttons
FEATURE: SessionLogger — exercise image/GIF display with collapsible demo (supports .gif unoptimized)
FEATURE: SessionLogger — RIR target shown inline on all exercises; RIR actual input available on all sets (not just double-progression)
FEATURE: SessionLogger — unilateral exercise support: auto-detects via is_unilateral flag or name keywords, creates L/R sub-sets per series
FEATURE: SessionLogger — last performance displayed per set in placeholder ("↩ 80kg × 8") fetched server-side
FEATURE: SessionLogger — rest timer full-screen modal with animated countdown and skip button
FEATURE: SessionLogger — per-exercise client feeling note (textarea, persisted in exercise_notes JSONB)
FEATURE: session/[sessionId]/page.tsx — fetch last set_logs server-side for previous performance hints
CHORE: client/layout.tsx — add Next.js metadata for PWA (appleWebApp, manifest link, viewport)
CHORE: public/manifest.json — update background_color and theme_color to #121212 (DS v2.0)

FEATURE: MetricsSection — add bar/line chart type toggle per category (composition/mensurations/bien-être) with localStorage persistence
FIX: MetricsSection — norms tab now finds most recent submission with both weight_kg and height_cm instead of using rows[0] blindly; tab is disabled with tooltip when no valid submission exists
FIX: MetricsSection — overlay annotation save now shows API error message inline in form when save fails (was silently swallowing non-ok responses)
FIX: MetricsSection — slider date labels replaced with fixed left/right layout, no more collision when cursors are close
FIX: MetricsSection — getDelta now computes first→last value over the full visible window (was computing last minus second-to-last, giving single-step delta)
FIX: MetricsSection — slider right thumb date no longer hidden when cursors are close — label moves above the track instead of disappearing (both TimeRangeSlider and SliderBlock)
FIX: /client/auth/callback — handle INITIAL_SESSION with session → done(true) immediately (was falling through to 8s timeout)
FIX: /client/auth/callback — detect Supabase error params (?error_code / ?error) at mount and redirect immediately with reason param
FIX: /client/auth/callback — add reason param to all done(false) calls (timeout / no_token / code_exchange_failed) for easier diagnosis in login page URL
FIX: invite route — use coach_clients.status === 'suspended' instead of last_sign_in_at to decide reactivation vs fresh invite (last_sign_in_at is unreliable — set by OTP verification even when user never completed set-password)
