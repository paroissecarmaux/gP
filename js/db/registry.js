// Registre transversal des entités (voir docs/ENTITIES.md § V9) : chaque
// module s'y enregistre pour que la Corbeille, la Recherche globale et le
// tableau de bord (V10) fonctionnent sur TOUTE entité sans liste codée en
// dur ailleurs.
(function (gP) {
  'use strict';

  const entries = [];

  function registerEntity({ key, label, repository, searchFields = [], path = null }) {
    entries.push({ key, label, repository, searchFields, path });
  }

  function listRegisteredEntities() {
    return entries;
  }

  Object.assign(gP.db, { registerEntity, listRegisteredEntities });
})(window.gP);
