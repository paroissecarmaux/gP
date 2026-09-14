import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const intentionRepository = new Repository('intentions', 'Intention');
export const paymentRepository = new Repository('payments', 'Paiement');

registerEntity({
  key: 'intentions',
  label: 'Intentions de messe',
  repository: intentionRepository,
  searchFields: ['requesterName', 'forWhom'],
  path: '/intentions',
});
registerEntity({ key: 'payments', label: 'Paiements', repository: paymentRepository, searchFields: [], path: '/intentions/paiements' });
