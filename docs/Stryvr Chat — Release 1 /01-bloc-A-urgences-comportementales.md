# Bloc A — Urgences comportementales

**Côté : Client (Stryvr PWA)**
**Priorité : Critique**
**Dépendances : Bloc D (DB et observabilité) doit être livré en amont**

---

## Objectif du bloc

Corriger en priorité les comportements défaillants observés du Coach IA actuel et poser les bases d'une expérience de chat fiable. Ce bloc se concentre sur trois axes :

1. Refonte du system prompt LLM pour éliminer les hallucinations et la robotisation
2. Persistance des check-ins dans le chat comme messages user éditables
3. Système d'édition et de suppression des messages user, avec re-trigger automatique de la réponse du bot/LLM

À la fin de ce bloc, le Coach IA doit produire des réponses cohérentes, sans inventer de symptômes, sans appeler le client "le client", sans répéter mécaniquement "le programme que ton coach t'a préparé", et avec des refus calibrés (pas de refus systématique sur des questions légitimes).

## Périmètre fonctionnel

### Refonte du system prompt LLM

**Problèmes à corriger (observés en production) :**

- Le LLM mentionne des symptômes que le client n'a pas signalés (exemple : "courbatures légères" alors que le client a répondu "aucune courbature" au check-in)
- Le LLM appelle parfois le client "le client" littéralement (fallback du placeholder `${firstName}` qui ne se résout pas)
- Le LLM répète mécaniquement "le programme que ton coach t'a préparé" plusieurs fois dans le même message ou de message en message
- Le LLM refuse de répondre à des questions légitimes (suggestions de combinaisons d'aliments pour atteindre les macros restantes, conseils basiques d'hygiène de vie, interprétation de tendances) en se réfugiant derrière "parle à ton coach"
- Le LLM invente des concepts (parle de "séance de repos" au lieu de "jour de repos")

**Exigences pour la nouvelle version du prompt :**

- Les données client (check-ins, repas, métriques) doivent être présentées au LLM sous forme de **phrases explicites et contextualisées**, pas en JSON brut. Exemple : *"Réponses du check-in soir : courbatures = aucune (0/4), énergie = bonne, stress = faible"*. Le LLM ne sait pas lire un objet, il lit du texte.
- Les valeurs absentes ou nulles doivent être indiquées explicitement (*"Pas de check-in matin réalisé aujourd'hui"*) plutôt que omises silencieusement.
- Le prénom du client doit toujours résoudre — si pour une raison quelconque le prénom n'est pas disponible, fallback sur "toi" et logging d'erreur, jamais "le client".
- La directive *"ne donne pas de conseils nutritionnels génériques"* est trop large et conduit au refus systématique. À remplacer par une distinction claire :
  - **Autorisé** : suggestions de combinaisons d'aliments à partir d'ingrédients listés par le client pour atteindre les macros restantes, conseils basiques d'hygiène de vie et de sommeil dans le cadre du protocole, interprétation de tendances, explication d'une donnée du jour
  - **Interdit** : modification des macros cibles, prescription d'un nouveau programme, diagnostic médical, conseil sur traumatisme physique, intervention sur santé mentale
  - Toute demande relevant de l'interdit déclenche l'**escalade silencieuse** (voir Bloc C), pas un refus textuel
- La référence au coach humain dans la voix du LLM doit être **naturelle, pas robotique**. Le LLM dit "ton programme" et non "le programme que ton coach t'a préparé". Le ton doit être celui paramétré par le coach (par défaut "bienveillant" en R1, plus de granularité en R2).
- Le LLM doit citer les chiffres exacts du client quand pertinent (calories logguées, macros restantes, hydratation) et **ne jamais inventer** une donnée. S'il manque une donnée critique pour répondre, escalade silencieuse.
- Réponses de 2-3 phrases maximum, sauf si la question demande explicitement une réponse plus détaillée.

**Approche technique recommandée :**

Plutôt que d'injecter les données brutes dans le prompt, créer une couche de **signaux pré-calculés** : delta de poids sur 7 jours, % d'atteinte des macros du jour, tendance énergie sur 3 jours, écart vs cible hydratation, etc. Le prompt contient les signaux interprétés, pas les données brutes. Cela réduit la fenêtre de contexte, baisse le coût, et limite les hallucinations.

Claude Code est libre de définir la structure exacte de cette couche, à condition que :
- Elle soit testable de manière isolée (fonction pure sur des données mockées)
- Elle soit observable (les signaux calculés doivent être visibles dans la trace `llm_traces` pour debug)
- Elle soit extensible (ajout futur de nouveaux signaux sans refonte)

### Persistance des check-ins dans le chat

**Problème actuel :** quand le client complète le flow de check-in matin ou soir, ses réponses ne persistent pas dans le chat. Le client perd la vision de ce qu'il a répondu, ne peut pas corriger en cas d'erreur, et le flux conversationnel se brise.

**Comportement attendu :**

