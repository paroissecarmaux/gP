# Synchronisation entre installations — gParoisse

Conception de la synchronisation entre installations locales
indépendantes (section 7 du cahier des charges). **Implémentation prévue
en V10** — ce document fixe le design maintenant pour que les métadonnées
posées dès la V1 (`id`, `updatedAt`, `deletedAt`, `originInstallationId`,
`revision`) soient directement exploitables le moment venu, sans
remaniement du modèle de données.

## Principe général

Pas de serveur central : la synchronisation se fait par **échange de
fichier** (paquet de synchronisation), transmis par clé USB, dossier
partagé ou email — cohérent avec « sans backend, sans serveur, sans
cloud ». Chaque poste peut exporter l'état de sa base (ou les
modifications depuis la dernière synchronisation) et l'importer sur un
autre poste pour fusionner.

## Contenu d'un paquet de synchronisation

- En-tête : `originInstallationId` de l'émetteur, date de génération,
  version de schéma, somme de contrôle.
- Pour chaque table synchronisable (tout sauf `localSettings`, local par
  nature) : la liste des enregistrements, avec leurs métadonnées
  complètes.

Un paquet dont la version de schéma est incompatible (plus récente que
l'installation qui importe) ou dont la somme de contrôle ne correspond
pas au contenu est **refusé** avant toute écriture en base — exigence
explicite (« refuser les paquets incompatibles ou corrompus »).

## Algorithme de fusion

Pour chaque enregistrement du paquet importé, comparé à l'enregistrement
local de même `id` (s'il existe) :

| Cas | Condition | Action |
|-----|-----------|--------|
| 1. Absent localement | pas de ligne locale avec cet `id` | Insertion directe |
| 2. Identique des deux côtés | même `revision` **et** mêmes champs | Aucune action |
| 3. Modifié d'un seul côté | `revision` importée > `revision` locale, **et** la ligne locale n'a pas changé depuis la dernière synchronisation connue avec cette installation | Intégrer la version importée |
| 4. Modifié des deux côtés | `revision` a progressé localement **et** dans le paquet depuis la dernière synchronisation commune | Créer un `ConflitSynchronisation` (voir [ENTITIES.md](ENTITIES.md)) |

La suppression douce (`deletedAt`) est un cas particulier de
« modification » : elle se fusionne avec les mêmes règles, jamais par
réapparition silencieuse d'une donnée supprimée d'un côté (exigence
explicite du cahier des charges).

## Résolution des conflits

Chaque `ConflitSynchronisation` conserve les deux versions
(`localSnapshot`, `incomingSnapshot`) et reste visible tant qu'il n'est
pas résolu. L'écran de résolution (prévu en V10) propose, champ par champ
quand c'est pertinent :

- **Conserver ma version** — la version locale l'emporte, `revision`
  incrémentée pour dominer lors d'une prochaine synchronisation.
- **Utiliser la version importée** — remplace la version locale.
- **Fusionner champ par champ** — pour les cas où les deux modifications
  portent sur des champs différents du même enregistrement (ex. l'un a
  changé le téléphone, l'autre l'adresse).

Un conflit non résolu **reste identifié** (jamais résolu automatiquement
par défaut) et apparaît dans un compteur visible du tableau de bord
(section 8 du cahier des charges : KPI « conflits non résolus »).

## Contrôles d'intégrité

- **Avant fusion** : validation du paquet (schéma compatible, somme de
  contrôle, absence de champs obligatoires manquants).
- **Après fusion** : vérification des références (ex. une `Célébration`
  importée dont le `lieuId` ne correspond à aucun `Lieu` connu après
  fusion) — signalée, jamais corrigée silencieusement.

## Résumé post-synchronisation

Chaque synchronisation affiche un résumé (ajouts, modifications,
suppressions, conflits) et journalise une entrée `Synchronisation`
(type, résumé, compteurs, date) consultable dans un historique dédié —
distinct de l'historique transversal des entités métier
(`Historique`, V9).

## Ce qui reste hors périmètre

- Pas de synchronisation temps réel ni de connexion réseau entre postes :
  le paquet est toujours un fichier explicite, échangé consciemment par
  un utilisateur. C'est un choix assumé, cohérent avec « sans serveur,
  sans cloud », pas une limitation technique contournable.
