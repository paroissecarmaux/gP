import './style.css';
import { installGlobalErrorHandlers, reportError } from './errors/errorHandler.js';
import { openDatabase } from './db/database.js';
import { AppShell } from './ui/layout/AppShell.js';
import { Router } from './ui/core/router.js';
import { ensureCurrentInstallation } from './services/installationService.js';
import { setCurrentInstallationId } from './services/session.js';

import * as systeme from './modules/systeme/index.js';
import * as annuaire from './modules/annuaire/index.js';
import * as territoireAgenda from './modules/territoire-agenda/index.js';
import * as taches from './modules/taches/index.js';
import * as intentions from './modules/intentions/index.js';
import * as secretariat from './modules/secretariat/index.js';
import * as sacrements from './modules/sacrements/index.js';
import * as quetes from './modules/quetes/index.js';
import * as transversal from './modules/transversal/index.js';
import * as liturgie from './modules/liturgie/index.js';

const modules = [
  systeme,
  annuaire,
  territoireAgenda,
  taches,
  intentions,
  secretariat,
  sacrements,
  quetes,
  transversal,
  liturgie,
];

installGlobalErrorHandlers();

const routes = Object.assign({}, ...modules.map((m) => m.routes));
const navSections = modules.map((m) => m.navSection).filter(Boolean);

const appRoot = document.querySelector('#app');
const shell = new AppShell({ navSections });
shell.mount(appRoot);

const router = new Router(routes, shell.outlet);

openDatabase()
  .then(() => ensureCurrentInstallation('Poste principal'))
  .then((installation) => {
    setCurrentInstallationId(installation.id);
    router.start();
  })
  .catch((error) => reportError(error, { source: 'bootstrap' }));
