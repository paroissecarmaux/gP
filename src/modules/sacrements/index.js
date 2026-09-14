import { registerCrudRoutes } from '../../ui/core/crud.js';
import { actRepository, noteRepository } from './repositories.js';
import { actColumns, actFields, actFormContext, noteColumns, noteFields, noteFormContext } from './fields.js';
import { CertificatePage } from './CertificatePage.js';

const acts = registerCrudRoutes({
  path: '/sacrements/actes',
  title: 'Actes sacramentels',
  repository: actRepository,
  columns: actColumns,
  fields: actFields,
  prepareContext: actFormContext,
  sort: (a, b) => new Date(b.date) - new Date(a.date),
  extraLinks: [{ label: 'Certificat', path: (entity) => `/sacrements/actes/${entity.id}/certificat` }],
});

const notes = registerCrudRoutes({
  path: '/sacrements/mentions',
  title: 'Mentions sacramentelles',
  repository: noteRepository,
  columns: noteColumns,
  fields: noteFields,
  prepareContext: noteFormContext,
  sort: (a, b) => new Date(b.date) - new Date(a.date),
});

export const routes = {
  ...acts.routes,
  '/sacrements/actes/:id/certificat': (params) => new CertificatePage({ id: params.id }),
  ...notes.routes,
};

export const navSection = {
  section: 'Sacrements',
  items: [acts.navItem, notes.navItem],
};
