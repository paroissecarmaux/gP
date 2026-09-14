// Métadonnées obligatoires sur toute entité métier importante (section 5 du
// prompt maître) : identifiant global, traçabilité temporelle, suppression
// douce, provenance et compteur de révision pour la fusion lors de la
// synchronisation entre installations (voir docs/SYNCHRONIZATION.md).
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
