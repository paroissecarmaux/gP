import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const syncLogRepository = new Repository('syncLog', 'Synchronisation');

registerEntity({ key: 'syncLog', label: 'Journal de synchronisation', repository: syncLogRepository, searchFields: [] });
