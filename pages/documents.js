(function (gP) {
  'use strict';

  function context() {
    return { entityTypes: gP.services.linkedEntityLabels() };
  }

  const fields = [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'category', label: 'Catégorie', type: 'select', options: gP.utils.staticOptions(gP.services.DOCUMENT_CATEGORIES) },
    { name: 'linkedEntityType', label: 'Module concerné', type: 'select', options: (ctx) => ctx.entityTypes.map((t) => ({ value: t, label: t })) },
    { name: 'linkedEntityId', label: 'Élément concerné (description libre)', type: 'text' },
    { name: 'fileBlob', label: 'Fichier', type: 'file' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  function transform(values) {
    if (values.fileBlob instanceof Blob) {
      return { fileName: values.fileBlob.name ?? '', fileMimeType: values.fileBlob.type ?? '' };
    }
    return {};
  }

  function documentsListPage() {
    return new gP.ui.ListView({
      title: 'Documents',
      repository: gP.services.documentRepository,
      columns: [
        { label: 'Titre', key: 'title' },
        { label: 'Catégorie', key: 'category' },
        { label: 'Lié à', render: (row) => [row.linkedEntityType, row.linkedEntityId].filter(Boolean).join(' — ') },
        { label: 'Fichier', render: (row) => row.fileName ?? '' },
      ],
      newPath: '/documents/new',
      editPath: (row) => `/documents/${row.id}`,
      sort: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    });
  }

  function documentFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un document' : 'Nouveau document',
      repository: gP.services.documentRepository,
      id: params?.id ?? null,
      fields,
      prepareContext: context,
      transform,
      backPath: '/documents',
    });
  }

  Object.assign(gP.pages, { documentsListPage, documentFormPage });
})(window.gP);
