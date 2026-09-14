(function (gP) {
  'use strict';

  // Clé de regroupement par jour CALENDAIRE LOCAL : `toISOString()` (UTC)
  // décalerait les journées d'un jour dès que le fuseau local n'est pas UTC
  // (ex. minuit local le 21/09 en UTC+2 = 22:00 UTC le 20/09), désynchronisé
  // des cellules de la grille (construites avec des méthodes locales
  // getDate/setDate). Les deux doivent utiliser la même référence.
  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  class AgendaPage extends gP.ui.Component {
    constructor(props) {
      super(props);
      this.state = { viewMode: 'month', referenceDate: new Date(), sectorId: '', clocherId: '', lieuId: '' };
    }

    render() {
      const el = document.createElement('section');
      el.className = 'page agenda-page';
      el.innerHTML = `
        <div class="page-header">
          <h1>Agenda</h1>
          <a class="button primary" href="#/agenda/celebrations/new">+ Nouvelle célébration</a>
        </div>
        <div class="agenda-toolbar"></div>
        <p class="agenda-conflicts" hidden></p>
        <div class="agenda-body"></div>
      `;
      return el;
    }

    async onMount() {
      try {
        const [evenements, celebrations, lieux, clochers, sectors] = await Promise.all([
          gP.services.evenementRepository.list(),
          gP.services.celebrationRepository.list(),
          gP.services.lieuRepository.list(),
          gP.services.clocherRepository.list(),
          gP.services.sectorRepository.list(),
        ]);
        this.items = gP.services.mergeAgendaItems(evenements, celebrations);
        this.celebrations = celebrations;
        this.lieux = lieux;
        this.clochers = clochers;
        this.sectors = sectors;
        this.renderToolbar();
        this.renderConflicts();
        this.renderBody();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Agenda' });
      }
    }

    filteredItems() {
      let allowedLieuIds = null;
      if (this.state.lieuId) {
        allowedLieuIds = new Set([this.state.lieuId]);
      } else if (this.state.clocherId) {
        allowedLieuIds = new Set(this.lieux.filter((l) => l.clocherId === this.state.clocherId).map((l) => l.id));
      } else if (this.state.sectorId) {
        const clocherIds = new Set(this.clochers.filter((c) => c.sectorId === this.state.sectorId).map((c) => c.id));
        const directLieux = this.lieux.filter((l) => l.sectorId === this.state.sectorId).map((l) => l.id);
        const viaClocher = this.lieux.filter((l) => clocherIds.has(l.clocherId)).map((l) => l.id);
        allowedLieuIds = new Set([...directLieux, ...viaClocher]);
      }
      if (!allowedLieuIds) return this.items;
      return this.items.filter((i) => allowedLieuIds.has(i.lieuId));
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
        <a class="button-secondary" href="#/agenda/evenements/new">+ Nouvel événement</a>
      `;

      toolbar.querySelectorAll('[data-nav]').forEach((btn) => btn.addEventListener('click', () => this.handleNav(btn.dataset.nav)));
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
      this.el.querySelectorAll('[data-view]').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === this.state.viewMode));
    }

    handleNav(action) {
      const ref = this.state.referenceDate;
      if (action === 'today') {
        this.state.referenceDate = new Date();
      } else {
        const sign = action === 'next' ? 1 : -1;
        if (this.state.viewMode === 'month') this.state.referenceDate = new Date(ref.getFullYear(), ref.getMonth() + sign, 1);
        else if (this.state.viewMode === 'week') this.state.referenceDate = addDays(ref, 7 * sign);
        else this.state.referenceDate = addDays(ref, sign);
      }
      this.renderBody();
    }

    renderConflicts() {
      const conflicts = gP.services.findAllConflicts(this.celebrations);
      const banner = this.el.querySelector('.agenda-conflicts');
      if (conflicts.length === 0) {
        banner.hidden = true;
        return;
      }
      banner.hidden = false;
      banner.textContent = `⚠ ${conflicts.length} conflit(s) d'agenda détecté(s) entre célébrations (même lieu ou même célébrant sur un horaire chevauchant).`;
    }

    renderBody() {
      const body = this.el.querySelector('.agenda-body');
      const period = this.el.querySelector('.agenda-period');
      const items = this.filteredItems();

      if (this.state.viewMode === 'month') {
        period.textContent = this.state.referenceDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        body.innerHTML = this.renderMonth(items);
      } else if (this.state.viewMode === 'week') {
        const start = startOfWeek(this.state.referenceDate);
        period.textContent = `Semaine du ${start.toLocaleDateString('fr-FR')}`;
        body.innerHTML = this.renderDays(items, start, 7);
      } else {
        period.textContent = this.state.referenceDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        body.innerHTML = this.renderDays(items, this.state.referenceDate, 1);
      }
    }

    groupByDay(items) {
      const map = new Map();
      for (const item of items) {
        const key = dateKey(new Date(item.startAt));
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
      }
      for (const list of map.values()) list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      return map;
    }

    itemPath(item) {
      return item.subjectType === 'celebration' ? `/agenda/celebrations/${item.id}` : `/agenda/evenements/${item.id}`;
    }

    renderMonth(items) {
      const byDay = this.groupByDay(items);
      const monthStart = startOfMonth(this.state.referenceDate);
      const gridStart = startOfWeek(monthStart);
      const todayKey = dateKey(new Date());

      let html = '<div class="agenda-month-grid">';
      for (let i = 0; i < 42; i++) {
        const day = addDays(gridStart, i);
        const key = dateKey(day);
        const inMonth = day.getMonth() === monthStart.getMonth();
        const dayItems = byDay.get(key) ?? [];
        html += `<div class="agenda-day-cell ${inMonth ? '' : 'agenda-day-outside'} ${key === todayKey ? 'agenda-day-today' : ''}">
          <div class="agenda-day-number">${day.getDate()}</div>
          ${dayItems.slice(0, 3).map((it) => `<a class="agenda-item agenda-item-${it.subjectType}" href="#${this.itemPath(it)}">${it.title}</a>`).join('')}
          ${dayItems.length > 3 ? `<span class="agenda-more">+${dayItems.length - 3} autres</span>` : ''}
        </div>`;
      }
      html += '</div>';
      return html;
    }

    renderDays(items, start, count) {
      const byDay = this.groupByDay(items);
      let html = '<div class="agenda-days">';
      for (let i = 0; i < count; i++) {
        const day = addDays(start, i);
        const key = dateKey(day);
        const dayItems = byDay.get(key) ?? [];
        html += `<div class="agenda-day-column">
          <h3>${day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
          ${dayItems.length === 0 ? '<p class="agenda-empty">Rien de prévu</p>' : ''}
          ${dayItems
            .map((it) => `<a class="agenda-item agenda-item-${it.subjectType}" href="#${this.itemPath(it)}">${new Date(it.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — ${it.title}</a>`)
            .join('')}
        </div>`;
      }
      html += '</div>';
      return html;
    }
  }

  gP.pages.AgendaPage = AgendaPage;
})(window.gP);
