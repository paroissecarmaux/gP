// Enregistre chaque version du schéma sur l'instance Dexie, dans l'ordre.
// `upgrade`, quand fourni pour une version, transforme les données
// existantes lors du passage à cette version (ex. remplir un nouveau champ
// obligatoire) — voir docs/MIGRATIONS.md pour la procédure complète.
(function (gP) {
  'use strict';

  const UPGRADES = {
    // 12: (tx) => { ... }
  };

  function applyMigrations(db) {
    const versions = Object.keys(gP.db.SCHEMA)
      .map(Number)
      .sort((a, b) => a - b);

    for (const version of versions) {
      const versioned = db.version(version).stores(gP.db.SCHEMA[version]);
      if (UPGRADES[version]) versioned.upgrade(UPGRADES[version]);
    }
  }

  gP.db.applyMigrations = applyMigrations;
})(window.gP);
