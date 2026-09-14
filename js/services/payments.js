(function (gP) {
  'use strict';

  const paymentRepository = new gP.db.Repository('payments', 'Paiement');
  const PAYMENT_MODES = ['Espèces', 'Chèque', 'Carte bancaire', 'Virement'];

  Object.assign(gP.services, { paymentRepository, PAYMENT_MODES });

  gP.db.registerEntity({ key: 'payments', label: 'Paiement', repository: paymentRepository, path: '/intentions/paiements' });
})(window.gP);
