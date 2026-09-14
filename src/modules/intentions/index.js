import { registerCrudRoutes } from '../../ui/core/crud.js';
import { intentionRepository, paymentRepository } from './repositories.js';
import {
  intentionColumns,
  intentionFields,
  intentionFormContext,
  paymentColumns,
  paymentFields,
  paymentFormContext,
} from './fields.js';

const intentions = registerCrudRoutes({
  path: '/intentions',
  title: 'Intentions de messe',
  repository: intentionRepository,
  columns: intentionColumns,
  fields: intentionFields,
  prepareContext: intentionFormContext,
  sort: (a, b) => a.requesterName.localeCompare(b.requesterName),
});

const payments = registerCrudRoutes({
  path: '/intentions/paiements',
  title: 'Paiements',
  repository: paymentRepository,
  columns: paymentColumns,
  fields: paymentFields,
  prepareContext: paymentFormContext,
  sort: (a, b) => new Date(b.date) - new Date(a.date),
});

export const routes = { ...intentions.routes, ...payments.routes };

export const navSection = {
  section: 'Intentions',
  items: [intentions.navItem, payments.navItem],
};
