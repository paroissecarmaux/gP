(function (gP) {
  'use strict';

  const celebrationRepository = new gP.db.Repository('celebrations', 'Célébration');

  const CELEBRATION_TYPES = ['Messe', 'Baptême', 'Mariage', 'Obsèques', 'Confirmation', 'Réunion liturgique', 'Autre'];
  const RECURRENCE_FREQUENCIES = ['Aucune', 'Hebdomadaire', 'Mensuelle'];

  function addInterval(date, frequency) {
    const next = new Date(date);
    if (frequency === 'Hebdomadaire') next.setDate(next.getDate() + 7);
    else if (frequency === 'Mensuelle') next.setMonth(next.getMonth() + 1);
    return next;
  }

  /** Génère les occurrences d'une célébration récurrente (section 3 :
   * pas de données fictives — chaque occurrence est un enregistrement réel,
   * indépendamment supprimable/modifiable ensuite). */
  function computeOccurrences(startAt, endAt, frequency, until) {
    if (!frequency || frequency === 'Aucune' || !until) return [{ startAt, endAt }];

    const occurrences = [];
    let start = startAt;
    let end = endAt;
    const untilDate = new Date(until);
    untilDate.setHours(23, 59, 59, 999);

    while (start <= untilDate) {
      occurrences.push({ startAt: start, endAt: end });
      start = addInterval(start, frequency);
      end = addInterval(end, frequency);
    }
    return occurrences;
  }

  function overlaps(a, b) {
    return a.startAt < b.endAt && b.startAt < a.endAt;
  }

  /**
   * Détection de conflits (section 6 : même lieu, même célébrant, sur un
   * horaire chevauchant). Calculée à la volée, jamais stockée — voir
   * docs/ENTITIES.md § V3.
   */
  function findConflictsFor(candidate, existingCelebrations) {
    return existingCelebrations.filter((other) => {
      if (other.id === candidate.id) return false;
      if (!overlaps(candidate, other)) return false;
      const sameLieu = candidate.lieuId && other.lieuId === candidate.lieuId;
      const sameCelebrant = candidate.celebrantPersonId && other.celebrantPersonId === candidate.celebrantPersonId;
      return sameLieu || sameCelebrant;
    });
  }

  function findAllConflicts(celebrations) {
    const pairs = [];
    for (let i = 0; i < celebrations.length; i++) {
      for (let j = i + 1; j < celebrations.length; j++) {
        if (findConflictsFor(celebrations[i], [celebrations[j]]).length > 0) pairs.push([celebrations[i], celebrations[j]]);
      }
    }
    return pairs;
  }

  Object.assign(gP.services, {
    celebrationRepository,
    CELEBRATION_TYPES,
    RECURRENCE_FREQUENCIES,
    computeOccurrences,
    findConflictsFor,
    findAllConflicts,
  });
})(window.gP);
