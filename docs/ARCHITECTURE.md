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
│   │   ├── migrations.js       Application des versions à l'instance Dexie
│   │   └── repository.js        CRUD générique + métadonnées (depuis V2)
│   ├── services/             Logique métier, un fichier par domaine
│   │   ├── installation.js
│   │   ├── people.js          Personne + profils bénévole/clergé/salarié
│   │   ├── families.js         Famille + membres
│   │   ├── functions.js         Fonction + affectations
│   │   ├── groups.js             Groupe + participations
│   │   └── contacts.js            Coordonnée (partagée Personne/Famille)
│   ├── ui/
│   │   ├── components.js       Component, AppShell, ListView, FormView
│   │   ├── router.js            Routeur hash avec paramètres
│   │   ├── forms.js              Construction/lecture de champs de formulaire
│   │   ├── modals.js              Boîtes de dialogue (confirmation…)
│   │   └── notifications.js        Bandeau de notifications / erreurs
│   └── utils/
│       ├── uuid.js
│       ├── syncMeta.js          Métadonnées de synchronisation
│       ├── dates.js
│       ├── formatting.js         Libellés d'affichage (ex. nom d'une personne)
│       ├── indexBy.js             Indexation par id, options de <select> statiques
│       ├── validation.js           Validation centralisée
│       └── errors.js                Hiérarchie d'erreurs + gestion centralisée
├── pages/                  Écrans, un module par page/route
│   ├── dashboard.js
│   ├── people.js            Liste + fiche riche (coordonnées, fonctions, profils)
│   ├── families.js           Liste + fiche riche (membres)
│   ├── groups.js              Liste + fiche riche (membres)
│   └── functions.js            Liste + formulaire (CRUD simple)
├── docs/                   Cette documentation
└── scripts/
    └── push-to-github.ps1
```

`services/` (logique + accès aux données) et `pages/` (écrans) sont
volontairement séparés : un module métier ajoute ses fichiers dans les
deux dossiers sans toucher au reste.

Seuls les fichiers réellement utilisés par la version courante sont
créés. Les autres noms de fichiers/services prévus par le cahier des
charges (`agenda.js`, `intentions.js`…) apparaîtront au fil des versions
qui en ont besoin (voir [ROADMAP.md](ROADMAP.md)) — créer des fichiers
vides à l'avance n'apporterait rien et contredirait la règle « pas de gros
fichiers monolithiques / pas de code mort ».

Écart avec la liste indicative du cahier des charges (section 4) :
`functions.js` et `groups.js` n'y figuraient pas explicitement (seuls
`people.js`/`families.js` étaient cités pour tout l'annuaire), mais
`Fonction` et `Groupe` sont des entités à part entière dans la section 6 —
leur donner un fichier dédié évite de surcharger `people.js` et respecte
mieux « un fichier par domaine métier ».

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

### Couche « Repository » générique — décision révisée en V2

En V1, avec une seule entité (`Installation`), une abstraction générique
de CRUD aurait été prématurée : seule la logique de métadonnées était
factorisée (`js/utils/syncMeta.js`). En V2, l'annuaire introduit dix
tables d'un coup (`persons`, `families`, `familyMembers`, `coordonnees`,
`functions`, `personFunctions`, `groups`, `groupMemberships`,
`volunteers`, `clergy`, `employees`) : sans factorisation, le même CRUD
(créer/lister/modifier/supprimer-doucement/restaurer) se serait dupliqué
dix fois. `js/db/repository.js` (classe `Repository`) porte donc cette
logique, désormais justifiée par un besoin réel et non plus anticipé —
c'est exactement la réévaluation attendue par le cahier des charges
(section 1 : « tu peux modifier, compléter ou réorganiser… si cela
améliore réellement le projet »). Les futures versions (V3+) réutiliseront
`Repository` pour chaque nouvelle table.

`js/ui/components.js` fournit en miroir deux composants génériques,
`ListView` et `FormView`, pour les entités dont l'écran est un CRUD
simple (ex. `Fonction`). Les entités aux écrans plus riches (`Personne`,
`Famille`, `Groupe`, qui gèrent des sous-listes liées — coordonnées,
fonctions occupées, membres) composent des pages sur mesure
(`pages/people.js`, `pages/families.js`, `pages/groups.js`) à partir des
mêmes briques bas niveau (`js/ui/forms.js` : construction/lecture de
champs, `js/ui/modals.js` : confirmation) plutôt que de forcer ce cas
dans `ListView`/`FormView` — une page riche par entité complexe reste
plus lisible qu'une abstraction générique essayant de tout couvrir.

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
