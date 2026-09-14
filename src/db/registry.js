const entries = [];

export function registerEntity({ key, label, repository, searchFields = [], path = null }) {
  entries.push({ key, label, repository, searchFields, path });
}

export function listRegisteredEntities() {
  return entries;
}
