import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { listRegisteredEntities } from '../../db/registry.js';

export class TrashPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'trash-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Corbeille</h2></div>
      <div class="trash-sections"><p>Chargement…</p></div>
    `;
    return el;
  }

  async onMount() {
    await this.refresh();
  }

  async refresh() {
    try {
      const sections = [];
      for (const entry of listRegisteredEntities()) {
        const all = await entry.repository.list({ includeDeleted: true });
        const deleted = all.filter((row) => row.deletedAt != null);
        if (deleted.length > 0) sections.push({ entry, deleted });
      }
      this.renderSections(sections);
    } catch (error) {
      reportError(error, { source: 'Corbeille' });
    }
  }

  renderSections(sections) {
    const container = this.el.querySelector('.trash-sections');
    if (sections.length === 0) {
      container.innerHTML = '<p>La corbeille est vide.</p>';
      return;
    }

    container.replaceChildren();
    for (const { entry, deleted } of sections) {
      const section = document.createElement('div');
      section.className = 'trash-section';
      section.innerHTML = `<h3>${entry.label} (${deleted.length})</h3>`;
      const table = document.createElement('table');
      table.className = 'list-table';
      table.innerHTML = '<thead><tr><th>Identifiant</th><th>Supprimé le</th><th></th></tr></thead><tbody></tbody>';
      const tbody = table.querySelector('tbody');

      for (const row of deleted) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${row.id}</code></td><td>${new Date(row.deletedAt).toLocaleString('fr-FR')}</td>`;
        const actionsTd = document.createElement('td');

        const restoreBtn = document.createElement('button');
        restoreBtn.type = 'button';
        restoreBtn.textContent = 'Restaurer';
        restoreBtn.addEventListener('click', () => this.handleRestore(entry, row));
        actionsTd.appendChild(restoreBtn);

        const purgeBtn = document.createElement('button');
        purgeBtn.type = 'button';
        purgeBtn.className = 'link-danger';
        purgeBtn.textContent = 'Purger définitivement';
        purgeBtn.addEventListener('click', () => this.handlePurge(entry, row));
        actionsTd.appendChild(purgeBtn);

        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
      }

      section.appendChild(table);
      container.appendChild(section);
    }
  }

  async handleRestore(entry, row) {
    try {
      await entry.repository.restore(row.id);
      await this.refresh();
    } catch (error) {
      reportError(error, { source: 'Corbeille' });
    }
  }

  async handlePurge(entry, row) {
    if (!confirm('Purger définitivement cet élément ? Cette action est irréversible.')) return;
    try {
      await entry.repository.hardDelete(row.id);
      await this.refresh();
    } catch (error) {
      reportError(error, { source: 'Corbeille' });
    }
  }
}
