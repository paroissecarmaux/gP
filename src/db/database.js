import Dexie from 'dexie';
import { migrations } from './migrations.js';
import { DatabaseError } from '../errors/AppError.js';

export const db = new Dexie('gParoisse');

for (const migration of migrations) {
  const version = db.version(migration.version).stores(migration.stores);
  if (migration.upgrade) {
    version.upgrade(migration.upgrade);
  }
}

export async function openDatabase() {
  try {
    await db.open();
    return db;
  } catch (error) {
    throw new DatabaseError('Impossible d\'ouvrir la base de données locale', { cause: error });
  }
}