À la fin d'un flow check-in (matin ou soir), un message de type `checkin_summary` doit être inséré automatiquement dans `chat_messages` avec :
- `role: 'user'` (c'est conceptuellement une réponse du client)
- `message_type: 'checkin_summary'`
- `content` : résumé textuel structuré et lisible des réponses du client

**Format du résumé textuel :**

Pour un check-in matin :
> Check-in matin · Sommeil 7h30 · Qualité Excellent
> Énergie : Top ⚡ · Poids : 79.4 kg

Pour un check-in soir :
> Check-in soir · Énergie : Fatigué · Stress : Modéré · Courbatures : 2/4

Le rendu visuel dans le chat doit le distinguer subtilement d'un message texte classique (fond légèrement différent, petite icône check-in). Claude Code est libre de proposer le visuel exact, en cohérence avec le design system existant.

### Édition et suppression des messages

**Comportement attendu pour tout message `role: 'user'` (texte libre ET check-in summary) :**

- Un bouton discret (trois petits points type `MoreHorizontal` ou équivalent) apparaît au survol/tap sur les messages du client
- Au clic, un mini-modal/action sheet s'ouvre avec deux options : **Modifier** ou **Supprimer**
- **Modifier** :
  - L'interface permet d'éditer le contenu
  - À la sauvegarde, le message est mis à jour en DB
  - **Re-trigger de la réponse du bot/LLM** : la dernière réponse `role: 'assistant'` liée à ce message est archivée, et une nouvelle réponse est générée à partir du message édité
  - Pour un `checkin_summary`, l'édition met également à jour la table `client_daily_checkins` correspondante (cohérence des données métier)
- **Supprimer** :
  - Soft-delete (`archived_at = now()`) sur le message user
  - La réponse bot associée est également archivée
  - Une confirmation inline est demandée avant suppression (jamais `confirm()` natif du navigateur, qui casse l'UX mobile)

**Linkage des messages :**

Pour rendre cette mécanique fiable, chaque message `role: 'assistant'` doit pouvoir être lié à son message user déclencheur via `parent_message_id` (colonne ajoutée dans le Bloc D). Quand un message user est édité ou supprimé, le système retrouve la réponse bot associée via cette relation, pas par ordre chronologique.

**Exclusions :**

L'édition/suppression ne s'applique **pas** aux messages :
- `role: 'assistant'` (le client ne peut pas éditer les messages du coach IA)
- `message_type: 'morning_init'` ou `'evening_init'` (ce sont des messages système, pas du contenu client)

## Triggers techniques

- Chaque appel LLM passe désormais par le wrapper centralisé (à créer dans ce bloc) qui :
  - Trace la requête dans `llm_traces` (voir Bloc D)
  - Gère le timeout et les retries
  - Gère le streaming de la réponse
  - Encapsule l'appel à OpenAI pour permettre un swap futur de provider
- Le wrapper expose deux modes : `streaming` (pour les réponses au client en temps réel) et `non-streaming` (pour les usages internes type compression nocturne, si activé plus tard)

## Critères de "done"

- Une réponse du Coach IA sur 20 messages variés ne contient plus aucune hallucination de symptôme non signalé, ni "le client", ni répétition mécanique de "le programme que ton coach t'a préparé"
- Le LLM répond de manière utile aux questions légitimes (combinaisons d'aliments, conseils sommeil basiques, interprétation de tendances) et escalade silencieusement (Bloc C) sur les sujets bloqués
- Après un check-in (matin ou soir), un message `checkin_summary` apparaît dans le chat et persiste
- Le client peut éditer un message texte ou un `checkin_summary` et le bot re-répond cohéremment
- Le client peut supprimer un message et la réponse bot associée disparaît
- L'édition d'un `checkin_summary` met à jour la table `client_daily_checkins`
- Tous les appels LLM passent par le wrapper centralisé et sont tracés dans `llm_traces`
- Aucune erreur TypeScript, tests unitaires sur la couche de signaux pré-calculés passent

## Points de vigilance

- **Ne pas casser les crons existants** (`chat-morning-brief`, `chat-evening-brief`, `chat-archive`). Le `buildSystemPrompt` actuel peut être conservé pour le `buildDailyBrief` post check-in si nécessaire ; à arbitrer par Claude Code lors de l'implémentation. L'objectif est de progressivement faire converger vers la nouvelle architecture, pas de tout casser d'un coup.
- **Vigilance forte sur la rétro-compatibilité** : des messages existent déjà en DB. La nouvelle logique de `parent_message_id` ne doit pas casser l'affichage des anciens messages (où ce champ est `null`).
- **Streaming et édition** : si un message est en cours de streaming et que le client l'édite, gérer le cas proprement (annuler le stream en cours, puis re-trigger).
- **Tests utilisateur de la qualité LLM** : avant de considérer le bloc comme livré, faire une **passe de test manuelle** sur les scénarios qui ont posé problème en production (cf. le retour utilisateur dans le brief : "j'ai dit aucune courbature, il a dit courbatures légères", "il m'appelle le client", "il refuse tout"). Documenter les résultats dans le PR/commit.
- **Identité visuelle du `checkin_summary`** : doit être lisible et distinct sans être lourd visuellement. Pas une bulle de chat normale, pas non plus un encart envahissant.
