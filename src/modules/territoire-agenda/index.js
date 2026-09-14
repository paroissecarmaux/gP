import { registerCrudRoutes } from '../../ui/core/crud.js';
import { sectorRepository, clocherRepository, lieuRepository, celebrationRepository } from './repositories.js';
import {
  sectorColumns,
  sectorFields,
  clocherColumns,
  clocherFields,
  clocherFormContext,
  lieuColumns,
  lieuFields,
  lieuFormContext,
  celebrationColumns,
  celebrationFields,
  celebrationFormContext,
} from './fields.js';
import { CelebrationFormView } from './CelebrationFormView.js';
import { AgendaPage } from './AgendaPage.js';

const sectors = registerCrudRoutes({
  path: '/territoire/secteurs',
  title: 'Secteurs',
  repository: sectorRepository,
  columns: sectorColumns,
  fields: sectorFields,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const clochers = registerCrudRoutes({
  path: '/territoire/clochers',
  title: 'Clochers',
  repository: clocherRepository,
  columns: clocherColumns,
  fields: clocherFields,
  prepareContext: clocherFormContext,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const lieux = registerCrudRoutes({
  path: '/territoire/lieux',
  title: 'Lieux',
  repository: lieuRepository,
  columns: lieuColumns,
  fields: lieuFields,
  prepareContext: lieuFormContext,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const celebrations = registerCrudRoutes({
  path: '/agenda/celebrations',
  title: 'Célébrations',
  repository: celebrationRepository,
  columns: celebrationColumns,
  fields: celebrationFields,
  prepareContext: celebrationFormContext,
  sort: (a, b) => new Date(b.startAt) - new Date(a.startAt),
  FormComponent: CelebrationFormView,
});

export const routes = {
  '/agenda': () => new AgendaPage(),
  ...celebrations.routes,
  ...sectors.routes,
  ...clochers.routes,
  ...lieux.routes,
};

export const navSection = {
  section: 'Territoire & Agenda',
  items: [
    { label: 'Agenda', path: '/agenda' },
    celebrations.navItem,
    sectors.navItem,
    clochers.navItem,
    lieux.navItem,
  ],
};
