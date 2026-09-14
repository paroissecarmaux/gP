// Système de composants minimal : sépare la construction du DOM (render)
// du cycle de vie (mount/unmount). Les hooks onMount/onUnmount sont
// optionnels et servent à charger des données ou se désabonner d'événements.
(function (gP) {
  'use strict';

  class Component {
    constructor(props = {}) {
      this.props = props;
      this.el = null;
    }

    render() {
      throw new Error(`${this.constructor.name}.render() doit être implémenté`);
    }

    mount(container) {
      this.el = this.render();
      container.replaceChildren(this.el);
      this.onMount?.();
      return this.el;
    }

    unmount() {
      this.onUnmount?.();
      this.el = null;
    }
  }

  // Coquille persistante de l'application : en-tête, navigation, zone de
  // contenu (outlet) pour le routeur, et emplacement pour les notifications.
  class AppShell extends Component {
    render() {
      const el = document.createElement('div');
      el.className = 'app-shell';

      const nav = (this.props.navItems ?? [])
        .map((item) => `<li><a href="#${item.path}">${item.label}</a></li>`)
        .join('');

      el.innerHTML = `
        <header class="app-header">
          <a class="app-title" href="#/">gParoisse</a>
          <nav class="app-nav"><ul>${nav}</ul></nav>
        </header>
        <div class="notifications-slot"></div>
        <div class="modals-slot"></div>
        <main class="app-outlet"></main>
      `;
      return el;
    }

    get outlet() {
      return this.el.querySelector('.app-outlet');
    }

    get notificationsSlot() {
      return this.el.querySelector('.notifications-slot');
    }

    get modalsSlot() {
      return this.el.querySelector('.modals-slot');
    }
  }

  // ---------------------------------------------------------------------
  // Vue liste générique : tableau construit depuis une config déclarative
  // (colonnes, dépôt de données). Réutilisée par toutes les entités simples
  // de l'annuaire (Fonction, Groupe…) ; les fiches plus riches (Personne,
  // Famille) composent leurs propres pages à partir des mêmes briques
  // (js/ui/forms.js) sans passer par ListView/FormView.
  // ---------------------------------------------------------------------
  class ListView extends Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page list-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.title}</h1>
          ${this.props.newPath ? `<a class="button primary" href="#${this.props.newPath}">+ Nouveau</a>` : ''}
        </div>
        <table class="data-table">
          <thead><tr>${this.props.columns.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead>
          <tbody></tbody>
        </table>
        <p class="empty-state" hidden>Aucun élément.</p>
      `;
      return el;
    }

    async onMount() {
      await this.refresh();
    }

    async refresh() {
      try {
        const ctx = (await this.props.prepareContext?.()) ?? {};
        const rows = await this.props.repository.list();
        const filtered = this.props.filter ? rows.filter(this.props.filter) : rows;
        const sorted = this.props.sort ? [...filtered].sort(this.props.sort) : filtered;
        this.renderRows(sorted, ctx);
      } catch (error) {
        gP.utils.reportError(error, { source: this.props.title });
      }
    }

    renderRows(rows, ctx) {
      const tbody = this.el.querySelector('tbody');
      const empty = this.el.querySelector('.empty-state');
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
        actionsTd.className = 'row-actions';
        if (this.props.editPath) {
          const editLink = document.createElement('a');
          editLink.href = `#${this.props.editPath(row)}`;
          editLink.textContent = 'Modifier';
          actionsTd.appendChild(editLink);
        }
        if (this.props.deletable !== false) {
          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'button-danger-link';
          deleteBtn.textContent = 'Supprimer';
          deleteBtn.addEventListener('click', () => this.handleDelete(row));
          actionsTd.appendChild(deleteBtn);
        }
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
      }
    }

    async handleDelete(row) {
      const ok = await gP.ui.confirmModal('Supprimer cet élément ? Il restera récupérable (suppression douce).', { danger: true, confirmLabel: 'Supprimer' });
      if (!ok) return;
      try {
        await this.props.repository.remove(row.id);
        gP.ui.notify('Élément supprimé.', { type: 'success' });
        await this.refresh();
      } catch (error) {
        gP.utils.reportError(error, { source: this.props.title });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Formulaire générique : construit ses champs depuis une config
  // déclarative, valide (js/utils/validation.js) avant d'enregistrer via un
  // Repository.
  // ---------------------------------------------------------------------
  class FormView extends Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.title}</h1>
          <a href="#${this.props.backPath}">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"><p>Chargement…</p></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#${this.props.backPath}">Annuler</a>
          </div>
        </form>
      `;
      return el;
    }

    async onMount() {
      try {
        this.ctx = (await this.props.prepareContext?.()) ?? {};
        this.entity = this.props.id ? await this.props.repository.get(this.props.id) : null;

        const fieldsContainer = this.el.querySelector('.form-fields');
        fieldsContainer.replaceChildren();
        for (const field of this.props.fields) {
          const value = this.entity ? this.entity[field.name] : field.default;
          fieldsContainer.appendChild(await gP.ui.buildField(field, value, this.ctx));
        }

        this.el.querySelector('form').addEventListener('submit', (event) => this.handleSubmit(event));
      } catch (error) {
        gP.utils.reportError(error, { source: this.props.title });
      }
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      gP.ui.clearFormErrors(form);

      const values = gP.ui.readFormValues(this.props.fields, form);
      const errors = gP.utils.validate(this.props.fields, values);
      if (errors.size > 0) {
        gP.ui.showFormErrors(form, errors);
        return;
      }

      try {
        if (this.props.transform) Object.assign(values, this.props.transform(values, this.ctx));
        const saved = this.entity
          ? await this.props.repository.update(this.entity.id, values)
          : await this.props.repository.create(values);
        gP.ui.notify('Enregistré.', { type: 'success' });
        this.props.afterSave?.(saved);
        window.location.hash = this.props.backPath;
      } catch (error) {
        gP.utils.reportError(error, { source: this.props.title });
      }
    }
  }

  Object.assign(gP.ui, { Component, AppShell, ListView, FormView });
})(window.gP);
