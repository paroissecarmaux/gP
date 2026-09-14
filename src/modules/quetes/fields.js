import { indexById } from '../../utils/indexBy.js';
import { celebrationRepository, lieuRepository } from '../territoire-agenda/repositories.js';
import { personRepository } from '../annuaire/repositories.js';
import { collectionRepository } from './repositories.js';

export async function collectionFormContext() {
  const [celebrations, lieux] = await Promise.all([celebrationRepository.list(), lieuRepository.list()]);
  return { celebrations, lieux, lieuxById: indexById(lieux), celebrationsById: indexById(celebrations) };
}

export const collectionColumns = [
  { label: 'Date', render: (row) => (row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '') },
  { label: 'Célébration', render: (row, ctx) => ctx.celebrationsById.get(row.celebrationId)?.title ?? '' },
  { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
];

export const collectionFields = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'celebrationId', label: 'Célébration', type: 'select', options: (ctx) => ctx.celebrations.map((c) => ({ value: c.id, label: c.title })) },
  { name: 'lieuId', label: 'Lieu', type: 'select', options: (ctx) => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

function collectionLabel(collection, ctx) {
  const date = collection.date ? new Date(collection.date).toLocaleDateString('fr-FR') : '?';
  const lieu = ctx.lieuxById.get(collection.lieuId)?.name;
  return `${date}${lieu ? ` — ${lieu}` : ''}`;
}

export async function countFormContext() {
  const [collections, persons, lieux] = await Promise.all([
    collectionRepository.list(),
    personRepository.list(),
    lieuRepository.list(),
  ]);
  return { collections, persons, lieux, lieuxById: indexById(lieux), collectionsById: indexById(collections) };
}

export const countColumns = [
  { label: 'Collecte', render: (row, ctx) => collectionLabel(ctx.collectionsById.get(row.collectionId) ?? {}, ctx) },
  { label: 'Compté le', render: (row) => (row.countedAt ? new Date(row.countedAt).toLocaleDateString('fr-FR') : '') },
  { label: 'Espèces', render: (row) => `${(row.cashAmount ?? 0).toFixed(2)} €` },
  { label: 'Chèques', render: (row) => `${(row.checkAmount ?? 0).toFixed(2)} €` },
  { label: 'Total', render: (row) => `${((row.cashAmount ?? 0) + (row.checkAmount ?? 0)).toFixed(2)} €` },
];

export const countFields = [
  { name: 'collectionId', label: 'Collecte', type: 'select', required: true, options: (ctx) => ctx.collections.map((c) => ({ value: c.id, label: collectionLabel(c, ctx) })) },
  { name: 'counterPersonIds', label: 'Bénévoles compteurs', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
  { name: 'cashAmount', label: 'Espèces (€)', type: 'number', step: '0.01' },
  { name: 'checkAmount', label: 'Chèques (€)', type: 'number', step: '0.01' },
  { name: 'countedAt', label: 'Compté le', type: 'date', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export async function remittanceFormContext() {
  const [collections, persons, lieux] = await Promise.all([
    collectionRepository.list(),
    personRepository.list(),
    lieuRepository.list(),
  ]);
  return { collections, persons, lieux, lieuxById: indexById(lieux), collectionsById: indexById(collections) };
}

export const remittanceColumns = [
  { label: 'Collecte', render: (row, ctx) => collectionLabel(ctx.collectionsById.get(row.collectionId) ?? {}, ctx) },
  { label: 'Date', render: (row) => (row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '') },
  { label: 'Montant', render: (row) => `${(row.amount ?? 0).toFixed(2)} €` },
];

export const remittanceFields = [
  { name: 'collectionId', label: 'Collecte', type: 'select', required: true, options: (ctx) => ctx.collections.map((c) => ({ value: c.id, label: collectionLabel(c, ctx) })) },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'depositedByPersonId', label: 'Déposé par', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
  { name: 'amount', label: 'Montant (€)', type: 'number', required: true, step: '0.01' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
