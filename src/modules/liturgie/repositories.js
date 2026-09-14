import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const diocesanFeastRepository = new Repository('diocesanFeasts', 'Particularité diocésaine');

registerEntity({
  key: 'diocesanFeasts',
  label: 'Particularités diocésaines',
  repository: diocesanFeastRepository,
  searchFields: ['name'],
  path: '/liturgie/particularites',
});
