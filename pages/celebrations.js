(function (gP) {
  'use strict';

  async function loadContext() {
    const [lieux, persons, celebrations] = await Promise.all([
      gP.services.lieuRepository.list(),
      gP.services.personRepository.list(),
      gP.services.celebrationRepository.list(),
    ]);
    return { lieux, persons, celebrations, lieuxById: gP.utils.indexById(lieux), personsById: gP.utils.indexById(persons) };
  }

  function coreFields(ctx) {
    return [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: async () => gP.services.CELEBRATION_TYPES.map((t) => ({ value: t, label: t })) },
      { name: 'startAt', label: 'Début', type: 'datetime', required: true },
      { name: 'endAt', label: 'Fin', type: 'datetime', required: true },
      { name: 'lieuId', label: 'Lieu', type: 'select', options: async () => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
      { name: 'celebrantPersonId', label: 'Célébrant', type: 'select', options: async () => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
      { name: 'recurrenceFrequency', label: 'Récurrence', type: 'select', options: async () => gP.services.RECURRENCE_FREQUENCIES.map((f) => ({ value: f, label: f })), default: 'Aucune' },
      { name: 'recurrenceUntil', label: "Récurrence jusqu'au", type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
  }

  function celebrationsListPage() {
    return new gP.ui.ListView({
      title: 'Célébrations',
      repository: gP.services.celebrationRepository,
      columns: [
        { label: 'Titre', key: 'title' },
        { label: 'Type', key: 'type' },
        { label: 'Début', render: (row) => gP.utils.formatDateTime(row.startAt) },
        { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
        { label: 'Célébrant', render: (row, ctx) => gP.utils.personLabel(ctx.personsById.get(row.celebrantPersonId)) },
      ],
      prepareContext: loadContext,
      newPath: '/agenda/celebrations/new',
      editPath: (row) => `/agenda/celebrations/${row.id}`,
      sort: (a, b) => new Date(b.startAt) - new Date(a.startAt),
    });
  }

  class CelebrationFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier une célébration' : 'Nouvelle célébration'}</h1>
          <a href="#/agenda/celebrations">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/agenda/celebrations">Annuler</a>
          </div>
        </form>
        <section class="related-section" hidden>
          <h2>Participants</h2>
          <table class="data-table"><thead><tr><th>Personne</th><th>Rôle</th><th></th></tr></thead><tbody></tbody></table>
          <form class="add-member-form">
            <select name="personId"></select>
            <input type="text" name="role" placeholder="Rôle (ex. témoin, parrain…)" />
            <button type="submit">Ajouter</button>
          </form>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.ctx = await loadContext();
        this.entity = this.props.id ? await gP.services.celebrationRepository.get(this.props.id) : null;
        this.fields = coreFields(this.ctx);

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of this.fields) {
          const value = this.entity ? this.entity[field.name] : field.default;
          fieldsContainer.appendChild(await gP.ui.buildField(field, value, this.ctx));
        }
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.related-section').hidden = false;
          this.el.querySelector('select[name=personId]').innerHTML = this.ctx.persons.map((p) => `<option value="${p.id}">${gP.utils.personLabel(p)}</option>`).join('');
          this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddParticipant(e));
          await this.refreshParticipants();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Célébration' });
      }
    }

    async refreshParticipants() {
      const participants = await gP.services.listParticipants('celebration', this.entity.id);
      const tbody = this.el.querySelector('.related-section tbody');
      tbody.innerHTML =
        participants
          .map((p) => `<tr><td>${gP.utils.personLabel(this.ctx.personsById.get(p.personId))}</td><td>${p.role || ''}</td><td><button type="button" class="button-danger-link" data-remove="${p.id}">Retirer</button></td></tr>`)
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
        await gP.services.addParticipant('celebration', this.entity.id, personId, role);
        form.elements.namedItem('role').value = '';
        await this.refreshParticipants();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Célébration' });
      }
    }

    async handleRemoveParticipant(participationId) {
      const ok = await gP.ui.confirmModal('Retirer ce participant ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.removeParticipant(participationId);
        await this.refreshParticipants();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Célébration' });
      }
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      gP.ui.clearFormErrors(form);

      const values = {};
      for (const field of this.fields) values[field.name] = gP.ui.readFieldValue(field, form);

      const errors = gP.utils.validate(this.fields, values);
      if (errors.size > 0) {
        gP.ui.showFormErrors(form, errors);
        return;
      }

      const { recurrenceFrequency, recurrenceUntil, ...rest } = values;
      const occurrences = gP.services.computeOccurrences(rest.startAt, rest.endAt, recurrenceFrequency, recurrenceUntil);

      const conflicts = occurrences.flatMap((occ) => gP.services.findConflictsFor({ ...rest, ...occ, id: this.entity?.id }, this.ctx.celebrations));
      if (conflicts.length > 0) {
        const names = [...new Set(conflicts.map((c) => c.title))].join(', ');
        const proceed = await gP.ui.confirmModal(`Conflit d'agenda détecté avec : ${names} (même lieu ou même célébrant sur un horaire chevauchant). Enregistrer quand même ?`, {
          title: 'Conflit détecté',
          confirmLabel: 'Enregistrer quand même',
        });
        if (!proceed) return;
      }

      try {
        let saved = null;
        let first = true;
        for (const occ of occurrences) {
          const data = { ...rest, ...occ };
          if (this.entity && first) saved = await gP.services.celebrationRepository.update(this.entity.id, data);
          else saved = await gP.services.celebrationRepository.create(data);
          first = false;
        }
        gP.ui.notify(occurrences.length > 1 ? `${occurrences.length} célébrations enregistrées.` : 'Célébration enregistrée.', { type: 'success' });
        window.location.hash = this.entity ? `/agenda/celebrations/${this.entity.id}` : `/agenda/celebrations/${saved.id}`;
        if (this.entity) this.entity = saved;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Célébration' });
      }
    }
  }

  function celebrationFormPage(params) {
    return new CelebrationFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { celebrationsListPage, CelebrationFormPage, celebrationFormPage });
})(window.gP);
