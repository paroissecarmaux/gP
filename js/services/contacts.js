// Coordonnées / adresses, entité indépendante à propriétaire polymorphe
// (« personne » ou « famille ») — voir docs/ENTITIES.md.
import { Repository } from '../db/repository.js';

export const coordonneeRepository = new Repository('coordonnees', 'Coordonnée');

export async function listForOwner(ownerType, ownerId) {
  const all = await coordonneeRepository.list();
  return all.filter((row) => row.ownerType === ownerType && row.ownerId === ownerId);
}

export async function addCoordonnee(ownerType, ownerId, fields) {
  return coordonneeRepository.create({ ownerType, ownerId, isPrimary: false, ...fields });
}
