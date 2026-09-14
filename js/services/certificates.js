// Journal des certificats générés/imprimés pour un acte sacramentel :
// jamais de re-saisie, le certificat se génère toujours depuis l'acte
// (voir docs/ENTITIES.md § V7).
(function (gP) {
  'use strict';

  const certificateRepository = new gP.db.Repository('certificates', 'Certificat');

  async function listForAct(actId) {
    const all = await certificateRepository.list();
    return all.filter((row) => row.actId === actId);
  }

  Object.assign(gP.services, { certificateRepository, listCertificatesForAct: listForAct });

  gP.db.registerEntity({ key: 'certificates', label: 'Certificat', repository: certificateRepository });
})(window.gP);
