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
  };

  gP.db.SCHEMA = SCHEMA;
})(window.gP);
