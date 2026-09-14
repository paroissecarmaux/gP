// Coordonnées / adresses, entité indépendante à propriétaire polymorphe
// (« personne » ou « famille ») — voir docs/ENTITIES.md.
(function (gP) {
  'use strict';

  const coordonneeRepository = new gP.db.Repository('coordonnees', 'Coordonnée');

  async function listForOwner(ownerType, ownerId) {
    const all = await coordonneeRepository.list();
    return all.filter((row) => row.ownerType === ownerType && row.ownerId === ownerId);
  }

  async function addCoordonnee(ownerType, ownerId, fields) {
    return coordonneeRepository.create({ ownerType, ownerId, isPrimary: false, ...fields });
  }

  Object.assign(gP.services, { coordonneeRepository, listForOwner, addCoordonnee });

  gP.db.registerEntity({ key: 'coordonnees', label: 'Coordonnée', repository: coordonneeRepository });
})(window.gP);
