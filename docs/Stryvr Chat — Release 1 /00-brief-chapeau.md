# Stryvr Chat — Release 1 — Brief chapeau

**À lire en premier. Ce document donne la vue d'ensemble. Les 5 sous-briefs (un par bloc A, B, C, D, E) détaillent chacun un périmètre fonctionnel.**

---

## Contexte

Stryvr est la PWA client de Stryv Lab. Au cœur de Stryvr se trouve un **chat conversationnel** qui est l'écran d'accueil et le centre nerveux de l'expérience client : tous les messages proactifs du système, les alertes, les check-ins, les bilans signés par le coach, et les échanges avec le coach IA y convergent.

Le coach IA est conçu comme **l'avatar du coach humain** : il porte sa photo, son ton, son nom, et il est l'extension digitale du coach humain entre les sessions de coaching.

Aujourd'hui, le chat existe mais présente plusieurs problèmes critiques :
- Hallucinations LLM (mentions de symptômes non signalés, invention de séances)
- Robotisation (répétition mécanique de "le programme que ton coach t'a préparé")
- Bugs (fallback "le client" au lieu du prénom)
- Refus systématiques même sur des demandes légitimes
- Check-ins éphémères (les réponses du flow check-in ne persistent pas dans le chat)
- Pas de visibilité côté coach des conversations IA
- Pas de paramétrage côté coach
- Pas de routage des messages clients vers le coach humain quand le LLM ne doit pas répondre

La Release 1 corrige ces problèmes et pose les fondations du Chat Stryvr selon la vision produit (voir `stryvr-chat-vision.md`).

## Principes intangibles à respecter dans toute la Release 1

Ces principes sont fondamentaux et doivent guider chaque décision d'implémentation. Détaillés dans le document de vision, résumés ici :

