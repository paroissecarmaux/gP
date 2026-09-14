import { Repository } from '../db/repository.js';

export const familyRepository = new Repository('families', 'Famille');
export const familyMemberRepository = new Repository('familyMembers', 'Membre de famille');

export async function listMembersOf(familyId) {
  const all = await familyMemberRepository.list();
  return all.filter((row) => row.familyId === familyId);
}

export async function listFamiliesForPerson(personId) {
  const all = await familyMemberRepository.list();
  return all.filter((row) => row.personId === personId);
}

export async function addMember(familyId, personId, role = 'Membre') {
  return familyMemberRepository.create({ familyId, personId, role });
}

export async function removeMember(memberId) {
  return familyMemberRepository.remove(memberId);
}
