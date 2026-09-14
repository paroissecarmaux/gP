// Couche d'accès générique à une table Dexie : CRUD + soft delete +
// métadonnées de synchronisation systématiques. Introduite en V2 (décision
// révisée par rapport à la V1, voir docs/ARCHITECTURE.md § Décisions
// architecturales) : avec dix tables ajoutées d'un coup pour l'annuaire,
// dupliquer cette logique dans chaque service violerait la règle
// « éviter toute duplication inutile » (section 3 du cahier des charges).
import { db } from './database.js';
import { createEntity, touch, softDelete } from '../utils/syncMeta.js';
import { getCurrentInstallationId } from '../services/installation.js';
import { DatabaseError } from '../utils/errors.js';

async function withDatabaseError(action, message) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(message, { cause: error });
  }
}

export class Repository {
  constructor(tableName, entityLabel) {
    this.tableName = tableName;
    this.entityLabel = entityLabel;
  }

  get table() {
    return db[this.tableName];
  }

  async list({ includeDeleted = false } = {}) {
    return withDatabaseError(async () => {
      const all = await this.table.toArray();
      return includeDeleted ? all : all.filter((row) => row.deletedAt == null);
    }, `Impossible de lister : ${this.entityLabel}`);
  }

  async get(id) {
    return withDatabaseError(() => this.table.get(id), `Impossible de récupérer : ${this.entityLabel}`);
  }

  async create(fields) {
    return withDatabaseError(async () => {
      const entity = createEntity(fields, getCurrentInstallationId());
      await this.table.put(entity);
      return entity;
    }, `Impossible de créer : ${this.entityLabel}`);
  }

  async update(id, fields) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityLabel} ${id} introuvable`);
      const updated = touch({ ...existing, ...fields });
      await this.table.put(updated);
      return updated;
    }, `Impossible de modifier : ${this.entityLabel}`);
  }

  /** Suppression douce : l'enregistrement reste en base (deletedAt renseigné). */
  async remove(id) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityLabel} ${id} introuvable`);
      const deleted = softDelete(existing);
      await this.table.put(deleted);
      return deleted;
    }, `Impossible de supprimer : ${this.entityLabel}`);
  }

  async restore(id) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityLabel} ${id} introuvable`);
      const restored = touch({ ...existing, deletedAt: null });
      await this.table.put(restored);
      return restored;
    }, `Impossible de restaurer : ${this.entityLabel}`);
  }

  async listWhere(predicate, options) {
    const all = await this.list(options);
    return all.filter(predicate);
  }
}