1. **Le coach IA est l'avatar du coach humain** (photo, nom, ton du coach)
2. **Le coach IA ne ment jamais** — pas de donnée → il le dit ; ne sait pas → il escalade
3. **Le bot scripté fonctionne sans LLM** — le LLM est une couche optionnelle, pas un prérequis
4. **La zone de saisie libre existe toujours**
5. **Sans LLM activé → messages libres routés au coach humain** (via l'inbox coach)
6. **Édition/suppression des messages user toujours possibles**, ce qui peut re-déclencher une réponse
7. **Check-ins persistent dans le fil** comme messages user éditables
8. **Escalade silencieuse** sur sujets bloqués (santé, hors-périmètre, données manquantes) — le LLM ne répond pas, le message est flaggé, le coach intervient
9. **Visibilité totale du coach** sur les conversations IA de ses clients
10. **LLM activable client par client** par le coach, jamais activé par défaut
11. **Observabilité systématique** : toute réponse LLM tracée
12. **Constat et enquête, jamais prescription** : le bot constate des faits et pose des questions ; il ne prescrit jamais. Le LLM aide à **exécuter** le protocole établi par le coach (suggestions d'aliments concrets pour atteindre des macros restantes, par exemple), il ne **redéfinit jamais** ce protocole (changement de macros, programme, intensité → escalade systématique au coach humain)
13. **Cadre légal européen respecté** : aucun conseil médical par le LLM, escalade santé systématique

## Vue d'ensemble des 5 blocs

La Release 1 est décomposée en 5 blocs fonctionnels. Chaque bloc a son sous-brief dédié.

| Bloc | Périmètre | Côté | Priorité |
|------|-----------|------|----------|
| **A** | Urgences comportementales : refonte prompt LLM, persistance check-ins, édition/suppression messages | Client | Critique |
| **B** | Bot scripté enrichi en mode enquête : briefs matin/soir, alertes routées chat, bilans signés cliquables, patterns conversationnels | Client | Haute |
| **C** | Escalade silencieuse : classification des messages, flag `requires_coach_response`, notifications coach | Client + transverse | Critique |
| **D** | Préparations DB et observabilité : schéma complet, table `llm_traces`, feature flags | Transverse | Critique (bloquant) |
| **E** | Workspace coach assistant : paramétrage global + par client, inbox messages, réponse coach humain | Coach | Critique |

## Ordre d'exécution et parallélisation

### Phase 0 — Séquentielle, bloquante

**Bloc D doit être livré en premier.** Il pose la migration DB complète et l'infrastructure d'observabilité. Tous les autres blocs en dépendent (colonnes, tables, feature flags).

Une fois le Bloc D mergé sur la branche principale, les autres blocs peuvent démarrer.

### Phase 1 — Parallélisation possible

Après la Phase 0, deux pistes peuvent avancer en parallèle sur des branches séparées :

**Piste client** : Blocs A, B, C (peuvent être travaillés en parallèle ou séquentiellement par la même session selon préférence)

**Piste coach** : Bloc E (workspace coach, indépendant des blocs client)

Les deux pistes convergent vers les mêmes tables (notamment `chat_messages` avec son flag `requires_coach_response` et la table `coach_ai_settings_per_client`). Tant que le schéma DB est figé en amont (Phase 0), aucun conflit n'est attendu.

### Phase 2 — Intégration et QA

Tests de bout en bout sur les scénarios critiques :
- Un client envoie "j'ai mal au dos" → escalade silencieuse → inbox coach → coach répond → réponse arrive dans le chat avec bordure verte
- Un check-in du soir est complété → résumé dans le chat → client édite une valeur → re-trigger de la réponse bot
- Le coach active le LLM pour un client → le client pose une question → réponse contextuelle ; le coach désactive → le même message route à l'inbox

## Conventions pour Claude Code

### Avant de commencer chaque bloc
- Lire le sous-brief du bloc en entier
- Lire ce brief chapeau pour le contexte
- Lire `stryvr-chat-vision.md` pour la vision produit
- Identifier les dépendances avec d'autres blocs

### Pendant l'implémentation
- Respecter les conventions de code existantes du repo (typage strict, structure de dossiers, patterns d'authentification)
- Pour toute décision technique non spécifiée dans le brief, choisir l'option la plus simple et la plus extensible, et la documenter dans un commentaire ou un commit message
- Aucun `any` TypeScript sur les nouvelles fonctions liées aux Facts, Decision, ou pipeline LLM
- Toute nouvelle route API doit blinder l'authentification avant accès aux données
- Tout appel LLM doit passer par le wrapper centralisé (à créer dans le Bloc A) et être tracé dans `llm_traces`

### Définition de "done" par bloc
Un bloc est considéré comme livré quand :
- Toutes les fonctionnalités décrites dans le sous-brief sont implémentées
- Aucune erreur TypeScript (`npx tsc --noEmit` passe)
- Les tests unitaires sur les fonctions pures critiques sont écrits et passent
- Un parcours manuel end-to-end du bloc fonctionne
- Le `project-state.md` et le `CHANGELOG.md` sont mis à jour
- Le commit final mentionne explicitement le bloc livré

## Périmètre explicite **hors** Release 1

Pour éviter le scope creep, voici ce qui est **explicitement reporté** à des releases ultérieures :

**Reporté à la Release 2 :**
- Check-in post-entraînement (3-4 questions avant le résumé de séance)
- Check-in post-repas (2-3 questions à chaque log de repas)
- Dashboard coach : visibilité complète des conversations IA par client (lecture)
- `coachMemory` : mémoire LLM inter-tours pour cohérence dialogue
- Système de flag "réponse IA inappropriée" par le coach (feedback loop d'amélioration)
- Paramétrage avancé des seuils d'alerte coach (en R1, seuils par défaut + activation/désactivation des canaux)

**Reporté à la Release 3 ou plus tard :**
- Workspace messagerie temps réel coach-client (en R1 : inbox simple suffit)
- Refonte architecture en 5 domaines isolés (en R1 : refacto minimal du prompt)
- Compression nocturne LLM pour mémoire narrative riche
- Tier pricing avec UI paywall et système de rechargement de crédits

**Produits séparés (V2) :**
- Agent WhatsApp coach
- Function calling LLM (préparé techniquement mais pas activé)

## Dépendances externes et décisions de stack

- **LLM** : OpenAI GPT-4o-mini en R1 (un seul modèle, abstraction provider en place pour swap futur)
- **Streaming** : oui, côté UI et côté serveur
- **Notifications coach R1** : inbox dashboard (toujours) + email pour alertes safety (toujours) + email pour patterns coach (cochable). Pas de SMS, pas de WhatsApp en R1.
- **Photos coach** : utilisées comme avatar du coach IA dans le chat
- **Feature flag** : `has_ai_llm` sur les coachs pour activer/désactiver le LLM globalement, et `ai_llm_enabled` au niveau de chaque client pour l'activation granulaire

## Comment passer les sous-briefs à Claude Code

Recommandation : **un sous-brief par session Claude Code**, dans l'ordre suivant :

1. Bloc D (DB et observabilité) — bloquant pour tout le reste
2. Bloc A (urgences comportementales) — corrige le LLM existant
3. Bloc C (escalade silencieuse) — étend la logique LLM
4. Bloc B (bot scripté enrichi) — enrichit les messages proactifs
5. Bloc E (workspace coach) — peut démarrer en parallèle dès que D est livré

Pour chaque session :
- Coller le sous-brief correspondant
- Coller ce brief chapeau pour le contexte
- Référencer le document de vision si une question de fond émerge

## Critères globaux de Release 1 livrée

La Release 1 est considérée comme livrée quand :
- Les 5 blocs sont en `done` selon leurs critères individuels
- Le scénario complet fonctionne : un coach configure un client, le client utilise le chat, l'IA répond proprement OU escalade au coach, le coach répond depuis son inbox, la réponse arrive dans le chat client avec bordure verte
- Les hallucinations qualitatives constatées (cf. retour utilisateur "courbatures légères alors qu'il n'y en avait pas", "le client" au lieu du prénom) ont disparu sur un test de 20 messages variés
- L'observabilité est active : chaque appel LLM apparaît dans `llm_traces` avec ses inputs, outputs, coût, latence
- Le coach peut activer/désactiver le LLM pour un client donné et observer le bon routage des messages
- Tests d'intégration sur les flows critiques passent
