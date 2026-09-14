import { registerCrudRoutes } from '../../ui/core/crud.js';
import { ListView } from '../../ui/core/ListView.js';
import { requestRepository } from './repositories.js';
import { requestColumns, requestFields, requestFormContext, isRequestOverdue } from './fields.js';

const requests = registerCrudRoutes({
  path: '/secretariat',
  title: 'Demandes secrétariat',
  repository: requestRepository,
  columns: requestColumns,
  fields: requestFields,
  prepareContext: requestFormContext,
  sort: (a, b) => new Date(a.dueDate ?? 0) - new Date(b.dueDate ?? 0),
});

export const routes = {
  ...requests.routes,
  '/secretariat/ouvertes': () =>
    new ListView({
      title: 'Demandes ouvertes',
      repository: requestRepository,
      columns: requestColumns,
      editPath: (row) => `/secretariat/${row.id}`,
      prepareContext: requestFormContext,
      filter: (row) => row.status === 'Ouverte' || row.status === 'En cours' || row.status === 'En attente',
      deletable: false,
    }),
  '/secretariat/en-retard': () =>
    new ListView({
      title: 'Demandes en retard',
      repository: requestRepository,
      columns: requestColumns,
      editPath: (row) => `/secretariat/${row.id}`,
      prepareContext: requestFormContext,
      filter: isRequestOverdue,
      deletable: false,
    }),
};

export const navSection = {
  section: 'Secrétariat',
  items: [
    requests.navItem,
    { label: 'Ouvertes', path: '/secretariat/ouvertes' },
    { label: 'En retard', path: '/secretariat/en-retard' },
  ],
};
