(function (gP) {
  'use strict';

  class TrashPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page trash-page';
      el.innerHTML = `<div class="page-header"><h1>Corbeille</h1></div><div class="trash-sections"><p>Chargement…</p></div>`;
      return el;
    }

    async onMount() {
      await this.refresh();
    }

    async refresh() {
      try {
        const sections = await gP.services.listTrashSections();
        this.renderSections(sections);
      } catch (error) {
        gP.utils.reportError(error, { source: 'Corbeille' });
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
        section.innerHTML = `<h2>${entry.label} (${deleted.length})</h2>`;
        const table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML = '<thead><tr><th>Identifiant</th><th>Supprimé le</th><th></th></tr></thead><tbody></tbody>';
        const tbody = table.querySelector('tbody');

        for (const row of deleted) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td><code>${row.id.slice(0, 8)}</code></td><td>${gP.utils.formatDateTime(row.deletedAt)}</td>`;
          const actionsTd = document.createElement('td');

          const restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.textContent = 'Restaurer';
          restoreBtn.addEventListener('click', () => this.handleRestore(entry, row));
          actionsTd.appendChild(restoreBtn);

          const purgeBtn = document.createElement('button');
          purgeBtn.type = 'button';
          purgeBtn.className = 'button-danger-link';
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
        gP.utils.reportError(error, { source: 'Corbeille' });
      }
    }

    async handlePurge(entry, row) {
      const ok = await gP.ui.confirmModal('Purger définitivement cet élément ? Cette action est irréversible.', { danger: true, confirmLabel: 'Purger' });
      if (!ok) return;
      try {
        await entry.repository.hardDelete(row.id);
        await this.refresh();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Corbeille' });
      }
    }
  }

  gP.pages.TrashPage = TrashPage;
})(window.gP);
