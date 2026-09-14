# Catalogue des entités — gParoisse

Ce document liste **toutes** les entités prévues par le cahier des charges
(section 6), au-delà de la V1, pour que chaque version future s'appuie sur
un modèle déjà pensé plutôt que de l'improviser au fil de l'eau (mission
V1, étapes 1 à 9 : analyser avant de coder). Seule `Installation` est
implémentée à ce stade — voir [ROADMAP.md](ROADMAP.md) pour le calendrier.

Sauf mention contraire, chaque entité porte les métadonnées standard
(`id`, `createdAt`, `updatedAt`, `deletedAt`, `originInstallationId`,
`revision` — voir [DATABASE.md](DATABASE.md)), omises ci-dessous pour la
lisibilité.

Les ajustements par rapport à la liste brute du cahier des charges sont
justifiés en note : le prompt maître autorise et attend cette réflexion
(section 1 et section 6 : « Tu peux ajuster les noms et le découpage si
une meilleure modélisation est identifiée »).

---

## V1 — Fondation ✅

### Installation
Un poste connu (le sien, et ceux découverts par synchronisation).
- `name`

---

## V2 — Annuaire

### Personne
- `civility`, `firstName`, `lastName`, `birthDate`, `deathDate`, `notes`

### Famille
- `name`, `headPersonId` (référence Personne)

> Le lien famille ↔ membres passe par une entité de liaison dédiée
> (`ParticipationFamille` ou équivalent), plutôt qu'un tableau
> d'identifiants sur `Famille` : cohérent avec le traitement de
> `Groupe`/`ParticipationGroupe` ci-dessous, et permet d'attacher un rôle
> (« enfant », « conjoint »…) et une période à l'appartenance.

### Coordonnee (Coordonnée / Adresse)
Entité indépendante plutôt que des champs dupliqués sur `Personne` et
`Famille` : une personne peut avoir plusieurs adresses (domicile,
travail), une famille une adresse commune, et l'entité sera réutilisable
pour `Lieu` si besoin.
- `ownerType` (`personne` | `famille`), `ownerId`, `label`,
  `street`, `postalCode`, `city`, `country`, `phone`, `email`,
  `isPrimary`

### Fonction
Table de référence (Curé, Trésorier, Catéchiste…).
- `name`, `description`

