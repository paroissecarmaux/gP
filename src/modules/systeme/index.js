import './repositories.js';
import { DashboardPage } from './DashboardPage.js';
import { SearchPage } from './SearchPage.js';
import { SyncPage } from './SyncPage.js';

export const routes = {
  '/': () => new DashboardPage(),
  '/recherche': () => new SearchPage(),
  '/parametres/sauvegarde': () => new SyncPage(),
};

export const navSection = {
  section: 'Système',
  items: [
    { label: 'Tableau de bord', path: '/' },
    { label: 'Recherche', path: '/recherche' },
    { label: 'Sauvegarde & synchro', path: '/parametres/sauvegarde' },
  ],
};
