import { staticOptions, indexById, labelsFor } from '../../utils/indexBy.js';
import { functionRepository, groupRepository, personRepository } from './repositories.js';

export const functionColumns = [{ label: 'Nom', key: 'name' }];
export const functionFields = [{ name: 'name', label: 'Nom', type: 'text', required: true }];

export const groupColumns = [
  { label: 'Nom', key: 'name' },
  { label: 'Description', key: 'description' },
];
export const groupFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const CIVILITIES = ['M.', 'Mme', 'Mlle', 'Abbé', 'Père', 'Mgr'];
const CONTRACT_TYPES = ['CDI', 'CDD', 'Bénévolat indemnisé', 'Vacation'];

export async function personFormContext() {
  const [functions, groups] = await Promise.all([functionRepository.list(), groupRepository.list()]);
  return { functions, groups, functionsById: indexById(functions), groupsById: indexById(groups) };
}

export const personColumns = [
  { label: 'Nom', key: 'lastName' },
  { label: 'Prénom', key: 'firstName' },
  { label: 'Email', key: 'email' },
  { label: 'Téléphone', render: (row) => row.mobile || row.phone || '' },
  { label: 'Fonctions', render: (row, ctx) => labelsFor(row.functionIds, ctx.functionsById) },
];

export const personFields = [
  { name: 'civility', label: 'Civilité', type: 'select', options: staticOptions(CIVILITIES) },
  { name: 'firstName', label: 'Prénom', type: 'text', required: true },
  { name: 'lastName', label: 'Nom', type: 'text', required: true },
  { name: 'birthDate', label: 'Date de naissance', type: 'date' },
  { name: 'deathDate', label: 'Date de décès', type: 'date' },
  { name: 'phone', label: 'Téléphone fixe', type: 'text' },
  { name: 'mobile', label: 'Téléphone mobile', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'addressStreet', label: 'Adresse', type: 'text' },
  { name: 'addressPostalCode', label: 'Code postal', type: 'text' },
  { name: 'addressCity', label: 'Ville', type: 'text' },
  { name: 'addressCountry', label: 'Pays', type: 'text', default: 'France' },
  { name: 'functionIds', label: 'Fonctions', type: 'multiselect', options: (ctx) => ctx.functions.map((f) => ({ value: f.id, label: f.name })) },
  { name: 'groupIds', label: 'Groupes', type: 'multiselect', options: (ctx) => ctx.groups.map((g) => ({ value: g.id, label: g.name })) },
  { name: 'isVolunteer', label: 'Bénévole', type: 'checkbox' },
  { name: 'volunteerNotes', label: 'Disponibilités / compétences bénévole', type: 'textarea' },
  { name: 'isClergy', label: 'Membre du clergé', type: 'checkbox' },
  { name: 'clergyOrdinationDate', label: 'Date d\'ordination', type: 'date' },
  { name: 'clergyAssignment', label: 'Affectation', type: 'text' },
  { name: 'isEmployee', label: 'Salarié', type: 'checkbox' },
  { name: 'employeeStartDate', label: 'Date d\'embauche', type: 'date' },
  { name: 'employeePosition', label: 'Poste', type: 'text' },
  { name: 'employeeContractType', label: 'Type de contrat', type: 'select', options: staticOptions(CONTRACT_TYPES) },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export async function familyFormContext() {
  const persons = await personRepository.list();
  return { persons, personsById: indexById(persons) };
}

const personLabel = (p) => `${p.firstName} ${p.lastName}`;

export const familyColumns = [
  { label: 'Nom de famille', key: 'name' },
  { label: 'Chef de famille', render: (row, ctx) => (row.headPersonId ? personLabel(ctx.personsById.get(row.headPersonId) ?? {}) : '') },
  { label: 'Membres', render: (row, ctx) => (row.memberPersonIds ?? []).length },
];

export const familyFields = [
  { name: 'name', label: 'Nom de famille', type: 'text', required: true },
  { name: 'headPersonId', label: 'Chef de famille', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'memberPersonIds', label: 'Membres', type: 'multiselect', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: personLabel(p) })) },
  { name: 'addressStreet', label: 'Adresse', type: 'text' },
  { name: 'addressPostalCode', label: 'Code postal', type: 'text' },
  { name: 'addressCity', label: 'Ville', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
