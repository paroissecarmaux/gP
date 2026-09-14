(function (gP) {
  'use strict';

  function indexById(list) {
    return new Map(list.map((item) => [item.id, item]));
  }

  /** Fabrique une fonction `options` (attendue par js/ui/forms.js) à partir
   * d'une liste de valeurs fixes (ex. civilités, types de contrat). */
  function staticOptions(values) {
    return async () => values.map((value) => ({ value, label: value }));
  }

  Object.assign(gP.utils, { indexById, staticOptions });
})(window.gP);
