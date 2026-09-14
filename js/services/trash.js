// Corbeille : pas de table dédiée, vue calculée sur toutes les entités
// enregistrées (js/db/registry.js) dont deletedAt est renseigné — voir
// docs/ENTITIES.md § V9.
(function (gP) {
  'use strict';

  async function listTrashSections() {
    const sections = [];
    for (const entry of gP.db.listRegisteredEntities()) {
      const all = await entry.repository.list({ includeDeleted: true });
      const deleted = all.filter((row) => row.deletedAt != null);
      if (deleted.length > 0) sections.push({ entry, deleted });
    }
    return sections;
  }

  gP.services.listTrashSections = listTrashSections;
})(window.gP);
