import { personRepository, familyRepository } from '../annuaire/repositories.js';
import { celebrationRepository, lieuRepository } from '../territoire-agenda/repositories.js';
import { taskRepository } from '../taches/repositories.js';
import { intentionRepository, paymentRepository } from '../intentions/repositories.js';
import { actRepository } from '../sacrements/repositories.js';

function checkRefs(rows, field, validIds, label) {
  const issues = [];
  for (const row of rows) {
    const value = row[field];
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    for (const id of ids) {
      if (!validIds.has(id)) {
        issues.push(`${label} ${row.id} : champ "${field}" référence un identifiant introuvable (${id})`);
      }
    }
  }
  return issues;
}

export async function runIntegrityChecks() {
  const [persons, families, celebrations, lieux, tasks, intentions, payments, acts] = await Promise.all([
    personRepository.list(),
    familyRepository.list(),
    celebrationRepository.list(),
    lieuRepository.list(),
    taskRepository.list(),
    intentionRepository.list(),
    paymentRepository.list(),
    actRepository.list(),
  ]);

  const personIds = new Set(persons.map((p) => p.id));
  const lieuIds = new Set(lieux.map((l) => l.id));
  const celebrationIds = new Set(celebrations.map((c) => c.id));
  const intentionIds = new Set(intentions.map((i) => i.id));

  return [
    ...checkRefs(families, 'headPersonId', personIds, 'Famille'),
    ...checkRefs(families, 'memberPersonIds', personIds, 'Famille'),
    ...checkRefs(celebrations, 'lieuId', lieuIds, 'Célébration'),
    ...checkRefs(celebrations, 'celebrantPersonId', personIds, 'Célébration'),
    ...checkRefs(tasks, 'assigneePersonIds', personIds, 'Tâche'),
    ...checkRefs(intentions, 'celebrationId', celebrationIds, 'Intention'),
    ...checkRefs(payments, 'intentionId', intentionIds, 'Paiement'),
    ...checkRefs(acts, 'personId', personIds, 'Acte sacramentel'),
    ...checkRefs(acts, 'lieuId', lieuIds, 'Acte sacramentel'),
  ];
}
