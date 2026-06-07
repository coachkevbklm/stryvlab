# Stryvr Chat — Document de Vision

**Version 1.0 — Mai 2026**
**Auteur : Coach Kev, Stryv Lab**
**Statut : Document fondateur — boussole produit**

---

## Préambule

Ce document fige la vision du Chat Stryvr après plusieurs sessions de brainstorming et d'itération. Il n'est pas un brief technique. C'est la boussole qui guide chaque décision future sur ce périmètre — chaque nouvelle idée doit pouvoir être évaluée contre ces principes pour déterminer si elle renforce ou dilue la vision.

Tout brief technique destiné à Claude Code (ou tout autre développeur) doit découler de ce document, jamais l'inverse.

---

## 1. Thèse produit

**Le Chat Stryvr n'est pas une feature. C'est le centre nerveux conversationnel de l'expérience client.**

À l'origine, la page client de Stryvr était un dashboard récapitulatif statique. La vision actuelle est de transformer cette interface en un fil conversationnel temporel où convergent toutes les interactions, données, alertes et communications relatives au coaching du client.

L'analogie n'est pas "ChatGPT pour le fitness". C'est plus proche d'un outil moderne d'interface conversationnelle guidée (type Linear, Superhuman, ou les bots WhatsApp Business) : un flux temporel où chaque message a une intention, une action possible, et où l'utilisateur peut interagir de manière structurée ou conversationnelle.

**Le canal officiel de communication coach-client devient le Chat Stryvr.** Pas WhatsApp, pas l'email. Stryvr centralise la communication structurée, l'historique reste dans la plateforme avec les data, les bilans et le contexte. WhatsApp et les canaux externes restent ce qu'ils sont : des canaux personnels, déstructurés.

## 2. Identité et posture

**Le coach IA est l'avatar du coach humain dans le chat.** Sa photo, son nom, son ton — il est conçu comme l'extension digitale du coach, son double disponible H24 entre les sessions.

Cette identité visuelle pose une exigence forte : tout ce qui sort du chat doit être digne du coach humain. Pas de réponse générique de chatbot, pas de fuite vers *"je suis juste une IA"*, pas de prise de risque médicale ou légale.

L'IA n'est pas autonome — elle exécute le protocole du coach, elle ne le redéfinit jamais.

## 3. Architecture conversationnelle — Les trois cercles

Le chat fonctionne par cercles concentriques, du plus universel au plus premium.

### Cercle 1 — Bot scripté (toujours actif, toutes formules)

L'ossature minimum, sans appel LLM, déterministe et fiable :

- Briefs proactifs matin et soir personnalisés au client
- Alertes nutrition, hydratation, training routées dans le chat
- Invitations aux check-ins (matin, soir, à terme post-entraînement et post-repas)
- Push automatique des bilans signés par le coach (cliquables)
- Rappels et notifications contextuelles
- Interactions via UI structurée : boutons, sliders, choix multiples, flows guidés

Ce bot fonctionne pour 100 % des coachs et de leurs clients, indépendamment de toute formule premium. C'est la promesse de base du Chat Stryvr.

### Cercle 2 — Saisie libre du client (toujours présente)

Une zone de texte existe en bas du chat dans tous les cas. Le traitement diffère selon la formule du coach.

**Sans formule LLM activée pour le client :**
- Le message est enregistré et marqué *"vu par ton coach"*
- Notification au coach humain via son dashboard, email, SMS selon ses préférences
- Le coach répond depuis Stryvr (workspace coach assistant) — sa réponse apparaît dans le chat client avec sa photo
- Aucune réponse automatique du bot, aucun message générique de fuite

**Avec formule LLM activée pour le client :**
- Le LLM peut répondre dans le cadre du protocole, en respectant le ton paramétré
- Tous les principes intangibles s'appliquent (escalade silencieuse, non-prescription, etc.)
- Le coach garde visibilité totale sur les échanges

### Cercle 3 — LLM augmenté (couche premium optionnelle)

Quand activé par le coach pour un client donné, le LLM apporte la couche d'intelligence conversationnelle :

- Réponses contextuelles avec accès aux données du client (nutrition, sommeil, métriques, programme)
- Aide à l'exécution du protocole : suggestions de combinaisons d'aliments concrètes pour atteindre les macros restantes, conseils d'hygiène de vie dans le cadre établi
- Dialogue itératif (questions de clarification, raffinement des propositions)
- Capacité à reconnaître ses limites — savoir dire *"je ne sais pas"* et escalader proprement

