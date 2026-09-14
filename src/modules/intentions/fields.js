import { staticOptions, indexById } from '../../utils/indexBy.js';
import { personRepository } from '../annuaire/repositories.js';
import { celebrationRepository } from '../territoire-agenda/repositories.js';
import { intentionRepository, paymentRepository } from './repositories.js';

export const INTENTION_STATUSES = ['Demandée', 'À planifier', 'Planifiée', 'Célébrée', 'Annulée'];
export const PAYMENT_MODES = ['Espèces', 'Chèque', 'Carte bancaire', 'Virement'];

export function paymentStatus(intention, payments) {
  if (!intention.amountRequested) return 'Gratuit';
  const paid = payments.filter((p) => p.intentionId === intention.id).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  if (paid <= 0) return 'À payer';
  if (paid < intention.amountRequested) return 'Partiellement payé';
  return 'Payé';
}

export async function intentionFormContext() {
  const [persons, celebrations, payments] = await Promise.all([
    personRepository.list(),
    celebrationRepository.list(),
    paymentRepository.list(),
  ]);
  return { persons, celebrations, payments, celebrationsById: indexById(celebrations) };
}

export const intentionColumns = [
  { label: 'Demandeur', key: 'requesterName' },
  { label: 'Objet', key: 'forWhom' },
  { label: 'Statut', key: 'status' },
  { label: 'Célébration', render: (row, ctx) => ctx.celebrationsById.get(row.celebrationId)?.title ?? '' },
  { label: 'Paiement', render: (row, ctx) => paymentStatus(row, ctx.payments) },
];

export const intentionFields = [
  { name: 'requesterName', label: 'Demandeur', type: 'text', required: true },
  { name: 'requesterPersonId', label: 'Demandeur (fiche existante)', type: 'select', options: (ctx) => ctx.persons.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
  { name: 'forWhom', label: 'Objet de l\'intention', type: 'textarea' },
  { name: 'status', label: 'Statut', type: 'select', required: true, options: staticOptions(INTENTION_STATUSES), default: 'Demandée' },
  { name: 'celebrationId', label: 'Célébration', type: 'select', options: (ctx) => ctx.celebrations.map((c) => ({ value: c.id, label: c.title })) },
  { name: 'amountRequested', label: 'Montant demandé (€)', type: 'number', step: '0.01' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export async function paymentFormContext() {
  const intentions = await intentionRepository.list();
  return { intentions, intentionsById: indexById(intentions) };
}

const intentionLabel = (i) => `${i.requesterName} — ${i.forWhom ?? ''}`;

export const paymentColumns = [
  { label: 'Intention', render: (row, ctx) => intentionLabel(ctx.intentionsById.get(row.intentionId) ?? { requesterName: '?' }) },
  { label: 'Montant', render: (row) => `${(row.amount ?? 0).toFixed(2)} €` },
  { label: 'Mode', key: 'mode' },
  { label: 'Date', render: (row) => (row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '') },
];

export const paymentFields = [
  { name: 'intentionId', label: 'Intention', type: 'select', required: true, options: (ctx) => ctx.intentions.map((i) => ({ value: i.id, label: intentionLabel(i) })) },
  { name: 'amount', label: 'Montant (€)', type: 'number', required: true, step: '0.01' },
  { name: 'mode', label: 'Mode de paiement', type: 'select', required: true, options: staticOptions(PAYMENT_MODES) },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
