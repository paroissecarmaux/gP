(function (gP) {
  'use strict';

  // Chaque version ajoute ses entrées de navigation et ses routes ici, sans
  // modification de l'architecture (voir docs/ARCHITECTURE.md).
  const NAV_ITEMS = [
    { label: 'Tableau de bord', path: '/' },
    { label: 'Recherche', path: '/recherche' },
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
    { label: 'Tâches', path: '/taches' },
    { label: 'Intentions', path: '/intentions' },
    { label: 'Paiements', path: '/intentions/paiements' },
    { label: 'Secrétariat', path: '/secretariat' },
    { label: 'Registres', path: '/sacrements/registres' },
    { label: 'Actes sacramentels', path: '/sacrements/actes' },
    { label: 'Collectes', path: '/quetes/collectes' },
    { label: 'Comptages', path: '/quetes/comptages' },
    { label: 'Remises', path: '/quetes/remises' },
    { label: 'Stats quêtes', path: '/quetes/statistiques' },
    { label: 'Fournisseurs', path: '/fournisseurs' },
    { label: 'Documents', path: '/documents' },
    { label: 'Corbeille', path: '/corbeille' },
    { label: 'Historique', path: '/historique' },
    { label: 'Sauvegarde & synchro', path: '/parametres/sauvegarde' },
    { label: 'Conflits', path: '/parametres/conflits' },
    { label: 'Calendrier liturgique', path: '/liturgie' },
  ];

  const ROUTES = {
    '/': () => new gP.pages.DashboardPage(),
    '/recherche': () => new gP.pages.SearchPage(),

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

    '/taches': gP.pages.tasksListPage,
    '/taches/en-retard': gP.pages.tasksOverdueListPage,
    '/taches/urgentes': gP.pages.tasksUrgentListPage,
    '/taches/new': gP.pages.taskFormPage,
    '/taches/:id': gP.pages.taskFormPage,

    '/intentions': gP.pages.intentionsListPage,
    '/intentions/new': gP.pages.intentionFormPage,
    '/intentions/paiements': gP.pages.paymentsListPage,
    '/intentions/paiements/new': gP.pages.paymentFormPage,
    '/intentions/paiements/:id': gP.pages.paymentFormPage,
    '/intentions/:id': gP.pages.intentionFormPage,

    '/secretariat': gP.pages.secretariatListPage,
    '/secretariat/ouvertes': gP.pages.secretariatOpenListPage,
    '/secretariat/en-retard': gP.pages.secretariatOverdueListPage,
    '/secretariat/new': gP.pages.secretariatFormPage,
    '/secretariat/:id': gP.pages.secretariatFormPage,

    '/sacrements/registres': gP.pages.registersListPage,
    '/sacrements/registres/new': gP.pages.registerFormPage,
    '/sacrements/registres/:id': gP.pages.registerFormPage,
    '/sacrements/actes': gP.pages.actsListPage,
    '/sacrements/actes/new': gP.pages.actFormPage,
    '/sacrements/actes/:id/certificat': gP.pages.certificatePage,
    '/sacrements/actes/:id': gP.pages.actFormPage,

    '/quetes/collectes': gP.pages.collectionsListPage,
    '/quetes/collectes/new': gP.pages.collectionFormPage,
    '/quetes/collectes/:id': gP.pages.collectionFormPage,
    '/quetes/comptages': gP.pages.countsListPage,
    '/quetes/comptages/new': gP.pages.countFormPage,
    '/quetes/comptages/:id': gP.pages.countFormPage,
    '/quetes/remises': gP.pages.remittancesListPage,
    '/quetes/remises/new': gP.pages.remittanceFormPage,
    '/quetes/remises/:id': gP.pages.remittanceFormPage,
    '/quetes/statistiques': () => new gP.pages.QuetesStatsPage(),

    '/fournisseurs': gP.pages.suppliersListPage,
    '/fournisseurs/new': gP.pages.supplierFormPage,
    '/fournisseurs/:id': gP.pages.supplierFormPage,

    '/documents': gP.pages.documentsListPage,
    '/documents/new': gP.pages.documentFormPage,
    '/documents/:id': gP.pages.documentFormPage,

    '/corbeille': () => new gP.pages.TrashPage(),
    '/historique': () => new gP.pages.HistoryPage(),

    '/parametres/sauvegarde': () => new gP.pages.SyncPage(),
    '/parametres/conflits': () => new gP.pages.ConflictsPage(),

    '/liturgie': () => new gP.pages.LiturgicalCalendarPage(),
    '/liturgie/particularites': gP.pages.diocesanFeastsListPage,
    '/liturgie/particularites/new': gP.pages.diocesanFeastFormPage,
    '/liturgie/particularites/:id': gP.pages.diocesanFeastFormPage,
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
