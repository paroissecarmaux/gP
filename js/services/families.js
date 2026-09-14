(function (gP) {
  'use strict';

  const familyRepository = new gP.db.Repository('families', 'Famille');
  const familyMemberRepository = new gP.db.Repository('familyMembers', 'Membre de famille');

  async function listMembersOf(familyId) {
    const all = await familyMemberRepository.list();
    return all.filter((row) => row.familyId === familyId);
  }

  async function listFamiliesForPerson(personId) {
    const all = await familyMemberRepository.list();
    return all.filter((row) => row.personId === personId);
  }

  async function addMember(familyId, personId, role = 'Membre') {
    return familyMemberRepository.create({ familyId, personId, role });
  }

  async function removeMember(memberId) {
    return familyMemberRepository.remove(memberId);
  }

  Object.assign(gP.services, {
    familyRepository,
    familyMemberRepository,
    familiesListMembersOf: listMembersOf,
    listFamiliesForPerson,
    familiesAddMember: addMember,
    familiesRemoveMember: removeMember,
  });
})(window.gP);
