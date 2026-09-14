// Documents : référence polymorphe réelle vers l'élément concerné
// (linkedEntityType/Id), construite à partir du registre transversal
// (js/db/registry.js) — voir docs/ENTITIES.md § V9.
(function (gP) {
  'use strict';

  const documentRepository = new gP.db.Repository('documents', 'Document');
  const DOCUMENT_CATEGORIES = ['Contrat', 'Facture', 'Certificat', 'Compte-rendu', 'Photo', 'Autre'];

  function linkedEntityLabels() {
    return gP.db.listRegisteredEntities().map((e) => e.label);
  }

  Object.assign(gP.services, { documentRepository, DOCUMENT_CATEGORIES, linkedEntityLabels });

  gP.db.registerEntity({ key: 'documents', label: 'Document', repository: documentRepository, searchFields: ['title', 'category'], path: '/documents' });
})(window.gP);
