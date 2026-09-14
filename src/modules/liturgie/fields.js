const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const diocesanFeastColumns = [
  { label: 'Nom', key: 'name' },
  { label: 'Date', render: (row) => (row.day && row.month ? `${row.day} ${MONTHS[row.month - 1]}` : '') },
  { label: 'Description', key: 'description' },
];

export const diocesanFeastFields = [
  { name: 'name', label: 'Nom', type: 'text', required: true },
  { name: 'month', label: 'Mois', type: 'select', required: true, options: async () => MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
  { name: 'day', label: 'Jour', type: 'number', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export function diocesanFeastTransform(values) {
  return { month: Number(values.month), day: Number(values.day) };
}
