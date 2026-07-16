# TODO

## Robustesse du portail admin en cas de panne partielle

Contexte : étape 2 du chantier "élimination du statique" (métriques admin).
Non commité à ce jour (HEAD au moment de la rédaction : `8b02b55`) — mettre à
jour cette référence avec le hash réel une fois l'étape 2 committée.
Non traité pour rester dans le périmètre de l'étape.

1. Restructurer le `try/except` global de `get_admin_metrics` (`backend/main.py`)
   en réponses dégradées par section (aujourd'hui : un seul `except` attrape
   tout, toute la réponse est perdue).
2. Payload dégradé structuré : garder la forme `platform`/`ml_health`/`system`/`users`
   avec `null` à l'intérieur plutôt qu'une forme à plat différente.
3. Remplacer le guard `json.platform` de `fetchAdminMetrics`
   (`frontend/src/app/admin-portal/page.tsx:28`) par un critère compatible
   avec un payload dégradé (ex. `json.system && !json.error`).
4. Rendre null-safe tous les accès `data.platform.*`, `data.ml_health.*` dans
   `admin-portal/page.tsx` (aujourd'hui `data.users?.` et
   `data.recent_activities?.` sont protégés, d'autres non — inconsistance).

Priorité : après clôture du chantier "élimination du statique".

## Améliorations observabilité (non prioritaires)

Contexte : étape 4 du chantier "élimination du statique" (`avg_latency_ms`
via middleware, fenêtre glissante 5 min en RAM).

1. `avg_latency_ms` est une moyenne — cache les queues. Ajouter P95 et P99
   sur la même fenêtre 5 min pour détecter les longues traînes que la
   moyenne noie (un chat à 8s + 100 requêtes à 20ms → moyenne acceptable,
   P99 catastrophique).
2. Historique persistant : la fenêtre 5 min est en RAM du process. Un
   redémarrage Render efface tout. Pour un vrai suivi de trend, exporter
   vers un stockage externe (Prometheus, base time-series). Coût élevé,
   valeur limitée à ce stade — à revoir en Phase 2.
3. Métrique "fallback rate" pour analyses média : ratio (fallbacks /
   total analyses) sur une fenêtre glissante, exposé dans le portail admin.
   Un taux qui monte signale que Gemini est saturé / indisponible plus
   souvent — signal actionnable (revoir plafond du rate limiter, revoir
   modèle épinglé, etc.). À faire après clôture du chantier "élimination
   du statique".

Ces trois points sont notés pour la traçabilité, aucun n'est urgent.

## Intégrité des données utilisateur

1. Sites en doublon
   Un utilisateur peut créer plusieurs sites avec le même nom, ce qui produit
   des doublons dans la liste. Chantier à cadrer :
   - Périmètre d'unicité : par user_id ? par organisation ? global ?
   - Normalisation à appliquer : casse, accents, espaces multiples ?
   - Stratégie pour les doublons existants en base : fusion, désambiguïsation
     par suffixe, alerte utilisateur à la prochaine connexion ?
   - Contrainte SQL (UNIQUE INDEX) + validation applicative (côté backend
     avant l'INSERT, message d'erreur explicite).
   Priorité : à traiter après clôture du chantier "élimination du statique".

2. Vérifier si le même problème existe sur Machine (deux machines même nom,
   même site) et sur d'autres entités déclaratives — probablement.

## Prose encore incohérente après le renommage "prévision IA" -> "statistique"

Contexte : étape 7 du chantier "élimination du statique" (renommage de
`source: "ia"` -> `"statistique"` sur `/api/bills/forecast`). Le périmètre de
l'étape portait sur la valeur `source` et les libellés UI directement
associés au badge de prévision (grep exhaustif "prevision ia" / "ai forecast"
— 0 occurrence après correction). Des mentions plus diffuses de "l'IA" pour
décrire ce mécanisme (moyenne mobile + facteur de correction, pas un modèle
ML) subsistent, hors périmètre strict du grep car formulées différemment :

1. `frontend/src/lib/i18n.tsx` :
   - `billsDesc` (~ligne 152) : "pour que l'IA base ses prévisions... pour
     que l'IA affine sa précision."
   - `notifActualSaved` (~ligne 181) : "l'IA recalibre ses prochaines
     prévisions."
2. `backend/main.py`, docstring de `confirm_bill_actual` (~ligne 1049) :
   "pour que les prochaines prévisions de l'IA s'améliorent."

Ces textes ne sont pas faux à 100% (le "facteur de correction" est bien un
mécanisme adaptatif), mais le mot "IA" y suggère un modèle ML alors que la
méthode réelle est une moyenne mobile pondérée — la même ambiguïté que
l'étape 7 a corrigée pour le badge. Pas traité ici pour rester strictement
dans le périmètre validé (renommage de `source` + labels associés). À
recadrer explicitement si on veut une réécriture cohérente de toute la prose
"prévision" du module facturation.

Priorité : basse, aucun impact fonctionnel — question de cohérence de
discours uniquement.
