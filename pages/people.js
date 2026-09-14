(function (gP) {
  'use strict';

  const CIVILITIES = ['M.', 'Mme', 'Mlle', 'Abbé', 'Père', 'Mgr'];
  const CONTRACT_TYPES = ['CDI', 'CDD', 'Bénévolat indemnisé', 'Vacation'];
  const COORDONNEE_LABELS = ['Domicile', 'Travail', 'Autre'];

  const CORE_FIELDS = [
    { name: 'civility', label: 'Civilité', type: 'select', options: gP.utils.staticOptions(CIVILITIES) },
    { name: 'firstName', label: 'Prénom', type: 'text', required: true },
    { name: 'lastName', label: 'Nom', type: 'text', required: true },
    { name: 'birthDate', label: 'Date de naissance', type: 'date' },
    { name: 'deathDate', label: 'Date de décès', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  function peopleListPage() {
    return new gP.ui.ListView({
      title: 'Personnes',
      repository: gP.services.personRepository,
      columns: [
        { label: 'Nom', key: 'lastName' },
        { label: 'Prénom', key: 'firstName' },
        { label: 'Naissance', render: (row) => gP.utils.formatDate(row.birthDate) },
      ],
      newPath: '/annuaire/personnes/new',
      editPath: (row) => `/annuaire/personnes/${row.id}`,
      sort: (a, b) => a.lastName.localeCompare(b.lastName),
    });
  }

  class PersonFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view person-form';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier une personne' : 'Nouvelle personne'}</h1>
          <a href="#/annuaire/personnes">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>

          <fieldset class="profile-fieldset">
            <legend><label><input type="checkbox" name="isVolunteer" /> Bénévole</label></legend>
            <div class="profile-fields" data-profile="volunteer"></div>
          </fieldset>

          <fieldset class="profile-fieldset">
            <legend><label><input type="checkbox" name="isClergy" /> Membre du clergé</label></legend>
            <div class="profile-fields" data-profile="clergy"></div>
          </fieldset>

          <fieldset class="profile-fieldset">
            <legend><label><input type="checkbox" name="isEmployee" /> Salarié</label></legend>
            <div class="profile-fields" data-profile="employee"></div>
          </fieldset>

          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/annuaire/personnes">Annuler</a>
          </div>
        </form>

        <section class="related-section" hidden>
          <h2>Coordonnées</h2>
          <table class="data-table"><thead><tr><th>Libellé</th><th>Téléphone</th><th>Email</th><th>Adresse</th></tr></thead><tbody class="coordonnees-body"></tbody></table>
          <form class="add-coordonnee-form">
            <select name="label">${COORDONNEE_LABELS.map((l) => `<option value="${l}">${l}</option>`).join('')}</select>
            <input type="text" name="phone" placeholder="Téléphone" />
            <input type="text" name="email" placeholder="Email" />
            <input type="text" name="street" placeholder="Adresse" />
            <input type="text" name="postalCode" placeholder="Code postal" />
            <input type="text" name="city" placeholder="Ville" />
            <button type="submit">Ajouter</button>
          </form>

          <h2>Fonctions occupées</h2>
          <table class="data-table"><thead><tr><th>Fonction</th><th>Depuis</th><th></th></tr></thead><tbody class="functions-body"></tbody></table>
          <form class="add-function-form">
            <select name="functionId"></select>
            <button type="submit">Assigner</button>
          </form>

          <h2>Groupes</h2>
          <ul class="groups-list"></ul>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.entity = this.props.id ? await gP.services.personRepository.get(this.props.id) : null;

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of CORE_FIELDS) {
          fieldsContainer.appendChild(await gP.ui.buildField(field, this.entity?.[field.name]));
        }

        await this.setupProfileFieldset('volunteer', await (this.entity ? gP.services.getVolunteerProfile(this.entity.id) : null), [
          { name: 'skills', label: 'Compétences', type: 'text' },
          { name: 'availability', label: 'Disponibilités', type: 'text' },
        ]);
        await this.setupProfileFieldset('clergy', await (this.entity ? gP.services.getClergyProfile(this.entity.id) : null), [
          { name: 'title', label: 'Titre (Curé, Vicaire, Diacre…)', type: 'text' },
          { name: 'ordinationDate', label: "Date d'ordination", type: 'date' },
          { name: 'assignment', label: 'Affectation', type: 'text' },
        ]);
        await this.setupProfileFieldset('employee', await (this.entity ? gP.services.getEmployeeProfile(this.entity.id) : null), [
          { name: 'position', label: 'Poste', type: 'text' },
          { name: 'contractType', label: 'Type de contrat', type: 'select', options: gP.utils.staticOptions(CONTRACT_TYPES) },
          { name: 'startDate', label: "Date d'embauche", type: 'date' },
        ]);

        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.related-section').hidden = false;
          this.el.querySelector('.add-coordonnee-form').addEventListener('submit', (e) => this.handleAddCoordonnee(e));
          this.el.querySelector('.add-function-form').addEventListener('submit', (e) => this.handleAssignFunction(e));
          await this.populateFunctionSelect();
          await this.refreshCoordonnees();
          await this.refreshFunctions();
          await this.refreshGroups();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Personne' });
      }
    }

    async setupProfileFieldset(key, profile, subFields) {
      const container0 = this.el.querySelector(`[data-profile="${key}"]`);
      const fieldset = container0.closest('fieldset');
      const checkbox = fieldset.querySelector('input[type=checkbox]');
      const container = fieldset.querySelector('.profile-fields');

      checkbox.checked = Boolean(profile);
      for (const field of subFields) {
        container.appendChild(await gP.ui.buildField(field, profile?.[field.name]));
      }
      container.hidden = !checkbox.checked;
      checkbox.addEventListener('change', () => {
        container.hidden = !checkbox.checked;
      });

      this[`${key}Fields`] = subFields;
    }

    async populateFunctionSelect() {
      const functions = await gP.services.functionRepository.list();
      this.functionsById = gP.utils.indexById(functions);
      this.el.querySelector('select[name=functionId]').innerHTML = functions
        .map((f) => `<option value="${f.id}">${f.name}</option>`)
        .join('');
    }

    async refreshCoordonnees() {
      const coordonnees = await gP.services.listForOwner('personne', this.entity.id);
      const tbody = this.el.querySelector('.coordonnees-body');
      tbody.innerHTML =
        coordonnees
          .map(
            (c) => `
          <tr>
            <td>${c.label ?? ''}</td>
            <td>${c.phone ?? ''}</td>
            <td>${c.email ?? ''}</td>
            <td>${[c.street, c.postalCode, c.city].filter(Boolean).join(', ')}</td>
          </tr>`,
          )
          .join('') || '<tr><td colspan="4">Aucune coordonnée enregistrée.</td></tr>';
    }

    async refreshFunctions() {
      const assignments = await gP.services.listFunctionsForPerson(this.entity.id);
      const tbody = this.el.querySelector('.functions-body');
      tbody.innerHTML =
        assignments
          .map(
            (a) => `
          <tr>
            <td>${this.functionsById.get(a.functionId)?.name ?? ''}</td>
            <td>${gP.utils.formatDate(a.startDate)}</td>
            <td><button type="button" class="button-danger-link" data-end="${a.id}">Retirer</button></td>
          </tr>`,
          )
          .join('') || '<tr><td colspan="3">Aucune fonction assignée.</td></tr>';

      tbody.querySelectorAll('[data-end]').forEach((btn) =>
        btn.addEventListener('click', () => this.handleEndFunction(btn.dataset.end)),
      );
    }

    async refreshGroups() {
      const memberships = await gP.services.listGroupsForPerson(this.entity.id);
      const groups = await gP.services.groupRepository.list();
      const groupsById = gP.utils.indexById(groups);
      const list = this.el.querySelector('.groups-list');
      list.innerHTML =
        memberships
          .map((m) => `<li><a href="#/annuaire/groupes/${m.groupId}">${groupsById.get(m.groupId)?.name ?? ''}</a>${m.role ? ` — ${m.role}` : ''}</li>`)
          .join('') || '<li>Aucun groupe.</li>';
    }

    async handleAddCoordonnee(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        await gP.services.addCoordonnee('personne', this.entity.id, data);
        form.reset();
        await this.refreshCoordonnees();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Personne' });
      }
    }

    async handleAssignFunction(event) {
      event.preventDefault();
      const functionId = event.currentTarget.elements.namedItem('functionId').value;
      if (!functionId) return;
      try {
        await gP.services.assignFunction(this.entity.id, functionId);
        await this.refreshFunctions();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Personne' });
      }
    }

    async handleEndFunction(assignmentId) {
      const ok = await gP.ui.confirmModal('Retirer cette fonction ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.endFunctionAssignment(assignmentId);
        await this.refreshFunctions();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Personne' });
      }
    }

    async saveProfiles(personId, form) {
      const readProfile = async (key, repository) => {
        const checkbox = form.elements.namedItem(`is${key[0].toUpperCase()}${key.slice(1)}`);
        const enabled = checkbox.checked;
        const values = {};
        for (const field of this[`${key}Fields`]) values[field.name] = gP.ui.readFieldValue(field, form);
        await gP.services.setProfile(repository, personId, enabled, values);
      };

      await readProfile('volunteer', gP.services.volunteerRepository);
      await readProfile('clergy', gP.services.clergyRepository);
      await readProfile('employee', gP.services.employeeRepository);
    }

    async handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;

      const values = {};
      for (const field of CORE_FIELDS) values[field.name] = gP.ui.readFieldValue(field, form);

      if (!values.firstName || !values.lastName) {
        gP.ui.notify('Le prénom et le nom sont obligatoires.', { type: 'error' });
        return;
      }

      try {
        if (!this.entity) {
          const duplicates = await gP.services.findPotentialDuplicates(values.firstName, values.lastName);
          if (duplicates.length > 0) {
            const proceed = await gP.ui.confirmModal(
              `Une personne du même nom existe déjà : ${duplicates.map(gP.utils.personLabel).join(', ')}. Enregistrer quand même ?`,
              { title: 'Doublon potentiel', confirmLabel: 'Enregistrer quand même' },
            );
            if (!proceed) return;
          }
        }

        const saved = this.entity
          ? await gP.services.personRepository.update(this.entity.id, values)
          : await gP.services.personRepository.create(values);
        await this.saveProfiles(saved.id, form);
        gP.ui.notify('Personne enregistrée.', { type: 'success' });
        this.entity = saved;
        window.location.hash = `/annuaire/personnes/${saved.id}`;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Personne' });
      }
    }
  }

  function personFormPage(params) {
    return new PersonFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { peopleListPage, PersonFormPage, personFormPage });
})(window.gP);
