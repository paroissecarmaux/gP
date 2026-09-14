# Architecture — gParoisse

Application 100 % locale et 100 % statique : HTML, CSS et JavaScript
vanilla, IndexedDB via Dexie.js. Pas de backend, pas de build, pas de
framework SPA, **pas de serveur du tout** — `index.html` s'ouvre en
double-clic (`file://`), sans rien installer, pas même Node.js. Voir
« Décisions architecturales » ci-dessous pour la justification de chaque
choix qui s'écarte d'une lecture strictement littérale du cahier des
charges.

## Structure des dossiers

```
/
├── index.html            Point d'entrée. Double-clic pour lancer l'app.
├── favicon.svg
├── css/
│   ├── app.css             Réinitialisation, mise en page, structure
│   ├── components.css       Styles des composants (cartes, notifications…)
│   └── responsive.css        Media queries
├── js/
│   ├── app.js               Bootstrap : DB, installation, routeur, coquille
│   ├── vendor/
│   │   └── dexie.js          Dexie 4.4.6, build UMD, copie locale (voir plus bas)
│   ├── db/
│   │   ├── database.js       Instance Dexie + ouverture
│   │   ├── schema.js          Définition des tables, une entrée par version
│   │   ├── migrations.js       Application des versions à l'instance Dexie
│   │   ├── repository.js        CRUD générique + métadonnées + historique (depuis V2/V9)
│   │   └── registry.js           Registre transversal des entités (depuis V9)
│   ├── services/             Logique métier, un fichier par domaine
│   │   ├── installation.js
│   │   ├── history.js          Historique transversal (V9)
│   │   ├── people.js            Personne + profils bénévole/clergé/salarié
│   │   ├── families.js           Famille + membres
│   │   ├── functions.js           Fonction + affectations
│   │   ├── groups.js               Groupe + participations
│   │   ├── contacts.js              Coordonnée (partagée Personne/Famille)
│   │   ├── territory.js              Secteur + Clocher + Lieu
│   │   ├── agenda.js                  Événement + Participation (polymorphe)
│   │   ├── celebrations.js             Célébration + récurrence + conflits
│   │   ├── tasks.js                     Tâche + affectations (V4)
│   │   ├── intentions.js                 Intention de messe (V5)
│   │   ├── payments.js                    Paiement (V5)
│   │   ├── secretariat.js                  Demande secrétariat (V6)
│   │   ├── sacraments.js                    Registre + Acte + Mention (V7)
│   │   ├── certificates.js                   Journal des certificats (V7)
│   │   ├── collections.js                     Collecte/Comptage/Remise (V8)
│   │   ├── suppliers.js                        Fournisseur (V9)
│   │   ├── documents.js                         Document (V9)
│   │   ├── trash.js                              Corbeille (V9)
│   │   ├── search.js                              Recherche globale (V10)
│   │   ├── synchronization.js                      Sauvegarde/fusion/conflits (V10)
│   │   ├── statistics.js                            KPI du tableau de bord (V10)
│   │   └── liturgy.js                                Calendrier liturgique (V11)
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
├── pages/                  Écrans, un module par page/route (un fichier par
│                           domaine, miroir de services/)
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

### Scripts classiques + espace de noms global, zéro serveur — décision révisée

**Version initiale de la V1** : le code utilisait les modules ES natifs
(`import`/`export`, `<script type="module">`), et un petit serveur de
fichiers local (`serve.js`, Node sans dépendance) était fourni pour
contourner deux limites : les modules ES sont bloqués par la politique
CORS des navigateurs en `file://`, et le comportement d'IndexedDB en
`file://` avait *a priori* semblé risqué à valider sans test — jugement
prudent mais pas vérifié, sur un point pourtant central vu que
l'intégrité des données est la priorité n°1 du projet.

**Retour explicite de l'utilisateur** : aucun outil, aucun serveur, même
local et sans dépendance — un site strictement statique, ouvert en
double-clic sur `index.html`. Deux changements en conséquence :

1. **Tous les modules ES ont été convertis en scripts classiques.** Plus
   d'`import`/`export` : chaque fichier s'enregistre dans un espace de
   noms global unique, `window.gP` (`{ utils, db, services, ui, pages }`),
   initialisé une fois en tête d'`index.html` puis rempli par chaque
   `<script>` chargé dans l'ordre de ses dépendances (utils → db →
   services → ui → pages → `app.js`). Un fichier lit les dépendances
   d'un autre bucket directement (`gP.services.personRepository`) plutôt
   que par un `import` — la seule contrainte est l'ordre de chargement
   des `<script>`, documenté et fixe dans `index.html`.
