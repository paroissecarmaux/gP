(function (gP) {
  'use strict';

  class CertificatePage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page certificate-page';
      el.innerHTML = `
        <div class="page-header no-print">
          <h1>Certificat</h1>
          <a href="#/sacrements/actes/${this.props.id}">← Retour à l'acte</a>
        </div>
        <div class="certificate-content"><p>Chargement…</p></div>
        <div class="certificate-actions no-print">
          <button type="button" class="primary generate">Générer et imprimer / exporter en PDF</button>
        </div>
        <div class="certificate-history no-print"></div>
      `;
      return el;
    }

    async onMount() {
      try {
        const act = await gP.services.sacramentalActRepository.get(this.props.id);
        if (!act) throw new Error('Acte introuvable');
        const [person, celebrant, lieu, history] = await Promise.all([
          gP.services.personRepository.get(act.personId),
          act.celebrantPersonId ? gP.services.personRepository.get(act.celebrantPersonId) : null,
          act.lieuId ? gP.services.lieuRepository.get(act.lieuId) : null,
          gP.services.listCertificatesForAct(this.props.id),
        ]);

        this.act = act;
        this.renderCertificate(act, person, celebrant, lieu);
        this.renderHistory(history);

        this.el.querySelector('.generate').addEventListener('click', () => this.handleGenerate());
      } catch (error) {
        gP.utils.reportError(error, { source: 'Certificat' });
      }
    }

    renderCertificate(act, person, celebrant, lieu) {
      const content = this.el.querySelector('.certificate-content');
      content.innerHTML = `
        <div class="certificate-paper">
          <h1>Certificat de ${act.type.toLowerCase()}</h1>
          <p>Nous certifions que <strong>${gP.utils.personLabel(person) || '—'}</strong>
          a reçu le sacrement de <strong>${act.type}</strong>
          le <strong>${gP.utils.formatDate(act.date) || '—'}</strong>
          ${lieu ? `à <strong>${lieu.name}</strong>` : ''}
          ${celebrant ? `, célébré par <strong>${gP.utils.personLabel(celebrant)}</strong>` : ''}.</p>
          ${act.details ? `<p>${act.details}</p>` : ''}
          <p class="certificate-date">Délivré le ${gP.utils.formatDate(new Date())}</p>
        </div>
      `;
    }

    renderHistory(entries) {
      const container = this.el.querySelector('.certificate-history');
      if (entries.length === 0) {
        container.innerHTML = "<p>Aucun certificat généré pour cet acte jusqu'à présent.</p>";
        return;
      }
      container.innerHTML = `
        <h3>Historique des certificats générés</h3>
        <ul>${entries.map((e) => `<li>${gP.utils.formatDateTime(e.createdAt)}</li>`).join('')}</ul>
      `;
    }

    async handleGenerate() {
      try {
        await gP.services.certificateRepository.create({ actId: this.props.id });
        window.print();
        const history = await gP.services.listCertificatesForAct(this.props.id);
        this.renderHistory(history);
      } catch (error) {
        gP.utils.reportError(error, { source: 'Certificat' });
      }
    }
  }

  function certificatePage(params) {
    return new CertificatePage({ id: params.id });
  }

  Object.assign(gP.pages, { CertificatePage, certificatePage });
})(window.gP);
