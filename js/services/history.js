// Historique transversal (voir docs/ENTITIES.md § V9). Alimenté
// automatiquement par js/db/repository.js à chaque création, modification,
// suppression douce ou restauration de n'importe quelle entité — jamais
// appelé directement par les pages.
(function (gP) {
  'use strict';

  async function recordHistory(entityType, entityId, action) {
    await gP.db.db.history.put({
      id: gP.utils.generateId(),
      entityType,
      entityId,
      action,
      occurredAt: new Date(),
      installationId: gP.services.getCurrentInstallationId(),
    });
  }

  async function historyForEntity(entityType, entityId) {
    const rows = await gP.db.db.history.where({ entityType, entityId }).toArray();
    return rows.sort((a, b) => b.occurredAt - a.occurredAt);
  }

  async function recentHistory(limit = 100) {
    return gP.db.db.history.orderBy('occurredAt').reverse().limit(limit).toArray();
  }

  Object.assign(gP.services, { recordHistory, historyForEntity, recentHistory });
})(window.gP);