2. **`serve.js` et le lanceur Windows ont été supprimés.** Avant de les
   retirer, le comportement d'IndexedDB en `file://` a été vérifié
   directement (ouverture de base, écriture, fermeture, réouverture,
   lecture — cycle complet, avec Chromium) plutôt que supposé risqué :
   il fonctionne correctement. Le risque théorique initial ne se
   confirmait pas en pratique pour cet usage (un seul fichier, un seul
   profil navigateur, pas de scénario multi-origine) ; il n'y avait donc
   plus de raison de maintenir un serveur pour s'en prémunir.

Pas de collision de noms entre fichiers d'un même bucket à surveiller :
chaque export (dépôt, fonction, classe) porte un nom unique dans tout le
projet — vérifié explicitement lors de la conversion (deux paires de noms
génériques, `listMembersOf`/`addMember`/`removeMember` dans
`families.js` et `groups.js`, ont dû être préfixées, `familiesXxx` /
`groupsXxx`, pour éviter que l'un écrase l'autre).

### Dexie.js vendue en local

`js/vendor/dexie.js` est une copie locale du build **UMD** de Dexie 4.4.6
(et non le build ESM d'origine, incompatible avec les scripts classiques) :
chargé en `<script src="js/vendor/dexie.js">`, il expose `Dexie` comme
variable globale, utilisée par `js/db/database.js`. Cohérent avec « 100 %
locale » et « utilisable hors connexion » dès le premier lancement, sans
dépendre d'une disponibilité réseau — y compris pour charger une simple
bibliothèque JS.

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

### Conflits d'agenda et récurrence — calculés, jamais stockés

`js/services/celebrations.js` calcule les conflits (même lieu ou même
célébrant, horaire chevauchant) à la volée à partir des célébrations
existantes, et ne les persiste nulle part : un conflit est un état dérivé
qui change dès qu'une célébration bouge, le stocker créerait une source de
vérité à resynchroniser en permanence. Une célébration récurrente
(hebdomadaire/mensuelle) génère immédiatement une occurrence par date
(section 3 : « pas de données fictives ») — chacune est un enregistrement
indépendant, modifiable ou supprimable seule, plutôt qu'une règle de
récurrence interprétée à l'affichage : plus simple, et cohérent avec la
suppression douce (annuler UNE occurrence a un sens ; annuler une portion
d'une règle abstraite, beaucoup moins).

### Registre transversal + historique automatique — V9

`js/db/registry.js` introduit `registerEntity({ key, label, repository,
searchFields, path })` : chaque service s'y enregistre à son chargement.
La Corbeille (`pages/trash.js`), la Recherche globale
(`js/services/search.js`) et, plus tard, tout écran transversal
s'appuient sur ce registre plutôt que sur une liste d'entités codée en
dur — ajouter une entité à une future version la rend automatiquement
visible dans la Corbeille et la Recherche, sans toucher à ces pages.

Dans le même esprit, `js/db/repository.js` a été enrichi pour journaliser
automatiquement (`js/services/history.js`) chaque
création/modification/suppression/restauration, pour **toute** entité
passée par `Repository` — y compris celles des versions précédentes
(V2/V3), sans modification de leur code. `Repository.hardDelete()` (purge
définitive, réservée à la Corbeille) a été ajouté à cette version.

### Piège de fuseau horaire dans le regroupement par jour

Détecté par les tests de bout en bout pendant le développement de la V3,
corrigé avant livraison : la grille de l'agenda (`pages/agenda.js`)
construit ses cellules en heure **locale** (`Date.setDate`/`getDate`),
mais la fonction de regroupement des événements par jour utilisait
`toISOString()` (heure **UTC**) pour produire la même clé. Pour tout
fuseau horaire différent d'UTC, minuit local ne tombe pas sur le même jour
calendaire en UTC (ex. minuit le 21/09 en UTC+2 = 22h le 20/09 en UTC) :
les événements apparaissaient donc décalés d'un jour. Correction :
`dateKey()` construit désormais sa clé à partir des mêmes méthodes
locales que la grille (`getFullYear`/`getMonth`/`getDate`), jamais de
`toISOString()` pour un regroupement calendaire. Point de vigilance à
garder pour toute future fonctionnalité manipulant des dates par « jour »
plutôt que par instant précis.

### Fusion par `revision` seule : insuffisant — algorithme revu en V10

Conçu initialement autour du compteur `revision` (« révision entrante
supérieure → intégrer »), l'algorithme de fusion
(`js/services/synchronization.js`) a été testé avec deux installations
simulées (deux contextes de navigateur isolés, deux bases IndexedDB
distinctes) échangeant de vrais fichiers de sauvegarde — et non en se
fiant au seul raisonnement. Le test a révélé un cas faux-négatif réel :
si les deux côtés éditent indépendamment le même enregistrement depuis le
dernier échange, chacun incrémente `revision` de 1 → les deux arrivent à
la **même** révision avec un contenu **différent**. Comparer uniquement
`revision` classait alors ce cas en « rien à faire », faisant disparaître
silencieusement la modification d'un des deux côtés — exactement ce que
la section 7 du cahier des charges interdit.

Algorithme corrigé : la décision compare `updatedAt` de chaque côté à la
date du dernier échange avec **cette installation précise**
(`localSettings` clé `lastSyncWith:<installationId>`), pas `revision`.
Revérifié par le même test (fusion propre quand un seul côté a changé,
conflit détecté quand les deux ont changé différemment, silencieux quand
les deux ont changé vers un résultat identique) avant d'être considéré
fiable.

### Piège JavaScript : `event.currentTarget` après un `await`

Trouvé par le même test de synchronisation (erreur console en conditions
réelles, pas en relecture de code) : `SyncPage.handleImport()`
(`pages/synchronization.js`) lisait `event.currentTarget` dans un bloc
`finally`, **après** un `await`. Or `Event.currentTarget` redevient
`null` une fois la phase de dispatch de l'événement terminée — ce qui
arrive dès qu'un gestionnaire d'événement `async` franchit son premier
`await` et rend la main à la boucle d'événements. Corrigé en capturant
l'élément dans une variable locale **avant** le premier `await`, seul
moment où `event.currentTarget` est garanti non nul. Le reste du code
base suit déjà cette règle (`const form = event.currentTarget;` en toute
première ligne des gestionnaires) ; seul cet endroit y dérogeait.

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

La navigation V1 était volontairement minimale (un seul module : le
tableau de bord), conformément à la mission V1 du cahier des charges ;
elle s'est étoffée au fil des versions, chacune ajoutant ses entrées sans
toucher au routeur lui-même.

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

## Modèle de données

Catalogue complet des entités et leurs relations : [ENTITIES.md](ENTITIES.md)
et [RELATIONS.md](RELATIONS.md).

## Synchronisation entre installations

Conception et algorithme de fusion implémenté : voir
[SYNCHRONIZATION.md](SYNCHRONIZATION.md).

## Limites connues

Assumées consciemment pour tenir l'ensemble V1-V11 dans une base de code
cohérente ; à réévaluer si l'usage réel le justifie.

- **Pas de suite de tests automatisés committée.** Chaque version a été
  vérifiée par des scripts Playwright ad hoc pendant le développement
  (créer des enregistrements réels, vérifier l'absence d'erreur console,
  et pour la synchronisation, deux installations simulées échangeant de
  vrais fichiers) — cette méthode a trouvé de vrais bugs (fuseau horaire
  en V3, `event.currentTarget` et l'algorithme de fusion en V10) que la
  seule relecture de code n'aurait probablement pas révélés. Mais ces
  scripts n'ont pas été conservés dans le dépôt comme suite régressive :
  toute évolution future devrait s'appuyer sur un test manuel similaire,
  ou en constituer une suite durable si le projet grandit.
- **Accessibilité de base, pas auditée formellement.** Labels de
  formulaire associés, `aria-required`/`aria-describedby`/`aria-invalid`
  sur les champs, dialogues natifs `<dialog>` (focus géré par le
  navigateur), focus visible (`:focus-visible`). Pas de test au lecteur
  d'écran, pas d'audit WCAG.
- **Performance non profilée.** Les listes utilisent `Array.filter` en
  mémoire plutôt que des requêtes Dexie indexées pour la plupart des
  filtres (ex. tâches en retard, demandes ouvertes) : largement suffisant
  pour les volumes d'une paroisse, mais à revisiter si une table dépasse
  plusieurs dizaines de milliers de lignes.
- **Calendrier liturgique approché** (voir `js/services/liturgy.js`) :
  Épiphanie fixée au 6 janvier plutôt que reportée au dimanche selon les
  usages locaux — à corriger via les particularités diocésaines si besoin.
- **Synchronisation par fichier, pas par réseau** : choix assumé (voir
  [SYNCHRONIZATION.md](SYNCHRONIZATION.md)), pas une limitation à lever.
