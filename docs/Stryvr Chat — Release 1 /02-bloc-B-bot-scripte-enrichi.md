# Bloc B — Bot scripté enrichi en mode enquête

**Côté : Client (Stryvr PWA)**
**Priorité : Haute**
**Dépendances : Bloc D (DB) et idéalement Bloc A (refonte prompt) livrés en amont**

---

## Objectif du bloc

Transformer le chat actuel — qui ne vit que quand le client envoie un message — en un **chat vivant**, où des messages proactifs et contextuels arrivent au bon moment dans la journée du client. Le bot scripté est l'**ossature du chat** : il fonctionne sans LLM, de manière déterministe, et constitue la valeur ajoutée de base disponible pour tous les clients de tous les coachs.

Ce bloc enrichit également les alertes existantes (nutrition, training) en les routant systématiquement vers le chat, et introduit le concept de **brief matin en mode enquête** : quand un pattern préoccupant est détecté, le bot ne se contente pas d'informer, il pose une question ouverte avec réponses prédéfinies pour comprendre la cause et alimenter le coach humain.

## Périmètre fonctionnel

### Brief matin enrichi

Envoyé automatiquement chaque matin (cron Inngest existant à enrichir) à une heure paramétrée (par défaut 7h heure locale du client, paramétrable par le coach plus tard — en R1, heure fixe globale).

**Structure du brief matin :**

1. **Salutation personnalisée** selon le ton paramétré par le coach (en R1 : ton par défaut "bienveillant", les autres tons préparés mais activables en R2)
2. **Invitation au check-in matin proéminente** : c'est l'action prioritaire attendue du client le matin. Bouton "Faire mon check-in matin" qui déclenche le flow existant.
3. **Programme du jour** (affiché même si check-in non fait) :
   - Si séance prévue : nom de la séance (exemple : *"Séance pull au programme"*). **Pas d'heure**.
   - Si jour de repos : *"Jour de repos"*. Pas d'injonction type "repose-toi bien", neutre et factuel.
   - **Important** : les programmes peuvent être en cycle (J1 J2 J3 repos répétés) et non calés sur des jours fixes de la semaine. Utiliser la logique métier existante pour déterminer la prochaine séance.
4. **Cibles factuelles du jour** : calories cibles, macros principales (protéines, glucides, lipides), hydratation cible.
5. **Bilan signé disponible** : si le coach a signé un nouveau bilan depuis le dernier brief, message dédié avec carte cliquable qui ouvre le bilan (voir section dédiée plus bas).
6. **Point de vigilance — mode enquête** : si un pattern préoccupant est détecté (voir liste des patterns plus bas), une question conversationnelle est posée au client avec **réponses prédéfinies + option de saisie libre**.

**Principes de ton :**

- Pas d'heure de séance (les programmes n'ont pas d'horaire prescrit, le client gère)
- Pas de directive de performance (pas de *"dépasse-toi aujourd'hui"*, pas de *"pousse plus fort"*)
- Pas de jugement (pas de *"hier tu as raté"*, plutôt *"hier la séance prévue n'a pas été loggée"*)
- Constat + question, jamais prescription

### Brief soir enrichi

Envoyé automatiquement chaque soir (par défaut 21h heure locale, paramétrable plus tard — heure fixe en R1).

**Structure :**

1. **Récap du jour réel** : calories logguées vs cible, macros effectives, séance complétée ou non, hydratation atteinte
2. **Invitation au check-in soir** : bouton qui déclenche le flow
3. **Point de vigilance** si pattern détecté (voir patterns plus bas)

Le brief soir est plus court que le brief matin (le client est en fin de journée, moins disponible).

### Patterns d'enquête à implémenter en R1

Quand un pattern est détecté lors de la génération d'un brief matin (ou soir, selon pertinence), le brief inclut une question d'enquête conversationnelle avec des réponses prédéfinies + saisie libre.

**Patterns à implémenter en R1 (minimum 10) :**

