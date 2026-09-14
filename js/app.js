import { openDatabase } from './db/database.js';
import { installGlobalErrorHandlers, reportError, onError } from './utils/errors.js';
import { ensureCurrentInstallation } from './services/installation.js';
import { AppShell } from './ui/components.js';
import { Router } from './ui/router.js';
import { mountNotifications, notify } from './ui/notifications.js';
import { DashboardPage } from '../pages/dashboard.js';

// Navigation minimale V1 : un seul module (tableau de bord). Chaque
// version ajoutera ses entrées ici et ses routes ci-dessous, sans
// modification de l'architecture (voir docs/ARCHITECTURE.md).
const NAV_ITEMS = [{ label: 'Tableau de bord', path: '/' }];

const ROUTES = {
  '/': () => new DashboardPage(),
};

installGlobalErrorHandlers();

const appRoot = document.querySelector('#app');
const shell = new AppShell({ navItems: NAV_ITEMS });
shell.mount(appRoot);
mountNotifications(shell.notificationsSlot);

onError((error) => notify(error.message, { type: 'error', duration: 8000 }));

const router = new Router(ROUTES, shell.outlet);

openDatabase()
  .then(() => ensureCurrentInstallation('Poste principal'))
  .then(() => router.start())
  .catch((error) => reportError(error, { source: 'bootstrap' }));
