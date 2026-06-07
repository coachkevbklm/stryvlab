# Bloc C — Escalade silencieuse

**Côté : Client (Stryvr PWA) + transverse**
**Priorité : Critique**
**Dépendances : Bloc D (DB) livré en amont, Bloc A (wrapper LLM) en cours ou livré**

---

## Objectif du bloc

Implémenter le mécanisme d'**escalade silencieuse** : un système qui détecte, **avant tout appel LLM**, les messages clients qui ne doivent pas être traités par l'IA — pour raisons de sécurité, de cadre légal, ou parce qu'ils sortent du périmètre que le LLM peut traiter proprement. Quand un tel message est détecté, le LLM ne répond pas, le message est flaggé `requires_coach_response`, et le coach humain reçoit une notification prioritaire pour répondre depuis son inbox (Bloc E).

**Le principe directeur du Bloc C : le client ne reçoit jamais de réponse "je ne peux pas t'aider, va voir ton coach".** Le silence du LLM est intentionnel et invisible pour le client — il voit juste que son message a été envoyé, et son vrai coach lui répond plus tard via le chat (avec la bordure verte 1.5px qui marque subtilement l'intervention humaine).

## Périmètre fonctionnel

### Système de classification pré-LLM

**Comportement attendu :**

Quand le client envoie un message texte libre dans le chat :

1. Le message est d'abord enregistré normalement dans `chat_messages` avec `role: 'user'`
2. **Avant tout appel LLM**, le message passe par un classifieur qui détermine s'il relève d'un cas d'**escalade silencieuse**
3. Si oui :
   - Le message est flaggé `requires_coach_response = true` avec une `coach_response_reason` (enum)
   - Aucun appel LLM n'est effectué
   - Aucune réponse automatique n'apparaît dans le chat — le message client reste affiché, c'est tout
   - Une **notification au coach humain** est déclenchée (entrée dans son inbox + email pour les cas safety)
4. Si non :
   - Le flux normal continue : appel LLM (si activé pour ce client) ou routage à l'inbox coach (si LLM désactivé pour ce client)

**Approche du classifieur :**

Pour la R1, classification basée sur :
- **Détection de mots-clés** (liste exhaustive ci-dessous, organisée par catégorie)
- **Patterns simples** d'intention (modèles regex ou tokens contextuels)
- **Pas de LLM dédié** à la classification (trop coûteux et lent, risque d'erreur)

Le classifieur retourne un objet structuré : `{ shouldEscalate: boolean, reason: 'safety_health' | 'safety_mental' | 'out_of_scope_protocol' | 'out_of_scope_prediction' | 'data_missing' | null, matchedKeywords: string[] }`.

Claude Code définit l'implémentation exacte (TypeScript pur, testable de manière isolée). La liste de mots-clés doit être facilement éditable (fichier de constantes).

### Liste des triggers d'escalade silencieuse — Sécurité

**Catégorie : `safety_health` (sujets de santé physique)**

Mots-clés et patterns à détecter (liste non-exhaustive, à étendre par Claude Code et à valider par Coach Kev) :
- Blessure : *blessé(e), blessure, déchirure, claquage, entorse, tendinite, fracture*
- Douleur aiguë : *mal au dos, mal aux genoux, mal à l'épaule, douleur, j'ai mal, ça fait mal*
- Traumatisme : *je me suis fait mal, je me suis cogné, accident*
- Médication : *médicament, médication, ordonnance, antibiotique, antidouleur, anti-inflammatoire*
- Supplémentation médicale : *je dois prendre, mon médecin m'a prescrit*

**Catégorie : `safety_mental` (santé mentale)**

- Détresse explicite : *déprimé, dépression, idées noires, je veux en finir, je vais mal*
- Signaux TCA : *je me fais vomir, je ne mange plus, je suis dégoûté(e) de moi, obsession poids*
- Isolement aigu : *je n'ai personne, je me sens seul(e) tout le temps*

**Catégorie spécifique : Grossesse / allaitement**

- *enceinte, grossesse, allaitement, j'allaite, je suis tombée enceinte*

**À traiter comme `safety_health`** (escalade immédiate) car implique des recommandations professionnelles spécifiques.

### Liste des triggers d'escalade silencieuse — Hors-périmètre

**Catégorie : `out_of_scope_protocol` (modification du protocole)**

Le LLM peut suggérer des moyens d'**exécuter** le protocole (combinaisons d'aliments, idées de portions, conseils d'hygiène de vie basiques) mais jamais **modifier** le protocole. Les demandes de modification doivent être escaladées :

- *change mes macros, modifie mon programme, je veux faire autre chose, on peut changer*
- *augmente / diminue mes calories / mes protéines / mes glucides / mes lipides*
- *je veux ajouter une séance, je veux faire moins, je veux faire plus*
- *je voudrais passer en sèche, je voudrais passer en prise de masse, je veux changer d'objectif*

**Catégorie : `out_of_scope_prediction` (demande de prédiction future)**

Le LLM ne doit jamais prédire un futur incertain (résultats, timing) :

- *quand je vais voir des résultats, dans combien de temps, à quel moment*
- *combien de temps pour perdre X kilos, combien de temps pour prendre X muscle*
- *quand est-ce que je devrais passer en sèche*

**Catégorie : `data_missing` (données critiques manquantes)**

Le LLM ne peut pas répondre proprement si une donnée critique manque pour la question. Exemple : le client demande "combien il me reste de protéines" mais n'a logé aucun repas aujourd'hui. Plutôt que de répondre approximativement, escalader.

Cette détection est plus contextuelle (dépend du contenu de la question ET de l'état des données). À implémenter comme une **vérification complémentaire** après la détection par mots-clés.

### Comportement après détection d'escalade

**Côté client :**

- Le message reste affiché dans le chat normalement
- **Aucun spinner infini, aucun message "ton coach a été notifié"**, aucun message générique de fuite
- L'UX est : le client envoie son message → il s'affiche → puis plus tard, la réponse du coach arrive (à l'identique d'une réponse IA mais avec bordure verte 1.5px discrète)

**Côté backend :**

- `chat_messages.requires_coach_response = true`
- `chat_messages.coach_response_reason = 'safety_health' | 'safety_mental' | 'out_of_scope_protocol' | 'out_of_scope_prediction' | 'data_missing'`
- Insertion d'une entrée dans la queue de notifications coach (table prévue dans le Bloc D)
- **Pour `safety_health` et `safety_mental`** : envoi d'un email au coach immédiatement (non-modifiable, c'est critique)
- **Pour les autres reasons** : entrée dans l'inbox du coach + notification dashboard (email optionnel selon paramétrage coach, voir Bloc E)

### Cas particulier : LLM désactivé pour le client

Quand le coach a désactivé le LLM pour un client donné (paramétrage du Bloc E), **tous les messages texte libres** du client sont traités comme une escalade vers le coach, **sans passer par la classification d'escalade silencieuse**.

C'est cohérent : si le LLM est désactivé, le seul interlocuteur possible est le coach humain. Le message est flaggé avec `coach_response_reason = 'llm_disabled'` (ajouter cette valeur à l'enum) et arrive dans l'inbox normalement.

### Cas particulier : enquête conversationnelle du Bloc B

Quand le client répond à une enquête conversationnelle (réponses prédéfinies) via le bot scripté du Bloc B, **le contenu est connu et structuré** : pas besoin de classification. L'alerte coach est générée directement.

Si le client utilise "Autre (écrire)" pour répondre librement à une enquête, alors le **système d'escalade silencieuse s'applique** au texte libre saisi.

## Routage de la réponse coach vers le chat client

Quand le coach répond depuis son inbox (Bloc E) à un message client flaggé :

- Un nouveau message est inséré dans `chat_messages` avec :
  - `role: 'assistant'` (cohérent avec la vision "extension du coach", le coach IA et le coach humain parlent de la même voix visuellement)
  - `parent_message_id = ` ID du message client auquel le coach répond
  - **Un flag dédié `from_coach_human: true`** sur ce message (colonne à ajouter au Bloc D si pas déjà fait)
  - `content` = texte rédigé par le coach
- **Identité visuelle dans le chat client** : message rendu identiquement à un message du coach IA (même avatar, même couleur, même bulle), **mais avec une bordure verte 1.5px** appliquée comme indicateur subtil. Le client peut intuitivement distinguer mais l'expérience reste cohérente.
- Le flag `requires_coach_response` du message user d'origine passe à `false` (résolu)

## Critères de "done"

- Le système de classification pré-LLM est en place et testable de manière isolée
- Les listes de mots-clés couvrent les catégories `safety_health`, `safety_mental`, `out_of_scope_protocol`, `out_of_scope_prediction`, `data_missing`, `llm_disabled`
- Quand un message client matche un trigger d'escalade, aucun appel LLM n'est effectué, le message est flaggé, la notification coach est déclenchée
- Pour les cas `safety_health` et `safety_mental`, un email est envoyé au coach (non-modifiable)
- Pour les autres cas, l'inbox coach reçoit l'entrée + dashboard notification (+ email si coché par le coach)
- Quand le LLM est désactivé pour un client, tous ses messages texte libres sont escaladés sans classification
- Quand le coach répond depuis son inbox, un nouveau message apparaît dans le chat client avec bordure verte 1.5px
- Les tests unitaires sur le classifieur passent (cas positifs, cas négatifs, edge cases)
- Test d'intégration end-to-end : un client envoie "j'ai mal au dos" → aucune réponse IA → entrée inbox coach + email → coach répond → réponse arrive dans le chat avec bordure verte

## Points de vigilance

- **Le classifieur n'est pas parfait, il sera amélioré itérativement.** Il vaut mieux **trop escalader** que trop laisser passer. En cas de doute lors de l'implémentation : escalade. Le coach absorbe le surplus en R1, les seuils seront affinés avec les données réelles.
- **Pas de faux sentiment de sécurité** : la liste de mots-clés ne couvre pas tout. Les coachs doivent être prévenus qu'ils restent responsables des conversations IA de leurs clients et qu'ils doivent les superviser (cf. visibilité totale en R2).
- **Multilingue** : si Stryvr est utilisé en français principalement, prévoir les variantes orthographiques (genres, conjugaisons) et synonymes courants. À l'avenir, l'extension à d'autres langues nécessitera d'enrichir la liste.
- **Faux positifs probables** : *"j'ai mal mangé hier"* ne devrait pas matcher *"j'ai mal"* tel quel. Le classifieur doit être assez intelligent pour éviter ces faux positifs trop évidents (analyse contextuelle simple suffit). Documenter les cas problématiques et les corriger au fil de l'eau.
- **Performance** : la classification doit être rapide (< 50ms). Pas d'appel externe, pas de modèle ML lourd. Pure logique TypeScript.
- **Liste de mots-clés à valider par Coach Kev** : Claude Code propose une liste exhaustive et Coach Kev valide/ajuste avant déploiement. Prévoir un fichier de constantes facile à éditer.
- **Notification coach immédiate sur safety** : ne pas se contenter de l'inbox. Email immédiat. Quand un client signale "j'ai mal au dos", le coach doit le savoir vite, pas découvrir le message 12h plus tard quand il ouvre son dashboard.
