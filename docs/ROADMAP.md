# Roadmap — gParoisse

> **Statut actuel : V1 (Fondation) et V2 (Annuaire) livrées.** V3 à V11
> sont planifiées et modélisées (voir [ENTITIES.md](ENTITIES.md) /
> [RELATIONS.md](RELATIONS.md)) mais pas encore implémentées —
> conformément à la mission V1 du prompt maître : « ne développe pas
> immédiatement tous les modules ».

## Ordre de priorité absolu (jamais renversé)

1. Intégrité des données
2. Architecture
3. Ergonomie
4. Fonctionnalités métier
5. Recherche
6. Synchronisation
7. Statistiques / KPI
8. Esthétique

## Versions

| Version | Contenu | Statut |
|---------|---------|--------|
| **V1** | Fondation : structure, Dexie, schéma, migrations, identifiants, métadonnées, Installation, architecture JS, navigation minimale, composants, erreurs, documentation | ✅ Livrée |
| **V2** | Annuaire : Personne, Famille, Coordonnée, Fonction, Groupe, Bénévole, Clergé, Salarié | ✅ Livrée |
| **V3** | Secteurs / Clochers / Lieux + Agenda + Célébrations + détection de conflits | Planifiée |
| **V4** | Tâches | Planifiée |
| **V5** | Intentions de messe + Paiements | Planifiée |
| **V6** | Secrétariat | Planifiée |
| **V7** | Sacrements (registres, actes, mentions) + Certificats | Planifiée |
| **V8** | Finances opérationnelles (quêtes) | Planifiée |
| **V9** | Fournisseurs + Documents + Historique + Corbeille | Planifiée |
| **V10** | Recherche + Sauvegarde/Export/Import + Synchronisation + KPI | Planifiée |
| **V11** | Calendrier liturgique + finalisation (performance, accessibilité, responsive, tests) | Planifiée |

## V1 — Ce qui a été livré

- Structure de dossiers (`css/`, `js/db|services|ui|utils`, `pages/`, `docs/`)
- Dexie.js vendu en local, base versionnée (`js/db/schema.js`, `js/db/migrations.js`)
- Identifiants uniques + métadonnées de synchronisation (`js/utils/syncMeta.js`)
- Entité `Installation` + réglages locaux (`localSettings`)
- Architecture JavaScript modulaire (ES natifs, sans build)
- Navigation minimale (routeur hash + un module : tableau de bord)
- Système de composants (`Component`, `AppShell`)
- Gestion centralisée des erreurs + notifications
- Documentation initiale complète (`docs/`)
- Serveur de fichiers statique local + lanceur Windows, sans dépendance

## Definition of Done — V1

On peut lancer l'application (double-clic ou `node serve.js`), la base
est créée et versionnée, une installation locale existe et persiste entre
les redémarrages, et l'architecture est prête à accueillir les modules
métier sans être refaite.

## V2 — Ce qui a été livré

- Entités : `Personne`, `Famille` (+ membres), `Coordonnée` (adresse/contact
  polymorphe), `Fonction` (+ affectations), `Groupe` (+ participations),
  profils `Bénévole`/`Clergé`/`Salarié` (1-1 sur Personne)
- Fiche Personne complète : coordonnées, fonctions occupées, groupes,
  profils bénévole/clergé/salarié activables
- Détection de doublons à la création d'une personne (jamais de fusion
  automatique — juste un avertissement, avec choix laissé à l'utilisateur)
- Suppression douce sur toutes les entités (corbeille de restauration
  visuelle prévue en V9 — les données ne sont jamais perdues entre-temps)
- Couche `Repository` générique (`js/db/repository.js`) : décision révisée
  par rapport à la V1 (voir [ARCHITECTURE.md](ARCHITECTURE.md)), justifiée
  par les dix tables introduites simultanément
- Composants génériques `ListView`/`FormView`, validation centralisée
  (`js/utils/validation.js`), modales accessibles (`js/ui/modals.js`)

## Definition of Done — V2

On peut créer, modifier et rechercher des personnes, les relier à des
familles et des groupes, leur assigner des fonctions et des profils
bénévole/clergé/salarié, sans perte de données possible (suppression
toujours douce) et avec un signalement des doublons évidents.
