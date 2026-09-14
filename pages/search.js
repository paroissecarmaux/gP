(function (gP) {
  'use strict';

  class SearchPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page search-page';
      el.innerHTML = `
        <div class="page-header"><h1>Recherche globale</h1></div>
        <form class="search-form">
          <input type="search" name="q" placeholder="Nom, email, titre…" autofocus />
          <button type="submit" class="primary">Rechercher</button>
        </form>
        <div class="search-results"></div>
      `;
      return el;
    }

    onMount() {
      this.el.querySelector('.search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('q');
        this.runSearch(String(query ?? ''));
      });
    }

    async runSearch(query) {
      const results = this.el.querySelector('.search-results');
      if (!query.trim()) {
        results.innerHTML = '';
        return;
      }

      try {
        const sections = await gP.services.globalSearch(query);
        results.innerHTML =
          sections.length === 0
            ? '<p>Aucun résultat.</p>'
            : sections
                .map(({ entry, found }) => {
                  const items = found
                    .slice(0, 20)
                    .map((row) => {
                      const label = entry.searchFields.map((f) => row[f]).filter(Boolean).join(' · ');
                      return entry.path ? `<li><a href="#${entry.path}/${row.id}">${label}</a></li>` : `<li>${label}</li>`;
                    })
                    .join('');
                  return `<div class="search-section"><h2>${entry.label} (${found.length})</h2><ul>${items}</ul></div>`;
                })
                .join('');
      } catch (error) {
        gP.utils.reportError(error, { source: 'Recherche' });
      }
    }
  }

  gP.pages.SearchPage = SearchPage;
})(window.gP);
