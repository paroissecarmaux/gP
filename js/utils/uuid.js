(function (gP) {
  'use strict';

  function generateId() {
    return crypto.randomUUID();
  }

  gP.utils.generateId = generateId;
})(window.gP);
