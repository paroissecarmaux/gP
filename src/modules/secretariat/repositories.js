import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const requestRepository = new Repository('requests', 'Demande secrétariat');

registerEntity({
  key: 'requests',
  label: 'Demandes secrétariat',
  repository: requestRepository,
  searchFields: ['type', 'notes'],
  path: '/secretariat',
});
