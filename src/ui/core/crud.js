import { ListView } from './ListView.js';
import { FormView } from './FormView.js';

export function registerCrudRoutes({
  path,
  title,
  repository,
  columns,
  fields,
  prepareContext,
  filter,
  sort,
  transform,
  FormComponent = FormView,
  deletable,
  extraLinks,
}) {
  const routes = {
    [path]: () =>
      new ListView({
        title,
        repository,
        columns,
        newPath: `${path}/new`,
        editPath: (row) => `${path}/${row.id}`,
        prepareContext,
        filter,
        sort,
        deletable,
      }),
    [`${path}/new`]: () =>
      new FormComponent({
        title: `${title} — Nouveau`,
        repository,
        id: null,
        fields,
        prepareContext,
        backPath: path,
        transform,
      }),
    [`${path}/:id`]: (params) =>
      new FormComponent({
        title: `${title} — Modifier`,
        repository,
        id: params.id,
        fields,
        prepareContext,
        backPath: path,
        transform,
        extraLinks,
      }),
  };

  return { routes, navItem: { label: title, path } };
}
