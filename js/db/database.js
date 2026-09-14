// `Dexie` est un global fourni par js/vendor/dexie.js (chargé en script
// classique avant ce fichier — voir index.html).
(function (gP) {
  'use strict';

  const db = new Dexie('gParoisse');
  gP.db.applyMigrations(db);

  async function openDatabase() {
    try {
      await db.open();
      return db;
    } catch (error) {
      throw new gP.utils.DatabaseError("Impossible d'ouvrir la base de données locale", { cause: error });
    }
  }

  Object.assign(gP.db, { db, openDatabase });
})(window.gP);
