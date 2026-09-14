import { registerCrudRoutes } from '../../ui/core/crud.js';
import { collectionRepository, countRepository, remittanceRepository } from './repositories.js';
import {
  collectionColumns,
  collectionFields,
  collectionFormContext,
  countColumns,
  countFields,
  countFormContext,
  remittanceColumns,
  remittanceFields,
  remittanceFormContext,
} from './fields.js';
import { StatsPage } from './StatsPage.js';

const collections = registerCrudRoutes({
  path: '/quetes/collectes',
  title: 'Collectes',
  repository: collectionRepository,
  columns: collectionColumns,
  fields: collectionFields,
  prepareContext: collectionFormContext,
  sort: (a, b) => new Date(b.date) - new Date(a.date),
});

const counts = registerCrudRoutes({
  path: '/quetes/comptages',
  title: 'Comptages',
  repository: countRepository,
  columns: countColumns,
  fields: countFields,
  prepareContext: countFormContext,
  sort: (a, b) => new Date(b.countedAt) - new Date(a.countedAt),
});

const remittances = registerCrudRoutes({
  path: '/quetes/remises',
  title: 'Remises',
  repository: remittanceRepository,
  columns: remittanceColumns,
  fields: remittanceFields,
  prepareContext: remittanceFormContext,
  sort: (a, b) => new Date(b.date) - new Date(a.date),
});

export const routes = {
  ...collections.routes,
  ...counts.routes,
  ...remittances.routes,
  '/quetes/statistiques': () => new StatsPage(),
};

export const navSection = {
  section: 'Quêtes',
  items: [collections.navItem, counts.navItem, remittances.navItem, { label: 'Statistiques', path: '/quetes/statistiques' }],
};
