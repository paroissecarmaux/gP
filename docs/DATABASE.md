# Base de données — gParoisse

Stockage local via [Dexie.js](https://dexie.org/) (vendue en local dans
`js/vendor/dexie.mjs`, version 4.4.6) au-dessus d'IndexedDB. Base nommée
`gParoisse`, ouverte par `openDatabase()` (`js/db/database.js`).

## Métadonnées communes à toute entité métier importante

Chaque enregistrement métier (à partir de V2 : Personne, Événement,
Tâche…) porte les champs suivants, produits par `js/utils/syncMeta.js` :

| Champ                  | Type      | Rôle                                                             |
|------------------------|-----------|-------------------------------------------------------------------|
| `id`                   | uuid      | Identifiant unique, généré côté client (`crypto.randomUUID()`)    |
| `createdAt`            | Date      | Date de création de l'enregistrement                              |
| `updatedAt`            | Date      | Date de dernière modification                                     |
| `deletedAt`            | Date/null | Suppression douce (soft delete) ; `null` tant que non supprimé    |
| `originInstallationId` | uuid      | Installation ayant créé l'enregistrement en premier                |
| `revision`             | int       | Compteur incrémenté à chaque modification, utilisé pour la fusion |

Ces champs ne sont volontairement pas mis en avant dans l'interface
(cahier des charges, section 5) : ils existent pour l'intégrité des
données et la synchronisation (voir [SYNCHRONIZATION.md](SYNCHRONIZATION.md)),
pas pour l'usage quotidien du secrétariat.

Helpers disponibles (`js/utils/syncMeta.js`) :
- `createEntity(fields, originInstallationId)` — crée un nouvel
  enregistrement avec `id`, horodatages et `revision: 1`.
- `touch(entity)` — met à jour `updatedAt` et incrémente `revision`.
- `softDelete(entity)` — marque `deletedAt` sans supprimer la ligne
  (la corbeille, prévue en V9, s'appuiera dessus).

## Table `installations`

Un enregistrement par poste **connu** — le sien, et ceux découverts lors
de futures synchronisations. La toute première installation créée sur un
poste est sa propre origine (`originInstallationId === id`).

| Champ | Description |
|-------|-------------|
| `id`, `createdAt`, `updatedAt`, `deletedAt`, `originInstallationId`, `revision` | Métadonnées standard (voir ci-dessus) |
| `name` | Nom lisible (ex. « Poste secrétariat ») |

## Table `localSettings`

Réglages strictement **locaux à ce poste**, jamais synchronisés ni
exportés — par nature, sans métadonnées de synchro. Clé/valeur, clé
primaire `key`. Utilisée pour retenir quelle ligne de `installations`
représente *ce* poste (`currentInstallationId`), afin qu'au redémarrage de
l'application, gParoisse sache quelle installation est la sienne même
après que d'autres installations soient apparues dans `installations` via
une synchronisation.

## Schéma versionné

Voir [MIGRATIONS.md](MIGRATIONS.md) pour la méthode, et
[ENTITIES.md](ENTITIES.md) pour le catalogue complet des entités prévues
au-delà de la V1.

### v1 — Fondation

| Table | Index Dexie | Contenu |
|-------|-------------|---------|
| `installations` | `id, updatedAt, deletedAt, originInstallationId` | Postes connus |
| `localSettings` | `key` | Réglages locaux (non synchronisés) |
