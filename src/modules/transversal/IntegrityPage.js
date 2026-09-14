import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { runIntegrityChecks } from './integrity.js';

export class IntegrityPage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'integrity-page';
    el.innerHTML = `
      <div class="list-view-header"><h2>Contrôles d'intégrité</h2></div>
      <div class="integrity-results"><p>Analyse en cours…</p></div>
    `;
    return el;
  }

  async onMount() {
    try {
      const issues = await runIntegrityChecks();
      const container = this.el.querySelector('.integrity-results');
      container.innerHTML =
        issues.length === 0
          ? '<p>Aucun problème détecté.</p>'
          : `<ul>${issues.map((issue) => `<li>${issue}</li>`).join('')}</ul>`;
    } catch (error) {
      reportError(error, { source: 'Contrôles d\'intégrité' });
    }
  }
}
