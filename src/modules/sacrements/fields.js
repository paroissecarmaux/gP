import { staticOptions, indexById } from '../../utils/indexBy.js';
import { personRepository } from '../annuaire/repositories.js';
import { lieuRepository } from '../territoire-agenda/repositories.js';
import { actRepository } from './repositories.js';

export const ACT_TYPES = ['Baptême', 'Mariage', 'Confirmation', 'Ordination', 'Obsèques'];

const personLabel = (p) => (p ? `${p.firstName} ${p.lastName}` : '');

export async function actFormContext() {
  const [persons, lieux] = await Promise.all([personRepository.list(), lieuRepository.list()]);
  return { persons, lieux, personsById: indexById(persons), lieuxById: indexById(lieux) };
}

export const actColumns = [
  { label: 'Type', key: 'type' },
  { label: 'Personne', render: (row, ctx) => personLabel(ctx.personsById.get(row.personId)) },
  { label: 'Date', render: (row) => (row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '') },
  { label: 'Lieu', render: (row, ctx) => ctx.lieuxById.get(row.lieuId)?.name ?? '' },
  { label: 'Célébrant', render: (row, ctx) => personLabel(ctx.personsById.get(row.celebrantPersonId)) },
];

export const actFields = [
  { name: 'type', label: 'Type d\'acte', type: 'select', required: true, options: staticOptions(ACT_TYPES) },
  { name: 'personId', label: 'Personne concernée', type: 'select', required: true, options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'lieuId', label: 'Lieu', type: 'select', options: (ctx) => ctx.lieux.map((l) => ({ value: l.id, label: l.name })) },
  { name: 'celebrantPersonId', label: 'Célébrant', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'relatedPersonIds', label: 'Personnes associées (témoins, parrain/marraine, conjoint…)', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'relatedPersonsNotes', label: 'Rôle de ces personnes', type: 'textarea' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export function actLabel(act, personsById) {
  return `${act.type} — ${personLabel(personsById.get(act.personId))} (${act.date ? new Date(act.date).toLocaleDateString('fr-FR') : '?'})`;
}

export async function noteFormContext() {
  const [acts, persons] = await Promise.all([actRepository.list(), personRepository.list()]);
  const personsById = indexById(persons);
  return { acts, personsById, actsById: indexById(acts) };
}

export const noteColumns = [
  { label: 'Acte', render: (row, ctx) => actLabel(ctx.actsById.get(row.actId) ?? {}, ctx.personsById) },
  { label: 'Date', render: (row) => (row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '') },
  { label: 'Texte', key: 'text' },
];

export const noteFields = [
  { name: 'actId', label: 'Acte concerné', type: 'select', required: true, options: (ctx) => ctx.acts.map((a) => ({ value: a.id, label: actLabel(a, ctx.personsById) })) },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'text', label: 'Texte de la mention', type: 'textarea', required: true },
  { name: 'relatedActId', label: 'Acte lié (ex : mention de mariage sur un acte de baptême)', type: 'select', options: (ctx) => ctx.acts.map((a) => ({ value: a.id, label: actLabel(a, ctx.personsById) })) },
];
