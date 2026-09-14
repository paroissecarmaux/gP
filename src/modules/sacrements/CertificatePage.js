import { Component } from '../../ui/core/Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { actRepository, certificateRepository } from './repositories.js';
import { personRepository } from '../annuaire/repositories.js';
import { lieuRepository } from '../territoire-agenda/repositories.js';

export class CertificatePage extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'certificate-page';
    el.innerHTML = `
      <div class="list-view-header no-print">
        <h2>Certificat</h2>
        <a href="#/sacrements/actes/${this.props.id}">← Retour à l'acte</a>
      </div>
      <div class="certificate-content"><p>Chargement…</p></div>
      <div class="certificate-actions no-print">
        <button type="button" class="generate">Générer et imprimer / exporter en PDF</button>
      </div>
      <div class="certificate-history no-print"></div>
    `;
    return el;
  }

  async onMount() {
    try {
      const act = await actRepository.get(this.props.id);
      if (!act) throw new Error('Acte introuvable');
      const [person, celebrant, lieu, history] = await Promise.all([
        personRepository.get(act.personId),
        act.celebrantPersonId ? personRepository.get(act.celebrantPersonId) : null,
        act.lieuId ? lieuRepository.get(act.lieuId) : null,
        certificateRepository.list(),
      ]);

      this.act = act;
      this.renderCertificate(act, person, celebrant, lieu);
      this.renderHistory(history.filter((c) => c.actId === this.props.id));

      this.el.querySelector('.generate').addEventListener('click', () => this.handleGenerate());
    } catch (error) {
      reportError(error, { source: 'Certificat' });
    }
  }

  renderCertificate(act, person, celebrant, lieu) {
    const content = this.el.querySelector('.certificate-content');
    content.innerHTML = `
      <div class="certificate-paper">
        <h1>Certificat de ${act.type.toLowerCase()}</h1>
        <p>Nous certifions que <strong>${person ? `${person.firstName} ${person.lastName}` : '—'}</strong>
        a reçu le sacrement de <strong>${act.type}</strong>
        le <strong>${act.date ? new Date(act.date).toLocaleDateString('fr-FR') : '—'}</strong>
        ${lieu ? `à <strong>${lieu.name}</strong>` : ''}
        ${celebrant ? `, célébré par <strong>${celebrant.firstName} ${celebrant.lastName}</strong>` : ''}.</p>
        ${act.relatedPersonsNotes ? `<p>${act.relatedPersonsNotes}</p>` : ''}
        <p class="certificate-date">Délivré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    `;
  }

  renderHistory(entries) {
    const container = this.el.querySelector('.certificate-history');
    if (entries.length === 0) {
      container.innerHTML = '<p>Aucun certificat généré pour cet acte jusqu\'à présent.</p>';
      return;
    }
    container.innerHTML = `
      <h3>Historique des certificats générés</h3>
      <ul>${entries.map((e) => `<li>${new Date(e.createdAt).toLocaleString('fr-FR')}</li>`).join('')}</ul>
    `;
  }

  async handleGenerate() {
    try {
      await certificateRepository.create({ actId: this.props.id });
      window.print();
      const history = await certificateRepository.list();
      this.renderHistory(history.filter((c) => c.actId === this.props.id));
    } catch (error) {
      reportError(error, { source: 'Certificat' });
    }
  }
}
