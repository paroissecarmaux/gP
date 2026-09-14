import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const functionRepository = new Repository('functions', 'Fonction');
export const groupRepository = new Repository('groups', 'Groupe');
export const personRepository = new Repository('persons', 'Personne');
export const familyRepository = new Repository('families', 'Famille');

registerEntity({ key: 'functions', label: 'Fonctions', repository: functionRepository, searchFields: ['name'], path: '/annuaire/fonctions' });
registerEntity({ key: 'groups', label: 'Groupes', repository: groupRepository, searchFields: ['name'], path: '/annuaire/groupes' });
registerEntity({
  key: 'persons',
  label: 'Personnes',
  repository: personRepository,
  searchFields: ['firstName', 'lastName', 'email', 'phone', 'mobile'],
  path: '/annuaire/personnes',
});
registerEntity({ key: 'families', label: 'Familles', repository: familyRepository, searchFields: ['name'], path: '/annuaire/familles' });
