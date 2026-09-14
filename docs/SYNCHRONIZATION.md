# Synchronisation entre installations — gParoisse

Synchronisation entre installations locales indépendantes (section 7 du
cahier des charges), implémentée en V10
(`js/services/synchronization.js`, écran `pages/synchronization.js`). Les
métadonnées posées dès la V1 (`id`, `updatedAt`, `deletedAt`,
`originInstallationId`, `revision`) sont ce qui rend la fusion possible.

**Vérifiée par un test à deux installations simulées** (deux contextes de
navigateur isolés = deux bases IndexedDB indépendantes, échangeant de
vrais fichiers de sauvegarde) — pas seulement relue : ce test a fait
évoluer l'algorithme ci-dessous d'une première version fondée sur
`revision` vers la version fondée sur `updatedAt` decrite plus bas, après
avoir révélé un cas de perte silencieuse. Voir
[ARCHITECTURE.md § Fusion par revision seule](ARCHITECTURE.md) pour le
détail de ce qui a été corrigé et pourquoi.

## Principe général

Pas de serveur central : la synchronisation se fait par **échange de
fichier** (paquet de synchronisation JSON), transmis par clé USB, dossier
partagé ou email — cohérent avec « sans backend, sans serveur, sans
cloud ». Chaque poste exporte l'état complet de sa base et l'importe sur
un autre poste pour fusionner.

## Contenu d'un paquet de synchronisation

- `originInstallationId` : identifiant de l'installation émettrice.
- `exportedAt` : date de génération.
- `recordCount` : nombre total d'enregistrements (indicatif).
- `data` : pour chaque table synchronisable (tout sauf `localSettings`,
  local par nature), la liste complète de ses enregistrements avec leurs
  métadonnées.

Avant toute écriture, `validatePackage()` refuse un fichier illisible
(JSON invalide) ou dépourvu de la structure minimale attendue
(`originInstallationId` + `data`) — exigence explicite (« refuser les
paquets incompatibles ou corrompus »). **Simplification assumée** : pas de
somme de contrôle ni de vérification de version de schéma à l'heure
actuelle — à ajouter si des paquets corrompus en usage réel le
justifient ; pour l'instant, un JSON structurellement valide mais
sémantiquement incohérent (ex. exporté par une version de schéma très
différente) serait accepté sans le détecter.

## Algorithme de fusion

Pour chaque enregistrement du paquet importé, comparé à l'enregistrement
local de même `id` (s'il existe), la fusion s'appuie sur la date du
**dernier échange avec cette installation précise** — retenue localement
dans `localSettings` sous la clé `lastSyncWith:<installationId>` — et non
sur le seul compteur `revision` :

| Cas | Condition | Action |
|-----|-----------|--------|
| 1. Absent localement | pas de ligne locale avec cet `id` | Insertion directe |
| 2. Rien de neuf importé | `incoming.updatedAt` ≤ date du dernier échange avec cette installation | Aucune action |
| 3. Modifié d'un seul côté | rien changé localement depuis le dernier échange avec cette installation (`existing.updatedAt` ≤ cette date) | Intégrer la version importée |
| 4. Modifié des deux côtés, résultats différents | les deux ont changé depuis le dernier échange **et** leur contenu diffère | Créer un `ConflitSynchronisation` (voir [ENTITIES.md](ENTITIES.md)) |
| 4bis. Modifié des deux côtés, même résultat | comme le cas 4 mais contenu identique | Aucune action (pas de conflit inutile) |

**Pourquoi pas `revision` seul** : si les deux côtés éditent
indépendamment le même enregistrement depuis le dernier échange, chacun
incrémente `revision` de 1 — les deux atteignent la **même** révision
avec un contenu **différent**. Une comparaison fondée uniquement sur
`revision` classerait ce cas en « rien à faire », effaçant silencieusement
la modification d'un des deux côtés.

La suppression douce (`deletedAt`) est un champ comme un autre pour cette
logique : elle se fusionne avec les mêmes règles, jamais par réapparition
silencieuse d'une donnée supprimée d'un côté.

**Limite connue** : l'horodatage `lastSyncWith:<installationId>` suppose
des horloges à peu près synchronisées entre postes ; un décalage
d'horloge important entre deux ordinateurs pourrait fausser la
détection. Non observé en usage normal (mise à jour automatique de
l'heure par l'OS), mais à garder en tête.

## Résolution des conflits

Chaque `ConflitSynchronisation` conserve les deux versions
(`localSnapshot`, `incomingSnapshot`) et reste visible tant qu'il n'est
pas résolu (écran `/parametres/conflits`, `pages/synchronization.js`) :

- **Conserver ma version** — la version locale l'emporte.
- **Utiliser la version importée** — remplace la version locale.
- **Fusionner champ par champ** — un sélecteur par champ en désaccord
  (les champs identiques des deux côtés ne sont pas proposés au choix),
  pour les cas où les deux modifications portent sur des champs
  différents du même enregistrement (ex. l'un a changé le téléphone,
  l'autre l'adresse).

Un conflit non résolu **reste identifié** (jamais résolu automatiquement)
et apparaît en KPI cliquable sur le tableau de bord (« Conflits non
résolus », `js/services/statistics.js`).

## Résumé post-synchronisation

Chaque export et chaque import journalise une entrée `Synchronisation`
(`syncLog`) avec un résumé lisible (ajouts, fusions, ignorés, conflits) et
la date — consultable dans l'écran de synchronisation, distinct de
l'historique transversal des entités métier (`history`, V9).

## Ce qui reste hors périmètre

- **Pas de synchronisation temps réel ni de connexion réseau entre
  postes** : le paquet est toujours un fichier explicite, échangé
  consciemment par un utilisateur. Choix assumé, cohérent avec « sans
  serveur, sans cloud » — pas une limitation technique à lever plus tard.
- **Pas de somme de contrôle / version de schéma dans le paquet** (voir
  plus haut) : à ajouter si le besoin se confirme en usage réel.
- **Contrôle d'intégrité post-fusion minimal** : le cahier des charges
  (section 7) demande une vérification des références après fusion (ex.
  une `Célébration` importée dont le `lieuId` ne correspond à aucun
  `Lieu` connu) — non implémentée à ce stade ; les contrôles d'intégrité
  existants (`js/services/*`) portent sur la saisie, pas sur l'état
  post-import.
