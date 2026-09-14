(function (gP) {
  'use strict';

  class SyncPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page sync-page';
      el.innerHTML = `
        <div class="page-header"><h1>Sauvegarde &amp; synchronisation</h1></div>
        <p>
          La synchronisation entre installations se fait par échange de fichier de
          sauvegarde (clé USB, dossier partagé, email…) : un poste exporte ses
          données, un autre les importe pour fusionner les nouveautés. La fusion
          conserve la version la plus récente de chaque enregistrement et crée un
          <a href="#/parametres/conflits">conflit</a> quand les deux côtés ont
          changé la même fiche depuis le dernier échange.
        </p>
        <div class="sync-actions">
          <button type="button" class="primary export">Télécharger une sauvegarde complète</button>
          <label class="import-label">
            Importer / fusionner une sauvegarde
            <input type="file" accept="application/json" class="import-input" />
          </label>
        </div>
        <p class="sync-feedback" hidden></p>
        <h2>Historique des synchronisations</h2>
        <table class="data-table">
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
        const entries = (await gP.services.syncLogRepository.list()).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
        this.el.querySelector('tbody').innerHTML =
          entries.map((e) => `<tr><td>${gP.utils.formatDateTime(e.occurredAt)}</td><td>${e.type}</td><td>${e.summary}</td></tr>`).join('') ||
          '<tr><td colspan="3">Aucune synchronisation.</td></tr>';
      } catch (error) {
        gP.utils.reportError(error, { source: 'Synchronisation' });
      }
    }

    showFeedback(message) {
      const feedback = this.el.querySelector('.sync-feedback');
      feedback.textContent = message;
      feedback.hidden = false;
    }

    async handleExport() {
      try {
        const backup = await gP.services.downloadBackup();
        this.showFeedback(`Sauvegarde téléchargée (${backup.recordCount} enregistrements).`);
        await this.refreshLog();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Synchronisation' });
      }
    }

    async handleImport(event) {
      // `event.currentTarget` redevient `null` une fois la gestion de
      // l'événement terminée : on garde une référence stable à l'élément
      // AVANT le premier `await`, plutôt que de relire `event.currentTarget`
      // après (piège JS classique).
      const input = event.currentTarget;
      const file = input.files[0];
      if (!file) return;
      try {
        const result = await gP.services.importBackup(file);
        let message = `Import terminé : ${result.imported} nouveaux, ${result.merged} fusionnés, ${result.skipped} ignorés.`;
        if (result.conflicts > 0) message += ` ⚠ ${result.conflicts} conflit(s) à résoudre.`;
        this.showFeedback(message);
        await this.refreshLog();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Synchronisation' });
      } finally {
        input.value = '';
      }
    }
  }

  class ConflictsPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page conflicts-page';
      el.innerHTML = `<div class="page-header"><h1>Conflits de synchronisation</h1></div><div class="conflicts-list"><p>Chargement…</p></div>`;
      return el;
    }

    async onMount() {
      await this.refresh();
    }

    async refresh() {
      try {
        const all = await gP.services.syncConflictRepository.list();
        const unresolved = all.filter((c) => c.resolvedAt == null);
        this.renderList(unresolved);
      } catch (error) {
        gP.utils.reportError(error, { source: 'Conflits' });
      }
    }

    renderList(conflicts) {
      const container = this.el.querySelector('.conflicts-list');
      if (conflicts.length === 0) {
        container.innerHTML = '<p>Aucun conflit non résolu.</p>';
        return;
      }
      container.replaceChildren();
      for (const conflict of conflicts) {
        const card = document.createElement('div');
        card.className = 'conflict-card';
        const fields = new Set([...Object.keys(conflict.localSnapshot), ...Object.keys(conflict.incomingSnapshot)]);
        const skip = new Set(['id', 'createdAt', 'updatedAt', 'revision', 'originInstallationId']);
        const diffFields = [...fields].filter((f) => !skip.has(f) && JSON.stringify(conflict.localSnapshot[f]) !== JSON.stringify(conflict.incomingSnapshot[f]));
        const sameFields = [...fields].filter((f) => !skip.has(f) && !diffFields.includes(f));

        const rows = [
          ...diffFields.map(
            (f) => `
            <tr class="conflict-diff">
              <td>${f}</td>
              <td><label><input type="radio" name="merge-${conflict.id}-${f}" value="local" checked /> ${JSON.stringify(conflict.localSnapshot[f]) ?? ''}</label></td>
              <td><label><input type="radio" name="merge-${conflict.id}-${f}" value="incoming" /> ${JSON.stringify(conflict.incomingSnapshot[f]) ?? ''}</label></td>
            </tr>`,
          ),
          ...sameFields.map((f) => `<tr><td>${f}</td><td colspan="2">${JSON.stringify(conflict.localSnapshot[f]) ?? ''} (identique)</td></tr>`),
        ].join('');

        card.innerHTML = `
          <h2>${conflict.entityType} — <code>${conflict.entityId.slice(0, 8)}</code></h2>
          <table class="data-table">
            <thead><tr><th>Champ</th><th>Ma version</th><th>Version importée</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="conflict-actions">
            <button type="button" data-action="local">Conserver ma version</button>
            <button type="button" data-action="incoming">Utiliser la version importée</button>
            <button type="button" class="primary" data-action="merge">Fusionner selon la sélection ci-dessus</button>
          </div>
        `;
        card.querySelector('[data-action="local"]').addEventListener('click', () => this.handleResolve(conflict.id, 'local'));
        card.querySelector('[data-action="incoming"]').addEventListener('click', () => this.handleResolve(conflict.id, 'incoming'));
        card.querySelector('[data-action="merge"]').addEventListener('click', () => this.handleMerge(conflict, diffFields, card));
        container.appendChild(card);
      }
    }

    async handleMerge(conflict, diffFields, card) {
      const merged = {};
      for (const field of diffFields) {
        const checked = card.querySelector(`input[name="merge-${conflict.id}-${field}"]:checked`);
        merged[field] = checked?.value === 'incoming' ? conflict.incomingSnapshot[field] : conflict.localSnapshot[field];
      }
      try {
        await gP.services.resolveConflict(conflict.id, { merged });
        gP.ui.notify('Conflit résolu par fusion.', { type: 'success' });
        await this.refresh();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Conflits' });
      }
    }

    async handleResolve(conflictId, resolution) {
      try {
        await gP.services.resolveConflict(conflictId, resolution);
        gP.ui.notify('Conflit résolu.', { type: 'success' });
        await this.refresh();
      } catch (error) {
        gP.utils.reportError(error, { source: 'Conflits' });
      }
    }
  }

  Object.assign(gP.pages, { SyncPage, ConflictsPage });
})(window.gP);
