(function (gP) {
  'use strict';

  function tile(label, value, path) {
    return `<a class="dashboard-tile" href="#${path}"><span class="dashboard-tile-value">${value}</span><span class="dashboard-tile-label">${label}</span></a>`;
  }

  class DashboardPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page dashboard-page';
      el.innerHTML = `
        <h1>Tableau de bord</h1>
        <section class="kpi-section">
          <h2>Annuaire</h2>
          <div class="dashboard-tiles annuaire-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Agenda</h2>
          <div class="dashboard-tiles agenda-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Tâches</h2>
          <div class="dashboard-tiles tasks-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Intentions</h2>
          <div class="dashboard-tiles intentions-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Quêtes</h2>
          <div class="dashboard-tiles quetes-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Sacrements</h2>
          <div class="dashboard-tiles sacraments-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Secrétariat</h2>
          <div class="dashboard-tiles secretariat-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Synchronisation</h2>
          <div class="dashboard-tiles sync-tiles"></div>
        </section>
        <section class="kpi-section">
          <h2>Comparaison entre secteurs (célébrations à venir)</h2>
          <div class="dashboard-sectors"></div>
        </section>
        <section class="kpi-section">
          <h2>Cette installation</h2>
          <div class="installation-card"><p>Chargement…</p></div>
        </section>
      `;
      return el;
    }

    async onMount() {
      try {
        const stats = await gP.services.computeDashboardStats();

        this.el.querySelector('.annuaire-tiles').innerHTML = [
          tile('Personnes', stats.annuaire.persons, '/annuaire/personnes'),
          tile('Familles', stats.annuaire.families, '/annuaire/familles'),
          tile('Bénévoles', stats.annuaire.volunteers, '/annuaire/personnes'),
          tile('Clergé', stats.annuaire.clergy, '/annuaire/personnes'),
          tile('Salariés', stats.annuaire.employees, '/annuaire/personnes'),
          tile('Groupes', stats.annuaire.groups, '/annuaire/groupes'),
        ].join('');

        this.el.querySelector('.agenda-tiles').innerHTML = [
          tile("Aujourd'hui", stats.agenda.today, '/agenda'),
          tile('Cette semaine', stats.agenda.week, '/agenda'),
          tile('Célébrations à venir', stats.agenda.upcomingCelebrations, '/agenda/celebrations'),
        ].join('');

        this.el.querySelector('.tasks-tiles').innerHTML = [
          tile('À faire / en cours', stats.tasks.pending, '/taches'),
          tile('Urgentes', stats.tasks.urgent, '/taches/urgentes'),
          tile('En retard', stats.tasks.overdue, '/taches/en-retard'),
        ].join('');

        this.el.querySelector('.intentions-tiles').innerHTML = [
          tile('À planifier', stats.intentions.toPlan, '/intentions'),
          tile('Planifiées', stats.intentions.planned, '/intentions'),
          tile('Célébrées', stats.intentions.celebrated, '/intentions'),
          tile('Impayées', stats.intentions.unpaid, '/intentions'),
          tile('Montant reçu', gP.utils.formatAmount(stats.intentions.amountReceived), '/intentions/paiements'),
        ].join('');

        this.el.querySelector('.quetes-tiles').innerHTML = [
          tile('Total compté', gP.utils.formatAmount(stats.quetes.total), '/quetes/comptages'),
          tile('Comptages', stats.quetes.counts, '/quetes/comptages'),
        ].join('');

        this.el.querySelector('.sacraments-tiles').innerHTML = [
          tile('Actes cette année', stats.sacraments.actsThisYear, '/sacrements/actes'),
          tile('Baptêmes', stats.sacraments.baptisms, '/sacrements/actes'),
          tile('Mariages', stats.sacraments.marriages, '/sacrements/actes'),
          tile('Confirmations', stats.sacraments.confirmations, '/sacrements/actes'),
          tile('Certificats générés', stats.sacraments.certificates, '/sacrements/actes'),
        ].join('');

        this.el.querySelector('.secretariat-tiles').innerHTML = [
          tile('Demandes ouvertes', stats.secretariat.open, '/secretariat/ouvertes'),
          tile('Urgentes', stats.secretariat.urgent, '/secretariat/ouvertes'),
        ].join('');

        this.el.querySelector('.sync-tiles').innerHTML = [
          tile('Dernière synchro', stats.synchronization.lastSyncAt ? gP.utils.formatDateTime(stats.synchronization.lastSyncAt) : 'Jamais', '/parametres/sauvegarde'),
          tile('Conflits non résolus', stats.synchronization.unresolvedConflicts, '/parametres/conflits'),
        ].join('');

        await this.renderSectorComparison();

        const installation = await gP.services.ensureCurrentInstallation('Poste principal');
        this.el.querySelector('.installation-card').innerHTML = `
          <dl class="field-list">
            <dt>Nom</dt><dd>${installation.name}</dd>
            <dt>Identifiant</dt><dd><code>${installation.id}</code></dd>
            <dt>Créée le</dt><dd>${gP.utils.formatDateTime(installation.createdAt)}</dd>
          </dl>
        `;
      } catch (error) {
        gP.utils.reportError(error, { source: 'Tableau de bord' });
      }
    }

    async renderSectorComparison() {
      const [celebrations, lieux, clochers, sectors] = await Promise.all([
        gP.services.celebrationRepository.list(),
        gP.services.lieuRepository.list(),
        gP.services.clocherRepository.list(),
        gP.services.sectorRepository.list(),
      ]);
      const lieuxById = gP.utils.indexById(lieux);
      const clochersById = gP.utils.indexById(clochers);
      const now = new Date();

      const counts = new Map(sectors.map((s) => [s.id, 0]));
      for (const c of celebrations) {
        if (new Date(c.startAt) < now) continue;
        const sectorId = clochersById.get(lieuxById.get(c.lieuId)?.clocherId)?.sectorId ?? lieuxById.get(c.lieuId)?.sectorId;
        if (sectorId && counts.has(sectorId)) counts.set(sectorId, counts.get(sectorId) + 1);
      }

      const rows = sectors.map((s) => `<tr><td>${s.name}</td><td>${counts.get(s.id) ?? 0}</td></tr>`).join('');
      this.el.querySelector('.dashboard-sectors').innerHTML = `
        <table class="data-table">
          <thead><tr><th>Secteur</th><th>Célébrations à venir</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="2">Aucun secteur défini.</td></tr>'}</tbody>
        </table>
      `;
    }
  }

  gP.pages.DashboardPage = DashboardPage;
})(window.gP);
