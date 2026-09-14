(function (gP) {
  'use strict';

  const requestRepository = new gP.db.Repository('secretariatRequests', 'Demande secrétariat');

  const REQUEST_TYPES = ['Certificat de baptême', 'Certificat de mariage', 'Certificat de confirmation', 'Acte administratif', 'Autre'];
  const REQUEST_STATUSES = ['Ouverte', 'En cours', 'En attente', 'Terminée', 'Annulée'];
  const REQUEST_PRIORITIES = ['Normale', 'Importante', 'Urgente'];

  function isRequestOverdue(request) {
    return request.status !== 'Terminée' && request.status !== 'Annulée' && request.dueDate && new Date(request.dueDate) < new Date();
  }

  function isRequestOpen(request) {
    return request.status === 'Ouverte' || request.status === 'En cours' || request.status === 'En attente';
  }

  Object.assign(gP.services, {
    requestRepository,
    REQUEST_TYPES,
    REQUEST_STATUSES,
    REQUEST_PRIORITIES,
    isRequestOverdue,
    isRequestOpen,
  });

  gP.db.registerEntity({
    key: 'secretariatRequests',
    label: 'Demande secrétariat',
    repository: requestRepository,
    searchFields: ['type'],
    path: '/secretariat',
  });
})(window.gP);
