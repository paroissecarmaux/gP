(function (gP) {
  'use strict';

  const ACTION_LABELS = { create: 'Création', update: 'Modification', delete: 'Suppression', restore: 'Restauration', purge: 'Purge' };

  class HistoryPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page history-page';
      el.innerHTML = `
        <div class="page-header"><h1>Historique</h1></div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Type</th><th>Action</th><th>Installation</th></tr></thead>
          <tbody></tbody>
        </table>
      `;
      return el;
    }

    async onMount() {
      try {
        const entries = await gP.services.recentHistory(200);
        this.el.querySelector('tbody').innerHTML =
          entries
            .map((e) => `<tr><td>${gP.utils.formatDateTime(e.occurredAt)}</td><td>${e.entityType}</td><td>${ACTION_LABELS[e.action] ?? e.action}</td><td><code>${e.installationId.slice(0, 8)}</code></td></tr>`)
            .join('') || '<tr><td colspan="4">Aucun historique.</td></tr>';
      } catch (error) {
        gP.utils.reportError(error, { source: 'Historique' });
      }
    }
  }

  gP.pages.HistoryPage = HistoryPage;
})(window.gP);
