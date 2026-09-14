import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const collectionRepository = new Repository('collections', 'Collecte');
export const countRepository = new Repository('counts', 'Comptage');
export const remittanceRepository = new Repository('remittances', 'Remise');

registerEntity({ key: 'collections', label: 'Collectes', repository: collectionRepository, searchFields: [], path: '/quetes/collectes' });
registerEntity({ key: 'counts', label: 'Comptages', repository: countRepository, searchFields: [], path: '/quetes/comptages' });
registerEntity({ key: 'remittances', label: 'Remises', repository: remittanceRepository, searchFields: [], path: '/quetes/remises' });
