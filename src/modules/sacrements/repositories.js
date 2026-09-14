import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const actRepository = new Repository('sacramentalActs', 'Acte sacramentel');
export const noteRepository = new Repository('sacramentalNotes', 'Mention sacramentelle');
export const certificateRepository = new Repository('certificates', 'Certificat');

registerEntity({ key: 'sacramentalActs', label: 'Actes sacramentels', repository: actRepository, searchFields: ['type'], path: '/sacrements/actes' });
registerEntity({ key: 'sacramentalNotes', label: 'Mentions', repository: noteRepository, searchFields: ['text'], path: '/sacrements/mentions' });
registerEntity({ key: 'certificates', label: 'Certificats', repository: certificateRepository, searchFields: [] });
