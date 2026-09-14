(function (gP) {
  'use strict';

  class DashboardPage extends gP.ui.Component {
    render() {
      const el = document.createElement('section');
      el.className = 'page dashboard-page';
      el.innerHTML = `
        <h1>Tableau de bord</h1>
        <p class="page-intro">
          Fondation V1 de gParoisse : base de données locale, identifiants et
          métadonnées de synchronisation, installation courante. Les modules
          métier (annuaire, agenda, tâches…) s'ajouteront sur cette base sans
          la remettre en cause.
        </p>
        <div class="installation-card"><p>Chargement…</p></div>
      `;
      return el;
    }

    async onMount() {
      try {
        const installation = await gP.services.ensureCurrentInstallation('Poste principal');
        this.el.querySelector('.installation-card').innerHTML = `
          <h2>Cette installation</h2>
          <dl class="field-list">
            <dt>Nom</dt><dd>${installation.name}</dd>
            <dt>Identifiant</dt><dd><code>${installation.id}</code></dd>
            <dt>Créée le</dt><dd>${gP.utils.formatDateTime(installation.createdAt)}</dd>
          </dl>
        `;
      } catch (error) {
        gP.utils.reportError(error, { source: 'DashboardPage' });
      }
    }
  }

  gP.pages.DashboardPage = DashboardPage;
})(window.gP);
