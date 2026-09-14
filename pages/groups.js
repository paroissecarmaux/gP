(function (gP) {
  'use strict';

  const columns = [
    { label: 'Nom', key: 'name' },
    { label: 'Description', key: 'description' },
  ];

  const coreFields = [
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];

  function groupsListPage() {
    return new gP.ui.ListView({
      title: 'Groupes',
      repository: gP.services.groupRepository,
      columns,
      newPath: '/annuaire/groupes/new',
      editPath: (row) => `/annuaire/groupes/${row.id}`,
      sort: (a, b) => a.name.localeCompare(b.name),
    });
  }

  class GroupFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier un groupe' : 'Nouveau groupe'}</h1>
          <a href="#/annuaire/groupes">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/annuaire/groupes">Annuler</a>
          </div>
        </form>
        <section class="members-section" hidden>
          <h2>Membres</h2>
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
        this.entity = this.props.id ? await gP.services.groupRepository.get(this.props.id) : null;

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of coreFields) {
          fieldsContainer.appendChild(await gP.ui.buildField(field, this.entity?.[field.name]));
        }
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.members-section').hidden = false;
          this.persons = await gP.services.personRepository.list();
          this.populatePersonSelect();
          this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddMember(e));
          await this.refreshMembers();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Groupe' });
      }
    }

    populatePersonSelect() {
      const select = this.el.querySelector('select[name=personId]');
      select.innerHTML = this.persons.map((p) => `<option value="${p.id}">${gP.utils.personLabel(p)}</option>`).join('');
    }

    async refreshMembers() {
      const memberships = await gP.services.groupsListMembersOf(this.entity.id);
      const personsById = new Map(this.persons.map((p) => [p.id, p]));
      const tbody = this.el.querySelector('.members-section tbody');
      tbody.innerHTML = memberships
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
        await gP.services.groupsAddMember(this.entity.id, personId, { role });
        form.elements.namedItem('role').value = '';
        await this.refreshMembers();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Groupe' });
      }
    }

    async handleRemoveMember(membershipId) {
      const ok = await gP.ui.confirmModal('Retirer cette personne du groupe ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.groupsRemoveMember(membershipId);
        await this.refreshMembers();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Groupe' });
      }
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      gP.ui.clearFormErrors(form);

      const values = gP.ui.readFormValues(coreFields, form);
      const errors = gP.utils.validate(coreFields, values);
      if (errors.size > 0) {
        gP.ui.showFormErrors(form, errors);
        return;
      }

      try {
        const saved = this.entity
          ? await gP.services.groupRepository.update(this.entity.id, values)
          : await gP.services.groupRepository.create(values);
        gP.ui.notify('Groupe enregistré.', { type: 'success' });
        if (!this.entity) {
          window.location.hash = `/annuaire/groupes/${saved.id}`;
        } else {
          this.entity = saved;
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Groupe' });
      }
    }
  }

  function groupFormPage(params) {
    return new GroupFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { groupsListPage, GroupFormPage, groupFormPage });
})(window.gP);
