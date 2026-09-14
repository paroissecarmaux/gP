(function (gP) {
  'use strict';

  function personLabel(person) {
    if (!person) return '';
    return [person.civility, person.firstName, person.lastName].filter(Boolean).join(' ');
  }

  function formatAmount(value) {
    if (value == null) return '';
    return `${Number(value).toFixed(2)} €`;
  }

  function shortId(id) {
    return id ? id.slice(0, 8) : '';
  }

  Object.assign(gP.utils, { personLabel, formatAmount, shortId });
})(window.gP);
