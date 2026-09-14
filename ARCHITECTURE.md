# Architecture — gParoisse

Application web hors-ligne d'abord (offline-first), en JavaScript vanilla
avec Vite comme outil de build et Dexie.js comme couche IndexedDB.
Toutes les versions V1 à V11 de la [roadmap](ROADMAP.md) sont implémentées.

## Pourquoi pas de framework UI

Le routeur et le système de composants sont volontairement maison et
minimalistes (voir `src/ui/core/`). L'application vise une durée de vie
longue en environnement paroissial, avec des besoins d'affichage simples
(listes, fiches, formulaires) : la dépendance à un framework front
n'apporte pas assez pour justifier son coût de maintenance à long terme.
La quantité de code reste maîtrisable grâce à un système de CRUD
générique (voir plus bas) : chaque écran liste/fiche d'entité est défini
par une simple configuration, pas par du HTML/JS réécrit à chaque fois.

## Structure des dossiers

```
src/
  db/                    Couche de persistance (Dexie/IndexedDB)
    database.js          Instance Dexie + application des migrations
    migrations.js         Liste ordonnée des versions de schéma (v1 → v11)
    repository.js         Classe Repository générique (CRUD + historique)
    registry.js            Registre transversal des entités (pour Recherche,
                           Corbeille, KPI)
    schemas/
      v1.js … v11.js       Définition des tables, une version par jalon
  services/               Services partagés
    installationService.js
    session.js             Installation courante (mémoire, pour Repository)
    historyService.js       Journal d'audit transversal
  ui/
    core/                 Briques réutilisables par tous les modules
      Component.js         Classe de base des composants
      router.js             Routeur hash avec paramètres (`/annuaire/:id`)
      ListView.js            Vue liste générique (config : colonnes, tri…)
      FormView.js             Vue formulaire générique (config : champs)
      formFields.js            Rendu des champs de formulaire par type
      crud.js                   `registerCrudRoutes()` : liste+fiche+édition
                                 en un appel, à partir d'une config d'entité
    layout/
      AppShell.js            Coquille de page + navigation + bandeau d'erreur
  modules/                 Un dossier par domaine métier (voir plus bas)
  utils/
    uuid.js                Génération d'identifiants
    syncMeta.js              Métadonnées de synchro (createdAt, revision…)
    indexBy.js                Aides (index par id, libellés, options statiques)
  errors/
    AppError.js              Hiérarchie d'erreurs typées
    errorHandler.js            Gestion centralisée + abonnement UI
  main.js                  Point d'entrée : bootstrap + assemblage des modules
```

## Modules métier

Chaque module vit dans `src/modules/<domaine>/` et regroupe tout ce qui le
concerne :

- `repositories.js` — instances `Repository` du module + `registerEntity()`
  pour les rendre visibles à la Recherche globale, la Corbeille et
  l'historique.
- `fields.js` — configuration des colonnes de liste et des champs de
  formulaire pour chaque entité (voir « CRUD générique » ci-dessous).
- `index.js` — assemble routes et entrée de navigation via
  `registerCrudRoutes()`, exporte `routes` et `navSection`.
- Composants spécifiques quand un écran dépasse le CRUD générique
  (`AgendaPage.js`, `CertificatePage.js`, `StatsPage.js`…).

Modules existants : `annuaire`, `territoire-agenda`, `taches`,
`intentions`, `secretariat`, `sacrements`, `quetes`, `transversal`,
`systeme` (tableau de bord, recherche, sauvegarde/synchro), `liturgie`.

`main.js` importe chaque module, fusionne leurs `routes` dans le routeur
et leurs `navSection` dans la navigation de l'`AppShell`.

## CRUD générique

`registerCrudRoutes({ path, title, repository, columns, fields, ... })`
(`src/ui/core/crud.js`) génère trois routes (liste, création, édition) à
partir d'une configuration déclarative :

- `columns` : `{ label, key }` ou `{ label, render(row, ctx) }` pour la
  liste (`ListView`).
