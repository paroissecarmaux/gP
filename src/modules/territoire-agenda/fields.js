import { staticOptions, indexById, labelsFor } from '../../utils/indexBy.js';
import { sectorRepository, clocherRepository, lieuRepository, celebrationRepository } from './repositories.js';
import { personRepository } from '../annuaire/repositories.js';

export const sectorColumns = [{ label: 'Nom', key: 'name' }];
export const sectorFields = [{ name: 'name', label: 'Nom', type: 'text', required: true }];

export async function clocherFormContext() {
  const sectors = await sectorRepository.list();
  return { sectors, sectorsById: indexById(sectors) };
}
export const clocherColumns = [
  { label: 'Nom', key: 'name' },
  { label: 'Secteur', render: (row, ctx) => ctx.sectorsById.get(row.sectorId)?.name ?? '' },
];
export const clocherFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'sectorId', label: 'Secteur', type: 'select', options: (ctx) => ctx.sectors.map((s) => ({ value: s.id, label: s.name })) },
];

export async function lieuFormContext() {
  const clochers = await clocherRepository.list();
  return { clochers, clochersById: indexById(clochers) };
}
export const lieuColumns = [
  { label: 'Nom', key: 'name' },
  { label: 'Clocher', render: (row, ctx) => ctx.clochersById.get(row.clocherId)?.name ?? '' },
  { label: 'Adresse', key: 'address' },
];
export const lieuFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'clocherId', label: 'Clocher', type: 'select', options: (ctx) => ctx.clochers.map((c) => ({ value: c.id, label: c.name })) },
  { name: 'address', label: 'Adresse', type: 'text' },
];

const CELEBRATION_TYPES = ['Messe', 'Baptême', 'Mariage', 'Obsèques', 'Confirmation', 'Réunion', 'Autre'];
const RECURRENCE_FREQUENCIES = ['Aucune', 'Hebdomadaire', 'Mensuelle'];

export async function celebrationFormContext() {
  const [lieux, persons, celebrations] = await Promise.all([
    lieuRepository.list(),
    personRepository.list(),
    celebrationRepository.list(),
  ]);
  return { lieux, persons, celebrations, lieuxById: indexById(lieux), personsById: indexById(persons) };
}

const personLabel = (p) => `${p.firstName} ${p.lastName}`;

export const celebrationColumns = [
  { label: 'Titre', key: 'title' },
  { label: 'Type', key: 'type' },
  { label: 'Début', render: (row) => (row.startAt ? new Date(row.startAt).toLocaleString('fr-FR') : '') },
  { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
  { label: 'Célébrant', render: (row, ctx) => (row.celebrantPersonId ? personLabel(ctx.personsById.get(row.celebrantPersonId) ?? {}) : '') },
];

export const celebrationFields = [
  { name: 'title', label: 'Titre', type: 'text', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: staticOptions(CELEBRATION_TYPES) },
  { name: 'startAt', label: 'Début', type: 'datetime', required: true },
  { name: 'endAt', label: 'Fin', type: 'datetime', required: true },
  { name: 'lieuId', label: 'Lieu', type: 'select', options: (ctx) => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
  { name: 'celebrantPersonId', label: 'Célébrant', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'participantPersonIds', label: 'Participants', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'recurrenceFrequency', label: 'Récurrence', type: 'select', options: staticOptions(RECURRENCE_FREQUENCIES), default: 'Aucune' },
  { name: 'recurrenceUntil', label: 'Récurrence jusqu\'au', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export function celebrationLabel(c, ctx) {
  const lieu = ctx.lieuxById.get(c.lieuId)?.name;
  return `${c.title}${lieu ? ` — ${lieu}` : ''}`;
}
