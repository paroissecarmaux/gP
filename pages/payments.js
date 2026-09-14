(function (gP) {
  'use strict';

  function intentionLabel(i) {
    return `${i.requesterName} — ${i.object ?? ''}`;
  }

  async function loadContext() {
    const intentions = await gP.services.intentionRepository.list();
    return { intentions, intentionsById: gP.utils.indexById(intentions) };
  }

  const fields = [
    { name: 'intentionId', label: 'Intention', type: 'select', required: true, options: (ctx) => ctx.intentions.map((i) => ({ value: i.id, label: intentionLabel(i) })) },
    { name: 'amount', label: 'Montant (€)', type: 'number', required: true, step: '0.01' },
    { name: 'mode', label: 'Mode de paiement', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.PAYMENT_MODES) },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  function paymentsListPage() {
    return new gP.ui.ListView({
      title: 'Paiements',
      repository: gP.services.paymentRepository,
      columns: [
        { label: 'Intention', render: (row, ctx) => intentionLabel(ctx.intentionsById.get(row.intentionId) ?? { requesterName: '?' }) },
        { label: 'Montant', render: (row) => gP.utils.formatAmount(row.amount) },
        { label: 'Mode', key: 'mode' },
        { label: 'Date', render: (row) => gP.utils.formatDate(row.date) },
      ],
      prepareContext: loadContext,
      newPath: '/intentions/paiements/new',
      editPath: (row) => `/intentions/paiements/${row.id}`,
      sort: (a, b) => new Date(b.date) - new Date(a.date),
    });
  }

  function paymentFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un paiement' : 'Nouveau paiement',
      repository: gP.services.paymentRepository,
      id: params?.id ?? null,
      fields,
      prepareContext: loadContext,
      backPath: '/intentions/paiements',
    });
  }

  Object.assign(gP.pages, { paymentsListPage, paymentFormPage });
})(window.gP);
