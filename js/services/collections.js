// Quêtes : Collecte → Comptage → Remise, un flux séquentiel, regroupé dans
// un seul fichier (voir docs/ENTITIES.md § V8).
(function (gP) {
  'use strict';

  const collectionRepository = new gP.db.Repository('collections', 'Collecte');
  const countRepository = new gP.db.Repository('collectionCounts', 'Comptage de collecte');
  const remittanceRepository = new gP.db.Repository('collectionRemittances', 'Remise de collecte');

  function collectionLabel(collection, lieuxById) {
    const date = gP.utils.formatDate(collection.date) || '?';
    const lieu = lieuxById.get(collection.lieuId)?.name;
    return `${date}${lieu ? ` — ${lieu}` : ''}`;
  }

  Object.assign(gP.services, { collectionRepository, countRepository, remittanceRepository, collectionLabel });

  gP.db.registerEntity({ key: 'collections', label: 'Collecte', repository: collectionRepository, path: '/quetes/collectes' });
  gP.db.registerEntity({ key: 'collectionCounts', label: 'Comptage', repository: countRepository, path: '/quetes/comptages' });
  gP.db.registerEntity({ key: 'collectionRemittances', label: 'Remise', repository: remittanceRepository, path: '/quetes/remises' });
})(window.gP);
