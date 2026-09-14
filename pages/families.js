(function (gP) {
  'use strict';

  function coreFields(persons) {
    return [
      { name: 'name', label: 'Nom de famille', type: 'text', required: true },
      {
        name: 'headPersonId',
        label: 'Chef de famille',
        type: 'select',
        options: async () => persons.map((p) => ({ value: p.id, label: gP.utils.personLabel(p) })),
      },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
  }

  function familiesListPage() {
    return new gP.ui.ListView({
      title: 'Familles',
      repository: gP.services.familyRepository,
      columns: [
        { label: 'Nom', key: 'name' },
        {
          label: 'Chef de famille',
          render: (row, ctx) => gP.utils.personLabel(ctx?.personsById?.get(row.headPersonId)),
        },
      ],
      prepareContext: async () => {
        const persons = await gP.services.personRepository.list();
        return { personsById: gP.utils.indexById(persons) };
      },
      newPath: '/annuaire/familles/new',
      editPath: (row) => `/annuaire/familles/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  const MEMBER_ROLES = ['Chef de famille', 'Conjoint', 'Enfant', 'Autre'];

  class FamilyFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier une famille' : 'Nouvelle famille'}</h1>
          <a href="#/annuaire/familles">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/annuaire/familles">Annuler</a>
          </div>
        </form>
        <section class="members-section" hidden>
          <h2>Membres</h2>
          <table class="data-table"><thead><tr><th>Personne</th><th>Rôle</th><th></th></tr></thead><tbody></tbody></table>
          <form class="add-member-form">
            <select name="personId"></select>
            <select name="role">${MEMBER_ROLES.map((r) => `<option value="${r}">${r}</option>`).join('')}</select>
            <button type="submit">Ajouter</button>
          </form>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.persons = await gP.services.personRepository.list();
        this.entity = this.props.id ? await gP.services.familyRepository.get(this.props.id) : null;
        this.fields = coreFields(this.persons);

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of this.fields) {
          fieldsContainer.appendChild(await gP.ui.buildField(field, this.entity?.[field.name]));
        }
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.members-section').hidden = false;
          this.populatePersonSelect();
          this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddMember(e));
          await this.refreshMembers();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Famille' });
      }
    }

    populatePersonSelect() {
      const select = this.el.querySelector('select[name=personId]');
      select.innerHTML = this.persons.map((p) => `<option value="${p.id}">${gP.utils.personLabel(p)}</option>`).join('');
    }

    async refreshMembers() {
      const members = await gP.services.familiesListMembersOf(this.entity.id);
      const personsById = new Map(this.persons.map((p) => [p.id, p]));
      const tbody = this.el.querySelector('.members-section tbody');
      tbody.innerHTML = members
        .map(
          (m) => `
          <tr>
            <td>${gP.utils.personLabel(personsById.get(m.personId))}</td>
            <td>${m.role || ''}</td>
            <td><button type="button" class="button-danger-link" data-remove="${m.id}">Retirer</button></td>
          </tr>`,
        )
        .join('') || '<tr><td colspan="3">Aucun membre.</td></tr>';

      tbody.querySelectorAll('[data-remove]').forEach((btn) =>
        btn.addEventListener('click', () => this.handleRemoveMember(btn.dataset.remove)),
      );
    }

    async handleAddMember(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const personId = form.elements.namedItem('personId').value;
      const role = form.elements.namedItem('role').value;
      if (!personId) return;
      try {
        await gP.services.familiesAddMember(this.entity.id, personId, role);
        await this.refreshMembers();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Famille' });
      }
    }

    async handleRemoveMember(memberId) {
      const ok = await gP.ui.confirmModal('Retirer cette personne de la famille ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.familiesRemoveMember(memberId);
        await this.refreshMembers();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Famille' });
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
          ? await gP.services.familyRepository.update(this.entity.id, values)
          : await gP.services.familyRepository.create(values);
        gP.ui.notify('Famille enregistrée.', { type: 'success' });
        if (!this.entity) {
          window.location.hash = `/annuaire/familles/${saved.id}`;
        } else {
          this.entity = saved;
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Famille' });
      }
    }
  }

  function familyFormPage(params) {
    return new FamilyFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { familiesListPage, FamilyFormPage, familyFormPage });
})(window.gP);
