import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { ensureCurrentInstallation } from '../../services/installationService.js';
import { personRepository, familyRepository } from '../annuaire/repositories.js';
import { celebrationRepository, lieuRepository, clocherRepository, sectorRepository } from '../territoire-agenda/repositories.js';
import { taskRepository } from '../taches/repositories.js';
import { intentionRepository, paymentRepository } from '../intentions/repositories.js';
import { requestRepository } from '../secretariat/repositories.js';
import { isOverdue } from '../taches/fields.js';
import { paymentStatus } from '../intentions/fields.js';
import { indexById } from '../../utils/indexBy.js';

function tile(label, value, path) {
  return `<a class="dashboard-tile" href="#${path}"><span class="dashboard-tile-value">${value}</span><span class="dashboard-tile-label">${label}</span></a>`;
}

export class DashboardPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'dashboard-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Tableau de bord</h2></div>
      <div class="dashboard-tiles"><p>Chargement…</p></div>
      <h3>Comparaison entre secteurs (célébrations sur 30 jours)</h3>
      <div class="dashboard-sectors"></div>
      <h3>Cette installation</h3>
      <div class="dashboard-installation"></div>
    `;
    return el;
  }

  async onMount() {
    try {
      const [persons, families, celebrations, lieux, clochers, sectors, tasks, intentions, payments, requests] =
        await Promise.all([
          personRepository.list(),
          familyRepository.list(),
          celebrationRepository.list(),
          lieuRepository.list(),
          clocherRepository.list(),
          sectorRepository.list(),
          taskRepository.list(),
          intentionRepository.list(),
          paymentRepository.list(),
          requestRepository.list(),
        ]);

      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      const upcoming = celebrations.filter((c) => new Date(c.startAt) >= now && new Date(c.startAt) <= in7days);
      const pendingTasks = tasks.filter((t) => t.status !== 'Terminé' && t.status !== 'Annulé');
      const overdueTasks = tasks.filter(isOverdue);
      const pendingPaymentIntentions = intentions.filter((i) => {
        const status = paymentStatus(i, payments);
        return status === 'À payer' || status === 'Partiellement payé';
      });
      const openRequests = requests.filter((r) => r.status === 'Ouverte' || r.status === 'En cours' || r.status === 'En attente');

      this.el.querySelector('.dashboard-tiles').innerHTML = [
        tile('Personnes', persons.length, '/annuaire/personnes'),
        tile('Familles', families.length, '/annuaire/familles'),
        tile('Célébrations (7 j.)', upcoming.length, '/agenda'),
        tile('Tâches en cours', pendingTasks.length, '/taches'),
        tile('Tâches en retard', overdueTasks.length, '/taches/en-retard'),
        tile('Intentions à encaisser', pendingPaymentIntentions.length, '/intentions'),
        tile('Demandes ouvertes', openRequests.length, '/secretariat/ouvertes'),
      ].join('');

      this.renderSectorComparison(celebrations, lieux, clochers, sectors, now);
      await this.renderInstallation();
    } catch (error) {
      reportError(error, { source: 'Tableau de bord' });
    }
  }

  renderSectorComparison(celebrations, lieux, clochers, sectors, now) {
    const lieuxById = indexById(lieux);
    const clochersById = indexById(clochers);
    const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const to = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const counts = new Map(sectors.map((s) => [s.id, 0]));
    for (const c of celebrations) {
      const date = new Date(c.startAt);
      if (date < from || date > to) continue;
      const sectorId = clochersById.get(lieuxById.get(c.lieuId)?.clocherId)?.sectorId;
      if (sectorId && counts.has(sectorId)) counts.set(sectorId, counts.get(sectorId) + 1);
    }

    const rows = sectors.map((s) => `<tr><td>${s.name}</td><td>${counts.get(s.id) ?? 0}</td></tr>`).join('');
    this.el.querySelector('.dashboard-sectors').innerHTML = `
      <table class="list-table">
        <thead><tr><th>Secteur</th><th>Célébrations</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2">Aucun secteur défini.</td></tr>'}</tbody>
      </table>
    `;
  }

  async renderInstallation() {
    const installation = await ensureCurrentInstallation('Poste principal');
    this.el.querySelector('.dashboard-installation').innerHTML = `
      <dl class="installation-info">
        <dt>Nom</dt><dd>${installation.name}</dd>
        <dt>Identifiant</dt><dd><code>${installation.id}</code></dd>
        <dt>Créée le</dt><dd>${new Date(installation.createdAt).toLocaleString('fr-FR')}</dd>
      </dl>
    `;
  }
}
