# Bloc D — Préparations DB et observabilité

**Côté : Transverse (DB + infrastructure)**
**Priorité : Critique — BLOQUANT pour tous les autres blocs**
**Dépendances : Aucune. À livrer EN PREMIER.**

---

## Objectif du bloc

Poser la fondation technique de la Release 1 : migration de schéma DB complète, infrastructure d'observabilité (table de traces des appels LLM), et feature flags pour piloter l'activation du LLM par coach et par client.

**Ce bloc doit être livré et mergé avant tout autre bloc.** Les Blocs A, B, C, E dépendent tous des colonnes, tables et flags introduits ici.

## Périmètre fonctionnel

### Schéma DB à ajouter

**Sur la table `chat_messages`** (existante) :

- `parent_message_id` (UUID, nullable, FK vers `chat_messages.id`) : permet de lier une réponse `assistant` au message `user` qui l'a déclenchée. Indispensable pour l'édition/suppression cohérente des messages (Bloc A) et pour le routage de la réponse coach (Bloc C).
- `requires_coach_response` (boolean, default false) : flag d'escalade silencieuse posé par le Bloc C.
- `coach_response_reason` (enum, nullable) : raison de l'escalade. Valeurs : `safety_health`, `safety_mental`, `out_of_scope_protocol`, `out_of_scope_prediction`, `data_missing`, `llm_disabled`.
- `from_coach_human` (boolean, default false) : indique qu'un message `role: 'assistant'` a été rédigé par le coach humain via l'inbox (et non par le LLM). Permet le rendu avec bordure verte 1.5px côté client.
- `trace_id` (UUID, nullable) : référence vers une entrée dans `llm_traces` quand le message provient d'un appel LLM. Permet le debug et l'audit.

Étendre également l'enum `message_type` pour inclure : `checkin_summary`, `bilan_signed`, `nutrition_alert_auto`, `training_alert_auto`, `pattern_inquiry` (questions d'enquête conversationnelle du Bloc B).

**Sur la table `coach_profiles`** (existante) :

- `has_ai_llm` (boolean, default false) : feature flag global. Si false, le LLM n'est jamais appelé pour aucun client de ce coach. Permet d'activer le LLM coach par coach lors du déploiement progressif.
- `ai_tone` (enum, default `'bienveillant'`) : ton par défaut appliqué aux messages du Coach IA pour les clients de ce coach. Valeurs : `strict`, `bienveillant`, `motivant`, `neutre`. Override possible par client (voir table dédiée plus bas).
- `ai_coach_name` (text, nullable) : nom optionnel de l'IA si le coach veut personnaliser. Si null, fallback sur le prénom du coach.
- `ai_permissions` (JSONB, default `'{"give_nutrition_advice":true,"give_training_advice":true,"give_lifestyle_advice":true}'`) : permissions du LLM pour les clients de ce coach. Réglages par défaut à valider.
- `ai_custom_instructions` (text, nullable, max 500 chars) : instructions custom du coach à injecter dans le prompt LLM.

**Nouvelle table `coach_ai_settings_per_client`** :

Override par client des paramètres globaux du coach. Si une ligne existe pour un (`coach_id`, `client_id`), elle prime sur les défauts du coach.

Colonnes :
- `id` (UUID, PK)
- `coach_id` (UUID, FK)
- `client_id` (UUID, FK)
- `ai_llm_enabled` (boolean, default false) : LLM activé pour ce client. **Par défaut false, le coach active manuellement** chaque client.
- `ai_tone` (enum, nullable) : override du ton global
- `ai_custom_instructions` (text, nullable, max 500 chars) : override des instructions globales
- `monthly_quota` (integer, nullable) : quota mensuel de messages LLM pour ce client. Si null, illimité dans la limite du budget coach.
- `created_at`, `updated_at`

Contrainte d'unicité sur (`coach_id`, `client_id`).

**Nouvelle table `coach_llm_budget`** :

Suivi du budget LLM par coach (utilisé en R1 pour traçabilité, UI de billing en R3).

Colonnes :
- `id` (UUID, PK)
- `coach_id` (UUID, FK)
- `month` (date, premier jour du mois)
- `tier_included_quota` (integer) : quota inclus dans la formule du coach pour ce mois
- `purchased_credits` (integer, default 0) : crédits supplémentaires achetés ce mois
- `consumed_messages` (integer, default 0) : nombre de messages LLM consommés ce mois (somme sur tous les clients du coach)
- `created_at`, `updated_at`

