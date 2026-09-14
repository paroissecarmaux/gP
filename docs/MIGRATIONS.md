# Migrations — gParoisse

Le schéma est versionné avec le système natif de Dexie
(`db.version(n).stores(...)`), défini dans `js/db/schema.js` et appliqué
par `js/db/migrations.js`.

## Règle absolue

**Une version déjà livrée ne se modifie jamais.** Toute évolution du
schéma ajoute une nouvelle entrée dans `SCHEMA` (`js/db/schema.js`) avec
le numéro de version suivant. Dexie rejoue l'intégralité de l'historique
des versions sur les bases existantes : modifier une entrée passée
casserait la mise à niveau des installations déjà en service — c'est une
question d'intégrité des données (priorité n°1 du projet), pas de style.

## Procédure pour ajouter une version

1. Dans `js/db/schema.js`, ajouter une entrée `N: { ...tables }` (syntaxe
   Dexie : `'clé, index1, index2'`), sans toucher aux entrées existantes.
2. Si les données existantes doivent être transformées (ex. remplir un
   nouveau champ obligatoire, migrer un format), ajouter une fonction dans
   `UPGRADES` (`js/db/migrations.js`) pour ce numéro de version — Dexie
   l'exécute automatiquement lors du passage à cette version.
3. Documenter la version dans le tableau ci-dessous et dans
   [DATABASE.md](DATABASE.md).
4. Ne jamais faire de suppression destructrice de données dans une
   migration : en cas de restructuration, conserver l'ancien champ ou le
   basculer en `deletedAt` plutôt que de le supprimer silencieusement
   (règle explicite : « pas d'écrasement silencieux »).

## Historique des versions

| Version | Contenu | Migration de données |
|---------|---------|-----------------------|
| 1 | `installations`, `localSettings` | — (version initiale) |

Les versions suivantes seront ajoutées au fil de la [roadmap](ROADMAP.md),
une entrée par module livré (V2 → Annuaire, V3 → Territoire/Agenda…).
