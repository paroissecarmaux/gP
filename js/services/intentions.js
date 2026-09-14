(function (gP) {
  'use strict';

  const intentionRepository = new gP.db.Repository('intentions', 'Intention de messe');

  const STATUSES = ['Demandée', 'À planifier', 'Planifiée', 'Célébrée', 'Annulée'];

  /** Statut de paiement dérivé (jamais stocké) à partir des paiements liés. */
  function paymentStatus(intention, payments) {
    if (!intention.amountRequested) return 'Gratuit';
    const paid = payments.filter((p) => p.intentionId === intention.id).reduce((sum, p) => sum + (p.amount ?? 0), 0);
    if (paid <= 0) return 'À payer';
    if (paid < intention.amountRequested) return 'Partiellement payé';
    return 'Payé';
  }

  Object.assign(gP.services, { intentionRepository, INTENTION_STATUSES: STATUSES, intentionPaymentStatus: paymentStatus });

  gP.db.registerEntity({
    key: 'intentions',
    label: 'Intention de messe',
    repository: intentionRepository,
    searchFields: ['requesterName', 'object'],
    path: '/intentions',
  });
})(window.gP);
