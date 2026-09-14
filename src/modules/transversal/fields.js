import { staticOptions } from '../../utils/indexBy.js';
import { listRegisteredEntities } from '../../db/registry.js';

export const SUPPLIER_CATEGORIES = ['Fleuriste', 'Imprimeur', 'Entretien', 'Restauration', 'Fournitures liturgiques', 'Autre'];

export const supplierColumns = [
  { label: 'Nom', key: 'name' },
  { label: 'Catégorie', key: 'category' },
  { label: 'Contact', key: 'contactName' },
  { label: 'Téléphone', key: 'phone' },
];

export const supplierFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'category', label: 'Catégorie', type: 'select', options: staticOptions(SUPPLIER_CATEGORIES) },
  { name: 'contactName', label: 'Contact', type: 'text' },
  { name: 'phone', label: 'Téléphone', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'address', label: 'Adresse', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export const DOCUMENT_CATEGORIES = ['Contrat', 'Facture', 'Certificat', 'Compte-rendu', 'Photo', 'Autre'];

export function documentFormContext() {
  return { entityTypes: listRegisteredEntities().map((e) => e.label) };
}

export const documentColumns = [
  { label: 'Titre', key: 'title' },
  { label: 'Catégorie', key: 'category' },
  { label: 'Lié à', render: (row) => [row.linkedEntityType, row.linkedDescription].filter(Boolean).join(' — ') },
  { label: 'Fichier', render: (row) => row.fileName ?? '' },
];

export const documentFields = [
  { name: 'title', label: 'Titre', type: 'text', required: true },
  { name: 'category', label: 'Catégorie', type: 'select', options: staticOptions(DOCUMENT_CATEGORIES) },
  { name: 'linkedEntityType', label: 'Module concerné', type: 'select', options: (ctx) => ctx.entityTypes.map((t) => ({ value: t, label: t })) },
  { name: 'linkedDescription', label: 'Élément concerné (description libre)', type: 'text' },
  { name: 'fileBlob', label: 'Fichier', type: 'file' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export function documentTransform(values) {
  if (values.fileBlob instanceof Blob) {
    return { fileName: values.fileBlob.name ?? '', fileMimeType: values.fileBlob.type ?? '' };
  }
  return {};
}
