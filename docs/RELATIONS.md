# Relations entre entités — gParoisse

Complète [ENTITIES.md](ENTITIES.md). Les diagrammes ci-dessous couvrent le
modèle **prévu** sur l'ensemble des versions (voir [ROADMAP.md](ROADMAP.md)
pour ce qui est réellement implémenté à un instant donné).

## Territoire

```mermaid
erDiagram
    SECTEUR ||--o{ CLOCHER : contient
    SECTEUR ||--o{ LIEU : "peut rattacher directement"
    CLOCHER ||--o{ LIEU : "peut rattacher"
```

Un `Lieu` est indépendant : il référence `clocherId` **ou** `sectorId`
(les deux optionnels), jamais les deux à la fois en usage normal.

## Personnes & organisation

```mermaid
erDiagram
    PERSONNE ||--o{ COORDONNEE : possède
    FAMILLE ||--o{ COORDONNEE : possède
    FAMILLE ||--o{ PARTICIPATION_FAMILLE : "compose (membres)"
    PERSONNE ||--o{ PARTICIPATION_FAMILLE : "appartient à"
    PERSONNE ||--o{ AFFECTATION_FONCTION : occupe
    FONCTION ||--o{ AFFECTATION_FONCTION : "assignée via"
    PERSONNE ||--o{ PARTICIPATION_GROUPE : participe
    GROUPE ||--o{ PARTICIPATION_GROUPE : compte
    PERSONNE ||--o| BENEVOLE : "peut être"
    PERSONNE ||--o| CLERGE : "peut être"
    PERSONNE ||--o| SALARIE : "peut être"
```

`Benevole`/`Clerge`/`Salarie` sont des extensions 1-1 optionnelles de
`Personne` (une personne peut cumuler plusieurs de ces profils — un
diacre peut aussi être salarié).

## Agenda & célébrations

```mermaid
erDiagram
    LIEU ||--o{ EVENEMENT : accueille
    LIEU ||--o{ CELEBRATION : accueille
    PERSONNE ||--o{ CELEBRATION : célèbre
    EVENEMENT ||--o{ PARTICIPATION : "réunit (via lien polymorphe)"
    CELEBRATION ||--o{ PARTICIPATION : "réunit (via lien polymorphe)"
    PERSONNE ||--o{ PARTICIPATION : participe
```

`Participation` est polymorphe (`subjectType` + `subjectId`) pour éviter
deux tables quasi identiques (`ParticipationEvenement` /
`ParticipationCelebration`).

## Tâches

```mermaid
erDiagram
    TACHE ||--o{ AFFECTATION_TACHE : assignée
    PERSONNE ||--o{ AFFECTATION_TACHE : "peut être assignée"
    GROUPE ||--o{ AFFECTATION_TACHE : "peut être assigné"
    EVENEMENT ||--o{ TACHE : "peut être liée à"
    CELEBRATION ||--o{ TACHE : "peut être liée à"
```

## Intentions & quêtes

```mermaid
erDiagram
    PERSONNE ||--o{ INTENTION_MESSE : demande
    CELEBRATION ||--o{ INTENTION_MESSE : "peut planifier"
    INTENTION_MESSE ||--o{ PAIEMENT : reçoit
    CELEBRATION ||--o{ COLLECTE : génère
    COLLECTE ||--o{ COMPTAGE_COLLECTE : "compte (un ou plusieurs)"
    COLLECTE ||--o{ REMISE_COLLECTE : "remise (une ou plusieurs)"
```

## Sacrements

```mermaid
erDiagram
    REGISTRE_SACRAMENTEL ||--o{ ACTE_SACRAMENTEL : contient
    PERSONNE ||--o{ ACTE_SACRAMENTEL : concerne
    PERSONNE ||--o{ ACTE_SACRAMENTEL : célèbre
    LIEU ||--o{ ACTE_SACRAMENTEL : accueille
    ACTE_SACRAMENTEL ||--o{ MENTION_SACRAMENTELLE : reçoit
    ACTE_SACRAMENTEL ||--o{ CERTIFICAT : génère
    ACTE_SACRAMENTEL ||--o{ MENTION_SACRAMENTELLE : "référence (mention croisée)"
```

## Secrétariat, fournisseurs, documents, historique

```mermaid
erDiagram
    PERSONNE ||--o{ DEMANDE_SECRETARIAT : demande
    PERSONNE ||--o{ DEMANDE_SECRETARIAT : "traite (responsable)"
    DOCUMENT }o--|| "(toute entité)" : "lié via linkedEntityType/Id"
    HISTORIQUE }o--|| "(toute entité)" : "journalise via entityType/Id"
```

`Document` et `Historique` référencent une entité quelconque par
`(entityType, entityId)` plutôt que par une clé étrangère typée par
table : c'est un lien polymorphe volontaire, seule façon d'attacher un
document ou de journaliser une action sur n'importe quel type
d'enregistrement sans dupliquer le mécanisme pour chaque entité.

## Synchronisation

```mermaid
erDiagram
    INSTALLATION ||--o{ "(toute entité synchronisable)" : "origine (originInstallationId)"
    "(toute entité synchronisable)" ||--o{ CONFLIT_SYNCHRONISATION : "peut déclencher"
    SYNCHRONISATION ||--o{ CONFLIT_SYNCHRONISATION : détecte
```

Voir [SYNCHRONIZATION.md](SYNCHRONIZATION.md) pour la logique de fusion.

## Corbeille

Pas d'entité ni de relation propre : une vue calculée sur toute entité
dont `deletedAt` n'est pas `null`, via le registre des entités
synchronisables (mis en place en V9).
