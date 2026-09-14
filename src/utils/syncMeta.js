import { generateId } from './uuid.js';

export function createEntity(fields, originInstallationId) {
  const now = new Date();
  return {
    id: generateId(),
    ...fields,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    originInstallationId,
    revision: 1,
  };
}

export function touch(entity) {
  return {
    ...entity,
    updatedAt: new Date(),
    revision: entity.revision + 1,
  };
}

export function softDelete(entity) {
  const now = new Date();
  return {
    ...entity,
    deletedAt: now,
    updatedAt: now,
    revision: entity.revision + 1,
  };
}

export function isDeleted(entity) {
  return entity.deletedAt != null;
}
