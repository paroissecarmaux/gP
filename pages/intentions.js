(function (gP) {
  'use strict';

  async function loadContext() {
    const [persons, celebrations, payments] = await Promise.all([
      gP.services.personRepository.list(),
      gP.services.celebrationRepository.list(),
      gP.services.paymentRepository.list(),
    ]);
    return { persons, celebrations, payments, celebrationsById: gP.utils.indexById(celebrations) };
  }

  const fields = [
    { name: 'requesterName', label: 'Demandeur', type: 'text', required: true },
    { name: 'requesterPersonId', label: 'Demandeur (fiche existante)', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'object', label: "Objet de l'intention", type: 'textarea' },
    { name: 'status', label: 'Statut', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.INTENTION_STATUSES), default: 'Demandée' },
    { name: 'celebrationId', label: 'Célébration', type: 'select', options: (ctx) => ctx.celebrations.map((c) => ({ value: c.id, label: c.title })) },
    { name: 'amountRequested', label: 'Montant demandé (€)', type: 'number', step: '0.01' },
  ];

  function intentionsListPage() {
    return new gP.ui.ListView({
      title: 'Intentions de messe',
      repository: gP.services.intentionRepository,
      columns: [
        { label: 'Demandeur', key: 'requesterName' },
        { label: 'Objet', key: 'object' },
        { label: 'Statut', key: 'status' },
        { label: 'Célébration', render: (row, ctx) => ctx.celebrationsById.get(row.celebrationId)?.title ?? '' },
        { label: 'Paiement', render: (row, ctx) => gP.services.intentionPaymentStatus(row, ctx.payments) },
      ],
      prepareContext: loadContext,
      newPath: '/intentions/new',
      editPath: (row) => `/intentions/${row.id}`,
      sort: (a, b) => a.requesterName.localeCompare(b.requesterName),
    });
  }

  function intentionFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une intention' : 'Nouvelle intention',
      repository: gP.services.intentionRepository,
      id: params?.id ?? null,
      fields,
      prepareContext: loadContext,
      backPath: '/intentions',
    });
  }

  Object.assign(gP.pages, { intentionsListPage, intentionFormPage });
})(window.gP);
