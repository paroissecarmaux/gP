import { registerCrudRoutes } from '../../ui/core/crud.js';
import { supplierRepository, documentRepository } from './repositories.js';
import { supplierColumns, supplierFields, documentColumns, documentFields, documentFormContext, documentTransform } from './fields.js';
import { TrashPage } from './TrashPage.js';
import { HistoryPage } from './HistoryPage.js';
import { IntegrityPage } from './IntegrityPage.js';

const suppliers = registerCrudRoutes({
  path: '/fournisseurs',
  title: 'Fournisseurs',
  repository: supplierRepository,
  columns: supplierColumns,
  fields: supplierFields,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const documents = registerCrudRoutes({
  path: '/documents',
  title: 'Documents',
  repository: documentRepository,
  columns: documentColumns,
  fields: documentFields,
  prepareContext: documentFormContext,
  transform: documentTransform,
  sort: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
});

export const routes = {
  ...suppliers.routes,
  ...documents.routes,
  '/corbeille': () => new TrashPage(),
  '/historique': () => new HistoryPage(),
  '/integrite': () => new IntegrityPage(),
};

export const navSection = {
  section: 'Transversal',
  items: [
    suppliers.navItem,
    documents.navItem,
    { label: 'Corbeille', path: '/corbeille' },
    { label: 'Historique', path: '/historique' },
    { label: "Contrôles d'intégrité", path: '/integrite' },
  ],
};
