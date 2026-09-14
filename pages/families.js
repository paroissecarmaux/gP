import { Component, ListView } from '../js/ui/components.js';
import { buildField, readFormValues, showFormErrors, clearFormErrors } from '../js/ui/forms.js';
import { confirmModal } from '../js/ui/modals.js';
import { notify } from '../js/ui/notifications.js';
import { validate } from '../js/utils/validation.js';
import { reportError } from '../js/utils/errors.js';
import { personLabel } from '../js/utils/formatting.js';
import { personRepository } from '../js/services/people.js';
import { familyRepository, listMembersOf, addMember, removeMember } from '../js/services/families.js';
import { indexById } from '../js/utils/indexBy.js';

function coreFields(persons) {
  return [
    { name: 'name', label: 'Nom de famille', type: 'text', required: true },
    {
      name: 'headPersonId',
      label: 'Chef de famille',
      type: 'select',
      options: async () => persons.map((p) => ({ value: p.id, label: personLabel(p) })),
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];
}

export const familiesListPage = () =>
  new ListView({
    title: 'Familles',
    repository: familyRepository,
    columns: [
      { label: 'Nom', key: 'name' },
      {
        label: 'Chef de famille',
        render: (row, ctx) => personLabel(ctx?.personsById?.get(row.headPersonId)),
      },
    ],
    prepareContext: async () => {
      const persons = await personRepository.list();
      return { personsById: indexById(persons) };
    },
    newPath: '/annuaire/familles/new',
    editPath: (row) => `/annuaire/familles/${row.id}`,
    sort: (a, b) => a.name.localeCompare(b.name),
  });

const MEMBER_ROLES = ['Chef de famille', 'Conjoint', 'Enfant', 'Autre'];

export class FamilyFormPage extends Component {
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
      this.persons = await personRepository.list();
      this.entity = this.props.id ? await familyRepository.get(this.props.id) : null;
      this.fields = coreFields(this.persons);

      const fieldsContainer = this.el.querySelector('.form-fields');
      for (const field of this.fields) {
        fieldsContainer.appendChild(await buildField(field, this.entity?.[field.name]));
      }
      this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

      if (this.entity) {
        this.el.querySelector('.members-section').hidden = false;
        this.populatePersonSelect();
        this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAddMember(e));
        await this.refreshMembers();
      }
    } catch (error) {
      reportError(error, { source: 'Famille' });
    }
  }

  populatePersonSelect() {
    const select = this.el.querySelector('select[name=personId]');
    select.innerHTML = this.persons.map((p) => `<option value="${p.id}">${personLabel(p)}</option>`).join('');
  }

  async refreshMembers() {
    const members = await listMembersOf(this.entity.id);
    const personsById = new Map(this.persons.map((p) => [p.id, p]));
    const tbody = this.el.querySelector('.members-section tbody');
    tbody.innerHTML = members
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
      await addMember(this.entity.id, personId, role);
      await this.refreshMembers();
    } catch (error) {
      reportError(error, { source: 'Famille' });
    }
  }

  async handleRemoveMember(memberId) {
    const ok = await confirmModal('Retirer cette personne de la famille ?', { confirmLabel: 'Retirer', danger: true });
    if (!ok) return;
    try {
      await removeMember(memberId);
      await this.refreshMembers();
    } catch (error) {
      reportError(error, { source: 'Famille' });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    clearFormErrors(form);

    const values = readFormValues(this.fields, form);
    const errors = validate(this.fields, values);
    if (errors.size > 0) {
      showFormErrors(form, errors);
      return;
    }

    try {
      const saved = this.entity ? await familyRepository.update(this.entity.id, values) : await familyRepository.create(values);
      notify('Famille enregistrée.', { type: 'success' });
      if (!this.entity) {
        window.location.hash = `/annuaire/familles/${saved.id}`;
      } else {
        this.entity = saved;
      }
    } catch (error) {
      reportError(error, { source: 'Famille' });
    }
  }
}

export const familyFormPage = (params) => new FamilyFormPage({ id: params?.id ?? null });
