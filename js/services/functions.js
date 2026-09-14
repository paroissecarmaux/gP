(function (gP) {
  'use strict';

  const functionRepository = new gP.db.Repository('functions', 'Fonction');
  const personFunctionRepository = new gP.db.Repository('personFunctions', 'Affectation de fonction');

  async function listFunctionsForPerson(personId) {
    const all = await personFunctionRepository.list();
    return all.filter((row) => row.personId === personId);
  }

  async function assignFunction(personId, functionId, { startDate = new Date(), endDate = null } = {}) {
    return personFunctionRepository.create({ personId, functionId, startDate, endDate });
  }

  async function endFunctionAssignment(assignmentId) {
    return personFunctionRepository.remove(assignmentId);
  }

  Object.assign(gP.services, {
    functionRepository,
    personFunctionRepository,
    listFunctionsForPerson,
    assignFunction,
    endFunctionAssignment,
  });
})(window.gP);
