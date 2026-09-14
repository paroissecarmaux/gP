(function (gP) {
  'use strict';

  function coreFields() {
    return [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Statut', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.TASK_STATUSES), default: 'À faire' },
      { name: 'priority', label: 'Priorité', type: 'select', required: true, options: gP.utils.staticOptions(gP.services.TASK_PRIORITIES), default: 'Normale' },
      { name: 'dueDate', label: 'Échéance', type: 'date' },
    ];
  }

  const taskColumns = [
    { label: 'Titre', key: 'title' },
    { label: 'Statut', key: 'status' },
    { label: 'Priorité', key: 'priority' },
    { label: 'Échéance', render: (row) => `${gP.utils.formatDate(row.dueDate)}${gP.services.isTaskOverdue(row) ? ' ⚠' : ''}` },
  ];

  function tasksListPage() {
    return new gP.ui.ListView({
      title: 'Tâches',
      repository: gP.services.taskRepository,
      columns: taskColumns,
      newPath: '/taches/new',
      editPath: (row) => `/taches/${row.id}`,
      sort: (a, b) => new Date(a.dueDate ?? 0) - new Date(b.dueDate ?? 0),
    });
  }

  function tasksOverdueListPage() {
    return new gP.ui.ListView({
      title: 'Tâches en retard',
      repository: gP.services.taskRepository,
      columns: taskColumns,
      editPath: (row) => `/taches/${row.id}`,
      filter: gP.services.isTaskOverdue,
      deletable: false,
    });
  }

  function tasksUrgentListPage() {
    return new gP.ui.ListView({
      title: 'Tâches urgentes',
      repository: gP.services.taskRepository,
      columns: taskColumns,
      editPath: (row) => `/taches/${row.id}`,
      filter: (row) => row.priority === 'Urgente' && row.status !== 'Terminé' && row.status !== 'Annulé',
      deletable: false,
    });
  }

  class TaskFormPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page form-view';
      el.innerHTML = `
        <div class="page-header">
          <h1>${this.props.id ? 'Modifier une tâche' : 'Nouvelle tâche'}</h1>
          <a href="#/taches">← Retour</a>
        </div>
        <form class="entity-form" novalidate>
          <div class="form-fields"></div>
          <div class="form-actions">
            <button type="submit" class="primary">Enregistrer</button>
            <a class="button-secondary" href="#/taches">Annuler</a>
          </div>
        </form>
        <section class="related-section" hidden>
          <h2>Affecté à</h2>
          <table class="data-table"><thead><tr><th>Qui</th><th></th></tr></thead><tbody></tbody></table>
          <form class="add-member-form">
            <select name="type">
              <option value="person">Personne</option>
              <option value="group">Groupe</option>
            </select>
            <select name="targetId"></select>
            <button type="submit">Affecter</button>
          </form>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        this.fields = coreFields();
        this.entity = this.props.id ? await gP.services.taskRepository.get(this.props.id) : null;
        this.persons = await gP.services.personRepository.list();
        this.groups = await gP.services.groupRepository.list();

        const fieldsContainer = this.el.querySelector('.form-fields');
        for (const field of this.fields) {
          const value = this.entity ? this.entity[field.name] : field.default;
          fieldsContainer.appendChild(await gP.ui.buildField(field, value));
        }
        this.el.querySelector('form.entity-form').addEventListener('submit', (e) => this.handleSubmit(e));

        if (this.entity) {
          this.el.querySelector('.related-section').hidden = false;
          const typeSelect = this.el.querySelector('select[name=type]');
          typeSelect.addEventListener('change', () => this.populateTargetSelect());
          this.populateTargetSelect();
          this.el.querySelector('.add-member-form').addEventListener('submit', (e) => this.handleAssign(e));
          await this.refreshAssignments();
        }
      } catch (error) {
        gP.utils.reportError(error, { source: 'Tâche' });
      }
    }

    populateTargetSelect() {
      const type = this.el.querySelector('select[name=type]').value;
      const targetSelect = this.el.querySelector('select[name=targetId]');
      const list = type === 'group' ? this.groups : this.persons;
      const label = (item) => (type === 'group' ? item.name : gP.utils.personLabel(item));
      targetSelect.innerHTML = list.map((item) => `<option value="${item.id}">${label(item)}</option>`).join('');
    }

    async refreshAssignments() {
      const assignments = await gP.services.listAssignmentsFor(this.entity.id);
      const personsById = gP.utils.indexById(this.persons);
      const groupsById = gP.utils.indexById(this.groups);
      const tbody = this.el.querySelector('.related-section tbody');
      tbody.innerHTML =
        assignments
          .map((a) => {
            const label = a.personId ? gP.utils.personLabel(personsById.get(a.personId)) : `Groupe : ${groupsById.get(a.groupId)?.name ?? ''}`;
            return `<tr><td>${label}</td><td><button type="button" class="button-danger-link" data-remove="${a.id}">Retirer</button></td></tr>`;
          })
          .join('') || '<tr><td colspan="2">Personne n\'est affecté.</td></tr>';
      tbody.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', () => this.handleRemoveAssignment(btn.dataset.remove)));
    }

    async handleAssign(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const type = form.elements.namedItem('type').value;
      const targetId = form.elements.namedItem('targetId').value;
      if (!targetId) return;
      try {
        if (type === 'group') await gP.services.assignGroupToTask(this.entity.id, targetId);
        else await gP.services.assignPersonToTask(this.entity.id, targetId);
        await this.refreshAssignments();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Tâche' });
      }
    }

    async handleRemoveAssignment(assignmentId) {
      const ok = await gP.ui.confirmModal('Retirer cette affectation ?', { confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      try {
        await gP.services.removeTaskAssignment(assignmentId);
        await this.refreshAssignments();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Tâche' });
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
        const saved = this.entity ? await gP.services.taskRepository.update(this.entity.id, values) : await gP.services.taskRepository.create(values);
        gP.ui.notify('Tâche enregistrée.', { type: 'success' });
        if (!this.entity) window.location.hash = `/taches/${saved.id}`;
        else this.entity = saved;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Tâche' });
      }
    }
  }

  function taskFormPage(params) {
    return new TaskFormPage({ id: params?.id ?? null });
  }

  Object.assign(gP.pages, { tasksListPage, tasksOverdueListPage, tasksUrgentListPage, TaskFormPage, taskFormPage });
})(window.gP);
