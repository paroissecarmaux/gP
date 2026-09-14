// Recherche globale (voir docs/ENTITIES.md § V10), fondée sur le registre
// transversal (js/db/registry.js) : couvre automatiquement toute entité
// enregistrée, sans liste codée en dur.
(function (gP) {
  'use strict';

  function matches(row, fields, query) {
    return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(query));
  }

  async function globalSearch(query) {
    const lower = query.trim().toLowerCase();
    if (!lower) return [];

    const sections = [];
    for (const entry of gP.db.listRegisteredEntities()) {
      if (entry.searchFields.length === 0) continue;
      const rows = await entry.repository.list();
      const found = rows.filter((row) => matches(row, entry.searchFields, lower));
      if (found.length > 0) sections.push({ entry, found });
    }
    return sections;
  }

  gP.services.globalSearch = globalSearch;
})(window.gP);
