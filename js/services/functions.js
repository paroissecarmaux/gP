import { Repository } from '../db/repository.js';

export const functionRepository = new Repository('functions', 'Fonction');
export const personFunctionRepository = new Repository('personFunctions', 'Affectation de fonction');

export async function listFunctionsForPerson(personId) {
  const all = await personFunctionRepository.list();
  return all.filter((row) => row.personId === personId);
}

export async function assignFunction(personId, functionId, { startDate = new Date(), endDate = null } = {}) {
  return personFunctionRepository.create({ personId, functionId, startDate, endDate });
}

export async function endFunctionAssignment(assignmentId) {
  return personFunctionRepository.remove(assignmentId);
}
