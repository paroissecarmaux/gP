# Base de données — gParoisse

Stockage local via [Dexie.js](https://dexie.org/) au-dessus d'IndexedDB.
Base nommée `gParoisse`, ouverte par `openDatabase()`
(`src/db/database.js`).

## Métadonnées communes à toutes les entités

Chaque enregistrement métier (Personne, Événement, Tâche… à partir de V2)
porte les champs suivants, produits par `src/utils/syncMeta.js` :

| Champ                 | Type      | Rôle                                                            |
|-----------------------|-----------|------------------------------------------------------------------|
| `id`                  | uuid      | Identifiant unique, généré côté client (`crypto.randomUUID()`)   |
| `createdAt`           | Date      | Date de création de l'enregistrement                             |
| `updatedAt`           | Date      | Date de dernière modification                                    |
| `deletedAt`           | Date/null | Suppression douce (soft delete) ; `null` tant que non supprimé   |
| `originInstallationId`| uuid      | Installation ayant créé l'enregistrement en premier               |
| `revision`            | int       | Compteur incrémenté à chaque modification, utile pour la fusion  |

Ces champs permettent la synchronisation entre installations (V10) : en
cas de conflit, l'installation avec la `revision` la plus haute (ou la
`updatedAt` la plus récente) l'emporte, et `originInstallationId` permet
de tracer la provenance d'un enregistrement.

Helpers disponibles :
- `createEntity(fields, originInstallationId)` — crée un nouvel
  enregistrement avec `id`, timestamps et `revision: 1`.
- `touch(entity)` — met à jour `updatedAt` et incrémente `revision`.
- `softDelete(entity)` — marque `deletedAt` sans supprimer la ligne.

## Entité `Installation`

Représente un poste (ordinateur) sur lequel l'application est installée.
C'est la première entité créée par l'application, au premier lancement
(`ensureCurrentInstallation()` dans `installationService.js`) : elle
génère un `id` qui sert ensuite d'`originInstallationId` pour tout ce que
ce poste créera, avant même toute synchronisation.

| Champ | Description |
|-------|-------------|
| `id` | Identifiant de l'installation |
| `name` | Nom lisible (ex. « Poste secrétariat ») |
| `createdAt`, `updatedAt`, `deletedAt`, `originInstallationId`, `revision` | Métadonnées standard (voir ci-dessus) — `originInstallationId` vaut ici son propre `id` |

La table `_appMeta` (clé/valeur, clé primaire `key`) retient localement
quelle `Installation` correspond à *ce* poste, sous la clé
`currentInstallationId`. Cette table n'est jamais synchronisée : c'est un
réglage local à chaque poste.

## Migrations

Le schéma est versionné avec le système natif de Dexie
(`db.version(n).stores(...)`), piloté depuis `src/db/migrations.js` : ce
fichier liste, dans l'ordre, une entrée `{ version, stores, upgrade? }`
par version de schéma. `src/db/database.js` applique chaque entrée à
l'instance Dexie au démarrage.

Pour ajouter une version :
1. Créer `src/db/schemas/vN.js` avec les nouvelles définitions de tables
   (syntaxe Dexie : `'clé, index1, index2'`).
2. Ajouter une entrée `{ version: N, stores: vNStores }` dans
   `migrations.js`. Ajouter un `upgrade(tx)` si les données existantes
   doivent être transformées (ex. remplir un nouveau champ obligatoire).
3. Ne jamais modifier une version déjà livrée : Dexie rejoue l'historique
   complet des versions sur les bases existantes.

### v1 — Fondation

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `installations` | `id, updatedAt, deletedAt, originInstallationId` | Entité `Installation` |
| `_appMeta` | `key` | Réglages locaux clé/valeur (non synchronisés) |

### v2 — Annuaire

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `history` | `id, entityType, entityId, occurredAt` | Journal d'audit transversal (créé ici car nécessaire dès le premier `Repository` générique) |
| `functions` | `id, updatedAt, deletedAt, name` | Fonctions occupées (Curé, Trésorier…), référencées par `persons.functionIds` |
| `groups` | `id, updatedAt, deletedAt, name` | Groupes paroissiaux, référencés par `persons.groupIds` |
| `persons` | `id, updatedAt, deletedAt, lastName` | Fiche personne complète : civilité, coordonnées, adresse, fonctions, groupes, et attributs bénévole/clergé/salarié (voir simplifications ci-dessous) |
| `families` | `id, updatedAt, deletedAt, name` | Famille : `headPersonId` + `memberPersonIds[]` |

### v3 — Territoire & Agenda

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `sectors` | `id, updatedAt, deletedAt, name` | Secteur pastoral |
| `clochers` | `id, updatedAt, deletedAt, name, sectorId` | Clocher, rattaché à un secteur |
| `lieux` | `id, updatedAt, deletedAt, name, clocherId` | Lieu (église, salle…), rattaché à un clocher |
| `celebrations` | `id, updatedAt, deletedAt, startAt, lieuId, celebrantPersonId, type` | Événement/célébration : type, horaires, lieu, célébrant, `participantPersonIds[]`, récurrence |

