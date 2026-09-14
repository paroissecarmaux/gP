import { db } from './database.js';
import { createEntity, touch, softDelete } from '../utils/syncMeta.js';
import { getCurrentInstallationId } from '../services/session.js';
import { recordHistory } from '../services/historyService.js';
import { DatabaseError } from '../errors/AppError.js';

async function withDatabaseError(action, message) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(message, { cause: error });
  }
}

export class Repository {
  constructor(tableName, entityType) {
    this.tableName = tableName;
    this.entityType = entityType;
  }

  get table() {
    return db[this.tableName];
  }

  async list({ includeDeleted = false } = {}) {
    return withDatabaseError(async () => {
      const all = await this.table.toArray();
      return includeDeleted ? all : all.filter((item) => item.deletedAt == null);
    }, `Impossible de lister ${this.entityType}`);
  }

  async get(id) {
    return withDatabaseError(
      () => this.table.get(id),
      `Impossible de récupérer ${this.entityType} ${id}`,
    );
  }

  async create(fields) {
    return withDatabaseError(async () => {
      const entity = createEntity(fields, getCurrentInstallationId());
      await this.table.put(entity);
      await recordHistory(this.entityType, entity.id, 'create');
      return entity;
    }, `Impossible de créer ${this.entityType}`);
  }

  async update(id, fields) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityType} ${id} introuvable`);
      const updated = touch({ ...existing, ...fields });
      await this.table.put(updated);
      await recordHistory(this.entityType, id, 'update');
      return updated;
    }, `Impossible de modifier ${this.entityType} ${id}`);
  }

  async remove(id) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityType} ${id} introuvable`);
      const deleted = softDelete(existing);
      await this.table.put(deleted);
      await recordHistory(this.entityType, id, 'delete');
      return deleted;
    }, `Impossible de supprimer ${this.entityType} ${id}`);
  }

  async restore(id) {
    return withDatabaseError(async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new DatabaseError(`${this.entityType} ${id} introuvable`);
      const restored = touch({ ...existing, deletedAt: null });
      await this.table.put(restored);
      await recordHistory(this.entityType, id, 'restore');
      return restored;
    }, `Impossible de restaurer ${this.entityType} ${id}`);
  }

  async hardDelete(id) {
    return withDatabaseError(async () => {
      await this.table.delete(id);
      await recordHistory(this.entityType, id, 'purge');
    }, `Impossible de purger ${this.entityType} ${id}`);
  }
}
