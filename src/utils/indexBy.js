export function indexById(list) {
  return new Map(list.map((item) => [item.id, item]));
}

export function labelsFor(ids, byId, labelField = 'name') {
  return (ids ?? []).map((id) => byId.get(id)?.[labelField]).filter(Boolean).join(', ');
}

export function staticOptions(values) {
  return async () => values.map((value) => ({ value, label: value }));
}
