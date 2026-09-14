# Roadmap — gParoisse

> **Statut actuel : V1 à V11 livrées.** L'ensemble du cahier des charges
> est implémenté. Voir le détail de chaque version ci-dessous, et
> [ARCHITECTURE.md](ARCHITECTURE.md) pour les décisions techniques
> transversales et les simplifications assumées.

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
| **V3** | Secteurs / Clochers / Lieux + Agenda + Célébrations + détection de conflits | ✅ Livrée |
| **V4** | Tâches | ✅ Livrée |
| **V5** | Intentions de messe + Paiements | ✅ Livrée |
| **V6** | Secrétariat | ✅ Livrée |
| **V7** | Sacrements (registres, actes, mentions) + Certificats | ✅ Livrée |
| **V8** | Finances opérationnelles (quêtes) | ✅ Livrée |
| **V9** | Fournisseurs + Documents + Historique + Corbeille | ✅ Livrée |
| **V10** | Recherche + Sauvegarde/Export/Import + Synchronisation + KPI | ✅ Livrée |
| **V11** | Calendrier liturgique + finalisation (performance, accessibilité, responsive, tests) | ✅ Livrée |

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

## Definition of Done — V1

On peut lancer l'application (double-clic sur `index.html`, aucune
installation requise), la base est créée et versionnée, une installation
locale existe et persiste entre les redémarrages, et l'architecture est
prête à accueillir les modules métier sans être refaite.

## Révision post-V3 : site 100 % statique, zéro serveur

Après la livraison de la V3, retour explicite : aucun outil, aucun
serveur, même local et sans dépendance. L'architecture a été revue en
conséquence (voir [ARCHITECTURE.md § Scripts classiques](ARCHITECTURE.md))
— tous les modules ES convertis en scripts classiques sous un espace de
noms global (`window.gP`), `serve.js` et le lanceur Windows supprimés.
`index.html` s'ouvre désormais directement en double-clic, sans rien
installer, pas même Node.js. Le comportement d'IndexedDB en `file://`,
jusque-là supposé risqué par prudence, a été vérifié explicitement
(écriture, fermeture, réouverture, lecture) avant de retirer le serveur.

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

## V3 — Ce qui a été livré

- Entités : `Secteur`, `Clocher`, `Lieu` (rattaché à un clocher ou
  directement à un secteur), `Evenement` (générique), `Celebration`
  (liturgique, avec récurrence), `Participation` (lien polymorphe
  Événement/Célébration ↔ Personne)
- Agenda unifié (`pages/agenda.js`) : vues Jour/Semaine/Mois, filtres par
  secteur/clocher/lieu, navigation temporelle
