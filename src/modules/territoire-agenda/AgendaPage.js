import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { celebrationRepository, lieuRepository, clocherRepository, sectorRepository } from './repositories.js';
import { findAllConflicts } from './conflicts.js';

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export class AgendaPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewMode: 'month',
      referenceDate: new Date(),
      sectorId: '',
      clocherId: '',
      lieuId: '',
    };
  }

  render() {
    const el = document.createElement('section');
    el.className = 'agenda-page';
    el.innerHTML = `
      <div class="list-view-header">
        <h2>Agenda</h2>
        <a class="button" href="#/agenda/celebrations/new">+ Nouvelle célébration</a>
      </div>
      <div class="agenda-toolbar"></div>
      <p class="agenda-conflicts" hidden></p>
      <div class="agenda-body"></div>
    `;
    return el;
  }

  async onMount() {
    try {
      const [celebrations, lieux, clochers, sectors] = await Promise.all([
        celebrationRepository.list(),
        lieuRepository.list(),
        clocherRepository.list(),
        sectorRepository.list(),
      ]);
      this.celebrations = celebrations;
      this.lieux = lieux;
      this.clochers = clochers;
      this.sectors = sectors;
      this.renderToolbar();
      this.renderConflicts();
      this.renderBody();
    } catch (error) {
      reportError(error, { source: 'Agenda' });
    }
  }

  filteredCelebrations() {
    let allowedLieuIds = null;
    if (this.state.lieuId) {
      allowedLieuIds = new Set([this.state.lieuId]);
    } else if (this.state.clocherId) {
      allowedLieuIds = new Set(this.lieux.filter((l) => l.clocherId === this.state.clocherId).map((l) => l.id));
    } else if (this.state.sectorId) {
      const clocherIds = new Set(this.clochers.filter((c) => c.sectorId === this.state.sectorId).map((c) => c.id));
      allowedLieuIds = new Set(this.lieux.filter((l) => clocherIds.has(l.clocherId)).map((l) => l.id));
    }
    if (!allowedLieuIds) return this.celebrations;
    return this.celebrations.filter((c) => allowedLieuIds.has(c.lieuId));
  }

  renderToolbar() {
    const toolbar = this.el.querySelector('.agenda-toolbar');
    toolbar.innerHTML = `
      <div class="agenda-nav">
        <button type="button" data-nav="prev">←</button>
        <button type="button" data-nav="today">Aujourd'hui</button>
        <button type="button" data-nav="next">→</button>
        <strong class="agenda-period"></strong>
      </div>
      <div class="agenda-views">
        <button type="button" data-view="day">Jour</button>
        <button type="button" data-view="week">Semaine</button>
        <button type="button" data-view="month">Mois</button>
      </div>
      <div class="agenda-filters">
        <select data-filter="sectorId"><option value="">Tous secteurs</option>${this.sectors.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        <select data-filter="clocherId"><option value="">Tous clochers</option>${this.clochers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        <select data-filter="lieuId"><option value="">Tous lieux</option>${this.lieux.map((l) => `<option value="${l.id}">${l.name}</option>`).join('')}</select>
      </div>
    `;

    toolbar.querySelectorAll('[data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => this.handleNav(btn.dataset.nav)),
    );
    toolbar.querySelectorAll('[data-view]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.viewMode = btn.dataset.view;
        this.renderBody();
        this.updateActiveButtons();
      }),
    );
    toolbar.querySelectorAll('[data-filter]').forEach((select) => {
      select.value = this.state[select.dataset.filter];
      select.addEventListener('change', () => {
        this.state[select.dataset.filter] = select.value;
        this.renderBody();
      });
    });
    this.updateActiveButtons();
  }

  updateActiveButtons() {
    this.el.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === this.state.viewMode);
    });
  }

  handleNav(action) {
    const ref = this.state.referenceDate;
    if (action === 'today') {
      this.state.referenceDate = new Date();
    } else {
      const sign = action === 'next' ? 1 : -1;
      if (this.state.viewMode === 'month') {
        this.state.referenceDate = new Date(ref.getFullYear(), ref.getMonth() + sign, 1);
      } else if (this.state.viewMode === 'week') {
        this.state.referenceDate = addDays(ref, 7 * sign);
      } else {
        this.state.referenceDate = addDays(ref, sign);
      }
    }
    this.renderBody();
  }

  renderConflicts() {
    const conflicts = findAllConflicts(this.celebrations);
    const banner = this.el.querySelector('.agenda-conflicts');
    if (conflicts.length === 0) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    banner.textContent = `⚠ ${conflicts.length} conflit(s) d'agenda détecté(s) (même lieu, célébrant ou participant sur un horaire chevauchant).`;
  }

  renderBody() {
    const body = this.el.querySelector('.agenda-body');
    const period = this.el.querySelector('.agenda-period');
    const celebrations = this.filteredCelebrations();

    if (this.state.viewMode === 'month') {
      period.textContent = this.state.referenceDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      body.innerHTML = this.renderMonth(celebrations);
    } else if (this.state.viewMode === 'week') {
      const start = startOfWeek(this.state.referenceDate);
      period.textContent = `Semaine du ${start.toLocaleDateString('fr-FR')}`;
      body.innerHTML = this.renderDays(celebrations, start, 7);
    } else {
      period.textContent = this.state.referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      body.innerHTML = this.renderDays(celebrations, this.state.referenceDate, 1);
    }
  }

  groupByDay(celebrations) {
    const map = new Map();
    for (const c of celebrations) {
      const key = dateKey(new Date(c.startAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    for (const list of map.values()) list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    return map;
  }

  renderMonth(celebrations) {
    const byDay = this.groupByDay(celebrations);
    const monthStart = startOfMonth(this.state.referenceDate);
    const gridStart = startOfWeek(monthStart);
    const todayKey = dateKey(new Date());

    let html = '<div class="agenda-month-grid">';
    for (let i = 0; i < 42; i++) {
      const day = addDays(gridStart, i);
      const key = dateKey(day);
      const inMonth = day.getMonth() === monthStart.getMonth();
      const items = byDay.get(key) ?? [];
      html += `<div class="agenda-day-cell ${inMonth ? '' : 'agenda-day-outside'} ${key === todayKey ? 'agenda-day-today' : ''}">
        <div class="agenda-day-number">${day.getDate()}</div>
        ${items
          .slice(0, 3)
          .map((c) => `<a class="agenda-item" href="#/agenda/celebrations/${c.id}">${c.title}</a>`)
          .join('')}
        ${items.length > 3 ? `<span class="agenda-more">+${items.length - 3} autres</span>` : ''}
      </div>`;
    }
    html += '</div>';
    return html;
  }

  renderDays(celebrations, start, count) {
    const byDay = this.groupByDay(celebrations);
    let html = '<div class="agenda-days">';
    for (let i = 0; i < count; i++) {
      const day = addDays(start, i);
      const key = dateKey(day);
      const items = byDay.get(key) ?? [];
      html += `<div class="agenda-day-column">
        <h3>${day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
        ${items.length === 0 ? '<p class="agenda-empty">Rien de prévu</p>' : ''}
        ${items
          .map(
            (c) =>
              `<a class="agenda-item" href="#/agenda/celebrations/${c.id}">${new Date(c.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — ${c.title}</a>`,
          )
          .join('')}
      </div>`;
    }
    html += '</div>';
    return html;
  }
}
