// Couche d'accès générique à une table Dexie : CRUD + soft delete +
// métadonnées de synchronisation systématiques. Introduite en V2 (décision
// révisée par rapport à la V1, voir docs/ARCHITECTURE.md § Décisions
// architecturales) : avec dix tables ajoutées d'un coup pour l'annuaire,
// dupliquer cette logique dans chaque service violerait la règle
// « éviter toute duplication inutile » (section 3 du cahier des charges).
//
// Depuis V9, chaque mutation journalise automatiquement une entrée dans
// l'historique transversal (js/services/history.js) : c'est ce qui rend
// l'historique et la Corbeille valables pour TOUTE entité passée par ici,
// sans code répété dans chaque service.
(function (gP) {
  'use strict';

  async function withDatabaseError(action, message) {
    try {
      return await action();
    } catch (error) {
      if (error instanceof gP.utils.DatabaseError) throw error;
      throw new gP.utils.DatabaseError(message, { cause: error });
    }
  }

  function recordHistory(entityType, entityId, action) {
    // Optionnel tant que js/services/history.js n'est pas chargé (aucune
    // version antérieure à V9 n'en a besoin) ; toujours présent une fois
    // l'application complète chargée.
    return gP.services.recordHistory?.(entityType, entityId, action);
  }

  class Repository {
    constructor(tableName, entityLabel) {
      this.tableName = tableName;
      this.entityLabel = entityLabel;
    }

    get table() {
      return gP.db.db[this.tableName];
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
        const entity = gP.utils.createEntity(fields, gP.services.getCurrentInstallationId());
        await this.table.put(entity);
        await recordHistory(this.entityLabel, entity.id, 'create');
        return entity;
      }, `Impossible de créer : ${this.entityLabel}`);
    }

    async update(id, fields) {
      return withDatabaseError(async () => {
        const existing = await this.table.get(id);
        if (!existing) throw new gP.utils.DatabaseError(`${this.entityLabel} ${id} introuvable`);
        const updated = gP.utils.touch({ ...existing, ...fields });
        await this.table.put(updated);
        await recordHistory(this.entityLabel, id, 'update');
        return updated;
      }, `Impossible de modifier : ${this.entityLabel}`);
    }

    /** Suppression douce : l'enregistrement reste en base (deletedAt renseigné). */
    async remove(id) {
      return withDatabaseError(async () => {
        const existing = await this.table.get(id);
        if (!existing) throw new gP.utils.DatabaseError(`${this.entityLabel} ${id} introuvable`);
        const deleted = gP.utils.softDelete(existing);
        await this.table.put(deleted);
        await recordHistory(this.entityLabel, id, 'delete');
        return deleted;
      }, `Impossible de supprimer : ${this.entityLabel}`);
    }

    async restore(id) {
      return withDatabaseError(async () => {
        const existing = await this.table.get(id);
        if (!existing) throw new gP.utils.DatabaseError(`${this.entityLabel} ${id} introuvable`);
        const restored = gP.utils.touch({ ...existing, deletedAt: null });
        await this.table.put(restored);
        await recordHistory(this.entityLabel, id, 'restore');
        return restored;
      }, `Impossible de restaurer : ${this.entityLabel}`);
    }

    /** Suppression définitive (Corbeille, V9 uniquement) : à utiliser avec
     * prudence, jamais comme suppression par défaut. */
    async hardDelete(id) {
      return withDatabaseError(async () => {
        await this.table.delete(id);
        await recordHistory(this.entityLabel, id, 'purge');
      }, `Impossible de purger définitivement : ${this.entityLabel}`);
    }

    async listWhere(predicate, options) {
      const all = await this.list(options);
      return all.filter(predicate);
    }
  }

  gP.db.Repository = Repository;
})(window.gP);
