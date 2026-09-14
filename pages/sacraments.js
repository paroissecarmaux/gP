(function (gP) {
  'use strict';

  // --- Registre ----------------------------------------------------------
  async function registerContext() {
    const clochers = await gP.services.clocherRepository.list();
    return { clochers, clochersById: gP.utils.indexById(clochers) };
  }

  const registerFields = [
    { name: 'type', label: 'Type', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.ACT_TYPES) },
    { name: 'label', label: 'Libellé', type: 'text', required: true },
    { name: 'clocherId', label: 'Clocher', type: 'select', options: (ctx) => ctx.clochers.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'openedAt', label: 'Ouvert le', type: 'date' },
    { name: 'closedAt', label: 'Fermé le', type: 'date' },
  ];

  function registersListPage() {
    return new gP.ui.ListView({
      title: 'Registres sacramentels',
      repository: gP.services.sacramentalRegisterRepository,
      columns: [
        { label: 'Type', key: 'type' },
        { label: 'Libellé', key: 'label' },
        { label: 'Clocher', render: (row, ctx) => ctx.clochersById.get(row.clocherId)?.name ?? '' },
      ],
      prepareContext: registerContext,
      newPath: '/sacrements/registres/new',
      editPath: (row) => `/sacrements/registres/${row.id}`,
      sort: (a, b) => a.label.localeCompare(b.label),
    });
  }

  function registerFormPage(params) {
    return new gP.ui.FormView({
      title: params?.id ? 'Modifier un registre' : 'Nouveau registre',
      repository: gP.services.sacramentalRegisterRepository,
      id: params?.id ?? null,
      fields: registerFields,
      prepareContext: registerContext,
      backPath: '/sacrements/registres',
    });
  }

  // --- Acte ----------------------------------------------------------------
  async function actContext() {
    const [registers, persons, lieux] = await Promise.all([
      gP.services.sacramentalRegisterRepository.list(),
      gP.services.personRepository.list(),
      gP.services.lieuRepository.list(),
    ]);
    return { registers, persons, lieux, personsById: gP.utils.indexById(persons), lieuxById: gP.utils.indexById(lieux) };
  }

  const actFields = [
    { name: 'registerId', label: 'Registre', type: 'select', required: true, options: (ctx) => ctx.registers.map((r) => ({ value: r.id, label: r.label })) },
    { name: 'type', label: "Type d'acte", type: 'select', required: true, options: gP.utils.staticOptions(gP.services.ACT_TYPES) },
    { name: 'actNumber', label: 'Numéro dans le registre', type: 'number' },
    { name: 'personId', label: 'Personne concernée', type: 'select', required: true, options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'lieuId', label: 'Lieu', type: 'select', options: (ctx) => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
    { name: 'celebrantPersonId', label: 'Célébrant', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'witnessPersonIds', label: 'Témoins / parrain-marraine / conjoint', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })) },
    { name: 'details', label: 'Particularités', type: 'textarea' },
  ];

  function actsListPage() {
    return new gP.ui.ListView({
      title: 'Actes sacramentels',
      repository: gP.services.sacramentalActRepository,
      columns: [
        { label: 'Type', key: 'type' },
        { label: 'Personne', render: (row, ctx) => gP.utils.personLabel(ctx.personsById.get(row.personId)) },
        { label: 'Date', render: (row) => gP.utils.formatDate(row.date) },
        { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
      ],
      prepareContext: actContext,
      newPath: '/sacrements/actes/new',
      editPath: (row) => `/sacrements/actes/${row.id}`,
      sort: (a, b) => new Date(b.date) - new Date(a.date),
    });
  }

  class ActFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier un acte' : 'Nouvel acte'}</h1>
          <a href="#/sacrements/actes">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/sacrements/actes">Annuler</a>
          </div>
        </form>
        <section class="related-section" hidden>
          <p><a class="button-secondary" data-certificate-link href="#">Générer le certificat</a></p>
          <h2>Mentions marginales</h2>
          <table class="data-table"><thead><tr><th>Date</th><th>Texte</th></tr></thead><tbody></tbody></table>
          <form class="add-note-form">
            <input type="date" name="date" required />
            <input type="text" name="text" placeholder="Texte de la mention" required />
            <button type="submit">Ajouter</button>
          </form>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.ctx = await actContext();
        this.entity = this.props.id ? await gP.services.sacramentalActRepository.get(this.props.id) : null;

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of actFields) fieldsContainer.appendChild(await gP.ui.buildField(field, this.entity?.[field.name], this.ctx));
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.related-section').hidden = false;
          this.el.querySelector('[data-certificate-link]').href = `#/sacrements/actes/${this.entity.id}/certificat`;
          this.el.querySelector('.add-note-form').addEventListener('submit', (e) => this.handleAddNote(e));
          await this.refreshNotes();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Acte sacramentel' });
      }
    }

    async refreshNotes() {
      const notes = await gP.services.listNotesForAct(this.entity.id);
      const tbody = this.el.querySelector('.related-section tbody');
      tbody.innerHTML =
        notes.map((n) => `<tr><td>${gP.utils.formatDate(n.date)}</td><td>${n.text}</td></tr>`).join('') || '<tr><td colspan="2">Aucune mention.</td></tr>';
    }

    async handleAddNote(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const date = form.elements.namedItem('date').value;
      const text = form.elements.namedItem('text').value;
      if (!date || !text) return;
      try {
        await gP.services.sacramentalNoteRepository.create({ actId: this.entity.id, date: new Date(date), text, relatedActId: null });
        form.reset();
        await this.refreshNotes();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Acte sacramentel' });
      }
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      gP.ui.clearFormErrors(form);

      const values = gP.ui.readFormValues(actFields, form);
      const errors = gP.utils.validate(actFields, values);
      if (errors.size > 0) {
        gP.ui.showFormErrors(form, errors);
        return;
      }

      try {
        const saved = this.entity
          ? await gP.services.sacramentalActRepository.update(this.entity.id, values)
          : await gP.services.sacramentalActRepository.create(values);
        gP.ui.notify('Acte enregistré.', { type: 'success' });
        window.location.hash = `/sacrements/actes/${saved.id}`;
        this.entity = saved;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Acte sacramentel' });
      }
    }
  }

  function actFormPage(params) {
    return new ActFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { registersListPage, registerFormPage, actsListPage, ActFormPage, actFormPage });
})(window.gP);
