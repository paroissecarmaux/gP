import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { recentHistory } from '../../services/historyService.js';

const ACTION_LABELS = { create: 'Création', update: 'Modification', delete: 'Suppression', restore: 'Restauration', purge: 'Purge' };

export class HistoryPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'history-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Historique</h2></div>
      <table class="list-table">
        <thead><tr><th>Date</th><th>Type</th><th>Action</th><th>Installation</th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    return el;
  }

  async onMount() {
    try {
      const entries = await recentHistory(200);
      const tbody = this.el.querySelector('tbody');
      tbody.innerHTML =
        entries
          .map(
            (e) =>
              `<tr><td>${new Date(e.occurredAt).toLocaleString('fr-FR')}</td><td>${e.entityType}</td><td>${ACTION_LABELS[e.action] ?? e.action}</td><td><code>${e.installationId}</code></td></tr>`,
          )
          .join('') || '<tr><td colspan="4">Aucun historique.</td></tr>';
    } catch (error) {
      reportError(error, { source: 'Historique' });
    }
  }
}
