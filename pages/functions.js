(function (gP) {
  'use strict';

  const columns = [
    { label: 'Nom', key: 'name' },
    { label: 'Description', key: 'description' },
  ];

  const fields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];

  const sort = (a, b) => a.name.localeCompare(b.name);

  function functionsListPage() {
    return new gP.ui.ListView({
      title: 'Fonctions',
      repository: gP.services.functionRepository,
      columns,
      newPath: '/annuaire/fonctions/new',
      editPath: (row) => `/annuaire/fonctions/${row.id}`,
      sort,
    });
  }

  function functionFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une fonction' : 'Nouvelle fonction',
      repository: gP.services.functionRepository,
      id: params?.id ?? null,
      fields,
      backPath: '/annuaire/fonctions',
    });
  }

  Object.assign(gP.pages, { functionsListPage, functionFormPage });
})(window.gP);
