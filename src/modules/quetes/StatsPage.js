import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { collectionRepository, countRepository } from './repositories.js';
import { lieuRepository, clocherRepository, sectorRepository } from '../territoire-agenda/repositories.js';
import { indexById } from '../../utils/indexBy.js';

function groupSum(rows, keyFn, amountFn) {
  const totals = new Map();
  for (const row of rows) {
    const key = keyFn(row) ?? '—';
    totals.set(key, (totals.get(key) ?? 0) + amountFn(row));
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function renderTable(title, rows) {
  return `
    <div class="stats-table">
      <h3>${title}</h3>
      <table class="list-table">
        <thead><tr><th>Regroupement</th><th>Total</th></tr></thead>
        <tbody>${rows.map(([label, total]) => `<tr><td>${label}</td><td>${total.toFixed(2)} €</td></tr>`).join('') || '<tr><td colspan="2">Aucune donnée</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

export class StatsPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'stats-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Statistiques des quêtes</h2></div>
      <div class="stats-grid"></div>
    `;
    return el;
  }

  async onMount() {
    try {
      const [collections, counts, lieux, clochers, sectors] = await Promise.all([
        collectionRepository.list(),
        countRepository.list(),
        lieuRepository.list(),
        clocherRepository.list(),
        sectorRepository.list(),
      ]);

      const collectionsById = indexById(collections);
      const lieuxById = indexById(lieux);
      const clochersById = indexById(clochers);

      const amountOf = (count) => (count.cashAmount ?? 0) + (count.checkAmount ?? 0);
      const collectionOf = (count) => collectionsById.get(count.collectionId);
      const lieuOf = (count) => lieuxById.get(collectionOf(count)?.lieuId);
      const clocherOf = (count) => clochersById.get(lieuOf(count)?.clocherId);

      const byMonth = groupSum(
        counts,
        (c) => (collectionOf(c)?.date ? new Date(collectionOf(c).date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null),
        amountOf,
      );
      const byClocher = groupSum(counts, (c) => clocherOf(c)?.name, amountOf);
      const bySector = groupSum(counts, (c) => sectors.find((s) => s.id === clocherOf(c)?.sectorId)?.name, amountOf);

      this.el.querySelector('.stats-grid').innerHTML =
        renderTable('Par mois', byMonth) + renderTable('Par clocher', byClocher) + renderTable('Par secteur', bySector);
    } catch (error) {
      reportError(error, { source: 'Statistiques quêtes' });
    }
  }
}