### v4 — Tâches

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `tasks` | `id, updatedAt, deletedAt, status, priority, dueDate` | `assigneePersonIds[]`, `assigneeGroupIds[]`, lien optionnel vers une célébration |

### v5 — Intentions & Paiements

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `intentions` | `id, updatedAt, deletedAt, status, celebrationId` | Intention de messe : demandeur, objet, statut, montant demandé |
| `payments` | `id, updatedAt, deletedAt, intentionId, date` | Paiement associé à une intention (historique append-only via soft delete + `history`) |

### v6 — Secrétariat

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `requests` | `id, updatedAt, deletedAt, status, priority, dueDate` | Demande administrative (certificat, acte…), responsable, échéance |

### v7 — Sacrements & Certificats

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `sacramentalActs` | `id, updatedAt, deletedAt, type, personId, date` | Acte sacramentel (baptême, mariage…), lieu, célébrant, `relatedPersonIds[]` (témoins/parrain-marraine/conjoint) |
| `sacramentalNotes` | `id, updatedAt, deletedAt, actId` | Mention marginale sur un acte, avec lien optionnel vers un autre acte |
| `certificates` | `id, updatedAt, deletedAt, actId` | Journal des certificats générés/imprimés pour un acte |

### v8 — Quêtes

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `collections` | `id, updatedAt, deletedAt, celebrationId, date` | Collecte liée à une célébration |
| `counts` | `id, updatedAt, deletedAt, collectionId` | Comptage : bénévoles compteurs, espèces, chèques |
| `remittances` | `id, updatedAt, deletedAt, collectionId, date` | Remise en banque d'une collecte |

### v9 — Fournisseurs, Documents, Transversal

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `suppliers` | `id, updatedAt, deletedAt, name` | Fournisseur (catégorie, contact) |
| `documents` | `id, updatedAt, deletedAt, linkedEntityType` | Fichier (Blob), catégorie, lien libre vers l'élément concerné |

La Corbeille et les contrôles d'intégrité s'appuient sur les tables déjà
existantes via `registerEntity()` (pas de nouvelle table dédiée).

### v10 — Recherche, Sauvegarde, Synchronisation, KPI

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `syncLog` | `id, updatedAt, deletedAt, occurredAt` | Journal des exports/imports de sauvegarde (`type`, `summary`, `occurredAt`) |

La recherche globale et le tableau de bord ne créent pas de table : ils
lisent les tables existantes via `registerEntity()` / les repositories
des autres modules.

### v11 — Calendrier liturgique

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `diocesanFeasts` | `id, updatedAt, deletedAt, month, day` | Particularité diocésaine (fête locale récurrente chaque année) |

Les fêtes fixes et mobiles du calendrier romain (Pâques, Avent…) sont
calculées à la volée (`src/modules/liturgie/liturgicalCalendar.js`), pas
stockées.

## Synchronisation

Il n'y a pas de serveur : la synchronisation entre installations
(`/parametres/sauvegarde`, `src/modules/systeme/backupService.js`) se
fait par échange de fichier :

1. **Export** — sérialise toutes les tables (sauf `_appMeta`, locale à
   chaque poste) en un fichier JSON téléchargeable.
2. **Import/fusion** — pour chaque enregistrement du fichier, s'il
   n'existe pas localement il est inséré ; s'il existe, celui avec la
   `revision` la plus haute l'emporte (à égalité, la `updatedAt` la plus
   récente). Les dates sont ranimées (`reviveDates`) à partir d'une liste
   de champs connus, car le JSON les sérialise en chaînes.
3. Chaque export/import est journalisé dans `syncLog`, consultable dans
   l'écran de synchronisation.

Le fichier peut être transmis par clé USB, dossier partagé ou email :
c'est un choix délibéré pour rester cohérent avec une application
offline-first sans infrastructure serveur à maintenir.

## Simplifications de modélisation

Pour couvrir l'ensemble des modules sans complexité excessive, quelques
relations qui auraient pu être des tables de liaison dédiées sont des
tableaux d'identifiants sur l'entité principale :

- `persons.functionIds[]` / `persons.groupIds[]` plutôt que des tables
  `PersonFunction`/`GroupMembership`.
- `families.memberPersonIds[]` plutôt qu'une table `FamilyMember`.
- Bénévolat/clergé/salariat sont des champs booléens + attributs sur
  `persons` (`isVolunteer`, `isClergy`, `isEmployee`…) plutôt que des
  entités séparées.
- `tasks.assigneePersonIds[]` / `assigneeGroupIds[]` plutôt qu'une table
  d'affectation.
- `documents.linkedEntityType` + `linkedDescription` sont une
  description libre de l'élément concerné, pas une clé étrangère
  polymorphe stricte : plus simple, au prix de ne pas pouvoir lister
  automatiquement « les documents de telle fiche ».

Ces choix peuvent être révisés module par module si un besoin précis
l'exige (ex. suivre une date d'entrée/sortie par membre de groupe), sans
remettre en cause le reste du schéma.
