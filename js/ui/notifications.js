// Petit système de notifications (bandeau d'erreurs + futurs messages de
// confirmation "Enregistré", "Supprimé"...). `mountNotifications` doit être
// appelé une fois au démarrage ; `notify` peut ensuite être utilisé partout.
let container = null;

export function mountNotifications(target) {
  container = document.createElement('div');
  container.className = 'notifications';
  target.appendChild(container);
}

export function notify(message, { type = 'info', duration = 5000 } = {}) {
  if (!container) return;

  const item = document.createElement('div');
  item.className = `notification notification-${type}`;
  item.setAttribute('role', type === 'error' ? 'alert' : 'status');
  item.textContent = message;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'notification-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Fermer');
  close.addEventListener('click', () => item.remove());
  item.appendChild(close);

  container.appendChild(item);
  if (duration > 0) setTimeout(() => item.remove(), duration);
}