Le LLM est une **couche au-dessus**, pas un prérequis. Le chat fonctionne pleinement sans lui.

## 4. Principes intangibles

Ces principes sont la fondation philosophique du produit. Toute future évolution doit les respecter ou les remettre en question explicitement.

### Identité et posture

1. Le coach IA est **toujours l'avatar du coach humain** (photo, nom, ton). Jamais "assistant générique".
2. Le coach IA est **l'extension du coach humain**, jamais autonome dans ses recommandations stratégiques.
3. Le coach IA **ne ment jamais** : pas de donnée disponible → il le dit ; ne sait pas → il escalade.

### Architecture conversationnelle

4. Le **bot scripté** fonctionne **sans LLM**. Le LLM est une couche optionnelle, pas un prérequis.
5. La **zone de saisie libre** existe toujours, quelle que soit la formule.
6. Sans LLM activé → messages libres **routés au coach humain** qui répond depuis Stryvr.
7. Le client peut **toujours éditer ou supprimer** ses messages, ce qui peut re-déclencher une réponse du bot/LLM.
8. Les **check-ins persistent** comme messages user éditables dans le fil.

### Sécurité et contrôle

9. **Escalade silencieuse sur sujets bloqués** : santé, blessure, signaux TCA, détresse mentale, médication, grossesse, allaitement, demande de modification du protocole, donnée manquante critique, demande de prédiction → le LLM ne répond pas, le message est flaggé `requires_coach_response`, le coach reçoit une notification prioritaire et répond depuis Stryvr.
10. Le coach humain a **toujours visibilité totale** sur les conversations IA de ses clients.
11. Le coach humain peut **flagger une réponse IA** comme inappropriée (feedback loop, à partir de la Release 2).

### Paramétrage coach

12. Le coach paramètre **deux niveaux** : globalement (ses défauts) et par client (override).
13. Le LLM est activable **client par client** par le coach, jamais activé par défaut.

### Observabilité

14. Toute réponse LLM est **tracée** (`llm_traces`) : facts, prompt, réponse, tokens, latence, modèle. Indispensable pour débugger en production et répondre à toute demande légale.

### Principes transversaux

15. **Cadre légal européen respecté** : aucun conseil médical ou paramédical par le LLM, escalade systématique sur tout sujet santé, traçabilité totale, CGU explicites et consentement éclairé du client à l'onboarding. Disclaimer clair que le coach IA n'est pas un professionnel de santé. Avis juridique requis avant lancement public.

