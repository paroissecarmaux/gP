import { registerCrudRoutes } from '../../ui/core/crud.js';
import { diocesanFeastRepository } from './repositories.js';
import { diocesanFeastColumns, diocesanFeastFields, diocesanFeastTransform } from './fields.js';
import { LiturgicalCalendarPage } from './LiturgicalCalendarPage.js';

const diocesanFeasts = registerCrudRoutes({
  path: '/liturgie/particularites',
  title: 'Particularités diocésaines',
  repository: diocesanFeastRepository,
  columns: diocesanFeastColumns,
  fields: diocesanFeastFields,
  transform: diocesanFeastTransform,
  sort: (a, b) => a.month - b.month || a.day - b.day,
});

export const routes = {
  '/liturgie': () => new LiturgicalCalendarPage(),
  ...diocesanFeasts.routes,
};

export const navSection = {
  section: 'Liturgie',
  items: [{ label: 'Calendrier liturgique', path: '/liturgie' }, diocesanFeasts.navItem],
};