- `fields` : `{ name, label, type, required, options }` pour le formulaire
  (`FormView`) — types supportés : `text`, `textarea`, `number`, `date`,
  `datetime`, `checkbox`, `select`, `multiselect`, `file`.
- `prepareContext()` charge une fois les données de référence (ex. la
  liste des personnes pour un champ « célébrant ») et les transmet à
  `columns`/`fields` via `ctx`.
- `FormComponent` permet de remplacer `FormView` par une sous-classe pour
  un écran qui dépasse le CRUD simple (ex. `CelebrationFormView` gère la
  récurrence et l'alerte de conflit d'agenda).

Ce mécanisme couvre la majorité des écrans de l'application ; seuls les
écrans réellement spécifiques (agenda calendaire, certificats, tableau de
bord, recherche, sauvegarde/synchro, calendrier liturgique) ont un
composant dédié.

## Composants

`Component` (`src/ui/core/Component.js`) est une classe de base minimale :
elle sépare `render()` (construction du DOM) de `mount()`/`unmount()`
(cycle de vie). Les hooks optionnels `onMount()`/`onUnmount()` permettent
de charger des données ou de se désabonner d'événements.

## Routeur

`Router` (`src/ui/core/router.js`) est un routeur hash-based avec
paramètres (`/annuaire/personnes/:id`). Lorsqu'un chemin correspond à
plusieurs routes de même longueur (ex. `/taches/en-retard` face à
`/taches/:id`), la route sans paramètre (la plus spécifique) l'emporte
toujours, quel que soit l'ordre d'enregistrement — indispensable dès
qu'un module ajoute des vues filtrées sous un chemin déjà couvert par un
CRUD générique.

## Gestion des erreurs

Toute erreur métier doit être levée sous forme d'`AppError` (ou d'une
sous-classe : `DatabaseError`, `ValidationError`) pour porter un `code` et
un `context` exploitables. `reportError()` centralise la journalisation et
notifie les abonnés UI (l'`AppShell` affiche un bandeau d'erreur). Les
erreurs non interceptées (`window.onerror`, `unhandledrejection`) sont
capturées automatiquement par `installGlobalErrorHandlers()`, appelé une
fois au démarrage dans `main.js`.

## Repository générique et historique

`Repository` (`src/db/repository.js`) implémente `list`, `get`, `create`,
`update`, `remove` (soft delete), `restore`, `hardDelete` pour une table
Dexie donnée, en appliquant systématiquement les métadonnées de synchro
et en journalisant chaque mutation via `historyService.recordHistory()`
(table `history`, consultable sur `/historique`). C'est ce qui rend la
Corbeille (`/corbeille`) et l'historique transversaux : ils s'appuient sur
`registerEntity()` (`src/db/registry.js`), pas sur une liste codée en dur.

## Métadonnées de synchronisation

Voir [DATABASE.md](DATABASE.md) pour le détail des champs
(`createdAt`, `updatedAt`, `deletedAt`, `originInstallationId`,
`revision`) et de l'entité `Installation`, socle de la synchronisation
multi-postes (`/parametres/sauvegarde`, voir [DATABASE.md](DATABASE.md#synchronisation)).

## Système de migrations

Voir [DATABASE.md](DATABASE.md#migrations).

## Simplifications assumées

Pour tenir l'ensemble V1-V11 dans une base de code cohérente, quelques
choix pragmatiques ont été faits (documentés en détail dans
[DATABASE.md](DATABASE.md#simplifications-de-modélisation)) :

- Pas de tables de liaison dédiées pour les relations simples (ex.
  fonctions/groupes d'une personne) : ce sont des tableaux d'identifiants
  sur l'entité elle-même.
- Les documents (V9) se lient à un module par une description libre plutôt
  qu'une clé étrangère stricte.
- La synchronisation entre installations (V10) se fait par échange de
  fichier de sauvegarde (export/import fusion par révision), pas par un
  serveur ou une connexion réseau temps réel.
- Le calendrier liturgique (V11) est un calcul approché (Épiphanie fixée
  au 6 janvier) : à ajuster finement si besoin via les particularités
  diocésaines.
