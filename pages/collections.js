(function (gP) {
  'use strict';

  // --- Collecte ------------------------------------------------------------
  async function collectionContext() {
    const [celebrations, lieux] = await Promise.all([gP.services.celebrationRepository.list(), gP.services.lieuRepository.list()]);
    return { celebrations, lieux, lieuxById: gP.utils.indexById(lieux), celebrationsById: gP.utils.indexById(celebrations) };
  }

  const collectionFields = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'celebrationId', label: 'Célébration', type: 'select', options: (ctx) => ctx.celebrations.map((c) => ({ value: c.id, label: c.title })) },
    { name: 'lieuId', label: 'Lieu', type: 'select', options: (ctx) => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
  ];

  function collectionsListPage() {
    return new gP.ui.ListView({
      title: 'Collectes',
      repository: gP.services.collectionRepository,
      columns: [
        { label: 'Date', render: (row) => gP.utils.formatDate(row.date) },
        { label: 'Célébration', render: (row, ctx) => ctx.celebrationsById.get(row.celebrationId)?.title ?? '' },
        { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
      ],
      prepareContext: collectionContext,
      newPath: '/quetes/collectes/new',
      editPath: (row) => `/quetes/collectes/${row.id}`,
      sort: (a, b) => new Date(b.date) - new Date(a.date),
    });
  }

  function collectionFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une collecte' : 'Nouvelle collecte',
      repository: gP.services.collectionRepository,
      id: params?.id ?? null,
      fields: collectionFields,
      prepareContext: collectionContext,
      backPath: '/quetes/collectes',
    });
  }

  // --- Comptage --------------------------------------------------------------
  async function countContext() {
    const [collections, persons, lieux] = await Promise.all([
      gP.services.collectionRepository.list(),
      gP.services.personRepository.list(),
      gP.services.lieuRepository.list(),
    ]);
    return { collections, persons, lieux, lieuxById: gP.utils.indexById(lieux), collectionsById: gP.utils.indexById(collections) };
  }

  const countFields = [
    { name: 'collectionId', label: 'Collecte', type: 'select', required: true, options: (ctx) => ctx.collections.map((c) => ({ value: c.id, label: gP.services.collectionLabel(c, ctx.lieuxById) })) },
    { name: 'counterPersonIds', label: 'Bénévoles compteurs', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'cashAmount', label: 'Espèces (€)', type: 'number', step: '0.01' },
    { name: 'checkAmount', label: 'Chèques (€)', type: 'number', step: '0.01' },
    { name: 'countedAt', label: 'Compté le', type: 'date', required: true },
  ];

  function countsListPage() {
    return new gP.ui.ListView({
      title: 'Comptages',
      repository: gP.services.countRepository,
      columns: [
        { label: 'Collecte', render: (row, ctx) => gP.services.collectionLabel(ctx.collectionsById.get(row.collectionId) ?? {}, ctx.lieuxById) },
        { label: 'Compté le', render: (row) => gP.utils.formatDate(row.countedAt) },
        { label: 'Espèces', render: (row) => gP.utils.formatAmount(row.cashAmount) },
        { label: 'Chèques', render: (row) => gP.utils.formatAmount(row.checkAmount) },
        { label: 'Total', render: (row) => gP.utils.formatAmount((row.cashAmount ?? 0) + (row.checkAmount ?? 0)) },
      ],
      prepareContext: countContext,
      newPath: '/quetes/comptages/new',
      editPath: (row) => `/quetes/comptages/${row.id}`,
      sort: (a, b) => new Date(b.countedAt) - new Date(a.countedAt),
    });
  }

  function countFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un comptage' : 'Nouveau comptage',
      repository: gP.services.countRepository,
      id: params?.id ?? null,
      fields: countFields,
      prepareContext: countContext,
      backPath: '/quetes/comptages',
    });
  }

  // --- Remise ------------------------------------------------------------------
  const remittanceFields = [
    { name: 'collectionId', label: 'Collecte', type: 'select', required: true, options: (ctx) => ctx.collections.map((c) => ({ value: c.id, label: gP.services.collectionLabel(c, ctx.lieuxById) })) },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'depositedByPersonId', label: 'Déposé par', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'amount', label: 'Montant (€)', type: 'number', required: true, step: '0.01' },
  ];

  function remittancesListPage() {
    return new gP.ui.ListView({
      title: 'Remises',
      repository: gP.services.remittanceRepository,
      columns: [
        { label: 'Collecte', render: (row, ctx) => gP.services.collectionLabel(ctx.collectionsById.get(row.collectionId) ?? {}, ctx.lieuxById) },
        { label: 'Date', render: (row) => gP.utils.formatDate(row.date) },
        { label: 'Montant', render: (row) => gP.utils.formatAmount(row.amount) },
      ],
      prepareContext: countContext,
      newPath: '/quetes/remises/new',
      editPath: (row) => `/quetes/remises/${row.id}`,
      sort: (a, b) => new Date(b.date) - new Date(a.date),
    });
  }

  function remittanceFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une remise' : 'Nouvelle remise',
      repository: gP.services.remittanceRepository,
      id: params?.id ?? null,
      fields: remittanceFields,
      prepareContext: countContext,
      backPath: '/quetes/remises',
    });
  }

  // --- Statistiques --------------------------------------------------------------
  function groupSum(rows, keyFn, amountFn) {
    const totals = new Map();
    for (const row of rows) {
      const key = keyFn(row) ?? '—';
      totals.set(key, (totals.get(key) ?? 0) + amountFn(row));
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }

  function renderStatsTable(title, rows) {
    return `
      <div class="stats-table">
        <h3>${title}</h3>
        <table class="data-table">
          <thead><tr><th>Regroupement</th><th>Total</th></tr></thead>
          <tbody>${rows.map(([label, total]) => `<tr><td>${label}</td><td>${gP.utils.formatAmount(total)}</td></tr>`).join('') || '<tr><td colspan="2">Aucune donnée</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  class QuetesStatsPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page stats-page';
      el.innerHTML = `<div class="page-header"><h1>Statistiques des quêtes</h1></div><div class="stats-grid"></div>`;
      return el;
    }

    async onMount() {
      try {
        const [collections, counts, lieux, clochers, sectors] = await Promise.all([
          gP.services.collectionRepository.list(),
          gP.services.countRepository.list(),
          gP.services.lieuRepository.list(),
          gP.services.clocherRepository.list(),
          gP.services.sectorRepository.list(),
        ]);

        const collectionsById = gP.utils.indexById(collections);
        const lieuxById = gP.utils.indexById(lieux);
        const clochersById = gP.utils.indexById(clochers);

        const amountOf = (count) => (count.cashAmount ?? 0) + (count.checkAmount ?? 0);
        const collectionOf = (count) => collectionsById.get(count.collectionId);
        const lieuOf = (count) => lieuxById.get(collectionOf(count)?.lieuId);
        const clocherOf = (count) => clochersById.get(lieuOf(count)?.clocherId);

        const byMonth = groupSum(counts, (c) => (collectionOf(c)?.date ? new Date(collectionOf(c).date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null), amountOf);
        const byClocher = groupSum(counts, (c) => clocherOf(c)?.name, amountOf);
        const bySector = groupSum(counts, (c) => sectors.find((s) => s.id === clocherOf(c)?.sectorId)?.name, amountOf);

        this.el.querySelector('.stats-grid').innerHTML = renderStatsTable('Par mois', byMonth) + renderStatsTable('Par clocher', byClocher) + renderStatsTable('Par secteur', bySector);
      } catch (error) {
        gP.utils.reportError(error, { source: 'Statistiques quêtes' });
      }
    }
  }

  Object.assign(gP.pages, {
    collectionsListPage,
    collectionFormPage,
    countsListPage,
    countFormPage,
    remittancesListPage,
    remittanceFormPage,
    QuetesStatsPage,
  });
})(window.gP);
