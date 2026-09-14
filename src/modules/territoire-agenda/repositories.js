import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const sectorRepository = new Repository('sectors', 'Secteur');
export const clocherRepository = new Repository('clochers', 'Clocher');
export const lieuRepository = new Repository('lieux', 'Lieu');
export const celebrationRepository = new Repository('celebrations', 'Célébration');

registerEntity({ key: 'sectors', label: 'Secteurs', repository: sectorRepository, searchFields: ['name'], path: '/territoire/secteurs' });
registerEntity({ key: 'clochers', label: 'Clochers', repository: clocherRepository, searchFields: ['name'], path: '/territoire/clochers' });
registerEntity({ key: 'lieux', label: 'Lieux', repository: lieuRepository, searchFields: ['name'], path: '/territoire/lieux' });
registerEntity({
  key: 'celebrations',
  label: 'Célébrations',
  repository: celebrationRepository,
  searchFields: ['title', 'type'],
  path: '/agenda/celebrations',
});
