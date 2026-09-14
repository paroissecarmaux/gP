(function (gP) {
  'use strict';

  // --- Secteur ---------------------------------------------------------
  const sectorFields = [{ name: 'name', label: 'Nom', type: 'text', required: true }];

  function sectorsListPage() {
    return new gP.ui.ListView({
      title: 'Secteurs',
      repository: gP.services.sectorRepository,
      columns: [{ label: 'Nom', key: 'name' }],
      newPath: '/territoire/secteurs/new',
      editPath: (row) => `/territoire/secteurs/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  function sectorFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un secteur' : 'Nouveau secteur',
      repository: gP.services.sectorRepository,
      id: params?.id ?? null,
      fields: sectorFields,
      backPath: '/territoire/secteurs',
    });
  }

  // --- Clocher -----------------------------------------------------------
  async function clocherContext() {
    const sectors = await gP.services.sectorRepository.list();
    return { sectors, sectorsById: gP.utils.indexById(sectors) };
  }

  const clocherFields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'sectorId', label: 'Secteur', type: 'select', options: (ctx) => ctx.sectors.map((s) => ({ value: s.id, label: s.name })) },
  ];

  function clochersListPage() {
    return new gP.ui.ListView({
      title: 'Clochers',
      repository: gP.services.clocherRepository,
      columns: [
        { label: 'Nom', key: 'name' },
        { label: 'Secteur', render: (row, ctx) => ctx.sectorsById.get(row.sectorId)?.name ?? '' },
      ],
      prepareContext: clocherContext,
      newPath: '/territoire/clochers/new',
      editPath: (row) => `/territoire/clochers/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  function clocherFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un clocher' : 'Nouveau clocher',
      repository: gP.services.clocherRepository,
      id: params?.id ?? null,
      fields: clocherFields,
      prepareContext: clocherContext,
      backPath: '/territoire/clochers',
    });
  }

  // --- Lieu ----------------------------------------------------------------
  async function lieuContext() {
    const [clochers, sectors] = await Promise.all([gP.services.clocherRepository.list(), gP.services.sectorRepository.list()]);
    return { clochers, sectors, clochersById: gP.utils.indexById(clochers), sectorsById: gP.utils.indexById(sectors) };
  }

  const lieuFields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'clocherId', label: 'Clocher (optionnel)', type: 'select', options: (ctx) => ctx.clochers.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'sectorId', label: 'Secteur (si pas de clocher)', type: 'select', options: (ctx) => ctx.sectors.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'address', label: 'Adresse', type: 'text' },
  ];

  function lieuxListPage() {
    return new gP.ui.ListView({
      title: 'Lieux',
      repository: gP.services.lieuRepository,
      columns: [
        { label: 'Nom', key: 'name' },
        { label: 'Clocher', render: (row, ctx) => ctx.clochersById.get(row.clocherId)?.name ?? '' },
        { label: 'Secteur', render: (row, ctx) => ctx.sectorsById.get(row.sectorId)?.name ?? '' },
        { label: 'Adresse', key: 'address' },
      ],
      prepareContext: lieuContext,
      newPath: '/territoire/lieux/new',
      editPath: (row) => `/territoire/lieux/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  function lieuFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un lieu' : 'Nouveau lieu',
      repository: gP.services.lieuRepository,
      id: params?.id ?? null,
      fields: lieuFields,
      prepareContext: lieuContext,
      backPath: '/territoire/lieux',
    });
  }

  Object.assign(gP.pages, {
    sectorsListPage,
    sectorFormPage,
    clochersListPage,
    clocherFormPage,
    lieuxListPage,
    lieuFormPage,
  });
})(window.gP);
