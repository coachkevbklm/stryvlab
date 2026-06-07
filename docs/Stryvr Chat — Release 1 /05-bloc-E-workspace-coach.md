# Bloc E — Workspace coach assistant

**Côté : Coach (plateforme Stryv Lab)**
**Priorité : Critique**
**Dépendances : Bloc D (DB) livré en amont. Indépendant des Blocs A, B, C, peut démarrer en parallèle.**

---

## Objectif du bloc

Côté plateforme coach, créer le **workspace du coach assistant** : l'espace où le coach paramètre le Coach IA (globalement et par client), reçoit les messages clients qui demandent son intervention humaine, et y répond directement. Sans ce bloc, le système d'escalade silencieuse (Bloc C) et le LLM activable par client (vision produit) ne peuvent pas fonctionner — le coach ne saurait pas que des clients l'attendent.

Ce bloc est conçu pour être **livré en parallèle** des blocs côté client. Tant que le schéma DB est figé (Bloc D), les deux pistes avancent sans conflit.

## Périmètre fonctionnel

### Section "Coach Assistant" dans les paramètres globaux du coach

Une nouvelle section à ajouter à la page de paramètres du coach (chemin existant ou nouveau, à confirmer par Claude Code en inspectant le repo — typiquement `/coach/settings` ou équivalent).

**Contenu de la section :**

1. **Statut de la formule LLM** : indicateur visuel si le coach a la formule incluant le LLM (lecture seule en R1, basé sur `coach_profiles.has_ai_llm`). Si pas activée : message expliquant qu'il faut souscrire à la formule premium pour activer le LLM (lien vers contact/sales, pas de paywall UI en R1).

2. **Nom de l'IA** (input texte) : optionnel. Si laissé vide, le Coach IA porte le prénom du coach. Sinon, le nom custom est utilisé. Sauvegardé dans `coach_profiles.ai_coach_name`.

3. **Ton par défaut** : sélecteur entre 4 options (chips ou radio) :
   - **Strict** : direct, factuel, sans complaisance
   - **Bienveillant** : encourageant et précis (défaut)
   - **Motivant** : énergique, pousse à l'action
   - **Neutre** : informatif sans coloration émotionnelle
   - Chaque option a une description courte sous le label
   - Sauvegardé dans `coach_profiles.ai_tone`

4. **Permissions de l'IA** (3 toggles) :
   - "Autoriser les conseils nutrition"
   - "Autoriser les conseils entraînement"
   - "Autoriser les conseils mode de vie / récupération"
   - Tous activés par défaut. Le coach peut désactiver une catégorie globalement.
   - Sauvegardé dans `coach_profiles.ai_permissions` (JSONB)

5. **Instructions custom** (textarea, max 500 chars, counter live) : champ libre où le coach peut écrire des instructions générales pour l'IA, applicables à tous ses clients. Exemple : *"Mes clients sont principalement des athlètes intermédiaires/avancés. Sois précis et technique. Ne sur-explique pas les bases."* Sauvegardé dans `coach_profiles.ai_custom_instructions`.

6. **Préférences de notifications** : section avec checkboxes :
   - "Recevoir les notifications d'escalade santé par email" — **non-modifiable, toujours activé** (texte explicatif court)
   - "Recevoir les notifications d'escalade hors-périmètre par email" — modifiable
   - "Recevoir les notifications de patterns clients par email" — modifiable
   - "Recevoir les notifications de désengagement client par email" — modifiable
   - À sauvegarder dans une nouvelle structure de préférences notification coach (table à créer ou colonne JSONB sur `coach_profiles` selon convention du repo)

### Section "Coach Assistant" dans le profil de chaque client

Sur la page profil d'un client côté coach, ajouter une section dédiée au paramétrage du Coach Assistant pour **ce client spécifiquement**.

**Contenu de la section :**

1. **Toggle "Activer le LLM pour ce client"** :
   - Désactivé par défaut (cohérent avec la vision : LLM activé client par client manuellement)
   - Si le coach n'a pas la formule LLM (`has_ai_llm = false`), le toggle est désactivé/grisé avec message explicatif
   - Sauvegardé dans `coach_ai_settings_per_client.ai_llm_enabled`

2. **Quota mensuel de messages LLM** (input numérique, optionnel) :
   - Laissé vide = illimité (dans la limite du budget global du coach)
   - Permet au coach de plafonner ce client à X messages/mois
   - Sauvegardé dans `coach_ai_settings_per_client.monthly_quota`

3. **Override du ton** : sélecteur identique à celui des paramètres globaux, mais avec une option supplémentaire "Utiliser le ton par défaut" (sélectionnée par défaut). Si un ton spécifique est sélectionné, il override le ton global pour ce client.

4. **Instructions custom client** (textarea, max 500 chars) : champ libre pour des instructions spécifiques à ce client. Exemple : *"Ce client est en phase de récupération après blessure aux genoux. Évite toute mention d'exercices avec impact sur les genoux."* S'ajoute aux instructions globales du coach, ne les remplace pas.

**Validation et messages d'aide :**

Sous chaque champ, courte explication du comportement attendu pour aider le coach à comprendre. Particulièrement important pour les concepts nouveaux (LLM activé/désactivé, ce que ça change pour le client).

### Inbox du coach — messages en attente

**Une nouvelle page ou section** (à arbitrer selon UX du dashboard coach existant — Claude Code décide après inspection du repo) qui affiche **tous les messages clients qui demandent l'attention du coach**.