1. **Calories dépassées** sur 3 jours d'affilée (> 110 % de la cible)
2. **Calories en deçà** sur 3 jours d'affilée (< 80 % de la cible)
3. **Protéines en deçà** sur 5-7 jours (< 85 % de la cible)
4. **Glucides dépassés** sur 3 jours d'affilée (> 115 % de la cible)
5. **Glucides en deçà** sur 5-7 jours (< 80 % de la cible)
6. **Lipides dépassés** sur 3 jours d'affilée (> 115 % de la cible)
7. **Hydratation < 70 %** de la cible sur 5 jours d'affilée
8. **Sommeil < 6h** sur 3 nuits d'affilée
9. **Sommeil > 9h** sur 3 nuits d'affilée (signal de fatigue chronique potentielle)
10. **Énergie ≤ 2/5** au check-in matin sur 3 jours d'affilée
11. **Stress ≥ 4/5** au check-in soir sur 3 jours d'affilée
12. **Séance manquée** : dernière séance prévue dans le cycle n'a pas été loggée

Tous les seuils ci-dessus sont les **valeurs par défaut Stryv Lab**. Ils seront paramétrables par le coach en R2. En R1, ils sont figés dans le code mais facilement modifiables (constantes centralisées).

**Format d'une enquête conversationnelle :**

Pour chaque pattern, deux éléments à définir :
- Le **constat factuel** posé par le bot (1 phrase)
- La **question d'enquête** avec 3-5 réponses prédéfinies pertinentes + option "Autre (écrire)"

Exemple pour "Lipides dépassés 3 jours d'affilée" :
> "J'ai vu que tes lipides étaient au-dessus de ta cible ces 3 derniers jours. Qu'est-ce qui se passe ?"
> ○ Je mange beaucoup à l'extérieur en ce moment
> ○ J'ai eu plusieurs craquages
> ○ Mes repas habituels sont plus gras que prévu
> ○ J'ai du mal à logger précisément (l'app me pose souci)
> ○ Autre (écrire)

Quand le client clique sur une réponse prédéfinie :
- La réponse est enregistrée comme message `role: 'user'` dans le chat
- Une réponse de **remerciement bref** du bot apparaît : *"Merci pour ce retour. Je le partage avec ton coach."*
- Une **alerte coach** est générée (voir cartographie Bloc D + workspace coach Bloc E) avec la raison contextualisée
- Aucun LLM n'est appelé ici — purement scripté

Quand le client clique sur "Autre (écrire)" :
- Une zone de saisie texte apparaît
- Le message saisi est enregistré
- **Si LLM activé pour ce client** : le LLM répond dans le cadre du protocole (suggestions, dialogue), ET l'alerte coach est générée en parallèle (le coach reste informé)
- **Si LLM désactivé** : message routé à l'inbox coach via la mécanique d'escalade (voir Bloc C)

Claude Code définira les libellés et réponses prédéfinies pour chaque pattern lors de l'implémentation, en restant fidèle à l'esprit ci-dessus. Demander au coach (toi, Coach Kev) de valider la formulation finale avant déploiement.

### Routage des alertes existantes vers le chat

Actuellement, des alertes sont calculées et affichées dans les pages nutrition et training de l'app. En R1, elles doivent également être **routées vers le chat** comme messages proactifs avec icône dédiée et marquage non-lu.

**Catégories d'alertes à router :**

- Alertes nutrition (hydratation faible, dépassement macros sur la journée, etc.)
- Alertes training (séance manquée, performance en baisse sur un exercice spécifique, etc.)

**Comportement :**

- Quand une alerte est générée (timing existant à conserver), elle est insérée dans `chat_messages` avec un `message_type` dédié (exemple : `nutrition_alert_auto`, `training_alert_auto`)
- Dédup obligatoire : pas de doublon de la même alerte le même jour
- L'alerte reste visible dans la page d'origine (nutrition / training), mais elle apparaît **aussi** dans le chat
- Marquage non-lu jusqu'à ce que le client ouvre le chat

**Limite :** ne pas saturer le chat. Si plus de 3-4 alertes le même jour, regrouper ou prioriser. Logique d'agrégation à définir par Claude Code selon les patterns observés.

### Bilan signé cliquable

**Comportement attendu :**

Quand le coach signe un bilan pour un client (action existante côté plateforme coach), un message de type `bilan_signed` est automatiquement inséré dans le chat du client :

