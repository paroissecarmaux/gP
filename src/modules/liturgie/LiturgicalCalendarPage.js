import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { diocesanFeastRepository } from './repositories.js';
import { feastsForYear, seasonOn } from './liturgicalCalendar.js';

export class LiturgicalCalendarPage extends Component {
  constructor(props) {
    super(props);
    this.year = new Date().getFullYear();
  }

  render() {
    const el = document.createElement('section');
    el.className = 'liturgie-page';
    el.innerHTML = `
      <div class="list-view-header">
        <h2>Calendrier liturgique</h2>
        <a class="button" href="#/liturgie/particularites">Particularités diocésaines</a>
      </div>
      <p>Aujourd'hui : <strong class="liturgie-today"></strong></p>
      <div class="agenda-nav">
        <button type="button" data-year="prev">← Année précédente</button>
        <strong class="liturgie-year"></strong>
        <button type="button" data-year="next">Année suivante →</button>
      </div>
      <table class="list-table">
        <thead><tr><th>Date</th><th>Fête</th><th>Origine</th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    return el;
  }

  async onMount() {
    this.el.querySelector('.liturgie-today').textContent = seasonOn(new Date());
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
      const diocesanFeasts = await diocesanFeastRepository.list();
      const feasts = feastsForYear(this.year, diocesanFeasts);
      this.el.querySelector('tbody').innerHTML = feasts
        .map((f) => `<tr><td>${f.date.toLocaleDateString('fr-FR')}</td><td>${f.name}</td><td>${f.source}</td></tr>`)
        .join('');
    } catch (error) {
      reportError(error, { source: 'Calendrier liturgique' });
    }
  }
}
