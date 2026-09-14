(function (gP) {
  'use strict';

  const columns = [
    { label: 'Nom', key: 'name' },
    { label: 'Catégorie', key: 'category' },
    { label: 'Contact', key: 'contactName' },
    { label: 'Téléphone', key: 'phone' },
  ];

  const fields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'category', label: 'Catégorie', type: 'select', options: gP.utils.staticOptions(gP.services.SUPPLIER_CATEGORIES) },
    { name: 'contactName', label: 'Contact', type: 'text' },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'address', label: 'Adresse', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  function suppliersListPage() {
    return new gP.ui.ListView({
      title: 'Fournisseurs',
      repository: gP.services.supplierRepository,
      columns,
      newPath: '/fournisseurs/new',
      editPath: (row) => `/fournisseurs/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  function supplierFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un fournisseur' : 'Nouveau fournisseur',
      repository: gP.services.supplierRepository,
      id: params?.id ?? null,
      fields,
      backPath: '/fournisseurs',
    });
  }

  Object.assign(gP.pages, { suppliersListPage, supplierFormPage });
})(window.gP);
