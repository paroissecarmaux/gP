// Sacrements : de vrais registres, dans lesquels les actes sont numérotés,
// eux-mêmes pouvant recevoir des mentions marginales — jamais un simple
// booléen sur Personne (voir docs/ENTITIES.md § V7).
(function (gP) {
  'use strict';

  const registerRepository = new gP.db.Repository('sacramentalRegisters', 'Registre sacramentel');
  const actRepository = new gP.db.Repository('sacramentalActs', 'Acte sacramentel');
  const noteRepository = new gP.db.Repository('sacramentalNotes', 'Mention sacramentelle');

  const ACT_TYPES = ['Baptême', 'Mariage', 'Confirmation', 'Ordination', 'Obsèques'];

  async function listActsForRegister(registerId) {
    const all = await actRepository.list();
    return all.filter((row) => row.registerId === registerId);
  }

  async function listNotesForAct(actId) {
    const all = await noteRepository.list();
    return all.filter((row) => row.actId === actId);
  }

  function actLabel(act, personsById) {
    const person = personsById.get(act.personId);
    return `${act.type} — ${gP.utils.personLabel(person)} (${gP.utils.formatDate(act.date) || '?'})`;
  }

  Object.assign(gP.services, {
    sacramentalRegisterRepository: registerRepository,
    sacramentalActRepository: actRepository,
    sacramentalNoteRepository: noteRepository,
    ACT_TYPES,
    listActsForRegister,
    listNotesForAct,
    sacramentalActLabel: actLabel,
  });

  gP.db.registerEntity({ key: 'sacramentalRegisters', label: 'Registre sacramentel', repository: registerRepository, searchFields: ['label'], path: '/sacrements/registres' });
  gP.db.registerEntity({ key: 'sacramentalActs', label: 'Acte sacramentel', repository: actRepository, searchFields: ['type'], path: '/sacrements/actes' });
  gP.db.registerEntity({ key: 'sacramentalNotes', label: 'Mention sacramentelle', repository: noteRepository, searchFields: ['text'] });
})(window.gP);
