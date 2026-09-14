import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { downloadBackup, importBackup } from './backupService.js';
import { syncLogRepository } from './repositories.js';

export class SyncPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'sync-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Sauvegarde &amp; synchronisation</h2></div>
      <p>
        La synchronisation entre installations se fait par échange de fichier de sauvegarde
        (clé USB, dossier partagé, email…) : chaque poste peut exporter ses données puis un
        autre poste peut importer ce fichier pour fusionner les nouveautés. La fusion conserve,
        pour chaque enregistrement, la version la plus récente (numéro de révision, puis date de
        modification).
      </p>
      <div class="sync-actions">
        <button type="button" class="export">Télécharger une sauvegarde complète</button>
        <label class="import-label">
          Importer / fusionner une sauvegarde
          <input type="file" accept="application/json" class="import-input" />
        </label>
      </div>
      <p class="sync-feedback" hidden></p>
      <h3>Historique des synchronisations</h3>
      <table class="list-table">
        <thead><tr><th>Date</th><th>Type</th><th>Détail</th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    return el;
  }

  onMount() {
    this.el.querySelector('.export').addEventListener('click', () => this.handleExport());
    this.el.querySelector('.import-input').addEventListener('change', (event) => this.handleImport(event));
    this.refreshLog();
  }

  async refreshLog() {
    try {
      const entries = (await syncLogRepository.list()).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
      this.el.querySelector('tbody').innerHTML =
        entries
          .map((e) => `<tr><td>${new Date(e.occurredAt).toLocaleString('fr-FR')}</td><td>${e.type}</td><td>${e.summary}</td></tr>`)
          .join('') || '<tr><td colspan="3">Aucune synchronisation.</td></tr>';
    } catch (error) {
      reportError(error, { source: 'Synchronisation' });
    }
  }

  showFeedback(message) {
    const feedback = this.el.querySelector('.sync-feedback');
    feedback.textContent = message;
    feedback.hidden = false;
  }

  async handleExport() {
    try {
      const backup = await downloadBackup();
      this.showFeedback(`Sauvegarde téléchargée (${backup.recordCount} enregistrements).`);
      await this.refreshLog();
    } catch (error) {
      reportError(error, { source: 'Synchronisation' });
    }
  }

  async handleImport(event) {
    const file = event.currentTarget.files[0];
    if (!file) return;
    try {
      const result = await importBackup(file);
      this.showFeedback(`Import terminé : ${result.imported} nouveaux, ${result.merged} fusionnés, ${result.skipped} ignorés.`);
      await this.refreshLog();
    } catch (error) {
      reportError(error, { source: 'Synchronisation' });
    } finally {
      event.currentTarget.value = '';
    }
  }
}
