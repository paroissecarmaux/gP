import { staticOptions, indexById, labelsFor } from '../../utils/indexBy.js';
import { personRepository, groupRepository } from '../annuaire/repositories.js';
import { celebrationRepository } from '../territoire-agenda/repositories.js';

export const STATUSES = ['À faire', 'En cours', 'Terminé', 'Annulé'];
export const PRIORITIES = ['Normale', 'Importante', 'Urgente'];

export async function taskFormContext() {
  const [persons, groups, celebrations] = await Promise.all([
    personRepository.list(),
    groupRepository.list(),
    celebrationRepository.list(),
  ]);
  return {
    persons,
    groups,
    celebrations,
    personsById: indexById(persons),
    groupsById: indexById(groups),
    celebrationsById: indexById(celebrations),
  };
}

export function isOverdue(task) {
  return task.status !== 'Terminé' && task.status !== 'Annulé' && task.dueDate && new Date(task.dueDate) < new Date();
}

export const taskColumns = [
  { label: 'Titre', key: 'title' },
  { label: 'Statut', key: 'status' },
  { label: 'Priorité', key: 'priority' },
  { label: 'Échéance', render: (row) => `${row.dueDate ? new Date(row.dueDate).toLocaleDateString('fr-FR') : ''}${isOverdue(row) ? ' ⚠' : ''}` },
  {
    label: 'Assigné à',
    render: (row, ctx) =>
      [labelsFor(row.assigneePersonIds, ctx.personsById), labelsFor(row.assigneeGroupIds, ctx.groupsById)]
        .filter(Boolean)
        .join(' · '),
  },
];

export const taskFields = [
  { name: 'title', label: 'Titre', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'status', label: 'Statut', type: 'select', required: true, options: staticOptions(STATUSES), default: 'À faire' },
  { name: 'priority', label: 'Priorité', type: 'select', required: true, options: staticOptions(PRIORITIES), default: 'Normale' },
  { name: 'dueDate', label: 'Échéance', type: 'date' },
  { name: 'assigneePersonIds', label: 'Assigné à (personnes)', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
  { name: 'assigneeGroupIds', label: 'Assigné à (groupes)', type: 'multiselect', options: (ctx) => ctx.groups.map((g) => ({ value: g.id, label: g.name })) },
  { name: 'linkedCelebrationId', label: 'Événement / célébration liée', type: 'select', options: (ctx) => ctx.celebrations.map((c) => ({ value: c.id, label: c.title })) },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
