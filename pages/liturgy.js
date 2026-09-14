(function (gP) {
  'use strict';

  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const diocesanFeastColumns = [
    { label: 'Nom', key: 'name' },
    { label: 'Date', render: (row) => (row.day && row.month ? `${row.day} ${MONTHS[row.month - 1]}` : '') },
    { label: 'Description', key: 'description' },
  ];

  const diocesanFeastFields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'month', label: 'Mois', type: 'select', required: true, options: async () => MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
    { name: 'day', label: 'Jour', type: 'number', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];

  function diocesanFeastTransform(values) {
    return { month: Number(values.month), day: Number(values.day) };
  }

  function diocesanFeastsListPage() {
    return new gP.ui.ListView({
      title: 'Particularités diocésaines',
      repository: gP.services.diocesanFeastRepository,
      columns: diocesanFeastColumns,
      newPath: '/liturgie/particularites/new',
      editPath: (row) => `/liturgie/particularites/${row.id}`,
      sort: (a, b) => a.month - b.month || a.day - b.day,
    });
  }

  function diocesanFeastFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier une particularité' : 'Nouvelle particularité',
      repository: gP.services.diocesanFeastRepository,
      id: params?.id ?? null,
      fields: diocesanFeastFields,
      transform: diocesanFeastTransform,
      backPath: '/liturgie/particularites',
    });
  }

  class LiturgicalCalendarPage extends gP.ui.Component {
    constructor(props) {
      super(props);
      this.year = new Date().getFullYear();
    }

    render() {
      const el = document.createElement('section');
      el.className = 'page liturgie-page';
      el.innerHTML = `
        <div class="page-header">
          <h1>Calendrier liturgique</h1>
          <a class="button-secondary" href="#/liturgie/particularites">Particularités diocésaines</a>
        </div>
        <p>Aujourd'hui : <strong class="liturgie-today"></strong></p>
        <div class="agenda-nav">
          <button type="button" data-year="prev">← Année précédente</button>
          <strong class="liturgie-year"></strong>
          <button type="button" data-year="next">Année suivante →</button>
        </div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Fête</th><th>Origine</th></tr></thead>
          <tbody></tbody>
        </table>
      `;
      return el;
    }

    async onMount() {
      this.el.querySelector('.liturgie-today').textContent = gP.services.seasonOn(new Date());
      this.el.querySelectorAll('[data-year]').forEach((btn) =>
        btn.addEventListener('click', () => {
          this.year += btn.dataset.year === 'next' ? 1 : -1;
          this.refresh();
        }),
      );
      await this.refresh();
    }

    async refresh() {
      try {
        this.el.querySelector('.liturgie-year').textContent = this.year;
        const diocesanFeasts = await gP.services.diocesanFeastRepository.list();
        const feasts = gP.services.feastsForYear(this.year, diocesanFeasts);
        this.el.querySelector('tbody').innerHTML = feasts.map((f) => `<tr><td>${gP.utils.formatDate(f.date)}</td><td>${f.name}</td><td>${f.source}</td></tr>`).join('');
      } catch (error) {
        gP.utils.reportError(error, { source: 'Calendrier liturgique' });
      }
    }
  }

  Object.assign(gP.pages, { diocesanFeastsListPage, diocesanFeastFormPage, LiturgicalCalendarPage });
})(window.gP);
