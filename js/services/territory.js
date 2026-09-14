// Organisation territoriale (Secteur, Clocher, Lieu) : regroupés dans un
// seul fichier plutôt que trois — entités simples et étroitement liées
// hiérarchiquement (un Clocher appartient à un Secteur, un Lieu peut se
// rattacher à l'un ou l'autre), contrairement à Fonction/Groupe qui sont
// des domaines autonomes (voir docs/ARCHITECTURE.md).
(function (gP) {
  'use strict';

  const sectorRepository = new gP.db.Repository('sectors', 'Secteur');
  const clocherRepository = new gP.db.Repository('clochers', 'Clocher');
  const lieuRepository = new gP.db.Repository('lieux', 'Lieu');

  Object.assign(gP.services, { sectorRepository, clocherRepository, lieuRepository });
})(window.gP);
