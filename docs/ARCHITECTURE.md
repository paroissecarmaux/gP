# Architecture — gParoisse

Application 100 % locale : HTML, CSS et JavaScript vanilla, IndexedDB via
Dexie.js. Pas de backend, pas de build, pas de framework SPA — voir
« Décisions architecturales » ci-dessous pour la justification de chaque
choix qui s'écarte d'une lecture strictement littérale du cahier des
charges.

## Structure des dossiers

```
/
├── index.html            Point d'entrée, charge js/app.js en module
├── favicon.svg
├── serve.js               Serveur de fichiers statiques local (voir plus bas)
├── demarrer-gParoisse.bat  Lanceur Windows (double-clic)
├── css/
│   ├── app.css             Réinitialisation, mise en page, structure
│   ├── components.css       Styles des composants (cartes, notifications…)
│   └── responsive.css        Media queries
├── js/
│   ├── app.js               Bootstrap : DB, installation, routeur, coquille
│   ├── vendor/
│   │   └── dexie.mjs         Dexie 4.4.6, copie locale (voir plus bas)
│   ├── db/
│   │   ├── database.js       Instance Dexie + ouverture
│   │   ├── schema.js          Définition des tables, une entrée par version
│   │   └── migrations.js       Application des versions à l'instance Dexie
│   ├── services/             Logique métier, un fichier par domaine
│   │   └── installation.js    (seul service nécessaire en V1)
│   ├── ui/
│   │   ├── components.js       Classe de base des composants + AppShell
│   │   ├── router.js            Routeur hash avec paramètres
│   │   └── notifications.js      Bandeau de notifications / erreurs
│   └── utils/
│       ├── uuid.js
│       ├── syncMeta.js          Métadonnées de synchronisation
│       ├── dates.js
│       └── errors.js             Hiérarchie d'erreurs + gestion centralisée
├── pages/                  Écrans, un module par page/route
│   └── dashboard.js
├── docs/                   Cette documentation
└── scripts/
    └── push-to-github.ps1
```

`services/` (logique + accès aux données) et `pages/` (écrans) sont
volontairement séparés : un module métier futur (ex. Annuaire) ajoute
`js/services/people.js` + `js/services/families.js` et
`pages/annuaire.js`, sans toucher au reste.

Seuls les fichiers réellement utilisés par la V1 sont créés. Les autres
noms de fichiers/services prévus par le cahier des charges (`people.js`,
`agenda.js`, `forms.js`, `modals.js`, `validation.js`…) apparaîtront au fil
des versions qui en ont besoin (voir [ROADMAP.md](ROADMAP.md)) — créer des
fichiers vides à l'avance n'apporterait rien et contredirait la règle
« pas de gros fichiers monolithiques / pas de code mort ».

## Décisions architecturales

### Modules ES natifs, sans bundler

Le code est écrit en modules ES standard (`import`/`export`), chargés tels
quels par le navigateur (`<script type="module">`), sans étape de
build (Vite, Webpack, esbuild…). C'est la lecture la plus littérale de
« JavaScript vanilla » et de la structure de dossiers demandée (un
`index.html` à la racine chargeant directement des fichiers `.js`, sans
`src/`, `dist/`, `package.json` applicatif).

### Un serveur de fichiers statique local, pas de `file://`

Ouvrir `index.html` directement (`file://`) est théoriquement possible,
mais deux problèmes réels s'y opposent :
1. Les modules ES sont bloqués par la politique CORS des navigateurs sur
   `file://` (origine `null`).
2. Le comportement d'IndexedDB sur `file://` est incohérent selon les
   navigateurs et leurs versions — inacceptable pour une application dont
   la **priorité n°1 est l'intégrité des données** (section 10 du cahier
   des charges).

`serve.js` (racine du projet) est donc un serveur de fichiers statiques
minimal, écrit sans aucune dépendance (uniquement les modules natifs de
Node `http`/`fs`/`path`) : il ne contient **aucune logique métier**, ne
touche jamais à la base de données, et ne fait rien de plus que
`python -m http.server`. Ce n'est pas un « backend » au sens exclu par le
cahier des charges (qui vise un serveur métier/API gérant des données) :
c'est un outil local, au même titre qu'un serveur de développement. Node
est requis sur le poste pour le lancer, mais **aucune dépendance n'est
installée** (pas de `npm install`, pas de `node_modules`, pas de
`package.json`) — juste `node serve.js`, via le double-clic sur
`demarrer-gParoisse.bat`.

### Dexie.js vendue en local

`js/vendor/dexie.mjs` est une copie locale de Dexie 4.4.6 (build ESM
« modern », navigateurs récents), et non un `<script>` pointant vers un
CDN. Cohérent avec « 100 % locale » et « utilisable hors connexion » dès
le premier lancement, sans dépendre d'une disponibilité réseau — y
compris pour charger une simple bibliothèque JS.

### Pas de couche « Repository » générique

Avec une seule entité en V1 (`Installation`), une abstraction générique de
CRUD serait prématurée. En revanche, la logique de métadonnées
(identifiant, horodatage, révision, suppression douce) est déjà factorisée
dans `js/utils/syncMeta.js`, réutilisée par tous les futurs
`services/*.js` : ça évite la duplication (règle explicite du cahier des
charges) sans imposer une architecture générique avant d'en connaître le
besoin réel sur plusieurs entités.

## Composants et navigation

`Component` (`js/ui/components.js`) sépare `render()` (construction du
DOM) de `mount()`/`unmount()` (cycle de vie), avec hooks optionnels
`onMount()`/`onUnmount()`. `AppShell` est la coquille persistante
(en-tête, navigation, zone de contenu, emplacement des notifications).

`Router` (`js/ui/router.js`) est un routeur hash-based avec paramètres
(`/annuaire/:id`). Quand plusieurs routes ont le même nombre de segments,
la route la plus spécifique (le moins de paramètres) l'emporte toujours,
indépendamment de l'ordre d'enregistrement — nécessaire dès qu'un module
ajoute une vue filtrée sous un chemin déjà couvert par une route à
paramètre (ex. `/taches/en-retard` face à `/taches/:id`).

La navigation V1 est volontairement minimale (un seul module : le tableau
de bord), conformément à la mission V1 du cahier des charges.

## Gestion des erreurs et notifications

Toute erreur métier est levée sous forme d'`AppError` (ou sous-classe :
`DatabaseError`, `ValidationError`, `js/utils/errors.js`), avec un `code`
et un `context` exploitables. `reportError()` centralise la journalisation
et notifie les abonnés ; `installGlobalErrorHandlers()` capture les
erreurs non interceptées (`window.onerror`, `unhandledrejection`).
`js/ui/notifications.js` affiche ces erreurs (et, plus tard, les messages
de confirmation) sous forme de bandeaux non bloquants.

## Base de données et migrations

Voir [DATABASE.md](DATABASE.md) et [MIGRATIONS.md](MIGRATIONS.md).

## Modèle de données prévu

Voir [ENTITIES.md](ENTITIES.md) (catalogue complet, au-delà de la V1) et
[RELATIONS.md](RELATIONS.md).

## Synchronisation entre installations

Conception détaillée (implémentation prévue en V10) : voir
[SYNCHRONIZATION.md](SYNCHRONIZATION.md).
