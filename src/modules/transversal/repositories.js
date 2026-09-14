import { Repository } from '../../db/repository.js';
import { registerEntity } from '../../db/registry.js';

export const supplierRepository = new Repository('suppliers', 'Fournisseur');
export const documentRepository = new Repository('documents', 'Document');

registerEntity({
  key: 'suppliers',
  label: 'Fournisseurs',
  repository: supplierRepository,
  searchFields: ['name', 'contactName', 'category'],
  path: '/fournisseurs',
});
registerEntity({
  key: 'documents',
  label: 'Documents',
  repository: documentRepository,
  searchFields: ['title', 'category'],
  path: '/documents',
});