> "Ton coach a signé ton bilan du [date]. Clique pour le consulter."

Le message est cliquable et ouvre directement le bilan signé.

**Implémentation :**

Identifier le hook ou l'événement DB qui se déclenche à la signature d'un bilan, et y attacher l'insertion du message chat. Si aucun hook n'existe encore, en créer un (trigger Postgres ou Inngest selon convention du repo).

### Identité visuelle des messages proactifs

Tous les messages proactifs (briefs matin/soir, alertes, bilans signés) doivent :
- Porter l'avatar du coach IA (= photo du coach humain telle qu'enregistrée dans son profil)
- Être marqués non-lus tant que le client ne les a pas vus
- Suivre le ton paramétré par le coach (R1 : ton "bienveillant" par défaut)

### Ton paramétrable

En R1, le ton est figé à "bienveillant" comme défaut Stryv Lab, mais l'**infrastructure de paramétrage doit être posée** : le wrapper de génération de chaque message proactif doit lire le `ai_tone` du coach (colonne ajoutée dans le Bloc D) et adapter le ton en conséquence.

Les 4 tons possibles (à activer pleinement en R2 dans le workspace coach, Bloc E) :
- **strict** : direct, factuel, sans complaisance, chiffres et faits
- **bienveillant** : encourageant et précis, reconnaît les efforts (défaut R1)
- **motivant** : énergique, pousse à l'action, célèbre les progrès
- **neutre** : informatif sans coloration émotionnelle, données uniquement

Claude Code prépare les variations de formulation par ton dans le code, mais en R1 seul le ton "bienveillant" est exposé. Cela évite un refacto futur.

## Critères de "done"

- Le brief matin enrichi est envoyé à 7h chaque jour, contient invitation check-in, programme du jour (sans heure), cibles, et patterns d'enquête si détectés
- Le brief soir enrichi est envoyé à 21h chaque jour, contient récap réel, invitation check-in soir, et patterns d'enquête si pertinents
- Les 12 patterns listés sont implémentés et déclenchent une enquête conversationnelle quand détectés
- Une enquête conversationnelle (réponse prédéfinie cliquée) génère une alerte coach et un message de remerciement bot
- Les alertes nutrition et training existantes sont également routées dans le chat, dédupées, marquées non-lues
- Quand un coach signe un bilan, un message `bilan_signed` apparaît dans le chat client et est cliquable pour ouvrir le bilan
- Les messages proactifs portent l'avatar du coach humain
- L'infrastructure de ton paramétrable est en place (lecture de `ai_tone` du coach), même si seul "bienveillant" est exposé en R1
- Pas d'horaire de séance mentionné dans aucun message
- Aucune directive de performance dans les messages scriptés
- Tests unitaires sur la détection de patterns passent

## Points de vigilance

- **Programmes cycliques** : les programmes ne sont pas tous calés sur des jours fixes de la semaine. La logique de détection "séance du jour" doit gérer les cycles libres (J1 J2 J3 repos qui se répètent). Utiliser la logique métier existante si présente, sinon créer un utilitaire propre.
- **Ne pas saturer le chat** : trop de messages proactifs le même jour peuvent tuer l'expérience. Définir une logique de priorisation ou d'agrégation si nécessaire.
- **Cohérence des données dans les briefs** : les chiffres affichés (calories, macros, hydratation) doivent venir de la **même source** que ceux affichés dans les pages nutrition/training/métriques de l'app. Pas de divergence possible.
- **Timezone** : les heures d'envoi des briefs doivent respecter la timezone du client (à confirmer si elle est déjà capturée). À défaut, utiliser un défaut sensible et planifier le multi-timezone en R2.
- **Validation des libellés** : Claude Code propose les libellés des 12 patterns et leurs réponses prédéfinies, mais le Coach Kev doit valider avant déploiement (langage métier, ton, pertinence). Prévoir un fichier de constantes facile à éditer.
- **Performance** : la détection des patterns peut être coûteuse (lecture sur 7 jours de données pour chaque client). Optimiser via cache ou agrégats précalculés si nécessaire (typiquement une fois par jour suffit pour les briefs matin/soir).
