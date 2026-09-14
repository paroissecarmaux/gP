import { Repository } from '../db/repository.js';

export const groupRepository = new Repository('groups', 'Groupe');
export const groupMembershipRepository = new Repository('groupMemberships', 'Participation à un groupe');

export async function listMembersOf(groupId) {
  const all = await groupMembershipRepository.list();
  return all.filter((row) => row.groupId === groupId);
}

export async function listGroupsForPerson(personId) {
  const all = await groupMembershipRepository.list();
  return all.filter((row) => row.personId === personId);
}

export async function addMember(groupId, personId, { role = '', joinedDate = new Date() } = {}) {
  return groupMembershipRepository.create({ groupId, personId, role, joinedDate, leftDate: null });
}

export async function removeMember(membershipId) {
  return groupMembershipRepository.remove(membershipId);
}
