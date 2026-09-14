// Événements génériques (réunion, sortie, formation…) et participation —
// cette dernière polymorphe, partagée avec les célébrations
// (js/services/celebrations.js) : voir docs/ENTITIES.md § V3.
(function (gP) {
  'use strict';

  const evenementRepository = new gP.db.Repository('evenements', 'Événement');
  const participationRepository = new gP.db.Repository('participations', 'Participation');

  async function listParticipants(subjectType, subjectId) {
    const all = await participationRepository.list();
    return all.filter((row) => row.subjectType === subjectType && row.subjectId === subjectId);
  }

  async function addParticipant(subjectType, subjectId, personId, role = '') {
    return participationRepository.create({ subjectType, subjectId, personId, role });
  }

  async function removeParticipant(participationId) {
    return participationRepository.remove(participationId);
  }

  /** Toutes les entrées d'agenda (événements + célébrations), pour l'affichage
   * calendrier unifié. `celebrations` est passé par l'appelant pour éviter une
   * dépendance circulaire entre les deux services. */
  function mergeAgendaItems(evenements, celebrations) {
    return [
      ...evenements.map((e) => ({ ...e, subjectType: 'evenement' })),
      ...celebrations.map((c) => ({ ...c, subjectType: 'celebration' })),
    ];
  }

  Object.assign(gP.services, {
    evenementRepository,
    participationRepository,
    listParticipants,
    addParticipant,
    removeParticipant,
    mergeAgendaItems,
  });

  gP.db.registerEntity({ key: 'evenements', label: 'Événement', repository: evenementRepository, searchFields: ['title', 'description'], path: '/agenda/evenements' });
  gP.db.registerEntity({ key: 'participations', label: 'Participation', repository: participationRepository });
})(window.gP);
