(function (gP) {
  'use strict';

  const groupRepository = new gP.db.Repository('groups', 'Groupe');
  const groupMembershipRepository = new gP.db.Repository('groupMemberships', 'Participation à un groupe');

  async function listMembersOf(groupId) {
    const all = await groupMembershipRepository.list();
    return all.filter((row) => row.groupId === groupId);
  }

  async function listGroupsForPerson(personId) {
    const all = await groupMembershipRepository.list();
    return all.filter((row) => row.personId === personId);
  }

  async function addMember(groupId, personId, { role = '', joinedDate = new Date() } = {}) {
    return groupMembershipRepository.create({ groupId, personId, role, joinedDate, leftDate: null });
  }

  async function removeMember(membershipId) {
    return groupMembershipRepository.remove(membershipId);
  }

  Object.assign(gP.services, {
    groupRepository,
    groupMembershipRepository,
    groupsListMembersOf: listMembersOf,
    listGroupsForPerson,
    groupsAddMember: addMember,
    groupsRemoveMember: removeMember,
  });
})(window.gP);
