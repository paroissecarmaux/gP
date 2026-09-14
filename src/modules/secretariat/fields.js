import { staticOptions, indexById } from '../../utils/indexBy.js';
import { personRepository } from '../annuaire/repositories.js';

export const REQUEST_TYPES = [
  'Certificat de baptême',
  'Certificat de mariage',
  'Certificat de confirmation',
  'Acte administratif',
  'Autre',
];
export const REQUEST_STATUSES = ['Ouverte', 'En cours', 'En attente', 'Terminée', 'Annulée'];
export const REQUEST_PRIORITIES = ['Normale', 'Importante', 'Urgente'];

export function isRequestOverdue(request) {
  return (
    request.status !== 'Terminée' &&
    request.status !== 'Annulée' &&
    request.dueDate &&
    new Date(request.dueDate) < new Date()
  );
}

export async function requestFormContext() {
  const persons = await personRepository.list();
  return { persons, personsById: indexById(persons) };
}

const personLabel = (p) => (p ? `${p.firstName} ${p.lastName}` : '');

export const requestColumns = [
  { label: 'Type', key: 'type' },
  { label: 'Demandeur', render: (row, ctx) => personLabel(ctx.personsById.get(row.requesterPersonId)) },
  { label: 'Statut', key: 'status' },
  { label: 'Priorité', key: 'priority' },
  { label: 'Échéance', render: (row) => `${row.dueDate ? new Date(row.dueDate).toLocaleDateString('fr-FR') : ''}${isRequestOverdue(row) ? ' ⚠' : ''}` },
  { label: 'Responsable', render: (row, ctx) => personLabel(ctx.personsById.get(row.assigneePersonId)) },
];

export const requestFields = [
  { name: 'type', label: 'Type de demande', type: 'select', required: true, options: staticOptions(REQUEST_TYPES) },
  { name: 'requesterPersonId', label: 'Demandeur', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'status', label: 'Statut', type: 'select', required: true, options: staticOptions(REQUEST_STATUSES), default: 'Ouverte' },
  { name: 'priority', label: 'Priorité', type: 'select', required: true, options: staticOptions(REQUEST_PRIORITIES), default: 'Normale' },
  { name: 'dueDate', label: 'Échéance', type: 'date' },
  { name: 'assigneePersonId', label: 'Responsable', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