- Récurrence des célébrations (hebdomadaire/mensuelle jusqu'à une date) :
  chaque occurrence est un enregistrement réel et indépendant
- Détection de conflits entre célébrations (même lieu ou même célébrant,
  horaire chevauchant), calculée à la volée : avertissement à la
  création/modification (jamais bloquant, jamais de correction
  automatique) + bandeau récapitulatif sur l'agenda
- Bug corrigé en cours de développement (voir historique) : le
  regroupement des événements par jour dans la grille de l'agenda
  utilisait `toISOString()` (UTC) alors que la grille elle-même est
  construite en heure locale — décalage d'un jour pour tout fuseau
  horaire différent d'UTC, détecté par les tests de bout en bout et
  corrigé avant livraison

## Definition of Done — V3

On peut organiser le territoire (secteurs/clochers/lieux), planifier des
célébrations récurrentes et des événements, voir l'agenda sous plusieurs
vues filtrables, et être averti de tout conflit d'agenda avant de
l'enregistrer quand même si besoin.

## V4 — Ce qui a été livré

- `Tache` + `AffectationTache` (une personne OU un groupe par ligne,
  jamais les deux)
- Statuts, priorités, échéance ; vues filtrées « en retard » et
  « urgentes » accessibles directement depuis la navigation

## Definition of Done — V4

On peut créer une tâche, l'affecter à une ou plusieurs personnes/groupes,
suivre son statut, et repérer d'un coup d'œil les tâches en retard ou
urgentes.

## V5 — Ce qui a été livré

- `IntentionMesse` (demandeur, objet, statut, lien optionnel vers une
  célébration) et `Paiement` (historique append-only)
- Statut de paiement dérivé (Gratuit / À payer / Partiellement payé /
  Payé), calculé à la volée à partir des paiements liés — jamais stocké

## Definition of Done — V5

On peut suivre une intention depuis la demande jusqu'à la célébration, et
savoir en un coup d'œil si elle est payée.

## V6 — Ce qui a été livré

- `DemandeSecretariat` : type, demandeur, statut, priorité, échéance,
  responsable
- Vues filtrées « ouvertes » et « en retard »

## Definition of Done — V6

Le secrétariat a une vision claire de toutes les demandes en cours et de
celles qui prennent du retard.

## V7 — Ce qui a été livré

- `RegistreSacramentel` (de vrais registres, pas un type sur l'acte) +
  `ActeSacramentel` (numéroté, avec témoins/parrain-marraine en
  multi-sélection) + `MentionSacramentelle`
- Génération de certificat depuis l'acte (aucune re-saisie), avec aperçu
  imprimable et journal des certificats déjà générés (`Certificat`)

## Definition of Done — V7

On peut enregistrer un acte sacramentel dans son registre, lui ajouter des
mentions, et générer son certificat à l'impression.

## V8 — Ce qui a été livré

- `Collecte` → `ComptageCollecte` → `RemiseCollecte`, flux séquentiel
- Statistiques simples par mois / clocher / secteur (`pages/collections.js`)

## Definition of Done — V8

On sait ce qui a été collecté, compté et remis, avec un total par période,
clocher et secteur.

## V9 — Ce qui a été livré

- `Fournisseur`, `Document` (fichier + référence polymorphe réelle vers
  l'entité concernée), `Historique` (audit transversal)
- **Repository générique enrichi** : `js/db/repository.js` journalise
  désormais automatiquement chaque création/modification/
  suppression/restauration dans `history`, pour TOUTE entité passée par
  cette couche — aucun code répété dans chaque service
- **Registre transversal** (`js/db/registry.js`) : chaque service
  s'y enregistre (`registerEntity`), ce qui rend la Corbeille et
  l'Historique valables sur toutes les entités sans liste codée en dur
- Corbeille : restauration et purge définitive (`Repository.hardDelete`,
  ajouté à cette version)

## Definition of Done — V9

Toute suppression est récupérable depuis la Corbeille tant qu'elle n'est
pas purgée définitivement, et chaque action sur une fiche est tracée dans
l'historique.

## V10 — Ce qui a été livré

- Recherche globale (`js/services/search.js`), fondée sur le même
  registre transversal
- Sauvegarde/restauration par fichier (`js/services/synchronization.js`) :
  export complet, import avec fusion automatique
- `ConflitSynchronisation` : entité persistante (un conflit non résolu
  reste identifié), écran de résolution avec 3 options (conserver ma
  version / utiliser la version importée / fusion champ par champ)
- Tableau de bord avec KPI réels et cliquables (`js/services/statistics.js`) :
  annuaire, agenda, tâches, intentions, quêtes, sacrements, secrétariat,
  synchronisation — plus une comparaison entre secteurs
- **Algorithme de fusion revu pendant les tests** (voir
  [ARCHITECTURE.md](ARCHITECTURE.md) et
  [SYNCHRONIZATION.md](SYNCHRONIZATION.md)) : comparer uniquement le
  compteur `revision` ne suffit pas à distinguer « rien changé » de
  « modifié indépendamment des deux côtés vers la même révision » — un
  scénario pourtant courant (chaque camp incrémente `revision` de 1
  depuis la dernière synchronisation). Vérifié par un test à deux
  installations simulées (deux profils navigateur isolés) avant
  livraison ; l'algorithme final compare `updatedAt` à la date du
  dernier échange avec CETTE installation précise, pas `revision` seul.

## Definition of Done — V10

Deux installations peuvent échanger un fichier de sauvegarde et fusionner
leurs données : les modifications d'un seul côté s'appliquent proprement,
celles des deux côtés créent un conflit identifié et résoluble, jamais de
perte silencieuse. Le tableau de bord reflète les données réelles.

## V11 — Ce qui a été livré

- Calendrier liturgique calculé (Pâques via l'algorithme de
  Meeus/Jones/Butcher, fêtes fixes et mobiles, temps liturgiques) +
  `ParticulariteDiocesaine` pour les fêtes locales
- Le prompt maître (section 11) place les tâches de finalisation
  (performance, accessibilité, responsive, tests, nettoyage) dans cette
  version : le nettoyage et une partie de l'accessibilité (labels de
  formulaire, `aria-*`, dialogues natifs `<dialog>`) ont été traités au
  fil de l'eau plutôt qu'en fin de projet ; voir
  [ARCHITECTURE.md § Limites connues](ARCHITECTURE.md) pour ce qui reste
  perfectible.

## Definition of Done — V11

Le calendrier liturgique de n'importe quelle année s'affiche correctement,
avec les particularités diocésaines intégrées.
