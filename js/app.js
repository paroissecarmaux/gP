import { openDatabase } from './db/database.js';
import { installGlobalErrorHandlers, reportError, onError } from './utils/errors.js';
import { ensureCurrentInstallation } from './services/installation.js';
import { AppShell } from './ui/components.js';
import { Router } from './ui/router.js';
import { mountNotifications, notify } from './ui/notifications.js';
import { mountModals } from './ui/modals.js';
import { DashboardPage } from '../pages/dashboard.js';
import { peopleListPage, personFormPage } from '../pages/people.js';
import { familiesListPage, familyFormPage } from '../pages/families.js';
import { groupsListPage, groupFormPage } from '../pages/groups.js';
import { functionsListPage, functionFormPage } from '../pages/functions.js';

// Chaque version ajoute ses entrées de navigation et ses routes ici, sans
// modification de l'architecture (voir docs/ARCHITECTURE.md).
const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/' },
  { label: 'Personnes', path: '/annuaire/personnes' },
  { label: 'Familles', path: '/annuaire/familles' },
  { label: 'Groupes', path: '/annuaire/groupes' },
  { label: 'Fonctions', path: '/annuaire/fonctions' },
];

const ROUTES = {
  '/': () => new DashboardPage(),

  '/annuaire/personnes': peopleListPage,
  '/annuaire/personnes/new': personFormPage,
  '/annuaire/personnes/:id': personFormPage,

  '/annuaire/familles': familiesListPage,
  '/annuaire/familles/new': familyFormPage,
  '/annuaire/familles/:id': familyFormPage,

  '/annuaire/groupes': groupsListPage,
  '/annuaire/groupes/new': groupFormPage,
  '/annuaire/groupes/:id': groupFormPage,

  '/annuaire/fonctions': functionsListPage,
  '/annuaire/fonctions/new': functionFormPage,
  '/annuaire/fonctions/:id': functionFormPage,
};

installGlobalErrorHandlers();

const appRoot = document.querySelector('#app');
const shell = new AppShell({ navItems: NAV_ITEMS });
shell.mount(appRoot);
mountNotifications(shell.notificationsSlot);
mountModals(shell.modalsSlot);

onError((error) => notify(error.message, { type: 'error', duration: 8000 }));

const router = new Router(ROUTES, shell.outlet);

openDatabase()
  .then(() => ensureCurrentInstallation('Poste principal'))
  .then(() => router.start())
  .catch((error) => reportError(error, { source: 'bootstrap' }));
