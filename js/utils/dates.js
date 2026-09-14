(function (gP) {
  'use strict';

  function formatDateTime(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
  }

  Object.assign(gP.utils, { formatDateTime, formatDate });
})(window.gP);
