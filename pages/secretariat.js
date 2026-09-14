(function (gP) {
  'use strict';

  const personLabel = (p) => gP.utils.personLabel(p);

  async function loadContext() {
    const persons = await gP.services.personRepository.list();
    return { persons, personsById: gP.utils.indexById(persons) };
  }

  const fields = [
    { name: 'type', label: 'Type de demande', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.REQUEST_TYPES) },
    { name: 'requesterPersonId', label: 'Demandeur', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
    { name: 'status', label: 'Statut', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.REQUEST_STATUSES), default: 'Ouverte' },
    { name: 'priority', label: 'Priorité', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.REQUEST_PRIORITIES), default: 'Normale' },
    { name: 'dueDate', label: 'Échéance', type: 'date' },
    { name: 'assigneePersonId', label: 'Responsable', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  ];

  const columns = [
    { label: 'Type', key: 'type' },
    { label: 'Demandeur', render: (row, ctx) => personLabel(ctx.personsById.get(row.requesterPersonId)) },
    { label: 'Statut', key: 'status' },
    { label: 'Priorité', key: 'priority' },
    { label: 'Échéance', render: (row) => `${gP.utils.formatDate(row.dueDate)}${gP.services.isRequestOverdue(row) ? ' ⚠' : ''}` },
    { label: 'Responsable', render: (row, ctx) => personLabel(ctx.personsById.get(row.assigneePersonId)) },
  ];

  function secretariatListPage() {
    return new gP.ui.ListView({
      title: 'Demandes secrétariat',
      repository: gP.services.requestRepository,
      columns,
      prepareContext: loadContext,
      newPath: '/secretariat/new',
      editPath: (row) => `/secretariat/${row.id}`,
      sort: (a, b) => new Date(a.dueDate ?? 0) - new Date(b.dueDate ?? 0),
    });
  }

  function secretariatOpenListPage() {
    return new gP.ui.ListView({
      title: 'Demandes ouvertes',
      repository: gP.services.requestRepository,
      columns,
      prepareContext: loadContext,
      editPath: (row) => `/secretariat/${row.id}`,
      filter: gP.services.isRequestOpen,
      deletable: false,
    });
  }

  function secretariatOverdueListPage() {
    return new gP.ui.ListView({
      title: 'Demandes en retard',
      repository: gP.services.requestRepository,
      columns,
      prepareContext: loadContext,
      editPath: (row) => `/secretariat/${row.id}`,
      filter: gP.services.isRequestOverdue,
      deletable: false,
    });
  }

  function secretariatFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une demande' : 'Nouvelle demande',
      repository: gP.services.requestRepository,
      id: params?.id ?? null,
      fields,
      prepareContext: loadContext,
      backPath: '/secretariat',
    });
  }

  Object.assign(gP.pages, { secretariatListPage, secretariatOpenListPage, secretariatOverdueListPage, secretariatFormPage });
})(window.gP);
