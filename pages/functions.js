import { ListView, FormView } from '../js/ui/components.js';
import { functionRepository } from '../js/services/functions.js';

const columns = [
  { label: 'Nom', key: 'name' },
  { label: 'Description', key: 'description' },
];

const fields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const sort = (a, b) => a.name.localeCompare(b.name);

export const functionsListPage = () =>
  new ListView({
    title: 'Fonctions',
    repository: functionRepository,
    columns,
    newPath: '/annuaire/fonctions/new',
    editPath: (row) => `/annuaire/fonctions/${row.id}`,
    sort,
  });

export const functionFormPage = (params) =>
  new FormView({
    title: params?.id ? 'Modifier une fonction' : 'Nouvelle fonction',
    repository: functionRepository,
    id: params?.id ?? null,
    fields,
    backPath: '/annuaire/fonctions',
  });