16. **Constat et enquête, jamais prescription** : le bot scripté constate des faits et pose des questions ; il ne prescrit jamais. Le LLM (premium) peut aider à **exécuter** le protocole établi par le coach (suggestions d'aliments pour atteindre des macros, idées de portions concrètes, interprétation de tendances) mais ne **redéfinit jamais** ce protocole. Toute modification stratégique (macros cibles, programme, intensité, volume, fréquence) relève exclusivement du coach humain. La ligne est claire : *exécution du protocole* est légitime ; *redéfinition du protocole* escalade.

## 5. Business model — Direction

Le Chat Stryvr s'inscrit dans le modèle commercial Stryv Lab. Les détails de tarification seront figés ultérieurement ; ce document acte uniquement la **mécanique**.

### Activation du LLM — client par client

Lorsqu'un coach souscrit à une formule incluant le LLM :
- Le LLM devient **disponible** dans l'écosystème du coach
- Il n'est **pas automatiquement activé** pour chaque client
- Le coach se rend dans le profil de chaque client, section "Coach Assistant", et décide :
  - Activation du LLM pour ce client (oui/non)
  - Quota mensuel attribué à ce client
  - Ton spécifique et instructions custom

Cette granularité permet au coach de réserver le LLM aux clients qui en tirent réellement valeur, sans gaspillage de budget.

### Modèle de tarif hybride

- **Tier premium avec quota inclus généreux** : le coach paye un abonnement qui inclut un volume de requêtes LLM mutualisé sur l'ensemble de ses clients
- **Recharge possible** : si le coach dépasse son quota mensuel, il peut acheter du crédit supplémentaire (pay-as-you-go au-delà du quota)

Modèle simple à comprendre, juste pour les coachs power-users, économique pour les usages modérés.

### Implications techniques actées

Dès la Release 1 :
- Feature flag `has_ai_llm` sur les profils coach
- Table de gouvernance LLM par client (activation + quota)
- Table de suivi budget LLM coach (quota inclus + crédits rechargés)
- Aucune UI de paywall ni de billing en Release 1 — seulement le schéma DB extensible

## 6. Cartographie des alertes

Le moteur d'alertes est **unique** mais alimente deux flux distincts avec des règles d'agrégation différentes.

### Alertes client (dans son chat)

**Nature** : événements **immédiats**, contextuels, à fort signal d'action pour le client.

**Caractéristiques** :
- Fréquence quotidienne, plusieurs occurrences possibles par jour
- Format : messages dans le chat, marqués non-lus
- Objectif : faire agir le client tout de suite
- Ton : selon paramétrage coach (strict, bienveillant, motivant, neutre)

**Exemples** :
- Hydratation à 32 % à 16h00 → rappel
- Dépassement lipides du jour → constat
- Séance au programme aujourd'hui (pull, push, jambes, repos) → information
- Bilan signé disponible → message cliquable
- Pattern détecté (lipides dépassés 3 jours d'affilée) → enquête conversationnelle avec réponses prédéfinies + saisie libre

### Alertes coach (dans son dashboard)

**Nature** : **patterns** ou événements stratégiques qui nécessitent une intervention coach.

**Caractéristiques** :
- Fréquence moins élevée, valeur stratégique
- Format : entrées dans le dashboard coach, classées par priorité
- Objectif : alerter le coach pour qu'il intervienne (ajuster protocole, contacter le client)
- Canal : dashboard (par défaut), email (cochable), SMS (cochable), WhatsApp (V2)

**Catégories** :
- **Patterns nutrition** : macros hors cible plusieurs jours d'affilée, hydratation chronique insuffisante
- **Patterns training** : séances manquées répétées, performance en baisse continue
- **Patterns récupération** : sommeil insuffisant sur plusieurs nuits, stress élevé prolongé
- **Patterns engagement** : client n'a pas ouvert l'app depuis X jours, trajectoire de poids hors prévision
- **Messages clients en attente** : tous les messages flaggés `requires_coach_response` (priorité haute pour la catégorie safety)
- **Événements ponctuels** : bilan complété, rendez-vous annulé/modifié

### Principe directeur

**Le coach ne reçoit pas le bruit quotidien du client. Il reçoit le signal stratégique.**

Si on bombarde le coach avec chaque dépassement de macros de chacun de ses clients, il décroche. L'agrégation temporelle est ce qui transforme le bruit en signal.

### Paramétrage des alertes — Release 1

- Seuils par défaut Stryv Lab pré-définis (3 jours, 7 jours, %, etc.)
- Liste classée par priorité (safety > engagement > patterns)
- Le coach peut valider par défaut ou ajuster en partie en v1
- Le coach choisit ses canaux de notification par catégorie d'alerte (dashboard / email / SMS)

## 7. Roadmap par releases

### Release 1 — "Le chat devient vivant et fiable" (cible 4-6 semaines)

L'objectif est de poser les fondations cohérentes du Chat Stryvr et de corriger l'expérience actuelle qui pose problème (hallucinations, robotisation, check-ins éphémères).

**Bloc A — Urgences comportementales (côté client)**
- Refonte du system prompt LLM : élimination des hallucinations, correction du fallback "le client", suppression de la robotisation ("le programme que ton coach t'a préparé"), calibration des refus
- Persistance des check-ins dans le chat comme messages user éditables
- Édition et suppression des messages user avec re-trigger de la réponse bot/LLM
- Linkage `parent_message_id` pour cohérence des threads conversationnels

**Bloc B — Bot scripté enrichi en mode enquête (côté client)**
- Brief matin enrichi : invitation check-in matin proéminente, puis programme du jour (sans heure), cibles factuelles, point de vigilance avec enquête conversationnelle si pattern détecté
- Brief soir enrichi : récap du jour réel vs prévu, invitation check-in soir
- Routage de toutes les alertes nutrition et training existantes vers le chat
- Push automatique des bilans signés (messages cliquables)
- Tous les briefs respectent le ton paramétré par le coach (strict, bienveillant, motivant, neutre)

**Bloc C — Escalade silencieuse (côté client)**
- Système de classification des messages clients avant appel LLM (mots-clés + intent simple)
- Liste de triggers : sécurité, légal, hors-périmètre, données manquantes
- Flag `requires_coach_response` + `coach_response_reason` sur les messages concernés
- Notification coach prioritaire

**Bloc D — Préparations DB et observabilité (transverse)**
- Migration DB complète : `requires_coach_response`, `coach_response_reason`, `parent_message_id`, `has_ai_llm` (feature flag coach), `coach_ai_settings_per_client`, `coach_llm_budget`, `llm_traces`
- Observabilité active dès le premier message LLM
- Schéma extensible mais sans UI de billing ni paywall

**Bloc E — Workspace coach assistant (côté coach)**
- Section "Coach Assistant" dans les paramètres globaux du coach : ton par défaut, restrictions, instructions globales
- Section "Coach Assistant" dans le profil de chaque client : override ton, activation LLM, quota, instructions custom client
- **Inbox messages en attente de réponse coach** : tous les messages flaggés, triés par priorité (safety d'abord)
- Le coach répond depuis l'inbox, sa réponse arrive dans le chat client avec sa photo
- Notification coach push/email sur escalade

**Parallélisation suggérée** :
- Phase 0 séquentielle : migration DB + types TypeScript partagés
- Phase 1 parallèle : Branche client (Blocs A, B, C) et Branche coach (Bloc E)
- Phase 2 séquentielle : intégration end-to-end, tests d'escalade, QA

### Release 2 — "Le chat devient intelligent et observé" (cible après R1)

- Check-in post-entraînement (3-4 questions avant le résumé de séance)
- Check-in post-repas (2-3 questions à chaque log de repas)
- Dashboard coach : visibilité complète des conversations IA par client (lecture)
- Dashboard coach : section alertes patterns détaillée et paramétrable
- `coachMemory` (mémoire LLM inter-tours pour cohérence dialogue)
- Système de flag "réponse IA inappropriée" par le coach (feedback loop d'amélioration)

### Release 3 et au-delà

- Workspace messagerie temps réel coach-client (au-delà de l'inbox simple)
- Refonte architecture en 5 domaines isolés (si nécessaire à l'échelle)
- Compression nocturne LLM pour mémoire narrative riche
- Score de transformation client (déjà en cours, à connecter au chat)
- Guide de phase intelligent (déjà en cours, à connecter au chat)
- Tier pricing avec UI paywall et système de rechargement de crédits

### Reportés ou produits séparés

- **Agent WhatsApp coach** : produit V2 distinct, brief séparé. Permettra au coach de piloter son écosystème depuis WhatsApp (résumés clients, alertes, à terme actions sur la DB). Réutilisera les briques v1 (provider abstraction LLM, function calling, observabilité, escalade silencieuse).
- **Function calling LLM** : écarté en v1 explicitement, préparé techniquement (tableau de tools vide mais orchestrateur capable de gérer `tool_calls`). À activer quand un cas d'usage validé émerge.

## 8. Critères d'évolution

Plutôt que des dates, des **conditions de déclenchement** pour ouvrir les releases suivantes.

### Pour ouvrir la Release 2

- Release 1 stable en production depuis 4 semaines minimum
- Au moins 5 coachs actifs utilisant le chat avec leurs clients
- Métriques observées : taux d'hallucination LLM mesuré, taux d'escalade silencieuse, satisfaction coach et client
- Aucun incident légal ou de safety non géré
- Backlog de feedback coach traité

### Pour ouvrir la Release 3

- Release 2 stable
- 20+ coachs payants actifs
- Demande explicite documentée des coachs pour les features de R3
- Métriques d'usage du LLM justifiant l'investissement en compression nocturne ou refonte archi

### Pour démarrer l'Agent WhatsApp

- 50+ coachs payants
- Demande explicite (sondage ou interviews)
- Conformité WhatsApp Business API étudiée
- Budget développement validé

## 9. Garde-fous

Ce document est la boussole. À chaque future session de brainstorming ou d'idéation, revenir ici et vérifier :

- **Est-ce que la nouvelle idée renforce un des 16 principes intangibles, ou les dilue ?**
- **Est-ce que ça appartient à la release en cours, ou à une release future ?**
- **Est-ce que ça respecte le cadre "constat et enquête, jamais prescription" ?**
- **Est-ce que ça respecte le cadre "exécution du protocole, jamais redéfinition" ?**
- **Est-ce que le coach humain reste seul maître à bord stratégique ?**
- **Est-ce que c'est légalement défendable en Belgique et France ?**

Si une idée crée un conflit avec ces principes, le défaut est de **refuser ou reporter**, pas d'adopter. Le périmètre actuel est ambitieux, dérive et complexité sont les principaux risques.

---

**Document à conserver. À mettre à jour formellement uniquement quand un principe intangible est explicitement renégocié.**
