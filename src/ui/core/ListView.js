import { Component } from './Component.js';
import { reportError } from '../../errors/errorHandler.js';

export class ListView extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'list-view';
    el.innerHTML = `
      <div class="list-view-header">
        <h2>${this.props.title}</h2>
        ${this.props.newPath ? `<a class="button" href="#${this.props.newPath}">+ Nouveau</a>` : ''}
      </div>
      <table class="list-table">
        <thead><tr>${this.props.columns.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead>
        <tbody></tbody>
      </table>
      <p class="list-empty" hidden>Aucun élément.</p>
    `;
    return el;
  }

  async onMount() {
    await this.refresh();
  }

  async refresh() {
    try {
      const ctx = this.props.prepareContext ? await this.props.prepareContext() : {};
      const rows = await this.props.repository.list();
      const filtered = this.props.filter ? rows.filter(this.props.filter) : rows;
      const sorted = this.props.sort ? [...filtered].sort(this.props.sort) : filtered;
      this.renderRows(sorted, ctx);
    } catch (error) {
      reportError(error, { source: this.props.title });
    }
  }

  renderRows(rows, ctx) {
    const tbody = this.el.querySelector('tbody');
    const empty = this.el.querySelector('.list-empty');
    tbody.replaceChildren();
    empty.hidden = rows.length > 0;

    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const column of this.props.columns) {
        const td = document.createElement('td');
        td.textContent = column.render ? column.render(row, ctx) : (row[column.key] ?? '');
        tr.appendChild(td);
      }
      const actionsTd = document.createElement('td');
      actionsTd.className = 'list-actions';
      if (this.props.editPath) {
        const editLink = document.createElement('a');
        editLink.href = `#${this.props.editPath(row)}`;
        editLink.textContent = 'Modifier';
        actionsTd.appendChild(editLink);
      }
      if (this.props.deletable !== false) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.className = 'link-danger';
        deleteBtn.addEventListener('click', () => this.handleDelete(row));
        actionsTd.appendChild(deleteBtn);
      }
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    }
  }

  async handleDelete(row) {
    if (!confirm('Supprimer cet élément ? Il sera déplacé dans la corbeille.')) return;
    try {
      await this.props.repository.remove(row.id);
      await this.refresh();
    } catch (error) {
      reportError(error, { source: this.props.title });
    }
  }
}
