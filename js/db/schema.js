// Schéma Dexie, une entrée par version livrée. Règle absolue : une version
// déjà publiée ne se modifie jamais — toute évolution ajoute une nouvelle
// entrée (voir docs/MIGRATIONS.md). Syntaxe des tables : chaîne Dexie
// "clé primaire, index1, index2...".
(function (gP) {
  'use strict';

  const SCHEMA = {
    1: {
      // Un enregistrement par poste connu (le sien, et ceux découverts lors
      // de synchronisations futures). `originInstallationId` vaut son propre
      // `id` pour la toute première installation créée sur ce poste.
      installations: 'id, updatedAt, deletedAt, originInstallationId',
      // Réglages strictement locaux à ce poste (ex. quelle ligne de
      // `installations` représente CE poste) : jamais synchronisés, jamais
      // exportés. Pas de métadonnées de synchro ici, par nature.
      localSettings: 'key',
    },
    2: {
      // Annuaire (voir docs/ENTITIES.md § V2).
      persons: 'id, updatedAt, deletedAt, lastName',
      families: 'id, updatedAt, deletedAt, name',
      // Liaison Famille ↔ Personne, avec rôle (chef de famille, enfant…) et
      // période — plutôt qu'un tableau d'identifiants sur `families`.
      familyMembers: 'id, updatedAt, deletedAt, familyId, personId',
      // Coordonnée/adresse : entité indépendante, propriétaire polymorphe
      // (ownerType + ownerId) réutilisée par Personne et Famille.
      coordonnees: 'id, updatedAt, deletedAt, ownerType, ownerId',
      functions: 'id, updatedAt, deletedAt, name',
      personFunctions: 'id, updatedAt, deletedAt, personId, functionId',
      groups: 'id, updatedAt, deletedAt, name',
      groupMemberships: 'id, updatedAt, deletedAt, groupId, personId',
      // Extensions 1-1 de Personne. `&personId` = index unique Dexie : une
      // seule fiche bénévole/clergé/salarié par personne.
      volunteers: 'id, updatedAt, deletedAt, &personId',
      clergy: 'id, updatedAt, deletedAt, &personId',
      employees: 'id, updatedAt, deletedAt, &personId',
    },
    3: {
      // Territoire, Agenda, Célébrations (voir docs/ENTITIES.md § V3).
      sectors: 'id, updatedAt, deletedAt, name',
      clochers: 'id, updatedAt, deletedAt, name, sectorId',
      // Indépendant : rattaché à un clocher OU un secteur (les deux optionnels).
      lieux: 'id, updatedAt, deletedAt, name, clocherId, sectorId',
      // Entrée d'agenda générique (réunion, sortie…), distincte de Celebration.
      evenements: 'id, updatedAt, deletedAt, startAt, lieuId',
      celebrations: 'id, updatedAt, deletedAt, startAt, lieuId, celebrantPersonId, type',
      // Liaison polymorphe (subjectType: 'evenement' | 'celebration').
      participations: 'id, updatedAt, deletedAt, subjectType, subjectId, personId',
    },
    4: {
      // Tâches (voir docs/ENTITIES.md § V4).
      tasks: 'id, updatedAt, deletedAt, status, priority, dueDate',
      // Affectation à UNE personne OU UN groupe par ligne (jamais les deux) :
      // une tâche affectée à plusieurs personnes/groupes a plusieurs lignes.
      taskAssignments: 'id, updatedAt, deletedAt, taskId, personId, groupId',
    },
    5: {
      // Intentions de messe & paiements (voir docs/ENTITIES.md § V5).
      intentions: 'id, updatedAt, deletedAt, status, celebrationId',
      // Historique append-only par nature : jamais modifié, seulement
      // ajouté ou supprimé-doucement (jamais de suppression silencieuse).
      payments: 'id, updatedAt, deletedAt, intentionId, date',
    },
    6: {
      // Secrétariat (voir docs/ENTITIES.md § V6).
      secretariatRequests: 'id, updatedAt, deletedAt, status, priority, dueDate',
    },
    7: {
      // Sacrements & certificats (voir docs/ENTITIES.md § V7). De vrais
      // registres : les actes s'y rattachent et y sont numérotés, jamais de
      // simple booléen sur Personne.
      sacramentalRegisters: 'id, updatedAt, deletedAt, type, clocherId',
      sacramentalActs: 'id, updatedAt, deletedAt, registerId, type, personId, date',
      sacramentalNotes: 'id, updatedAt, deletedAt, actId',
      // Journal des certificats générés/imprimés — jamais de re-saisie.
      certificates: 'id, updatedAt, deletedAt, actId',
    },
    8: {
      // Quêtes (voir docs/ENTITIES.md § V8).
      collections: 'id, updatedAt, deletedAt, celebrationId, date',
      collectionCounts: 'id, updatedAt, deletedAt, collectionId',
      collectionRemittances: 'id, updatedAt, deletedAt, collectionId, date',
    },
    9: {
      // Fournisseurs, Documents, Historique (voir docs/ENTITIES.md § V9).
      suppliers: 'id, updatedAt, deletedAt, name',
      // Référence polymorphe réelle (linkedEntityType/Id), pas une
      // description libre : on doit pouvoir répondre à « quels documents
      // pour telle fiche ? » sans ambiguïté.
      documents: 'id, updatedAt, deletedAt, linkedEntityType, linkedEntityId',
      // Journal d'audit transversal, alimenté automatiquement par
      // js/db/repository.js à partir de cette version — voir
      // docs/ARCHITECTURE.md. Pas de deletedAt : un historique ne se
      // supprime jamais.
      history: 'id, entityType, entityId, occurredAt',
      // Corbeille : pas de table dédiée, vue calculée sur les entités
      // enregistrées via js/db/registry.js dont deletedAt est renseigné.
    },
    10: {
      // Synchronisation (voir docs/ENTITIES.md § V10 et SYNCHRONIZATION.md).
      syncLog: 'id, updatedAt, deletedAt, occurredAt',
      // Un conflit non résolu doit rester identifié : entité à part
      // entière, pas une alerte éphémère.
      syncConflicts: 'id, updatedAt, deletedAt, entityType, entityId, resolvedAt',
    },
    11: {
      // Calendrier liturgique (voir docs/ENTITIES.md § V11). Les fêtes
      // fixes/mobiles du calendrier romain sont calculées, pas stockées :
      // seules les particularités diocésaines le sont.
      diocesanFeasts: 'id, updatedAt, deletedAt, month, day',
    },
  };

  gP.db.SCHEMA = SCHEMA;
})(window.gP);
