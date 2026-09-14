import { registerCrudRoutes } from '../../ui/core/crud.js';
import { ListView } from '../../ui/core/ListView.js';
import { taskRepository } from './repositories.js';
import { taskColumns, taskFields, taskFormContext, isOverdue } from './fields.js';

const tasks = registerCrudRoutes({
  path: '/taches',
  title: 'Tâches',
  repository: taskRepository,
  columns: taskColumns,
  fields: taskFields,
  prepareContext: taskFormContext,
  sort: (a, b) => new Date(a.dueDate ?? 0) - new Date(b.dueDate ?? 0),
});

export const routes = {
  ...tasks.routes,
  '/taches/en-retard': () =>
    new ListView({
      title: 'Tâches en retard',
      repository: taskRepository,
      columns: taskColumns,
      editPath: (row) => `/taches/${row.id}`,
      prepareContext: taskFormContext,
      filter: isOverdue,
      deletable: false,
    }),
  '/taches/urgentes': () =>
    new ListView({
      title: 'Tâches urgentes',
      repository: taskRepository,
      columns: taskColumns,
      editPath: (row) => `/taches/${row.id}`,
      prepareContext: taskFormContext,
      filter: (row) => row.priority === 'Urgente' && row.status !== 'Terminé' && row.status !== 'Annulé',
      deletable: false,
    }),
};

export const navSection = {
  section: 'Tâches',
  items: [tasks.navItem, { label: 'En retard', path: '/taches/en-retard' }, { label: 'Urgentes', path: '/taches/urgentes' }],
};