Contrainte d'unicité sur (`coach_id`, `month`).

À chaque appel LLM réussi, `consumed_messages` est incrémenté de 1.

**Nouvelle table `llm_traces`** (cœur de l'observabilité) :

Pour chaque appel LLM, on logue tout ce qu'il faut pour débugger plus tard.

Colonnes :
- `id` (UUID, PK)
- `created_at` (timestamptz, default now())
- `client_id` (UUID, FK, nullable) : le client concerné, si applicable
- `coach_id` (UUID, FK, nullable) : le coach concerné
- `chat_message_id` (UUID, FK, nullable) : le message qui a déclenché cet appel
- `model` (text) : modèle utilisé (`gpt-4o-mini` en R1)
- `system_prompt` (text) : prompt système complet envoyé
- `user_message` (text) : message du client
- `context_summary` (JSONB) : signaux pré-calculés injectés (cf. Bloc A)
- `response_content` (text) : réponse du LLM
- `tokens_in` (integer) : tokens en entrée
- `tokens_out` (integer) : tokens en sortie
- `latency_ms` (integer) : durée totale de l'appel
- `error` (text, nullable) : message d'erreur si l'appel a échoué
- `error_type` (text, nullable) : type d'erreur (`timeout`, `rate_limit`, `invalid_response`, etc.)

Cette table peut grossir vite. Prévoir une politique de rétention (par exemple, archivage des entrées de plus de 90 jours). En R1 : pas de rétention automatique, on observe la croissance, on ajuste en R2.

**Nouvelle table `coach_notifications`** :

Queue des notifications côté coach. Alimentée par le Bloc C (escalades) et le Bloc B (alertes patterns), consommée par le Bloc E (inbox).

Colonnes :
- `id` (UUID, PK)
- `created_at` (timestamptz, default now())
- `coach_id` (UUID, FK)
- `client_id` (UUID, FK)
- `chat_message_id` (UUID, FK, nullable) : message client à l'origine de la notif (si applicable)
- `category` (enum) : `safety` (priorité haute), `out_of_scope`, `pattern_inquiry`, `engagement` (client inactif), `weight_off_track`
- `subcategory` (text, nullable) : précision (exemple : `safety_health`, `lipides_dépassés_3j`)
- `status` (enum, default `'pending'`) : `pending`, `resolved`, `dismissed`
- `priority` (integer) : 1 (safety, urgent) à 5 (info)
- `email_sent` (boolean, default false) : email déjà envoyé pour cette notif
- `resolved_at` (timestamptz, nullable)

Cette table devient l'**inbox du coach** côté Bloc E.

### Wrapper LLM centralisé

Tous les appels OpenAI dans le projet doivent passer par un wrapper unique (à créer dans ce bloc, utilisé par le Bloc A et au-delà).

**Responsabilités du wrapper :**

- Appel OpenAI (GPT-4o-mini en R1)
- Streaming de la réponse (SSE côté serveur, ReadableStream côté Edge)
- Gestion timeout (30s par défaut, configurable)
- Retry sur erreur transitoire (1 retry max en R1)
- Trace systématique dans `llm_traces` (création de l'entrée avant l'appel, mise à jour avec response/tokens/latency après)
- Décrément du `consumed_messages` dans `coach_llm_budget` après succès
- Gestion d'erreur propre : si l'appel échoue (timeout, rate limit, refus), enregistrer dans `llm_traces.error`, et **ne pas afficher de message d'erreur cryptique au client**. Fallback : afficher *"Une seconde..."* puis si échec persistant, escalader silencieusement comme s'il s'agissait d'un cas `data_missing`.

**Interface publique du wrapper (suggestion, Claude Code décide du nommage exact) :**

```typescript
callLLM({
  systemPrompt: string,
  userMessage: string,
  conversationHistory: Message[],
  contextSummary: object,
  clientId: string,
  coachId: string,
  chatMessageId: string,
  streaming: boolean,
  // ...
}): Promise<LLMResponse>
```

Le wrapper doit être **swappable** : si demain on veut passer à Claude Sonnet ou autre, un seul fichier à modifier.

### Infrastructure de notifications coach

Pour la R1, **deux canaux** sont supportés : entrée inbox dashboard (toujours), et email.

**Pour les emails :**

- Utiliser le service email déjà en place chez Stryv Lab (Resend, SendGrid, ou autre — à confirmer par Claude Code en inspectant le repo)
- Templates simples mais clairs : "Action requise — votre client [Prénom] a envoyé un message qui demande votre attention" + extrait du message + lien vers l'inbox
- Pour les notifications `safety` : email envoyé immédiatement, **non-modifiable** par le coach
- Pour les notifications `out_of_scope` et `pattern_inquiry` : email envoyé si le coach a coché ce canal pour cette catégorie (voir Bloc E)
- Pour les notifications `engagement` et `weight_off_track` : email cochable de la même manière

**Pas de SMS, pas de WhatsApp en R1.**

### Authentification et sécurité

Toutes les nouvelles routes API doivent :

- Vérifier l'authentification de l'utilisateur via Supabase Auth
- Vérifier l'**ownership** du `clientId` ou `coachId` cible avant tout accès aux données
- Ne jamais accepter un `clientId` arbitraire en input sans validation

**Sur l'usage du service role :**

Le code existant utilise parfois le `service_role` pour contourner RLS. C'est acceptable côté serveur si — et seulement si — la route API a validé l'authentification et l'ownership en amont. Documenter clairement dans le code les endroits où le `service_role` est utilisé et pourquoi c'est sûr.

Le wrapper LLM et les routes liées au chat doivent **toujours** valider l'auth avant d'utiliser le `service_role` pour lire les données du client.

### Gestion des dates physiologiques

Le projet utilise déjà la notion de "date physiologique" (cut-off à 4h UTC). Tout le code de ce bloc doit utiliser la fonction utilitaire existante (`computePhysiologicalDate` dans `lib/nutrition/physiological-date.ts`) plutôt que de manipuler des strings de date à la volée.

Si une constante `PHYSIOLOGICAL_DAY_OFFSET_HOURS = 4` n'existe pas encore, la créer et l'exporter pour usage centralisé.

## Critères de "done"

- Migration DB complète appliquée (toutes les colonnes et tables ci-dessus créées)
- RLS policies configurées proprement sur les nouvelles tables (cf. politique existante du projet)
- Wrapper LLM centralisé en place, utilisé par tous les appels OpenAI du projet (refacto inclus dans ce bloc)
- Chaque appel LLM crée une entrée dans `llm_traces` avec tous les champs renseignés
- Service email opérationnel pour envoyer une notification coach (test : envoyer une fausse notif et recevoir l'email)
- Feature flag `has_ai_llm` testable : à false, le LLM n'est jamais appelé même si tout le reste pousse à l'appeler
- Aucune erreur TypeScript
- Documentation rapide dans `project-state.md` du nouveau schéma DB et du wrapper LLM
- Backfill : les messages `chat_messages` existants ont `parent_message_id = null` (acceptable, on n'essaye pas de reconstruire l'historique)

## Points de vigilance

- **Migration DB en environnement de production** : à appliquer manuellement via Supabase Dashboard SQL Editor, hors heures de pointe. Backup avant.
- **Compatibilité ascendante** : les anciens messages dans `chat_messages` n'ont pas `parent_message_id`. Le code consommateur doit accepter `null` proprement, pas planter.
- **Volume de `llm_traces`** : peut grossir vite. Ne pas indexer toutes les colonnes (text content est lourd). Index sur `created_at`, `client_id`, `coach_id`, `error_type`. Le reste est consultable au cas par cas.
- **Cohérence des compteurs `consumed_messages`** : risque de race condition si plusieurs appels LLM simultanés pour le même coach. Soit transaction propre, soit acceptation d'une légère imprécision en R1 (le coach ne facturera pas au message en R1 de toute façon). À documenter.
- **Ne pas exposer `llm_traces` aux coachs en R1**. C'est une table d'observabilité interne Stryv Lab. L'accès est réservé à l'équipe.
- **Configuration des templates email** : valider la formulation avec Coach Kev (le coach lui-même reçoit ces emails dans sa boîte personnelle, ils doivent être pro et précis).