**Contenu de l'inbox :**

- Liste des entrées de `coach_notifications` avec `status = 'pending'`
- Triée par priorité décroissante (`safety` en haut), puis par date (plus récent en haut)
- Pour chaque entrée :
  - Photo + prénom du client
  - Catégorie de la notification (badge coloré selon priorité : rouge pour safety, orange pour out_of_scope, bleu pour patterns)
  - Extrait du message client (les 2-3 premières lignes)
  - Date/heure de réception
  - Statut (pending par défaut)
- Filtres possibles (R1 : minimum 2-3) : par catégorie, par client, par statut
- Compteur global d'entrées pending visible dans le dashboard principal (badge sur l'icône d'inbox)

**Détail d'une entrée et réponse coach :**

Quand le coach clique sur une entrée :
- Vue détaillée qui affiche :
  - L'historique du chat client (les 10-15 derniers messages)
  - Le message qui a déclenché l'escalade, mis en évidence
  - La raison de l'escalade (catégorie + subcatégorie)
  - Le contexte client utile (résumé : check-ins récents, alertes récentes, programme en cours)
- **Zone de réponse** : textarea pour écrire la réponse + bouton "Envoyer"
- À l'envoi :
  - Un nouveau message est inséré dans `chat_messages` avec `role: 'assistant'`, `from_coach_human: true`, `parent_message_id` = message client d'origine, `content` = texte rédigé
  - La notification `coach_notifications.status` passe à `'resolved'`
  - Le `chat_messages.requires_coach_response` du message d'origine passe à `false`
  - Côté client, la réponse apparaît dans le chat avec **bordure verte 1.5px**
- Option **"Marquer comme traité sans répondre"** : pour les cas où le coach a contacté le client par un autre canal (téléphone, en personne lors d'une séance). Passe la notif à `'resolved'` sans créer de message dans le chat.
- Option **"Reporter"** : repasse à `'pending'` plus tard (snooze 24h). En R1, optionnel — peut être en R2 si trop lourd.

### Tableau de bord / vue d'ensemble (light, R1)

Sur la page principale du dashboard coach, ajouter quelques indicateurs liés au Coach Assistant :

- Badge "X messages en attente" cliquable vers l'inbox
- Indicateur du nombre de clients avec LLM activé / total clients du coach
- Consommation LLM du mois (X / Y messages) si formule LLM active

Pas de graphique élaboré en R1, juste de l'info utile et visible.

## Critères de "done"

- Section "Coach Assistant" dans les paramètres globaux du coach opérationnelle : nom IA, ton, permissions, instructions custom, préférences de notification email
- Section "Coach Assistant" dans le profil de chaque client opérationnelle : toggle LLM, quota, override ton et instructions
- Inbox du coach affiche les entrées `coach_notifications` pending avec tri, filtres, badge de priorité
- Le coach peut cliquer sur une entrée et voir l'historique de conversation + contexte client
- Le coach peut écrire et envoyer une réponse depuis l'inbox
- La réponse coach arrive dans le chat client avec bordure verte 1.5px (côté UI client à coordonner avec le Bloc A)
- L'option "Marquer comme traité sans répondre" fonctionne
- Email "escalade safety" envoyé automatiquement au coach (cf. Bloc D, infrastructure email)
- Emails optionnels respectent les préférences du coach (paramètres globaux)
- Indicateurs sur le dashboard coach principal présents et corrects
- Tests d'intégration : un client envoie un message safety → inbox coach reçoit l'entrée + email arrive → coach répond → message arrive dans le chat client
- Aucune erreur TypeScript, lint clean

## Points de vigilance

- **Ne pas casser les pages existantes** : la page paramètres coach et la page profil client existent déjà avec d'autres sections (métriques, programme, notes, etc.). L'ajout de la section Coach Assistant doit s'intégrer proprement, pas remplacer.
- **Performance de l'inbox** : si un coach a 50+ clients actifs, l'inbox peut avoir 50-100 entrées par jour. Pagination obligatoire (10-20 par page). Pas de chargement de tout l'historique de chat pour chaque entrée — chargement lazy quand le coach clique.
- **Contexte client riche mais pas verbeux** : la vue détail d'une notification doit donner au coach assez d'info pour décider sans saturer. Quelques métriques clés + extrait pertinent suffit. Pas besoin de tout l'historique des bilans.
- **Cas où plusieurs notifications pour le même client en parallèle** : si un client envoie 3 messages safety en 10 minutes, le coach reçoit 3 entrées d'inbox. Pas de regroupement automatique en R1 — chaque message vit indépendamment. Si lourd, agrégation en R2.
- **Cohérence visuelle avec le design system coach existant** : si DS v2.0 mentionné dans les briefs précédents, suivre ces conventions (couleurs, typographies, espacements). Si pas de doc DS, suivre les patterns observés dans les autres pages du repo.
- **Validation par Coach Kev** : avant de figer les libellés (descriptions des tons, messages d'aide, templates d'email), faire valider par Coach Kev. Le langage métier est crucial pour la confiance du coach.
- **Sécurité** : un coach doit voir uniquement les conversations et notifications de **ses** clients. RLS strict + double vérification au niveau handler API.
- **L'inbox ne doit pas se vider trop vite** : quand le coach résout une notification, elle disparaît de la vue par défaut. Prévoir un filtre "Voir les notifications résolues" pour l'historique et l'audit.
