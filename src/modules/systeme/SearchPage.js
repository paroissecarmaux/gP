import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { listRegisteredEntities } from '../../db/registry.js';

function matches(row, fields, query) {
  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(query));
}

export class SearchPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'search-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Recherche globale</h2></div>
      <form class="search-form">
        <input type="search" name="q" placeholder="Nom, email, titre…" autofocus />
        <button type="submit">Rechercher</button>
      </form>
      <div class="search-results"></div>
    `;
    return el;
  }

  onMount() {
    this.el.querySelector('.search-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(event.currentTarget).get('q');
      this.runSearch(String(query ?? '').trim());
    });
  }

  async runSearch(query) {
    const results = this.el.querySelector('.search-results');
    if (!query) {
      results.innerHTML = '';
      return;
    }

    try {
      const lower = query.toLowerCase();
      const sections = [];
      for (const entry of listRegisteredEntities()) {
        if (entry.searchFields.length === 0) continue;
        const rows = await entry.repository.list();
        const found = rows.filter((row) => matches(row, entry.searchFields, lower));
        if (found.length > 0) sections.push({ entry, found });
      }

      results.innerHTML =
        sections.length === 0
          ? '<p>Aucun résultat.</p>'
          : sections
              .map(
                ({ entry, found }) => `
                <div class="search-section">
                  <h3>${entry.label} (${found.length})</h3>
                  <ul>
                    ${found
                      .slice(0, 20)
                      .map((row) => {
                        const label = entry.searchFields.map((f) => row[f]).filter(Boolean).join(' · ');
                        return entry.path
                          ? `<li><a href="#${entry.path}/${row.id}">${label}</a></li>`
                          : `<li>${label}</li>`;
                      })
                      .join('')}
                  </ul>
                </div>
              `,
              )
              .join('');
    } catch (error) {
      reportError(error, { source: 'Recherche' });
    }
  }
}
