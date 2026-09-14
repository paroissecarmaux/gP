(function (gP) {
  'use strict';

  const EVENT_TYPES = ['Réunion', 'Sortie', 'Formation', 'Autre'];

  async function coreContext() {
    const lieux = await gP.services.lieuRepository.list();
    return { lieux, lieuxById: gP.utils.indexById(lieux) };
  }

  function coreFields(lieux) {
    return [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: async () => EVENT_TYPES.map((t) => ({ value: t, label: t })) },
      { name: 'startAt', label: 'Début', type: 'datetime', required: true },
      { name: 'endAt', label: 'Fin', type: 'datetime', required: true },
      { name: 'lieuId', label: 'Lieu', type: 'select', options: async () => lieux.map((l) => ({ value: l.id, label: l.name })) },
      { name: 'description', label: 'Description', type: 'textarea' },
    ];
  }

  function evenementsListPage() {
    return new gP.ui.ListView({
      title: 'Événements',
      repository: gP.services.evenementRepository,
      columns: [
        { label: 'Titre', key: 'title' },
        { label: 'Type', key: 'type' },
        { label: 'Début', render: (row) => gP.utils.formatDateTime(row.startAt) },
        { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
      ],
      prepareContext: coreContext,
      newPath: '/agenda/evenements/new',
      editPath: (row) => `/agenda/evenements/${row.id}`,
      sort: (a, b) => new Date(b.startAt) - new Date(a.startAt),
    });
  }

  class EvenementFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? "Modifier un événement" : 'Nouvel événement'}</h1>
          <a href="#/agenda/evenements">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/agenda/evenements">Annuler</a>
          </div>
        </form>
        <section class="related-section" hidden>
          <h2>Participants</h2>
          <table class="data-table"><thead><tr><th>Personne</th><th>Rôle</th><th></th></tr></thead><tbody></tbody></table>
          <form class="add-member-form">
            <select name="personId"></select>
            <input type="text" name="role" placeholder="Rôle (optionnel)" />
            <button type="submit">Ajouter</button>
          </form>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.persons = await gP.services.personRepository.list();
        const lieux = await gP.services.lieuRepository.list();
        this.fields = coreFields(lieux);
        this.entity = this.props.id ? await gP.services.evenementRepository.get(this.props.id) : null;

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of this.fields) fieldsContainer.appendChild(await gP.ui.buildField(field, this.entity?.[field.name]));
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.related-section').hidden = false;
          this.el.querySelector('select[name=personId]').innerHTML = this.persons.map((p) => `<option value="${p.id}">${gP.utils.personLabel(p)}</option>`).join('');
          this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddParticipant(e));
          await this.refreshParticipants();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Événement' });
      }
    }

    async refreshParticipants() {
      const participants = await gP.services.listParticipants('evenement', this.entity.id);
      const personsById = gP.utils.indexById(this.persons);
      const tbody = this.el.querySelector('.related-section tbody');
      tbody.innerHTML =
        participants
          .map((p) => `<tr><td>${gP.utils.personLabel(personsById.get(p.personId))}</td><td>${p.role || ''}</td><td><button type="button" class="button-danger-link" data-remove="${p.id}">Retirer</button></td></tr>`)
          .join('') || '<tr><td colspan="3">Aucun participant.</td></tr>';
      tbody.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', () => this.handleRemoveParticipant(btn.dataset.remove)));
    }

    async handleAddParticipant(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const personId = form.elements.namedItem('personId').value;
      const role = form.elements.namedItem('role').value;
      if (!personId) return;
      try {
        await gP.services.addParticipant('evenement', this.entity.id, personId, role);
        form.elements.namedItem('role').value = '';
        await this.refreshParticipants();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Événement' });
      }
    }

    async handleRemoveParticipant(participationId) {
      const ok = await gP.ui.confirmModal('Retirer cette personne ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.removeParticipant(participationId);
        await this.refreshParticipants();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Événement' });
      }
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      gP.ui.clearFormErrors(form);

      const values = gP.ui.readFormValues(this.fields, form);
      const errors = gP.utils.validate(this.fields, values);
      if (errors.size > 0) {
        gP.ui.showFormErrors(form, errors);
        return;
      }

      try {
        const saved = this.entity
          ? await gP.services.evenementRepository.update(this.entity.id, values)
          : await gP.services.evenementRepository.create(values);
        gP.ui.notify('Événement enregistré.', { type: 'success' });
        if (!this.entity) window.location.hash = `/agenda/evenements/${saved.id}`;
        else this.entity = saved;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Événement' });
      }
    }
  }

  function evenementFormPage(params) {
    return new EvenementFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { evenementsListPage, EvenementFormPage, evenementFormPage });
})(window.gP);
