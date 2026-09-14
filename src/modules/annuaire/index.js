import { registerCrudRoutes } from '../../ui/core/crud.js';
import { functionRepository, groupRepository, personRepository, familyRepository } from './repositories.js';
import {
  functionColumns,
  functionFields,
  groupColumns,
  groupFields,
  personColumns,
  personFields,
  personFormContext,
  familyColumns,
  familyFields,
  familyFormContext,
} from './fields.js';

const persons = registerCrudRoutes({
  path: '/annuaire/personnes',
  title: 'Personnes',
  repository: personRepository,
  columns: personColumns,
  fields: personFields,
  prepareContext: personFormContext,
  sort: (a, b) => a.lastName.localeCompare(b.lastName),
});

const families = registerCrudRoutes({
  path: '/annuaire/familles',
  title: 'Familles',
  repository: familyRepository,
  columns: familyColumns,
  fields: familyFields,
  prepareContext: familyFormContext,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const groups = registerCrudRoutes({
  path: '/annuaire/groupes',
  title: 'Groupes',
  repository: groupRepository,
  columns: groupColumns,
  fields: groupFields,
  sort: (a, b) => a.name.localeCompare(b.name),
});

const functions = registerCrudRoutes({
  path: '/annuaire/fonctions',
  title: 'Fonctions',
  repository: functionRepository,
  columns: functionColumns,
  fields: functionFields,
  sort: (a, b) => a.name.localeCompare(b.name),
});

export const routes = {
  ...persons.routes,
  ...families.routes,
  ...groups.routes,
  ...functions.routes,
};

export const navSection = {
  section: 'Annuaire',
  items: [persons.navItem, families.navItem, groups.navItem, functions.navItem],
};
