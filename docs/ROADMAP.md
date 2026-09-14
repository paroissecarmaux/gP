# Roadmap — gParoisse

> **Statut actuel : V1 (Fondation), V2 (Annuaire) et V3 (Territoire,
> Agenda, Célébrations) livrées.** V4 à V11 sont planifiées et modélisées
> (voir [ENTITIES.md](ENTITIES.md) / [RELATIONS.md](RELATIONS.md)) mais
> pas encore implémentées — conformément à la mission V1 du prompt
> maître : « ne développe pas immédiatement tous les modules ».

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
