// Boîtes de dialogue modales génériques, construites sur l'élément HTML
// natif <dialog> (accessible : focus piégé, fermeture au clavier gérés par
// le navigateur).
let root = null;

export function mountModals(target) {
  root = target;
}

function buildDialog(bodyEl, { title } = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  const heading = title ? `<h2 class="modal-title">${title}</h2>` : '';
  dialog.innerHTML = `${heading}<div class="modal-body"></div>`;
  dialog.querySelector('.modal-body').appendChild(bodyEl);
  root.appendChild(dialog);
  return dialog;
}

/** Ouvre une modale de confirmation, résout `true`/`false` selon le choix. */
export function confirmModal(message, { title = 'Confirmation', confirmLabel = 'Confirmer', danger = false } = {}) {
  return new Promise((resolve) => {
    const body = document.createElement('div');
    body.innerHTML = `
      <p>${message}</p>
      <div class="modal-actions">
        <button type="button" class="button-secondary" data-action="cancel">Annuler</button>
        <button type="button" class="${danger ? 'button-danger' : 'primary'}" data-action="confirm">${confirmLabel}</button>
      </div>
    `;

    const dialog = buildDialog(body, { title });

    const close = (result) => {
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    body.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    body.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    dialog.addEventListener('cancel', () => close(false));

    dialog.showModal();
  });
}

/** Ouvre une modale générique contenant un élément DOM fourni par l'appelant. */
export function openModal(bodyEl, options) {
  const dialog = buildDialog(bodyEl, options);
  dialog.showModal();
  return {
    close: () => {
      dialog.close();
      dialog.remove();
    },
    dialog,
  };
}