### AffectationFonction
Assignation d'une `Fonction` à une `Personne`, avec période — plutôt
qu'un simple tableau sur `Personne`, pour dater les prises et fins de
fonction (utile pour l'historique et les statistiques).
- `personId`, `functionId`, `startDate`, `endDate`

### Groupe
- `name`, `description`

### ParticipationGroupe
- `groupId`, `personId`, `role`, `joinedDate`, `leftDate`

### Benevole
Extension 1-1 de `Personne`, seulement pour les personnes concernées
(plutôt qu'un booléen + champs nullable sur `Personne`) : garde
`Personne` léger et permet de lister directement « tous les bénévoles ».
- `personId` (unique), `skills`, `availability`, `notes`

### Clerge
Extension 1-1 de `Personne`.
- `personId` (unique), `title` (Curé, Vicaire, Diacre…),
  `ordinationDate`, `assignment`

### Salarie
Extension 1-1 de `Personne`.
- `personId` (unique), `position`, `contractType`, `startDate`, `endDate`

---

## V3 — Territoire, Agenda, Célébrations

### Secteur
- `name`

### Clocher
- `name`, `sectorId`

### Lieu
Indépendant : peut être rattaché à un `Clocher` **ou** directement à un
`Secteur` (règle explicite du cahier des charges), les deux étant
optionnels.
- `name`, `clocherId` (optionnel), `sectorId` (optionnel), `address`

### Evenement
Entrée d'agenda générique (réunion, sortie, formation…).
- `title`, `type`, `startAt`, `endAt`, `lieuId`, `description`

### Celebration
Entité distincte d'`Evenement` (et non un simple type) : une célébration
liturgique porte des champs propres (célébrant, récurrence) que les
autres événements n'ont pas. Les deux apparaissent sur l'agenda.
- `title`, `type` (Messe, Baptême, Mariage, Obsèques…), `startAt`,
  `endAt`, `lieuId`, `celebrantPersonId`, `recurrenceRule`

### Participation
Liaison polymorphe, réutilisée pour `Evenement` et `Celebration` plutôt
que deux tables quasi identiques.
- `subjectType` (`evenement` | `celebration`), `subjectId`, `personId`,
  `role`

> **Détection de conflits d'agenda** (même lieu, même personne, même
> célébrant sur un horaire chevauchant) : calculée à la volée à partir de
> `Celebration`/`Evenement`/`Participation`, pas stockée.

---

## V4 — Tâches

### Tache
- `title`, `description`, `status` (À faire/En cours/Terminé/Annulé),
  `priority` (Normale/Importante/Urgente), `dueDate`,
  `linkedSubjectType`, `linkedSubjectId` (événement/célébration liée,
  optionnel)

### AffectationTache
Une ou plusieurs personnes/groupes par tâche.
- `taskId`, `personId` (optionnel), `groupId` (optionnel), `role`

---

## V5 — Intentions de messe & Paiements

### IntentionMesse
- `requesterPersonId` (optionnel), `requesterName`, `object`, `status`
  (Demandée/À planifier/Planifiée/Célébrée/Annulée), `celebrationId`
  (optionnel), `amountRequested`

### Paiement
Historique append-only (jamais de suppression silencieuse : suppression
douce uniquement, comme toute entité).
- `intentionId`, `amount`, `mode`, `date`, `notes`

---

## V6 — Secrétariat

### DemandeSecretariat
- `type` (certificat, baptême, mariage, administrative…),
  `requesterPersonId`, `status`, `priority`, `dueDate`,
  `assigneePersonId`

---

## V7 — Sacrements & Certificats

### RegistreSacramentel
Un vrai registre (au sens propre du terme paroissial), pas un simple
type sur l'acte : les actes s'y rattachent et y sont numérotés.
- `type` (Baptême, Mariage, Confirmation, Obsèques, Ordination),
  `label`, `clocherId` (optionnel), `openedAt`, `closedAt` (optionnel)

### ActeSacramentel
- `registerId`, `actNumber` (numéro dans le registre), `personId`,
  `date`, `lieuId`, `celebrantPersonId`, `witnessPersonIds`, `details`
  (texte libre pour les particularités propres au type d'acte)

### MentionSacramentelle
Mention marginale, avec lien optionnel vers un autre acte (ex. mention
de mariage sur un acte de baptême).
- `actId`, `date`, `text`, `relatedActId` (optionnel)

### Certificat
Journal des certificats générés/imprimés pour un acte (pas de re-saisie :
un certificat se génère depuis l'acte).
- `actId`, `generatedAt`, `generatedByInstallationId`

---

## V8 — Quêtes (finances opérationnelles)

### Collecte
- `celebrationId`, `date`, `lieuId`

### ComptageCollecte
- `collectionId`, `counterPersonIds`, `cashAmount`, `checkAmount`,
  `countedAt`

### RemiseCollecte
- `collectionId`, `date`, `depositedByPersonId`, `amount`

---

## V9 — Fournisseurs, Documents, Historique, Corbeille

### Fournisseur
- `name`, `category`, `contactName`, `phone`, `email`, `address`, `notes`

### Document
Référence polymorphe réelle (et non une simple description libre) vers
l'élément concerné, pour pouvoir répondre à « quels documents pour telle
fiche ? » sans ambiguïté.
- `title`, `category`, `linkedEntityType`, `linkedEntityId`, `fileBlob`,
  `fileName`, `fileMimeType`, `notes`

### Historique
Journal d'audit transversal, alimenté automatiquement à chaque
création/modification/suppression/restauration d'une entité importante.
- `entityType`, `entityId`, `action`, `occurredAt`, `installationId`,
  `summary`

### Corbeille
N'est **pas** une table dédiée : vue transversale des enregistrements
dont `deletedAt` est renseigné, construite à partir d'un registre des
entités synchronisables (chaque service s'y enregistre). Restauration =
remettre `deletedAt` à `null` (`touch()`).

---

## V10 — Recherche, Sauvegarde, Synchronisation, KPI

### Synchronisation
Journal des exports/imports (résumé après fusion : ajouts, modifications,
suppressions, conflits — section 7 du cahier des charges).
- `type` (export/import), `summary`, `stats` (compteurs), `occurredAt`

### ConflitSynchronisation
Un conflit non résolu doit **rester identifié** (exigence explicite) :
entité à part entière, pas une alerte éphémère.
- `entityType`, `entityId`, `localSnapshot`, `incomingSnapshot`,
  `detectedAt`, `resolvedAt` (optionnel), `resolution` (optionnel :
  `local` | `incoming` | `merged`)

Voir [SYNCHRONIZATION.md](SYNCHRONIZATION.md) pour la logique de fusion et
de résolution.

---

## V11 — Calendrier liturgique

### ParticularariteDiocesaine
Fête ou règle propre au diocèse, en complément du calendrier romain
calculé (Pâques et fêtes mobiles/fixes ne sont pas stockées, seulement
calculées).
- `name`, `month`, `day`, `description`
