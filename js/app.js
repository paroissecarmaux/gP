(function (gP) {
  'use strict';

  // Chaque version ajoute ses entrées de navigation et ses routes ici, sans
  // modification de l'architecture (voir docs/ARCHITECTURE.md).
  const NAV_ITEMS = [
    { label: 'Tableau de bord', path: '/' },
    { label: 'Personnes', path: '/annuaire/personnes' },
    { label: 'Familles', path: '/annuaire/familles' },
    { label: 'Groupes', path: '/annuaire/groupes' },
    { label: 'Fonctions', path: '/annuaire/fonctions' },
    { label: 'Agenda', path: '/agenda' },
    { label: 'Célébrations', path: '/agenda/celebrations' },
    { label: 'Événements', path: '/agenda/evenements' },
    { label: 'Secteurs', path: '/territoire/secteurs' },
    { label: 'Clochers', path: '/territoire/clochers' },
    { label: 'Lieux', path: '/territoire/lieux' },
  ];

  const ROUTES = {
    '/': () => new gP.pages.DashboardPage(),

    '/annuaire/personnes': gP.pages.peopleListPage,
    '/annuaire/personnes/new': gP.pages.personFormPage,
    '/annuaire/personnes/:id': gP.pages.personFormPage,

    '/annuaire/familles': gP.pages.familiesListPage,
    '/annuaire/familles/new': gP.pages.familyFormPage,
    '/annuaire/familles/:id': gP.pages.familyFormPage,

    '/annuaire/groupes': gP.pages.groupsListPage,
    '/annuaire/groupes/new': gP.pages.groupFormPage,
    '/annuaire/groupes/:id': gP.pages.groupFormPage,

    '/annuaire/fonctions': gP.pages.functionsListPage,
    '/annuaire/fonctions/new': gP.pages.functionFormPage,
    '/annuaire/fonctions/:id': gP.pages.functionFormPage,

    '/territoire/secteurs': gP.pages.sectorsListPage,
    '/territoire/secteurs/new': gP.pages.sectorFormPage,
    '/territoire/secteurs/:id': gP.pages.sectorFormPage,

    '/territoire/clochers': gP.pages.clochersListPage,
    '/territoire/clochers/new': gP.pages.clocherFormPage,
    '/territoire/clochers/:id': gP.pages.clocherFormPage,

    '/territoire/lieux': gP.pages.lieuxListPage,
    '/territoire/lieux/new': gP.pages.lieuFormPage,
    '/territoire/lieux/:id': gP.pages.lieuFormPage,

    '/agenda': () => new gP.pages.AgendaPage(),

    '/agenda/evenements': gP.pages.evenementsListPage,
    '/agenda/evenements/new': gP.pages.evenementFormPage,
    '/agenda/evenements/:id': gP.pages.evenementFormPage,

    '/agenda/celebrations': gP.pages.celebrationsListPage,
    '/agenda/celebrations/new': gP.pages.celebrationFormPage,
    '/agenda/celebrations/:id': gP.pages.celebrationFormPage,
  };

  gP.utils.installGlobalErrorHandlers();

  const appRoot = document.querySelector('#app');
  const shell = new gP.ui.AppShell({ navItems: NAV_ITEMS });
  shell.mount(appRoot);
  gP.ui.mountNotifications(shell.notificationsSlot);
  gP.ui.mountModals(shell.modalsSlot);

  gP.utils.onError((error) => gP.ui.notify(error.message, { type: 'error', duration: 8000 }));

  const router = new gP.ui.Router(ROUTES, shell.outlet);

  gP.db
    .openDatabase()
    .then(() => gP.services.ensureCurrentInstallation('Poste principal'))
    .then(() => router.start())
    .catch((error) => gP.utils.reportError(error, { source: 'bootstrap' }));
})(window.gP);
