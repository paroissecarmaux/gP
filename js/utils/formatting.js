export function personLabel(person) {
  if (!person) return '';
  return [person.civility, person.firstName, person.lastName].filter(Boolean).join(' ');
}

export function formatAmount(value) {
  if (value == null) return '';
  return `${Number(value).toFixed(2)} €`;
}

export function shortId(id) {
  return id ? id.slice(0, 8) : '';
}
