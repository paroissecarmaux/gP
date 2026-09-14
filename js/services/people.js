// Personnes, et leurs profils optionnels (bénévole/clergé/salarié — des
// extensions 1-1, regroupées ici plutôt que dans des fichiers séparés :
// ce sont des facettes d'une personne, pas des domaines autonomes (voir
// docs/ARCHITECTURE.md).
import { Repository } from '../db/repository.js';

export const personRepository = new Repository('persons', 'Personne');
export const volunteerRepository = new Repository('volunteers', 'Bénévole');
export const clergyRepository = new Repository('clergy', 'Clergé');
export const employeeRepository = new Repository('employees', 'Salarié');

async function getProfile(repository, personId) {
  const all = await repository.list();
  return all.find((row) => row.personId === personId) ?? null;
}

export const getVolunteerProfile = (personId) => getProfile(volunteerRepository, personId);
export const getClergyProfile = (personId) => getProfile(clergyRepository, personId);
export const getEmployeeProfile = (personId) => getProfile(employeeRepository, personId);

/**
 * Crée, met à jour ou supprime le profil (bénévole/clergé/salarié) d'une
 * personne selon que `enabled` est vrai et que des champs sont fournis.
 */
export async function setProfile(repository, personId, enabled, fields) {
  const existing = await getProfile(repository, personId);
  if (!enabled) {
    if (existing) await repository.remove(existing.id);
    return null;
  }
  if (existing) return repository.update(existing.id, fields);
  return repository.create({ personId, ...fields });
}

/**
 * Détection de doublons (section 9 : jamais de fusion automatique, juste
 * un signalement à l'utilisateur qui reste libre d'enregistrer quand même).
 */
export async function findPotentialDuplicates(firstName, lastName, excludeId = null) {
  if (!firstName || !lastName) return [];
  const all = await personRepository.list();
  const normalize = (s) => s.trim().toLowerCase();
  return all.filter(
    (p) =>
      p.id !== excludeId &&
      normalize(p.firstName ?? '') === normalize(firstName) &&
      normalize(p.lastName ?? '') === normalize(lastName),
  );
}
