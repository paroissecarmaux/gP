(function (gP) {
  'use strict';

  const supplierRepository = new gP.db.Repository('suppliers', 'Fournisseur');
  const SUPPLIER_CATEGORIES = ['Fleuriste', 'Imprimeur', 'Entretien', 'Restauration', 'Fournitures liturgiques', 'Autre'];

  Object.assign(gP.services, { supplierRepository, SUPPLIER_CATEGORIES });

  gP.db.registerEntity({
    key: 'suppliers',
    label: 'Fournisseur',
    repository: supplierRepository,
    searchFields: ['name', 'contactName', 'category'],
    path: '/fournisseurs',
  });
})(window.gP);
