// Calculs de KPI pour le tableau de bord — toujours à partir des données
// réelles d'IndexedDB, jamais de chiffres fictifs (section 8 du cahier des
// charges).
(function (gP) {
  'use strict';

  async function computeDashboardStats() {
    const [
      persons, families, volunteers, clergy, employees, groups,
      celebrations, evenements,
      tasks,
      intentions, payments,
      requests,
      collectionCounts,
      acts, certificates,
      syncConflicts, syncLog,
    ] = await Promise.all([
      gP.services.personRepository.list(),
      gP.services.familyRepository.list(),
      gP.services.volunteerRepository.list(),
      gP.services.clergyRepository.list(),
      gP.services.employeeRepository.list(),
      gP.services.groupRepository.list(),
      gP.services.celebrationRepository.list(),
      gP.services.evenementRepository.list(),
      gP.services.taskRepository.list(),
      gP.services.intentionRepository.list(),
      gP.services.paymentRepository.list(),
      gP.services.requestRepository.list(),
      gP.services.countRepository.list(),
      gP.services.sacramentalActRepository.list(),
      gP.services.certificateRepository.list(),
      gP.services.syncConflictRepository.list(),
      gP.services.syncLogRepository.list(),
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 3600 * 1000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 3600 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const items = gP.services.mergeAgendaItems(evenements, celebrations);
    const todayCount = items.filter((i) => new Date(i.startAt) >= startOfToday && new Date(i.startAt) < endOfToday).length;
    const weekCount = items.filter((i) => new Date(i.startAt) >= startOfToday && new Date(i.startAt) < endOfWeek).length;
    const upcomingCelebrations = celebrations.filter((c) => new Date(c.startAt) >= now).length;

    const pendingTasks = tasks.filter((t) => t.status !== 'Terminé' && t.status !== 'Annulé');
    const overdueTasks = tasks.filter(gP.services.isTaskOverdue);
    const urgentTasks = tasks.filter((t) => t.priority === 'Urgente' && t.status !== 'Terminé' && t.status !== 'Annulé');

    const toPlanIntentions = intentions.filter((i) => i.status === 'Demandée' || i.status === 'À planifier').length;
    const plannedIntentions = intentions.filter((i) => i.status === 'Planifiée').length;
    const celebratedIntentions = intentions.filter((i) => i.status === 'Célébrée').length;
    const unpaidIntentions = intentions.filter((i) => {
      const status = gP.services.intentionPaymentStatus(i, payments);
      return status === 'À payer' || status === 'Partiellement payé';
    }).length;
    const amountReceived = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const questeTotal = collectionCounts.reduce((sum, c) => sum + (c.cashAmount ?? 0) + (c.checkAmount ?? 0), 0);

    const actsThisYear = acts.filter((a) => new Date(a.date) >= startOfYear);
    const baptisms = actsThisYear.filter((a) => a.type === 'Baptême').length;
    const marriages = actsThisYear.filter((a) => a.type === 'Mariage').length;
    const confirmations = actsThisYear.filter((a) => a.type === 'Confirmation').length;

    const openRequests = requests.filter(gP.services.isRequestOpen).length;
    const urgentRequests = requests.filter((r) => r.priority === 'Urgente' && gP.services.isRequestOpen(r)).length;

    const unresolvedConflicts = syncConflicts.filter((c) => c.resolvedAt == null).length;
    const lastSync = syncLog.length > 0 ? syncLog.reduce((a, b) => (new Date(a.occurredAt) > new Date(b.occurredAt) ? a : b)) : null;

    return {
      annuaire: { persons: persons.length, families: families.length, volunteers: volunteers.length, clergy: clergy.length, employees: employees.length, groups: groups.length },
      agenda: { today: todayCount, week: weekCount, upcomingCelebrations },
      tasks: { pending: pendingTasks.length, overdue: overdueTasks.length, urgent: urgentTasks.length },
      intentions: { toPlan: toPlanIntentions, planned: plannedIntentions, celebrated: celebratedIntentions, unpaid: unpaidIntentions, amountReceived },
      quetes: { total: questeTotal, counts: collectionCounts.length },
      sacraments: { actsThisYear: actsThisYear.length, baptisms, marriages, confirmations, certificates: certificates.length },
      secretariat: { open: openRequests, urgent: urgentRequests },
      synchronization: { lastSyncAt: lastSync?.occurredAt ?? null, unresolvedConflicts },
    };
  }

  gP.services.computeDashboardStats = computeDashboardStats;
})(window.gP);
