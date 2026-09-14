import Dexie from '../vendor/dexie.mjs';
import { applyMigrations } from './migrations.js';
import { DatabaseError } from '../utils/errors.js';

export const db = new Dexie('gParoisse');
applyMigrations(db);

export async function openDatabase() {
  try {
    await db.open();
    return db;
  } catch (error) {
    throw new DatabaseError("Impossible d'ouvrir la base de données locale", { cause: error });
  }
}
