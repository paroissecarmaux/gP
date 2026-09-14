function overlaps(a, b) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export function findConflictsFor(candidate, existing) {
  return existing.filter((other) => {
    if (other.id === candidate.id) return false;
    if (!overlaps(candidate, other)) return false;
    const sameLieu = candidate.lieuId && other.lieuId === candidate.lieuId;
    const sameCelebrant = candidate.celebrantPersonId && other.celebrantPersonId === candidate.celebrantPersonId;
    const sharedParticipant = (candidate.participantPersonIds ?? []).some((id) =>
      (other.participantPersonIds ?? []).includes(id),
    );
    return sameLieu || sameCelebrant || sharedParticipant;
  });
}

export function findAllConflicts(celebrations) {
  const pairs = [];
  for (let i = 0; i < celebrations.length; i++) {
    for (let j = i + 1; j < celebrations.length; j++) {
      const [a, b] = [celebrations[i], celebrations[j]];
      if (findConflictsFor(a, [b]).length > 0) pairs.push([a, b]);
    }
  }
  return pairs;
}
