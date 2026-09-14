import { Component, ListView } from '../js/ui/components.js';
import { buildField, readFormValues, showFormErrors, clearFormErrors } from '../js/ui/forms.js';
import { confirmModal } from '../js/ui/modals.js';
import { notify } from '../js/ui/notifications.js';
import { validate } from '../js/utils/validation.js';
import { reportError } from '../js/utils/errors.js';
import { personLabel } from '../js/utils/formatting.js';
import { personRepository } from '../js/services/people.js';
import { groupRepository, listMembersOf, addMember, removeMember } from '../js/services/groups.js';

const columns = [
  { label: 'Nom', key: 'name' },
  { label: 'Description', key: 'description' },
];

const coreFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export const groupsListPage = () =>
  new ListView({
    title: 'Groupes',
    repository: groupRepository,
    columns,
    newPath: '/annuaire/groupes/new',
    editPath: (row) => `/annuaire/groupes/${row.id}`,
    sort: (a, b) => a.name.localeCompare(b.name),
  });

export class GroupFormPage extends Component {
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
      this.entity = this.props.id ? await groupRepository.get(this.props.id) : null;

      const fieldsContainer = this.el.querySelector('.form-fields');
      for (const field of coreFields) {
        fieldsContainer.appendChild(await buildField(field, this.entity?.[field.name]));
      }
      this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

      if (this.entity) {
        this.el.querySelector('.members-section').hidden = false;
        this.persons = await personRepository.list();
        this.populatePersonSelect();
        this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddMember(e));
        await this.refreshMembers();
      }
    } catch (error) {
      reportError(error, { source: 'Groupe' });
    }
  }

  populatePersonSelect() {
    const select = this.el.querySelector('select[name=personId]');
    select.innerHTML = this.persons.map((p) => `<option value="${p.id}">${personLabel(p)}</option>`).join('');
  }

  async refreshMembers() {
    const memberships = await listMembersOf(this.entity.id);
    const personsById = new Map(this.persons.map((p) => [p.id, p]));
    const tbody = this.el.querySelector('.members-section tbody');
    tbody.innerHTML = memberships
      .map(
        (m) => `
        <tr>
          <td>${personLabel(personsById.get(m.personId))}</td>
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
      await addMember(this.entity.id, personId, { role });
      form.elements.namedItem('role').value = '';
      await this.refreshMembers();
    } catch (error) {
      reportError(error, { source: 'Groupe' });
    }
  }

  async handleRemoveMember(membershipId) {
    const ok = await confirmModal('Retirer cette personne du groupe ?', { confirmLabel: 'Retirer', danger: true });
    if (!ok) return;
    try {
      await removeMember(membershipId);
      await this.refreshMembers();
    } catch (error) {
      reportError(error, { source: 'Groupe' });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    clearFormErrors(form);

    const values = readFormValues(coreFields, form);
    const errors = validate(coreFields, values);
    if (errors.size > 0) {
      showFormErrors(form, errors);
      return;
    }

    try {
      const saved = this.entity ? await groupRepository.update(this.entity.id, values) : await groupRepository.create(values);
      notify('Groupe enregistré.', { type: 'success' });
      if (!this.entity) {
        window.location.hash = `/annuaire/groupes/${saved.id}`;
      } else {
        this.entity = saved;
      }
    } catch (error) {
      reportError(error, { source: 'Groupe' });
    }
  }
}

export const groupFormPage = (params) => new GroupFormPage({ id: params?.id ?? null });
